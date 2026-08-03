import { AdminPagination } from '@/components/platform-admin/admin-pagination';
import { UserAdminTable } from '@/components/platform-admin/user-admin-table';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type {
    PaginatedAdminResult,
    PlatformAdminOrganization,
    PlatformAdminUser,
} from '@/lib/api/types';
import { adminPagination } from '@/lib/platform-admin/pagination';

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string;
        status?: string;
        organizationId?: string;
        page?: string;
        limit?: string;
    }>;
}) {
    const params = await searchParams;
    const q = params.q?.trim() ?? '';
    const status = ['all', 'active', 'invited', 'blocked'].includes(params.status ?? '')
        ? params.status!
        : 'all';
    const organizationId = params.organizationId?.trim() || 'all';
    const { page, pageSize, offset } = adminPagination(params.page, params.limit);
    const query = new URLSearchParams({
        q,
        status,
        limit: String(pageSize),
        offset: String(offset),
    });
    if (organizationId !== 'all') query.set('organizationId', organizationId);
    const [result, organizations] = await Promise.all([
        apiFetch<PaginatedAdminResult<PlatformAdminUser>>(`/api/v1/admin/users?${query}`),
        apiFetch<PaginatedAdminResult<PlatformAdminOrganization>>(
            '/api/v1/admin/organizations?status=all&limit=100&offset=0',
        ),
    ]);

    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Acesso à plataforma"
                title="Usuários"
                description="Consulte identidades e intervenha somente quando houver uma razão clara de segurança ou suporte."
            />
            <form className="mb-4 grid gap-3 rounded-[22px] border border-border bg-surface/58 p-3 lg:grid-cols-[minmax(220px,1fr)_180px_220px_150px_auto]">
                <label className="relative">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3.5 top-3.5 size-3.5 text-muted"
                    />
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar nome ou e-mail..."
                        className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-3.5 text-[12px] outline-none"
                    />
                </label>
                <CustomSelect
                    name="status"
                    defaultValue={status}
                    options={[
                        { value: 'all', label: 'Todos os status' },
                        { value: 'active', label: 'Ativos' },
                        { value: 'invited', label: 'Convidados' },
                        { value: 'blocked', label: 'Bloqueados' },
                    ]}
                />
                <CustomSelect
                    name="organizationId"
                    defaultValue={organizationId}
                    options={[
                        { value: 'all', label: 'Todas as empresas' },
                        ...organizations.items.map((organization) => ({
                            value: organization.id,
                            label: organization.displayName,
                        })),
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
                    {result.total === 1 ? 'usuário encontrado' : 'usuários encontrados'}
                </p>
            </div>
            <UserAdminTable
                users={result.items}
                footer={
                    <AdminPagination
                        pathname="/admin/users"
                        params={{ q, status, organizationId }}
                        page={page}
                        pageSize={pageSize}
                        total={result.total}
                    />
                }
            />
        </div>
    );
}
