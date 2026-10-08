import { RoutingRules } from '@/components/orchestration/routing-rules';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { Checkout, GatewayConnection, GatewayRoutingRule, Product } from '@/lib/api/types';

export const metadata = { title: 'Regras de recebimento' };

export default async function RoutingRulesPage() {
    const [rules, connections, checkouts, products] = await Promise.all([
        apiFetch<GatewayRoutingRule[]>('/api/v1/gateway-routing-rules'),
        apiFetch<GatewayConnection[]>('/api/v1/gateway-connections'),
        // Só alimentam os filtros das regras: sem acesso, a regra fica sem esses critérios.
        apiFetch<Checkout[]>('/api/v1/checkouts').catch(() => [] as Checkout[]),
        apiFetch<Product[]>('/api/v1/products?limit=100').catch(() => [] as Product[]),
    ]);
    return (
        <>
            <PageHeader
                eyebrow="Orquestração"
                title="Regras"
                description="Opcional. Escolha qual gateway cobra cada tipo de venda: por forma de pagamento, valor, checkout ou produto."
            />
            <RoutingRules
                rules={rules}
                connections={connections}
                checkouts={checkouts}
                products={products}
            />
        </>
    );
}
