import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard, money } from '@/components/ui/resource-table';
import { OrdersTable, type OrderRow } from '@/components/orders/orders-table';
import { apiFetch } from '@/lib/api/server';
import type { Customer, Payment } from '@/lib/api/types';

export default async function OrdersPage() {
    const [orders, customers, payments] = await Promise.all([
        apiFetch<OrderRow[]>('/api/v1/orders'),
        apiFetch<Customer[]>('/api/v1/customers'),
        apiFetch<Payment[]>('/api/v1/payments'),
    ]);
    const currency = orders[0]?.currency ?? 'BRL';
    const total = orders.reduce((sum, order) => sum + order.totalMinor, 0);
    const paid = orders.reduce((sum, order) => sum + order.paidMinor, 0);
    const outstanding = orders.reduce(
        (sum, order) => sum + Math.max(0, order.totalMinor - order.paidMinor),
        0,
    );
    const discounts = orders.reduce((sum, order) => sum + order.discountMinor, 0);
    const refunded = orders.reduce((sum, order) => sum + order.refundedMinor, 0);
    const completed = orders.filter(
        (order) => order.paidMinor >= order.totalMinor && order.totalMinor > 0,
    ).length;

    return (
        <>
            <PageHeader
                eyebrow="Vendas"
                title="Pedidos"
                description="Entenda o que foi comprado, por quem e a situação comercial de cada venda."
            />
            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Valor dos pedidos" value={money(total, currency)} detail={`${orders.length} pedidos realizados`} icon="cart" />
                <SummaryCard label="Pedidos pagos" value={percentage(orders.length ? completed / orders.length : 0)} detail={`${completed} pagos integralmente`} icon="check" />
                <SummaryCard label="Saldo a receber" value={money(outstanding, currency)} detail={`${money(paid, currency)} já recebidos`} icon="clock" />
                <SummaryCard label="Descontos concedidos" value={money(discounts, currency)} detail={`${money(refunded, currency)} reembolsados`} icon="tag" />
            </section>
            <OrdersTable orders={orders} customers={customers} payments={payments} />
        </>
    );
}

function percentage(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}
