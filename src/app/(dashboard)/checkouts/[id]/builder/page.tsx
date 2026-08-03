import { notFound, redirect } from 'next/navigation';

import { CheckoutEditor } from '@/components/checkout-builder/checkout-editor';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import { publicAssetApiUrl } from '@/lib/api/config';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Checkout, CheckoutDraft, GatewayConnection, MediaFile } from '@/lib/api/types';

export default async function CheckoutBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const permissions = await currentPermissions();
    if (!permissions.has('products.write'))
        redirect(`/checkouts/${encodeURIComponent(id)}/preview`);
    const result = await loadCheckout(id, permissions.has('gateway_connections.manage'));
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

async function loadCheckout(id: string, canManageGateways: boolean) {
    try {
        const [checkout, draft, gatewayConnections, mediaFiles] = await Promise.all([
            apiFetch<Checkout>(`/api/v1/checkouts/${encodeURIComponent(id)}`),
            apiFetch<CheckoutDraft>(`/api/v1/checkouts/${encodeURIComponent(id)}/draft`),
            canManageGateways
                ? apiFetch<GatewayConnection[]>('/api/v1/gateway-connections')
                : Promise.resolve([]),
            apiFetch<MediaFile[]>('/api/v1/files'),
        ]);
        return { checkout, draft, gatewayConnections, mediaFiles };
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 404) notFound();
        throw error;
    }
}
