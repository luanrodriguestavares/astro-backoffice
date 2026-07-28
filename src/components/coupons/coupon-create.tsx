'use client';

import { Button } from '@/components/ui/button';

import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';

export function CouponCreate() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [discountType, setDiscountType] = useState('percentage');

    function close() {
        if (!loading) {
            setOpen(false);
        }
    }

    useEscapeClose(open, close);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);
        const shownValue = Number(String(form.get('discountValue') ?? '0').replace(',', '.'));
        const response = await fetch('/api/coupons', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: form.get('name'),
                code: form.get('code'),
                discountType,
                discountValue: Math.round(shownValue * 100),
                ...(discountType === 'fixed' ? { currency: 'BRL' } : {}),
                status: 'active',
                metadata: {},
            }),
        });
        const body = (await response.json()) as { detail?: string };
        setLoading(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível cadastrar o cupom.',
            });
            return;
        }
        setOpen(false);
        setDiscountType('percentage');
        showToast({
            tone: 'success',
            title: 'Cupom criado',
            description: 'O cupom já pode ser utilizado nos checkouts.',
        });
        router.refresh();
    }

    return (
        <>
            <Button type="button" variant="primary" onClick={() => setOpen(true)}>
                <Icon name="plus" className="size-3.5" />
                Criar cupom
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
                            className="modal-surface glass-panel my-6 w-full max-w-2xl rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"
                        >
                            <div className="flex items-start justify-between gap-5">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                                        Promoções
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                                        Novo cupom
                                    </h2>
                                    <p className="mt-1.5 text-[13px] leading-5 text-muted">
                                        Crie um código de desconto para utilizar nos checkouts.
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
                            <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                <Field
                                    name="name"
                                    label="Nome"
                                    placeholder="Ex.: Campanha de lançamento"
                                    required
                                />
                                <Field
                                    name="code"
                                    label="Código"
                                    placeholder="LANCAMENTO10"
                                    required
                                    className="uppercase"
                                />
                                <label className="text-[13px] font-semibold">
                                    Tipo de desconto
                                    <div className="mt-2">
                                        <CustomSelect
                                            name="discountType"
                                            value={discountType}
                                            onValueChange={setDiscountType}
                                            options={[
                                                { value: 'percentage', label: 'Percentual' },
                                                { value: 'fixed', label: 'Valor fixo' },
                                            ]}
                                        />
                                    </div>
                                </label>
                                <Field
                                    name="discountValue"
                                    label={
                                        discountType === 'percentage'
                                            ? 'Desconto (%)'
                                            : 'Desconto (R$)'
                                    }
                                    type="number"
                                    min="0.01"
                                    max={discountType === 'percentage' ? '100' : undefined}
                                    step="0.01"
                                    placeholder={discountType === 'percentage' ? '10' : '25,00'}
                                    required
                                />
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
                                    {loading ? 'Criando...' : 'Criar cupom'}
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
        <label className="text-[13px] font-semibold">
            {label}
            <input
                {...input}
                className={`mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)] ${className ?? ''}`}
            />
        </label>
    );
}
