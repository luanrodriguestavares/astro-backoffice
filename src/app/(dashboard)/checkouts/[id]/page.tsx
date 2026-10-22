import { notFound, redirect } from 'next/navigation';

import { CheckoutEditor } from '@/components/checkout-builder/checkout-editor';
import { publicAssetApiUrl } from '@/lib/api/config';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type {
    Checkout,
    CheckoutDraft,
    GatewayConnection,
    GatewayInsights,
    MediaFile,
    Product,
    WebhookEndpointSummary,
} from '@/lib/api/types';

export const metadata = { title: 'Checkout' };

/**
 * Workspace do checkout: o funil é a tela principal; dele se abrem o pagamento (modo simples
 * no painel, nós no editor avançado) e as páginas no builder.
 */
export default async function CheckoutWorkspacePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string; settings?: string }>;
}) {
    const { id } = await params;
    const { tab, settings } = await searchParams;
    const permissions = await currentPermissions();
    if (!permissions.has('products.write'))
        redirect(`/checkouts/${encodeURIComponent(id)}/preview`);
    const canManageGateways = permissions.has('gateway_connections.manage');
    const data = await loadWorkspace(id, canManageGateways);
    return (
        <CheckoutEditor
            checkout={data.checkout}
            draft={data.draft}
            gatewayConnections={data.connections}
            mediaFiles={data.mediaFiles}
            mediaApiUrl={publicAssetApiUrl()}
            flowResources={data.flowResources}
            canManageGateways={canManageGateways}
            initialTab={tab}
            initialPaymentSettingsOpen={settings === 'payments'}
        />
    );
}

async function loadWorkspace(id: string, canManageGateways: boolean) {
    // O editor de nós do pagamento usa gateways, métricas, produtos e webhooks só para
    // enriquecer os blocos: sem acesso a eles, o workspace funciona sem essas listas.
    const optional = <T,>(path: string, fallback: T, enabled = true) =>
        enabled ? apiFetch<T>(path).catch(() => fallback) : Promise.resolve(fallback);
    try {
        const [checkout, draft, mediaFiles, connections, insights, products, webhooks] =
            await Promise.all([
                apiFetch<Checkout>(`/api/v1/checkouts/${encodeURIComponent(id)}`),
                apiFetch<CheckoutDraft>(`/api/v1/checkouts/${encodeURIComponent(id)}/draft`),
                apiFetch<MediaFile[]>('/api/v1/files'),
                optional<GatewayConnection[]>('/api/v1/gateway-connections', [], canManageGateways),
                optional<GatewayInsights | null>('/api/v1/gateway-insights?days=30', null),
                optional<Product[]>('/api/v1/products?limit=100', []),
                optional<WebhookEndpointSummary[]>('/api/v1/developer/webhook-endpoints', []),
            ]);
        return {
            checkout,
            draft,
            mediaFiles,
            connections,
            flowResources: { insights, products, webhooks },
        };
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 404) notFound();
        throw error;
    }
}
