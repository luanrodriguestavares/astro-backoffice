'use client';

import { Button } from '@/components/ui/button';

import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';

export function InviteMember() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string>();

    function close() {
        if (loading) return;
        setOpen(false);
        setToken(undefined);
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
        setToken(body.data?.developmentToken);
        showToast({
            tone: 'success',
            title: 'Convite enviado',
            description: 'O novo membro foi convidado para o workspace.',
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
                            {token ? (
                                <>
                                    <p className="mt-6 text-[13px] leading-5 text-muted">
                                        Em ambiente local, compartilhe este token com o convidado.
                                        Ele é exibido somente agora.
                                    </p>
                                    <code className="mt-3 block overflow-x-auto rounded-xl border border-border bg-[var(--control-bg)] p-3 text-xs">
                                        {token}
                                    </code>
                                    <div className="mt-6 flex justify-end">
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
                                                    defaultValue="admin"
                                                    options={[
                                                        { value: 'admin', label: 'Administrador' },
                                                        { value: 'finance', label: 'Financeiro' },
                                                        { value: 'support', label: 'Suporte' },
                                                        { value: 'viewer', label: 'Leitura' },
                                                    ]}
                                                />
                                            </div>
                                        </label>
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
