import Link from 'next/link';

import { AdminBadge, AdminMetric, formatAdminDate } from '@/components/platform-admin/admin-ui';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type {
    PaginatedAdminResult,
    PlatformAdminAuditEntry,
    PlatformAdminOverview,
} from '@/lib/api/types';

export default async function AdminOverviewPage() {
    const [overview, audit] = await Promise.all([
        apiFetch<PlatformAdminOverview>('/api/v1/admin/overview'),
        apiFetch<PaginatedAdminResult<PlatformAdminAuditEntry>>('/api/v1/admin/audit?limit=6'),
    ]);

    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Operação da plataforma"
                title="O Astro, visto de cima."
                description="Acompanhe a saúde da base, identifique pendências e aja sem perder o contexto."
            />

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminMetric
                    label="Empresas"
                    value={overview.organizations.total}
                    detail={`${overview.organizations.active} ativas · ${overview.organizations.suspended} suspensas`}
                    icon="box"
                />
                <AdminMetric
                    label="Usuários"
                    value={overview.users.total}
                    detail={`${overview.users.active} ativos · ${overview.users.blocked} bloqueados`}
                    icon="users"
                    tone="success"
                />
                <AdminMetric
                    label="Assinaturas ativas"
                    value={overview.subscriptions.active}
                    detail={`${overview.subscriptions.trialing} em teste · ${overview.subscriptions.pastDue} pendentes`}
                    icon="repeat"
                    tone={overview.subscriptions.pastDue > 0 ? 'warning' : 'brand'}
                />
                <AdminMetric
                    label="Ideias em análise"
                    value={overview.roadmap.pending}
                    detail={`${overview.roadmap.published} publicadas no roadmap`}
                    icon="layout"
                    tone={overview.roadmap.pending > 0 ? 'warning' : 'brand'}
                />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
                <article className="glass-panel overflow-hidden rounded-[26px]">
                    <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
                        <div>
                            <h2 className="text-sm font-semibold">Atividade administrativa</h2>
                            <p className="mt-1 text-[11px] text-muted">
                                Alterações sensíveis realizadas na plataforma.
                            </p>
                        </div>
                        <Link
                            href="/admin/audit"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-strong"
                        >
                            Ver histórico
                            <Icon name="arrow-right" className="size-3" />
                        </Link>
                    </header>
                    {audit.items.length === 0 ? (
                        <div className="px-6 py-12 text-center text-[12px] text-muted">
                            Nenhuma atividade administrativa registrada.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {audit.items.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-start gap-3.5 px-5 py-4 transition hover:bg-surface-muted/35 sm:px-6"
                                >
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                                        <Icon name="edit" className="size-3.5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-[12px] font-semibold">
                                                {actionLabel(entry.action)}
                                            </p>
                                            <AdminBadge status={entry.resourceType}>
                                                {entry.resourceType}
                                            </AdminBadge>
                                        </div>
                                        <p className="mt-1 truncate text-[11px] text-muted">
                                            {entry.actorName ?? entry.actorEmail ?? 'Sistema'}
                                            {entry.reason ? ` · ${entry.reason}` : ''}
                                        </p>
                                    </div>
                                    <time className="shrink-0 pt-1 text-[10px] text-muted">
                                        {formatAdminDate(entry.createdAt, true)}
                                    </time>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <aside className="glass-panel rounded-[26px] p-5 sm:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-brand-strong">
                        Atenção agora
                    </p>
                    <h2 className="mt-2 text-lg font-semibold tracking-[-.035em]">
                        Pendências que merecem contexto.
                    </h2>
                    <div className="mt-5 space-y-2.5">
                        <QuickAction
                            href="/admin/roadmap#moderacao"
                            label="Moderar sugestões"
                            value={overview.roadmap.pending}
                            tone={overview.roadmap.pending > 0 ? 'warning' : 'neutral'}
                        />
                        <QuickAction
                            href="/admin/organizations?status=active"
                            label="Assinaturas com pagamento pendente"
                            value={overview.subscriptions.pastDue}
                            tone={overview.subscriptions.pastDue > 0 ? 'danger' : 'neutral'}
                        />
                        <QuickAction
                            href="/admin/users?status=blocked"
                            label="Usuários bloqueados"
                            value={overview.users.blocked}
                            tone="neutral"
                        />
                    </div>
                </aside>
            </section>
        </div>
    );
}

function QuickAction({
    href,
    label,
    value,
    tone,
}: {
    href: string;
    label: string;
    value: number;
    tone: 'warning' | 'danger' | 'neutral';
}) {
    const toneClass =
        tone === 'danger'
            ? 'bg-danger/10 text-danger'
            : tone === 'warning'
              ? 'bg-warning/10 text-warning'
              : 'bg-surface-muted text-muted';
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface/55 p-3.5 transition hover:border-brand/18 hover:bg-surface"
        >
            <span
                className={`grid min-w-8 place-items-center rounded-xl px-2 py-2 text-[11px] font-bold ${toneClass}`}
            >
                {value}
            </span>
            <span className="min-w-0 flex-1 text-[11px] font-semibold">{label}</span>
            <Icon name="arrow-right" className="size-3.5 text-muted" />
        </Link>
    );
}

function actionLabel(action: string) {
    const labels: Record<string, string> = {
        'platform.user.status_changed': 'Status de usuário alterado',
        'platform.organization.status_changed': 'Status de empresa alterado',
        'platform.subscription.updated': 'Assinatura atualizada',
        'platform.plan.updated': 'Plano atualizado',
        'platform.plan.entitlements_replaced': 'Limites do plano atualizados',
    };
    return labels[action] ?? action;
}
