import { SubscriptionCreateAction } from '@/components/resources/create-actions';
import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable, SummaryCard, date, money } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Customer, GatewayConnection, Price, Product, Subscription } from '@/lib/api/types';
const activeStatuses = ['active', 'trialing'];

export default async function SubscriptionsPage() {
    const permissions = await currentPermissions();
    const canReadProducts = permissions.has('products.read');
    const canManageGateways = permissions.has('gateway_connections.manage');
    const canCreate =
        permissions.has('subscriptions.create') && canReadProducts && canManageGateways;
    const [subscriptions, customers, products, gateways] = await Promise.all([
        apiFetch<Subscription[]>('/api/v1/subscriptions'),
        canReadProducts ? apiFetch<Customer[]>('/api/v1/customers') : Promise.resolve([]),
        canReadProducts
            ? apiFetch<Product[]>('/api/v1/products?limit=100')
            : Promise.resolve([]),
        canManageGateways
            ? apiFetch<GatewayConnection[]>('/api/v1/gateway-connections')
            : Promise.resolve([]),
    ]);
    const priceGroups = await Promise.all(
        products.map(async (product) => ({
            product,
            prices: await apiFetch<Price[]>(`/api/v1/products/${product.id}/prices`),
        })),
    );
    const recurringPrices = priceGroups.flatMap(({ product, prices }) =>
        prices
            .filter((price) => price.pricingType === 'recurring' && price.status === 'active')
            .map((price) => ({
                value: price.id,
                label: `${product.name} · ${price.name} · ${money(price.amountMinor, price.currency)}/${interval(price.recurringInterval ?? 'month')}`,
            })),
    );
    const customerMap = new Map(customers.map((item) => [item.id, item]));
    const productMap = new Map(products.map((item) => [item.id, item]));
    const active = subscriptions.filter((item) => activeStatuses.includes(item.status));
    const currency = subscriptions[0]?.currency ?? 'BRL';
    const recurringRevenue = active.reduce((sum, item) => sum + item.amountMinor, 0);
    const scheduledCancellation = active.filter((item) => item.cancelAtPeriodEnd).length;
    const action = canCreate ? (
        <SubscriptionCreateAction
            customers={customers.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.email}`,
            }))}
            prices={recurringPrices}
            gateways={gateways
                .filter((item) => item.status === 'active')
                .map((item) => ({ value: item.id, label: item.name }))}
        />
    ) : undefined;
    return (
        <>
            <PageHeader
                eyebrow="Recorrência"
                title="Assinaturas"
                description="Acompanhe ciclos, valores, renovações e cancelamentos."
                actions={action}
            />
            <section className="mb-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Assinaturas ativas"
                    value={String(active.length)}
                    detail={`${subscriptions.length} assinaturas no total`}
                    icon="repeat"
                />
                <SummaryCard
                    label="Receita recorrente"
                    value={money(recurringRevenue, currency)}
                    detail="Valor do ciclo das assinaturas ativas"
                    icon="chart"
                />
                <SummaryCard
                    label="Cancelamento agendado"
                    value={String(scheduledCancellation)}
                    detail="Ao final do período atual"
                    icon="clock"
                />
            </section>
            <ResourceTable
                title="Assinaturas e planos"
                description="Ciclos recorrentes processados pelos gateways"
                rows={subscriptions}
                empty="Nenhuma assinatura criada."
                columns={[
                    {
                        label: 'Cliente',
                        value: (row) => customerMap.get(row.customerId)?.name ?? row.customerId,
                    },
                    {
                        label: 'Produto',
                        value: (row) => productMap.get(row.productId)?.name ?? row.productId,
                    },
                    {
                        label: 'Valor',
                        value: (row) =>
                            `${money(row.amountMinor, row.currency)}/${interval(row.interval)}`,
                    },
                    { label: 'Status', value: (row) => row.status },
                    { label: 'Próxima cobrança', value: (row) => date(row.nextBillingAt) },
                ]}
            />
        </>
    );
}

function interval(value: string) {
    return (
        ({ day: 'dia', week: 'semana', month: 'mês', year: 'ano' } as Record<string, string>)[
            value
        ] ?? value
    );
}
