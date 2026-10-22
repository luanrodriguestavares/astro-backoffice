'use client';

import { useState } from 'react';

import { CheckoutFunnelAnalytics } from '@/components/checkout-builder/checkout-funnel-analytics';
import { CustomSelect } from '@/components/ui/custom-select';

export function FunnelAnalyticsHub({
    checkouts,
    initialCheckoutId,
}: {
    checkouts: { id: string; name: string; status: string }[];
    initialCheckoutId?: string;
}) {
    const [checkoutId, setCheckoutId] = useState(
        checkouts.find((checkout) => checkout.id === initialCheckoutId)?.id ?? checkouts[0]?.id ?? '',
    );
    if (!checkoutId) {
        return (
            <section className="glass-panel rounded-[28px] p-12 text-center">
                <h2 className="text-sm font-semibold">Nenhum checkout disponível</h2>
                <p className="mt-2 text-[12px] text-muted">Crie um checkout para começar a acompanhar a jornada.</p>
            </section>
        );
    }
    return (
        <div className="space-y-4">
            <section className="glass-panel flex flex-col gap-3 rounded-[22px] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-sm font-semibold">Checkout analisado</h2>
                    <p className="mt-1 text-[11.5px] text-muted">Troque o checkout sem sair da visão de funil.</p>
                </div>
                <div className="w-full sm:w-[320px]">
                    <CustomSelect
                        name="analytics-checkout"
                        value={checkoutId}
                        onValueChange={setCheckoutId}
                        options={checkouts.map((checkout) => ({
                            value: checkout.id,
                            label: checkout.name,
                            badge: checkout.status === 'published' ? 'Publicado' : 'Rascunho',
                        }))}
                    />
                </div>
            </section>
            <CheckoutFunnelAnalytics checkoutId={checkoutId} />
        </div>
    );
}
