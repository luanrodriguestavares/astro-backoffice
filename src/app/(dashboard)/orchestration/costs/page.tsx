import { GatewayCosts } from '@/components/orchestration/gateway-costs';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { GatewayConnection, GatewayRoutingRule } from '@/lib/api/types';

export const metadata = { title: 'Taxas dos gateways' };

export default async function GatewayCostsPage() {
    const [connections, rules] = await Promise.all([
        apiFetch<GatewayConnection[]>('/api/v1/gateway-connections'),
        apiFetch<GatewayRoutingRule[]>('/api/v1/gateway-routing-rules'),
    ]);
    return (
        <>
            <PageHeader
                eyebrow="Orquestração"
                title="Taxas"
                description="Informe quanto cada gateway cobra por venda. Assim o Astro consegue escolher o mais barato para você."
            />
            <GatewayCosts
                connections={connections.filter((connection) => connection.status !== 'disabled')}
                costRules={
                    rules.filter(
                        (rule) => rule.strategy === 'lowest_cost' && rule.status === 'active',
                    ).length
                }
            />
        </>
    );
}
