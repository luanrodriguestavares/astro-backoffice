import { notFound } from 'next/navigation';

import { CheckoutEditor } from '@/components/checkout-builder/checkout-editor';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import { publicAssetApiUrl } from '@/lib/api/config';
import type { Checkout, CheckoutDraft, GatewayConnection, MediaFile } from '@/lib/api/types';

export default async function CheckoutBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await loadCheckout(id);
    return (
        <CheckoutEditor
            checkout={result.checkout}
            draft={result.draft}
            gatewayConnections={result.gatewayConnections}
            mediaFiles={result.mediaFiles}
            mediaApiUrl={publicAssetApiUrl()}
        />
    );
}

async function loadCheckout(id: string) {
    try {
        const [checkout, draft, gatewayConnections, mediaFiles] = await Promise.all([
            apiFetch<Checkout>(`/api/v1/checkouts/${encodeURIComponent(id)}`),
            apiFetch<CheckoutDraft>(`/api/v1/checkouts/${encodeURIComponent(id)}/draft`),
            apiFetch<GatewayConnection[]>('/api/v1/gateway-connections'),
            apiFetch<MediaFile[]>('/api/v1/files'),
        ]);
        return { checkout, draft, gatewayConnections, mediaFiles };
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 404) notFound();
        throw error;
    }
}
