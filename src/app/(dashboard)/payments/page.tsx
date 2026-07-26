import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard } from '@/components/ui/resource-table';
import { Icon } from '@/components/ui/icon';
import { apiFetch } from '@/lib/api/server';
import type { Customer, Payment } from '@/lib/api/types';

const successfulStatuses = ['approved', 'paid', 'captured', 'succeeded'];

export default async function PaymentsPage() {
    const [payments, customers] = await Promise.all([
        apiFetch<Payment[]>('/api/v1/payments'),
        apiFetch<Customer[]>('/api/v1/customers'),
    ]);
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));
    const currency = payments[0]?.currency ?? 'BRL';
    const approved = payments.filter((payment) => successfulStatuses.includes(payment.status));
    const received = approved.reduce((sum, payment) => sum + payment.capturedMinor, 0);
    const refunded = payments.reduce((sum, payment) => sum + payment.refundedMinor, 0);

    return (
        <>
            <PageHeader
                eyebrow="Financeiro"
                title="Vendas e pagamentos"
                description="Acompanhe as transações processadas pelos gateways conectados."
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-3">
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
                    label="Total reembolsado"
                    value={money(refunded, currency)}
                    detail="Valores devolvidos aos clientes"
                    icon="refund"
                />
            </section>

            <section className="glass-panel overflow-hidden rounded-[28px]">
                <div className="flex items-center justify-between gap-4 border-b border-white/65 px-5 py-5 sm:px-6">
                    <div>
                        <h2 className="text-sm font-semibold tracking-[-0.02em]">
                            Transações recentes
                        </h2>
                        <p className="mt-1 text-[12px] text-muted">
                            Pagamentos processados por todos os gateways
                        </p>
                    </div>
                    <span className="hidden rounded-full border border-white/80 bg-white/40 px-3 py-1.5 text-[12px] font-medium text-muted sm:inline-flex">
                        {payments.length} {payments.length === 1 ? 'transação' : 'transações'}
                    </span>
                </div>

                {payments.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft/75 text-brand">
                            <Icon name="card" className="size-4" />
                        </span>
                        <h3 className="mt-3 text-sm font-semibold">Nenhum pagamento</h3>
                        <p className="mt-1 text-[13px] text-muted">
                            As transações dos seus checkouts aparecerão aqui.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-white/24 text-[12px] uppercase tracking-[0.09em] text-muted">
                                <tr>
                                    <th className="px-6 py-3.5 font-semibold">Pagamento</th>
                                    <th className="px-5 py-3.5 font-semibold">Cliente</th>
                                    <th className="px-5 py-3.5 font-semibold">Método</th>
                                    <th className="px-5 py-3.5 font-semibold">Valor</th>
                                    <th className="px-5 py-3.5 font-semibold">Status</th>
                                    <th className="px-6 py-3.5 font-semibold">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/65">
                                {payments.map((payment) => {
                                    const customer = customerById.get(payment.customerId);
                                    return (
                                        <tr
                                            key={payment.id}
                                            className="group text-[13px] transition hover:bg-white/34"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/80 bg-brand-soft/70 text-brand">
                                                        <Icon name="card" className="size-4" />
                                                    </span>
                                                    <span className="font-mono text-[12px] text-foreground">
                                                        {payment.id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-foreground">
                                                    {customer?.name ?? 'Cliente'}
                                                </p>
                                                <p className="mt-1 text-[12px] text-muted">
                                                    {customer?.email ?? payment.customerId}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-muted">
                                                {paymentMethod(payment.paymentMethod)}
                                            </td>
                                            <td className="px-5 py-4 font-semibold tabular-nums">
                                                {money(payment.amountMinor, payment.currency)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Status value={payment.status} />
                                            </td>
                                            <td className="px-6 py-4 text-[12px] text-muted">
                                                {dateTime(payment.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}

function Status({ value }: { value: string }) {
    const good = successfulStatuses.includes(value);
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${good ? 'border-emerald-100 bg-[#e8f7f1] text-success' : 'border-amber-100 bg-[#fff3e5] text-warning'}`}
        >
            {value}
        </span>
    );
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

function percentage(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(
        value,
    );
}

function dateTime(value: string) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
    );
}

function paymentMethod(value: string) {
    return (
        (
            {
                pix: 'Pix',
                card: 'Cartão',
                credit_card: 'Cartão de crédito',
                boleto: 'Boleto',
            } as Record<string, string>
        )[value] ?? value
    );
}
