import { notFound } from 'next/navigation';

import { CheckoutEditor } from '@/components/checkout-builder/checkout-editor';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { Checkout, CheckoutDraft, GatewayConnection } from '@/lib/api/types';

export default async function CheckoutBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await loadCheckout(id);
    return (
        <CheckoutEditor
            checkout={result.checkout}
            draft={result.draft}
            gatewayConnections={result.gatewayConnections}
        />
    );
}

async function loadCheckout(id: string) {
    try {
        const [checkout, draft, gatewayConnections] = await Promise.all([
            apiFetch<Checkout>(`/api/v1/checkouts/${encodeURIComponent(id)}`),
            apiFetch<CheckoutDraft>(`/api/v1/checkouts/${encodeURIComponent(id)}/draft`),
            apiFetch<GatewayConnection[]>('/api/v1/gateway-connections'),
        ]);
        return { checkout, draft, gatewayConnections };
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 404) notFound();
        throw error;
    }
}
