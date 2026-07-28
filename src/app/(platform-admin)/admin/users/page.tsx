import { UserAdminTable } from '@/components/platform-admin/user-admin-table';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { PaginatedAdminResult, PlatformAdminUser } from '@/lib/api/types';

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const params = await searchParams;
    const q = params.q?.trim() ?? '';
    const status = ['all', 'active', 'invited', 'blocked'].includes(params.status ?? '')
        ? params.status!
        : 'all';
    const query = new URLSearchParams({ q, status, limit: '100' });
    const result = await apiFetch<PaginatedAdminResult<PlatformAdminUser>>(
        `/api/v1/admin/users?${query}`,
    );

    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Acesso à plataforma"
                title="Usuários"
                description="Consulte identidades e intervenha somente quando houver uma razão clara de segurança ou suporte."
            />
            <form className="mb-4 grid gap-3 rounded-[22px] border border-border bg-surface/58 p-3 sm:grid-cols-[minmax(240px,1fr)_210px_auto]">
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
                <Button type="submit" variant="primary">
                    Filtrar
                </Button>
            </form>
            <div className="mb-3 flex justify-end">
                <p className="text-[10px] font-medium text-muted">
                    {result.total} {result.total === 1 ? 'usuário encontrado' : 'usuários encontrados'}
                </p>
            </div>
            <UserAdminTable users={result.items} />
        </div>
    );
}
