'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';
import type { Checkout, Product } from '@/lib/api/types';

type Scope = { type: 'checkout' | 'product'; id: string; name: string } | null;

export function CouponScopeEdit({
    coupon,
    checkouts,
    products,
}: {
    coupon: { id: string; version: number; scope: Scope };
    checkouts: Checkout[];
    products: Product[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scopeType, setScopeType] = useState<'checkout' | 'product'>(
        coupon.scope?.type ?? 'checkout',
    );
    const [scopeId, setScopeId] = useState(coupon.scope?.id ?? '');

    function close() {
        if (!loading) setOpen(false);
    }

    useEscapeClose(open, close);

    async function save() {
        if (!scopeId) {
            showToast({ tone: 'error', description: 'Selecione onde o cupom será aceito.' });
            return;
        }
        setLoading(true);
        const response = await fetch(`/api/coupons/${encodeURIComponent(coupon.id)}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                version: coupon.version,
                scope: { type: scopeType, id: scopeId },
            }),
        });
        const body = (await response.json()) as { detail?: string };
        setLoading(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível atualizar o cupom.',
            });
            return;
        }
        setOpen(false);
        showToast({
            tone: 'success',
            title: 'Aplicação atualizada',
            description: 'O cupom só será aceito no novo escopo.',
        });
        router.refresh();
    }

    return (
        <>
            <Button
                type="button"
                onClick={() => setOpen(true)}
                className="text-left text-[12px] font-semibold text-brand-strong hover:underline"
            >
                {coupon.scope === null
                    ? 'Definir aplicação'
                    : `${coupon.scope.type === 'checkout' ? 'Checkout' : 'Produto'}: ${coupon.scope.name}`}
            </Button>
            {open &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) close();
                        }}
                        className="fixed inset-0 z-[100] grid place-items-center bg-[#17172c]/20 p-4 backdrop-blur-sm"
                    >
                        <section className="modal-surface glass-panel w-full max-w-lg rounded-[28px] p-5 sm:p-7">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold tracking-[-0.035em]">
                                        Onde aceitar o cupom?
                                    </h2>
                                    <p className="mt-1.5 text-[13px] text-muted">
                                        O desconto será bloqueado fora do escopo selecionado.
                                    </p>
                                </div>
                                <Button type="button" variant="icon" onClick={close}>
                                    <Icon name="close" className="size-4" />
                                </Button>
                            </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <ScopeField label="Aplicar por">
                                    <CustomSelect
                                        name="scopeType"
                                        value={scopeType}
                                        onValueChange={(value) => {
                                            setScopeType(value as 'checkout' | 'product');
                                            setScopeId('');
                                        }}
                                        options={[
                                            { value: 'checkout', label: 'Checkout específico' },
                                            { value: 'product', label: 'Produto específico' },
                                        ]}
                                    />
                                </ScopeField>
                                <ScopeField
                                    label={scopeType === 'checkout' ? 'Checkout' : 'Produto'}
                                >
                                    <CustomSelect
                                        name="scopeId"
                                        value={scopeId}
                                        onValueChange={setScopeId}
                                        options={(scopeType === 'checkout'
                                            ? checkouts
                                            : products
                                        ).map((item) => ({ value: item.id, label: item.name }))}
                                    />
                                </ScopeField>
                            </div>
                            <div className="mt-7 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={close}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    disabled={loading}
                                    onClick={save}
                                >
                                    {loading ? 'Salvando...' : 'Salvar aplicação'}
                                </Button>
                            </div>
                        </section>
                    </div>,
                    document.body,
                )}
        </>
    );
}

function ScopeField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="text-[13px] font-semibold">
            {label}
            <div className="mt-2">{children}</div>
        </label>
    );
}
