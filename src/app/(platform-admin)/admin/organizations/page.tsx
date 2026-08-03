import { OrganizationAdminTable } from '@/components/platform-admin/organization-admin-table';
import { AdminPagination } from '@/components/platform-admin/admin-pagination';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type {
    PaginatedAdminResult,
    PlatformAdminOrganization,
    PlatformAdminPlan,
} from '@/lib/api/types';
import { adminPagination } from '@/lib/platform-admin/pagination';

export default async function AdminOrganizationsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string; limit?: string }>;
}) {
    const params = await searchParams;
    const q = params.q?.trim() ?? '';
    const status = ['all', 'active', 'suspended', 'closed'].includes(params.status ?? '')
        ? params.status!
        : 'all';
    const { page, pageSize, offset } = adminPagination(params.page, params.limit);
    const query = new URLSearchParams({
        q,
        status,
        limit: String(pageSize),
        offset: String(offset),
    });
    const [result, plans] = await Promise.all([
        apiFetch<PaginatedAdminResult<PlatformAdminOrganization>>(
            `/api/v1/admin/organizations?${query}`,
        ),
        apiFetch<PlatformAdminPlan[]>('/api/v1/admin/plans'),
    ]);

    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Base de clientes"
                title="Empresas"
                description="Consulte operações, gerencie acesso, planos, trials e situações de cobrança."
            />
            <form className="mb-4 grid gap-3 rounded-[22px] border border-border bg-surface/58 p-3 md:grid-cols-[minmax(240px,1fr)_190px_160px_auto]">
                <label className="relative">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3.5 top-3.5 size-3.5 text-muted"
                    />
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar empresa ou slug..."
                        className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-3.5 text-[12px] outline-none"
                    />
                </label>
                <CustomSelect
                    name="status"
                    defaultValue={status}
                    options={[
                        { value: 'all', label: 'Todos os status' },
                        { value: 'active', label: 'Ativas' },
                        { value: 'suspended', label: 'Suspensas' },
                        { value: 'closed', label: 'Encerradas' },
                    ]}
                />
                <CustomSelect
                    name="limit"
                    defaultValue={String(pageSize)}
                    options={[10, 20, 50, 100].map((value) => ({
                        value: String(value),
                        label: `${value} por página`,
                    }))}
                />
                <Button type="submit" variant="primary">
                    Filtrar
                </Button>
            </form>
            <div className="mb-3 flex justify-end">
                <p className="text-[10px] font-medium text-muted">
                    {result.total}{' '}
                    {result.total === 1 ? 'empresa encontrada' : 'empresas encontradas'}
                </p>
            </div>
            <OrganizationAdminTable
                organizations={result.items}
                plans={plans}
                footer={
                    <AdminPagination
                        pathname="/admin/organizations"
                        params={{ q, status }}
                        page={page}
                        pageSize={pageSize}
                        total={result.total}
                    />
                }
            />
        </div>
    );
}
