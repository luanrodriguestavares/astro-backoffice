import { AdminBadge, AdminEmpty, formatAdminDate } from '@/components/platform-admin/admin-ui';
import { AdminPagination } from '@/components/platform-admin/admin-pagination';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { PaginatedAdminResult, PlatformAdminAuditEntry } from '@/lib/api/types';
import { adminPagination } from '@/lib/platform-admin/pagination';

export default async function AdminAuditPage({
    searchParams,
}: {
    searchParams: Promise<{ action?: string; page?: string; limit?: string }>;
}) {
    const params = await searchParams;
    const action = params.action?.trim() ?? '';
    const { page, pageSize, offset } = adminPagination(params.page, params.limit);
    const query = new URLSearchParams({
        action,
        limit: String(pageSize),
        offset: String(offset),
    });
    const result = await apiFetch<PaginatedAdminResult<PlatformAdminAuditEntry>>(
        `/api/v1/admin/audit?${query}`,
    );

    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Rastreabilidade"
                title="Auditoria"
                description="Um histórico imutável das intervenções administrativas realizadas na plataforma."
            />
            <form className="mb-4 grid gap-3 rounded-[22px] border border-border bg-surface/58 p-3 sm:grid-cols-[minmax(240px,1fr)_160px_auto]">
                <label className="relative min-w-0 flex-1">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3.5 top-3.5 size-3.5 text-muted"
                    />
                    <input
                        name="action"
                        defaultValue={action}
                        placeholder="Buscar por ação, ex.: plan.updated..."
                        className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-3.5 text-[12px] outline-none"
                    />
                </label>
                <CustomSelect
                    name="limit"
                    defaultValue={String(pageSize)}
                    options={[10, 20, 50, 100].map((value) => ({
                        value: String(value),
                        label: `${value} por página`,
                    }))}
                />
                <Button type="submit" variant="primary">
                    Buscar
                </Button>
            </form>

            <section className="glass-panel overflow-hidden rounded-[26px]">
                <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                    <p className="text-[11px] text-muted">
                        {result.total}{' '}
                        {result.total === 1 ? 'evento registrado' : 'eventos registrados'}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-success">
                        <Icon name="check" className="size-3" />
                        Registro protegido
                    </span>
                </header>
                {result.items.length === 0 ? (
                    <AdminEmpty
                        title="Nenhum evento encontrado"
                        description="Não há ações administrativas com esse filtro."
                    />
                ) : (
                    <div className="divide-y divide-border">
                        {result.items.map((entry) => (
                            <article
                                key={entry.id}
                                className="grid gap-3 px-5 py-4 transition hover:bg-surface-muted/28 sm:px-6 lg:grid-cols-[minmax(220px,1.1fr)_minmax(180px,.8fr)_minmax(260px,1.3fr)_145px]"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-[12px] font-semibold">
                                        {actionLabel(entry.action)}
                                    </p>
                                    <p className="mt-1 truncate font-mono text-[9px] text-muted">
                                        {entry.action}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-medium">
                                        {entry.actorName ?? 'Sistema'}
                                    </p>
                                    <p className="mt-1 truncate text-[9px] text-muted">
                                        {entry.actorEmail ?? 'Ação automatizada'}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <AdminBadge status={entry.resourceType}>
                                            {resourceLabel(entry.resourceType)}
                                        </AdminBadge>
                                        {entry.resourceId && (
                                            <span className="truncate font-mono text-[9px] text-muted">
                                                {entry.resourceId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1.5 truncate text-[10px] text-muted">
                                        {entry.reason ?? 'Sem justificativa informada'}
                                    </p>
                                </div>
                                <time className="text-[10px] text-muted lg:text-right">
                                    {formatAdminDate(entry.createdAt, true)}
                                </time>
                            </article>
                        ))}
                    </div>
                )}
                <AdminPagination
                    pathname="/admin/audit"
                    params={{ action }}
                    page={page}
                    pageSize={pageSize}
                    total={result.total}
                />
            </section>
        </div>
    );
}

function actionLabel(action: string) {
    const labels: Record<string, string> = {
        'platform.user.status_changed': 'Status de usuário alterado',
        'platform.organization.status_changed': 'Status de empresa alterado',
        'platform.subscription.updated': 'Assinatura atualizada',
        'platform.plan.updated': 'Dados do plano atualizados',
        'platform.plan.entitlements_replaced': 'Recursos e limites atualizados',
    };
    return labels[action] ?? action;
}

function resourceLabel(resource: string) {
    const labels: Record<string, string> = {
        user: 'Usuário',
        organization: 'Empresa',
        subscription: 'Assinatura',
        plan: 'Plano',
    };
    return labels[resource] ?? resource;
}
