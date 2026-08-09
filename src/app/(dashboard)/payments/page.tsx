import { PaymentsTable } from '@/components/payments/payments-table';
import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Customer, GatewayConnection, Payment } from '@/lib/api/types';

const successfulStatuses = ['approved', 'paid', 'captured', 'succeeded'];

export default async function PaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ payment?: string }>;
}) {
    const { payment: highlightedPaymentId } = await searchParams;
    const permissions = await currentPermissions();
    const [payments, customers, gateways] = await Promise.all([
        apiFetch<Payment[]>('/api/v1/payments'),
        permissions.has('products.read')
            ? apiFetch<Customer[]>('/api/v1/customers')
            : Promise.resolve([]),
        permissions.has('gateway_connections.manage')
            ? apiFetch<GatewayConnection[]>('/api/v1/gateway-connections')
            : Promise.resolve([]),
    ]);
    const currency = payments[0]?.currency ?? 'BRL';
    const approved = payments.filter((payment) => successfulStatuses.includes(payment.status));
    const received = approved.reduce((sum, payment) => sum + payment.capturedMinor, 0);
    const refunded = payments.reduce((sum, payment) => sum + payment.refundedMinor, 0);
    const pending = payments.filter((payment) =>
        ['pending', 'processing', 'authorized'].includes(payment.status),
    );
    const failed = payments.filter((payment) =>
        ['rejected', 'failed', 'canceled'].includes(payment.status),
    );

    return (
        <>
            <PageHeader
                eyebrow="Financeiro"
                title="Vendas e pagamentos"
                description="Acompanhe as transações processadas pelos gateways conectados."
            />
            <section data-tour="page-summary" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Volume recebido"
                    value={money(received, currency)}
                    detail={`${approved.length} pagamentos aprovados`}
                    icon="card"
                />
                <SummaryCard
                    label="Taxa de aprovação"
                    value={percentage(payments.length ? approved.length / payments.length : 0)}
                    detail={`${payments.length} tentativas processadas`}
                    icon="chart"
                />
                <SummaryCard
                    label="Em processamento"
                    value={String(pending.length)}
                    detail={money(
                        pending.reduce((sum, payment) => sum + payment.amountMinor, 0),
                        currency,
                    )}
                    icon="clock"
                />
                <SummaryCard
                    label="Falhas e devoluções"
                    value={String(failed.length)}
                    detail={`${money(refunded, currency)} reembolsados`}
                    icon="refund"
                />
            </section>
            <PaymentsTable
                payments={payments}
                customers={customers}
                gateways={gateways}
                highlightedPaymentId={highlightedPaymentId}
            />
        </>
    );
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

function percentage(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        maximumFractionDigits: 1,
    }).format(value);
}
