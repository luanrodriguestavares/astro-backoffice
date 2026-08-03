import { OrganizationForm } from '@/components/settings/organization-form';
import { AppearancePreferences } from '@/components/settings/appearance-preferences';
import { PageHeader } from '@/components/ui/page-header';
import { Icon } from '@/components/ui/icon';
import { currentOrganization, currentUser } from '@/lib/auth/permissions';

export default async function SettingsPage() {
    const [organization, user] = await Promise.all([
        currentOrganization(),
        currentUser(),
    ]);
    const canManageOrganization = organization.permissions?.includes('members.manage') ?? false;
    return (
        <>
            <PageHeader
                eyebrow="Administração"
                title="Configurações"
                description="Configure a organização e consulte os dados da sua conta."
            />
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                {canManageOrganization && <OrganizationForm organization={organization} />}
                <aside className="glass-panel rounded-[28px] p-6">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-[13px] border border-white/80 bg-brand-soft/75 text-brand">
                            <Icon name="user" className="size-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold tracking-[-0.02em]">Sua conta</h2>
                            <p className="mt-1 text-[12px] text-muted">
                                Identidade e acesso ao workspace
                            </p>
                        </div>
                    </div>
                    <dl className="mt-6 divide-y divide-white/65 text-[13px]">
                        <AccountRow label="Nome" value={user.name} />
                        <AccountRow label="E-mail" value={user.email} />
                        <AccountRow
                            label="Verificação"
                            value={user.emailVerified ? 'E-mail verificado' : 'E-mail pendente'}
                        />
                        <AccountRow
                            label="Moeda padrão"
                            value={organization.defaultCurrency ?? 'BRL'}
                        />
                    </dl>
                </aside>
                <AppearancePreferences organization={organization} />
            </div>
        </>
    );
}

function AccountRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 py-4">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
        </div>
    );
}
