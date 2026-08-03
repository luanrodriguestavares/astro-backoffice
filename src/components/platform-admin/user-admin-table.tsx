'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { AdminBadge, AdminEmpty, formatAdminDate } from '@/components/platform-admin/admin-ui';
import { AdminToast } from '@/components/platform-admin/organization-admin-table';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { PlatformAdminUser } from '@/lib/api/types';

export function UserAdminTable({
    users,
    footer,
}: {
    users: PlatformAdminUser[];
    footer?: ReactNode;
}) {
    const router = useRouter();
    const [target, setTarget] = useState<PlatformAdminUser | null>(null);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
        null,
    );

    async function submit(form: FormData) {
        if (!target) return;
        setPending(true);
        try {
            const response = await fetch(
                `/api/platform-admin/users/${encodeURIComponent(target.id)}/status`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: target.status === 'blocked' ? 'active' : 'blocked',
                        reason: String(form.get('reason') ?? ''),
                    }),
                },
            );
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok)
                throw new Error(payload.detail ?? 'Não foi possível atualizar o usuário.');
            setTarget(null);
            setMessage({ tone: 'success', text: 'Status do usuário atualizado.' });
            router.refresh();
        } catch (error) {
            setMessage({
                tone: 'error',
                text: error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
            });
        } finally {
            setPending(false);
        }
    }

    if (users.length === 0)
        return (
            <section className="glass-panel rounded-[26px]">
                <AdminEmpty
                    title="Nenhum usuário encontrado"
                    description="Tente ajustar a pesquisa ou o filtro de status."
                />
            </section>
        );

    return (
        <>
            <section className="glass-panel overflow-hidden rounded-[26px]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1020px] text-left">
                        <thead className="border-b border-border bg-surface-muted/35 text-[10px] uppercase tracking-[.1em] text-muted">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold">Usuário</th>
                                <th className="px-5 py-3.5 font-semibold">Status</th>
                                <th className="px-5 py-3.5 font-semibold">Empresas</th>
                                <th className="px-5 py-3.5 font-semibold">E-mail</th>
                                <th className="px-5 py-3.5 font-semibold">Último acesso</th>
                                <th className="px-5 py-3.5 font-semibold">Cadastro</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="text-[12px] transition hover:bg-surface-muted/28"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-strong">
                                                {initials(user.name)}
                                            </span>
                                            <div>
                                                <p className="font-semibold">{user.name}</p>
                                                <p className="mt-1 text-[10px] text-muted">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <AdminBadge status={user.status} />
                                    </td>
                                    <td className="px-5 py-4">
                                        {user.organizations.length === 0 ? (
                                            <span className="text-[10px] text-muted">
                                                Sem empresa vinculada
                                            </span>
                                        ) : (
                                            <div className="flex max-w-64 flex-wrap gap-1.5">
                                                {user.organizations.map((organization) => (
                                                    <span
                                                        key={organization.id}
                                                        title={`/${organization.slug} · ${organization.membershipStatus}`}
                                                        className="inline-flex max-w-44 items-center gap-1.5 rounded-full border border-border bg-surface-muted/45 px-2.5 py-1 text-[9px] font-medium"
                                                    >
                                                        <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                                                        <span className="truncate">
                                                            {organization.displayName}
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-[11px] ${
                                                user.emailVerified ? 'text-success' : 'text-warning'
                                            }`}
                                        >
                                            <Icon
                                                name={user.emailVerified ? 'check' : 'clock'}
                                                className="size-3.5"
                                            />
                                            {user.emailVerified ? 'Verificado' : 'Não verificado'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-muted">
                                        {formatAdminDate(user.lastLoginAt, true)}
                                    </td>
                                    <td className="px-5 py-4 text-muted">
                                        {formatAdminDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            variant={
                                                user.status === 'blocked' ? 'secondary' : 'danger'
                                            }
                                            className="h-9"
                                            onClick={() => setTarget(user)}
                                        >
                                            {user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {footer}
            </section>

            {target &&
                createPortal(
                    <div className="fixed inset-0 z-[150] grid place-items-center bg-[#11111d]/42 p-4 backdrop-blur-sm">
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="w-full max-w-[500px] rounded-[28px] border border-border bg-surface p-6 shadow-[0_30px_90px_rgba(20,17,45,.28)]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-brand-strong">
                                        Segurança da conta
                                    </p>
                                    <h2 className="mt-2 text-xl font-semibold tracking-[-.04em]">
                                        {target.status === 'blocked'
                                            ? 'Desbloquear usuário'
                                            : 'Bloquear usuário'}
                                    </h2>
                                    <p className="mt-1.5 text-[12px] leading-5 text-muted">
                                        {target.status === 'blocked'
                                            ? `${target.name} poderá voltar a acessar seus workspaces.`
                                            : `As sessões de ${target.name} serão encerradas. Nenhum dado será apagado.`}
                                    </p>
                                </div>
                                <Button
                                    aria-label="Fechar"
                                    className="grid size-9 place-items-center rounded-xl bg-surface-muted text-muted"
                                    onClick={() => !pending && setTarget(null)}
                                >
                                    <Icon name="close" className="size-4" />
                                </Button>
                            </div>
                            <form action={submit} className="mt-6">
                                <label className="block">
                                    <span className="mb-2 block text-[11px] font-semibold">
                                        Motivo da alteração
                                    </span>
                                    <textarea
                                        name="reason"
                                        required
                                        minLength={5}
                                        rows={3}
                                        placeholder="Registre o contexto desta decisão."
                                        className="w-full resize-none rounded-xl border border-border bg-[var(--control-bg)] px-3.5 py-3 text-[13px] outline-none"
                                    />
                                </label>
                                <div className="mt-5 flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={pending}
                                        onClick={() => setTarget(null)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant={target.status === 'blocked' ? 'primary' : 'danger'}
                                        className="h-11 px-5"
                                        disabled={pending}
                                    >
                                        {pending ? 'Salvando...' : 'Confirmar'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body,
                )}
            {message &&
                createPortal(
                    <AdminToast message={message} onClose={() => setMessage(null)} />,
                    document.body,
                )}
        </>
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
