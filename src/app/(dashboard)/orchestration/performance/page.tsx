import { OrchestrationOverview } from '@/components/orchestration/orchestration-overview';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { GatewayConnection, GatewayFlow, GatewayInsights } from '@/lib/api/types';

export const metadata = { title: 'Desempenho da orquestração' };

export default async function OrchestrationPerformancePage() {
    const permissions = await currentPermissions();
    const canManage = permissions.has('gateway_connections.manage');
    const [insights, connections, flow] = await Promise.all([
        apiFetch<GatewayInsights>('/api/v1/gateway-insights?days=30'),
        canManage
            ? apiFetch<GatewayConnection[]>('/api/v1/gateway-connections')
            : Promise.resolve([] as GatewayConnection[]),
        canManage ? apiFetch<GatewayFlow>('/api/v1/gateway-flow') : Promise.resolve(null),
    ]);
    const { summary } = insights;
    const live = connections.filter(
        (connection) => connection.status === 'active' || connection.status === 'degraded',
    );
    const unstable = live.filter((connection) => connection.status === 'degraded').length;

    return (
        <>
            <PageHeader
                eyebrow="Orquestração"
                title="Desempenho"
                description="Como suas vendas estão sendo cobradas nos últimos 30 dias."
            />

            <section
                aria-label="Números da orquestração"
                className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"
            >
                <StatCard
                    label="Vendas aprovadas"
                    value={summary.approvalRate === null ? '—' : percent(summary.approvalRate)}
                    detail={
                        summary.approved + summary.declined === 0
                            ? 'Nenhuma venda concluída ainda'
                            : `${String(summary.approved)} de ${String(summary.approved + summary.declined)} vendas`
                    }
                    icon="check"
                    href="/payments"
                    tone="success"
                />
                <StatCard
                    label="Salvas pelo gateway reserva"
                    value={String(summary.recoveredByFailover)}
                    detail="Passaram depois que o principal falhou"
                    icon="repeat"
                    href="/payments"
                />
                <StatCard
                    label="Gateways funcionando"
                    value={
                        canManage
                            ? `${String(live.length - unstable)} de ${String(live.length)}`
                            : '—'
                    }
                    detail={
                        unstable > 0 ? `${String(unstable)} instável agora` : 'Todos funcionando'
                    }
                    icon="pulse"
                    href="/gateways"
                    tone={unstable > 0 ? 'warning' : 'brand'}
                />
            </section>

            <OrchestrationOverview insights={insights} connections={live} flow={flow} />
        </>
    );
}

function percent(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 }).format(
        value,
    );
}
