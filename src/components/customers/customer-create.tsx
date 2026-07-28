'use client';

import { Button } from '@/components/ui/button';

import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';

export function CustomerCreate() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    function openForm() {
        setOpen(true);
    }

    function closeForm() {
        if (loading) return;
        setOpen(false);
    }

    useEscapeClose(open, closeForm);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);
        const name = String(form.get('name') ?? '').trim();
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name,
                email: form.get('email'),
                phone: String(form.get('phone') ?? '').trim() || undefined,
                locale: 'pt-BR',
                timezone: 'America/Fortaleza',
                metadata: {},
            }),
        });
        const body = (await response.json()) as { detail?: string };
        setLoading(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível cadastrar o cliente.',
            });
            return;
        }
        setOpen(false);
        showToast({
            tone: 'success',
            title: 'Cliente cadastrado',
            description: `${name} foi adicionado à sua base de clientes.`,
        });
        router.refresh();
    }

    return (
        <>
            <Button type="button" variant="primary" onClick={openForm}>
                <Icon name="plus" className="size-3.5" />
                Adicionar cliente
            </Button>

            {open &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) closeForm();
                        }}
                        className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm"
                    >
                        <form
                            onSubmit={submit}
                            className="modal-surface glass-panel my-6 w-full max-w-2xl overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"
                        >
                            <div className="flex items-start justify-between gap-5">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                                        Relacionamento
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                                        Novo cliente
                                    </h2>
                                    <p className="mt-1.5 text-[13px] leading-5 text-muted">
                                        Cadastre os dados de contato para acompanhar compras e
                                        pagamentos.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="icon"
                                    aria-label="Fechar"
                                    disabled={loading}
                                    onClick={closeForm}
                                    className="size-9"
                                >
                                    <Icon name="close" className="size-4" />
                                </Button>
                            </div>

                            <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                <Field
                                    name="name"
                                    label="Nome"
                                    placeholder="Ex.: Maria Oliveira"
                                    autoComplete="name"
                                    required
                                />
                                <Field
                                    name="email"
                                    label="E-mail"
                                    type="email"
                                    placeholder="maria@exemplo.com"
                                    autoComplete="email"
                                    required
                                />
                                <Field
                                    name="phone"
                                    label="Telefone (opcional)"
                                    type="tel"
                                    placeholder="(85) 99999-9999"
                                    autoComplete="tel"
                                    className="sm:col-span-2"
                                />
                            </div>

                            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={loading}
                                    onClick={closeForm}
                                >
                                    Cancelar
                                </Button>
                                <Button variant="primary" disabled={loading} className="px-6">
                                    {loading ? 'Cadastrando...' : 'Cadastrar cliente'}
                                </Button>
                            </div>
                        </form>
                    </div>,
                    document.body,
                )}

        </>
    );
}

function Field({
    label,
    className,
    ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className={`text-[13px] font-semibold ${className ?? ''}`}>
            {label}
            <input
                {...input}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]"
            />
        </label>
    );
}
