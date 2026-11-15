import {
    SubscriptionLinkAction,
    SubscriptionsEmptyState,
    type SubscriptionCheckoutLink,
} from '@/components/subscriptions/subscription-link-action';
import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable, SummaryCard, date, money } from '@/components/ui/resource-table';
import { apiFetchIfAllowed } from '@/lib/api/batched';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Checkout, Customer, Product, Subscription } from '@/lib/api/types';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
const activeStatuses = ['active', 'trialing'];

export default async function SubscriptionsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; focus?: string }>;
}) {
    const { q = '', focus } = await searchParams;
    // Tudo numa leva só; as permissões decidem depois o que entra na tela.
    const [permissions, subscriptions, allCustomers, allProducts, allCheckouts] = await Promise.all(
        [
            currentPermissions(),
            apiFetch<Subscription[]>('/api/v1/subscriptions'),
            apiFetchIfAllowed<Customer[]>('/api/v1/customers', []),
            apiFetchIfAllowed<Product[]>('/api/v1/products?limit=100', []),
            apiFetchIfAllowed<Checkout[]>('/api/v1/checkouts', []),
        ],
    );
    const canReadProducts = permissions.has('products.read');
    const customers = canReadProducts ? allCustomers : [];
    const products = canReadProducts ? allProducts : [];
    // A assinatura nasce no checkout: o atalho da tela é o link de um checkout publicado que
    // vende plano recorrente (antes: "Criar assinatura", que ficava sem forma de pagamento).
    const subscriptionCheckouts: SubscriptionCheckoutLink[] = (canReadProducts ? allCheckouts : [])
        .filter((checkout) => checkout.status === 'published')
        .map((checkout) => ({
            id: checkout.id,
            name: checkout.name,
            url: checkoutPublicUrl(checkout.slug),
            plans: (checkout.products ?? [])
                .filter((item) => item.pricingType === 'recurring')
                .map(
                    (item) =>
                        `${item.priceName} · ${money(item.amountMinor, item.currency)}/${interval(item.recurringInterval ?? 'month')}`,
                ),
        }))
        .filter((checkout) => checkout.plans.length > 0);
    const customerMap = new Map(customers.map((item) => [item.id, item]));
    const productMap = new Map(products.map((item) => [item.id, item]));
    const active = subscriptions.filter((item) => activeStatuses.includes(item.status));
    const currency = subscriptions[0]?.currency ?? 'BRL';
    const recurringRevenue = active.reduce((sum, item) => sum + item.amountMinor, 0);
    const scheduledCancellation = active.filter((item) => item.cancelAtPeriodEnd).length;
    const action = canReadProducts ? (
        <SubscriptionLinkAction checkouts={subscriptionCheckouts} />
    ) : undefined;
    return (
        <>
            <PageHeader
                eyebrow="Recorrência"
                title="Assinaturas"
                description="Acompanhe ciclos, valores, renovações e cancelamentos."
                actions={action}
            />
            <section data-tour="page-summary" className="mb-4 grid gap-3 sm:grid-cols-3">
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
            {subscriptions.length === 0 ? (
                <SubscriptionsEmptyState />
            ) : (
                <ResourceTable
                    title="Assinaturas e planos"
                    description="Ciclos recorrentes processados pelos gateways"
                    rows={subscriptions}
                    initialQuery={q}
                    focusId={focus}
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
            )}
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
