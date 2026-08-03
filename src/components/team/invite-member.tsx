'use client';

import { Button } from '@/components/ui/button';

import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';
import type { InvitableRole } from '@/lib/api/types';

export const roleDescriptions: Record<InvitableRole['code'], string> = {
    administrator: 'Administra toda a operação, equipe, integrações e plano da workspace.',
    developer: 'Cuida de produtos, checkouts, gateways, webhooks, API e analytics.',
    finance: 'Acessa pagamentos, reembolsos, assinaturas e faturas.',
    editor: 'Cria produtos e publica checkouts, sem acesso financeiro.',
    support: 'Consulta produtos, pagamentos, assinaturas e faturas, sem alterar dados.',
    viewer: 'Visão somente leitura dos dados comerciais e financeiros.',
};

export const permissionLabels: Record<string, string> = {
    'products.read': 'Ver produtos e checkouts',
    'products.write': 'Criar e editar produtos',
    'checkouts.publish': 'Publicar checkouts',
    'gateway_connections.manage': 'Gerenciar gateways',
    'payments.read': 'Ver pagamentos e pedidos',
    'payments.refund': 'Realizar reembolsos',
    'subscriptions.read': 'Ver assinaturas',
    'subscriptions.create': 'Criar assinaturas',
    'subscriptions.cancel': 'Cancelar assinaturas',
    'subscriptions.pause': 'Pausar assinaturas',
    'subscriptions.change_plan': 'Alterar planos de assinatura',
    'invoices.read': 'Ver faturas',
    'webhooks.manage': 'Gerenciar webhooks',
    'members.manage': 'Gerenciar equipe',
    'audit.read': 'Consultar auditoria',
    'api_keys.manage': 'Gerenciar chaves de API',
    'analytics.read': 'Consultar analytics',
    'platform_billing.manage': 'Gerenciar plano Astro',
};

export function InviteMember({ roles }: { roles: InvitableRole[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [invitationLink, setInvitationLink] = useState<string>();
    const [selectedRole, setSelectedRole] = useState(roles[0]?.code ?? 'viewer');
    const role = roles.find(({ code }) => code === selectedRole);

    function close() {
        if (loading) return;
        setOpen(false);
        setInvitationLink(undefined);
    }

    useEscapeClose(open, close);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);
        const response = await fetch('/api/team/invitations', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: form.get('email'), role: form.get('role') }),
        });
        const body = (await response.json()) as {
            data?: { developmentToken?: string };
            detail?: string;
        };
        setLoading(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível enviar o convite.',
            });
            return;
        }
        const developmentToken = body.data?.developmentToken;
        if (developmentToken) {
            const url = new URL('/invitation', window.location.origin);
            url.searchParams.set('token', developmentToken);
            setInvitationLink(url.toString());
        }
        showToast({
            tone: 'success',
            title: developmentToken ? 'Convite criado' : 'Convite enviado',
            description: developmentToken
                ? 'Copie o link e envie diretamente para o novo membro.'
                : 'O novo membro foi convidado para o workspace.',
        });
        router.refresh();
        if (!body.data?.developmentToken) close();
    }

    return (
        <>
            <Button type="button" variant="primary" onClick={() => setOpen(true)}>
                <Icon name="plus" className="size-3.5" />
                Convidar membro
            </Button>
            {open &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) close();
                        }}
                        className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm"
                    >
                        <form
                            onSubmit={submit}
                            className="modal-surface glass-panel my-6 w-full max-w-lg rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"
                        >
                            <div className="flex items-start justify-between gap-5">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                                        Acesso
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                                        Convidar membro
                                    </h2>
                                    <p className="mt-1.5 text-[13px] leading-5 text-muted">
                                        Envie um convite e defina o nível de acesso à organização.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="icon"
                                    aria-label="Fechar"
                                    disabled={loading}
                                    onClick={close}
                                >
                                    <Icon name="close" className="size-4" />
                                </Button>
                            </div>
                            {invitationLink ? (
                                <>
                                    <p className="mt-6 text-[13px] leading-5 text-muted">
                                        O envio de e-mail está simulado. Compartilhe este link com o
                                        convidado; ele é exibido somente agora.
                                    </p>
                                    <a
                                        href={invitationLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 block break-all rounded-xl border border-border bg-[var(--control-bg)] p-3 text-xs text-brand-strong hover:border-brand/40"
                                    >
                                        {invitationLink}
                                    </a>
                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(invitationLink);
                                                showToast({
                                                    tone: 'success',
                                                    description: 'Link copiado.',
                                                });
                                            }}
                                        >
                                            Copiar link
                                        </Button>
                                        <Button type="button" variant="primary" onClick={close}>
                                            Concluir
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mt-7 grid gap-4">
                                        <label className="text-[13px] font-semibold">
                                            E-mail
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="nome@empresa.com"
                                                className="mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]"
                                            />
                                        </label>
                                        <label className="text-[13px] font-semibold">
                                            Função
                                            <div className="mt-2">
                                                <CustomSelect
                                                    name="role"
                                                    value={selectedRole}
                                                    onValueChange={(value) =>
                                                        setSelectedRole(
                                                            value as InvitableRole['code'],
                                                        )
                                                    }
                                                    options={roles.map((item) => ({
                                                        value: item.code,
                                                        label: roleLabel(item.code),
                                                    }))}
                                                />
                                            </div>
                                        </label>
                                        {role && (
                                            <div className="rounded-2xl border border-brand/12 bg-brand-soft/35 p-4">
                                                <p className="text-[12px] font-semibold text-brand-strong">
                                                    {roleDescriptions[role.code]}
                                                </p>
                                                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.12em] text-muted">
                                                    Permissões deste perfil
                                                </p>
                                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                                    {role.permissions.map((permission) => (
                                                        <li
                                                            key={permission}
                                                            className="rounded-full border border-brand/12 bg-white/60 px-2.5 py-1 text-[10px] text-foreground"
                                                        >
                                                            {permissionLabels[permission] ??
                                                                permission}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={loading}
                                            onClick={close}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button variant="primary" disabled={loading}>
                                            {loading ? 'Enviando...' : 'Enviar convite'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>,
                    document.body,
                )}
        </>
    );
}

export function roleLabel(role: InvitableRole['code']) {
    return {
        administrator: 'Administrador',
        developer: 'Desenvolvedor',
        finance: 'Financeiro',
        editor: 'Editor',
        support: 'Suporte',
        viewer: 'Leitura',
    }[role];
}
