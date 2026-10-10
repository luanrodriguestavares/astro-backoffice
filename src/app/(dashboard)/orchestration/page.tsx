import { FlowEditor } from '@/components/orchestration/flow-editor/flow-editor';
import { apiFetch } from '@/lib/api/server';
import type {
    Checkout,
    GatewayConnection,
    GatewayFlow,
    GatewayInsights,
    Product,
    WebhookEndpointSummary,
} from '@/lib/api/types';

export const metadata = { title: 'Fluxo de orquestração' };

export default async function OrchestrationFlowPage() {
    const [flow, connections, insights, checkouts, products, webhooks] = await Promise.all([
        apiFetch<GatewayFlow>('/api/v1/gateway-flow'),
        apiFetch<GatewayConnection[]>('/api/v1/gateway-connections'),
        // Métricas e listas só enriquecem os blocos: sem acesso, o editor funciona sem elas.
        apiFetch<GatewayInsights>('/api/v1/gateway-insights?days=30').catch(() => null),
        apiFetch<Checkout[]>('/api/v1/checkouts').catch(() => [] as Checkout[]),
        apiFetch<Product[]>('/api/v1/products?limit=100').catch(() => [] as Product[]),
        // Sem permissão de webhooks, a ação "Enviar webhook" mostra só o aviso para cadastrar.
        apiFetch<WebhookEndpointSummary[]>('/api/v1/developer/webhook-endpoints').catch(
            () => [] as WebhookEndpointSummary[],
        ),
    ]);
    return (
        <FlowEditor
            flow={flow}
            connections={connections}
            insights={insights}
            checkouts={checkouts}
            products={products}
            webhooks={webhooks}
        />
    );
}
