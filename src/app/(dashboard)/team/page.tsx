import { InviteMember } from '@/components/team/invite-member';
import { MemberRoleEditor } from '@/components/team/member-role-editor';
import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard } from '@/components/ui/resource-table';
import { Icon } from '@/components/ui/icon';
import { apiFetch } from '@/lib/api/server';
import { currentUser as getCurrentUser } from '@/lib/auth/permissions';
import type {
    InvitableRole,
    OrganizationInvitation,
    OrganizationMember,
} from '@/lib/api/types';

export default async function TeamPage() {
    const [members, invitations, roles, currentUser] = await Promise.all([
        apiFetch<OrganizationMember[]>('/api/v1/organizations/current/members'),
        apiFetch<OrganizationInvitation[]>('/api/v1/organizations/current/invitations'),
        apiFetch<InvitableRole[]>('/api/v1/organizations/current/invitable-roles'),
        getCurrentUser(),
    ]);
    const pending = invitations.filter((item) => !item.acceptedAt && !item.revokedAt);
    const active = members.filter((member) => member.status === 'active').length;
    return (
        <>
            <PageHeader
                eyebrow="Acesso"
                title="Equipe"
                description="Convide membros e acompanhe os acessos à organização."
                actions={<InviteMember roles={roles} />}
            />
            <section className="mb-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Membros"
                    value={String(members.length)}
                    detail="Pessoas na organização"
                    icon="team"
                />
                <SummaryCard
                    label="Acessos ativos"
                    value={String(active)}
                    detail="Membros com acesso atual"
                    icon="check"
                />
                <SummaryCard
                    label="Convites pendentes"
                    value={String(pending.length)}
                    detail="Aguardando aceite"
                    icon="clock"
                />
            </section>
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                <section className="glass-panel rounded-[28px] p-5 sm:p-6">
                    <PanelTitle
                        icon="team"
                        title="Membros"
                        detail="Acessos vinculados à organização"
                    />
                    <div className="mt-4 divide-y divide-white/65">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between gap-4 py-4"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
                                        {initials(member.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-semibold">
                                            {member.name}
                                        </p>
                                        <p className="mt-1 truncate text-[12px] text-muted">
                                            {member.email} · {roleLabel(member.role)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.status === 'active' ? 'bg-[#e8f7f1] text-success' : 'bg-[#fff5e9] text-warning'}`}
                                    >
                                        {memberStatusLabel(member.status)}
                                    </span>
                                    {member.role !== 'owner' &&
                                        member.userId !== currentUser.id && (
                                            <MemberRoleEditor member={member} roles={roles} />
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="glass-panel rounded-[28px] p-5 sm:p-6">
                    <PanelTitle
                        icon="clock"
                        title="Convites pendentes"
                        detail="Pessoas que ainda não aceitaram"
                    />
                    <div className="mt-4 divide-y divide-white/65">
                        {pending.map((invitation) => (
                            <div key={invitation.id} className="py-4">
                                <p className="text-[13px] font-semibold">{invitation.email}</p>
                                <p className="mt-1 text-[12px] text-muted">
                                    {roleLabel(invitation.role)} · expira{' '}
                                    {new Intl.DateTimeFormat('pt-BR').format(
                                        new Date(invitation.expiresAt),
                                    )}
                                </p>
                            </div>
                        ))}
                        {pending.length === 0 && (
                            <div className="py-10 text-center">
                                <Icon name="check" className="mx-auto size-4 text-success" />
                                <p className="mt-2 text-[13px] text-muted">
                                    Nenhum convite pendente.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

function PanelTitle({
    icon,
    title,
    detail,
}: {
    icon: 'team' | 'clock';
    title: string;
    detail: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft/75 text-brand">
                <Icon name={icon} className="size-4" />
            </span>
            <div>
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="mt-1 text-[12px] text-muted">{detail}</p>
            </div>
        </div>
    );
}

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function memberStatusLabel(status: string) {
    return (
        { active: 'Ativo', suspended: 'Suspenso', invited: 'Convidado', inactive: 'Inativo' }[
            status
        ] ?? 'Pendente'
    );
}

function roleLabel(role: string) {
    return (
        {
            owner: 'Proprietário',
            administrator: 'Administrador',
            developer: 'Desenvolvedor',
            finance: 'Financeiro',
            editor: 'Editor',
            support: 'Suporte',
            viewer: 'Leitura',
        }[role] ?? role
    );
}
