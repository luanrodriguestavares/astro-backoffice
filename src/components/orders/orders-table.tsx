'use client';

import { useMemo, useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { TableActionButton } from '@/components/ui/table-action-button';
import type { Customer, Payment } from '@/lib/api/types';
import { orderStatusLabel } from '@/lib/commerce-status';

export type OrderRow = {
    id: string;
    customerId: string;
    status: string;
    currency: string;
    subtotalMinor: number;
    discountMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
    paidMinor: number;
    refundedMinor: number;
    placedAt: string;
    paidAt: string | null;
};

export function OrdersTable({
    orders,
    customers,
    payments,
}: {
    orders: OrderRow[];
    customers: Customer[];
    payments: Payment[];
}) {
    const customerById = useMemo(
        () => new Map(customers.map((item) => [item.id, item])),
        [customers],
    );
    const paymentByOrderId = useMemo(
        () => new Map(payments.filter((item) => item.orderId).map((item) => [item.orderId, item])),
        [payments],
    );
    const [selected, setSelected] = useState<OrderRow>();
    const [query, setQuery] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const customer = selected ? customerById.get(selected.customerId) : undefined;
    const payment = selected ? paymentByOrderId.get(selected.id) : undefined;
    const filtered = orders.filter((order) => {
        const itemCustomer = customerById.get(order.customerId);
        return `${order.id} ${itemCustomer?.name ?? ''} ${itemCustomer?.email ?? ''} ${order.status}`
            .toLocaleLowerCase('pt-BR')
            .includes(query.toLocaleLowerCase('pt-BR'));
    });
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <>
            <section data-tour="page-primary" className="glass-panel overflow-hidden rounded-[28px]">
                <div className="border-b border-white/65 px-5 py-5 sm:px-6">
                    <h2 className="text-sm font-semibold">Pedidos recentes</h2>
                    <p className="mt-1 text-[12px] text-muted">
                        Abra um pedido para consultar sua composição e o pagamento relacionado.
                    </p>
                </div>
                <div className="grid gap-3 border-b border-white/65 px-5 py-4 sm:grid-cols-[1fr_180px] sm:px-6">
                    <label className="relative">
                        <Icon
                            name="search"
                            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                        />
                        <input
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Buscar pedido ou cliente"
                            className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-3 text-[13px] outline-none"
                        />
                    </label>
                    <CustomSelect
                        name="orders-page-size"
                        value={String(pageSize)}
                        onValueChange={(value) => {
                            setPageSize(Number(value));
                            setPage(1);
                        }}
                        options={[10, 20, 50, 100].map((value) => ({
                            value: String(value),
                            label: `${value} por página`,
                        }))}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[940px] text-left">
                        <thead className="bg-white/24 text-[12px] uppercase tracking-[.09em] text-muted">
                            <tr>
                                <th className="px-6 py-3.5">Pedido</th>
                                <th className="px-5 py-3.5">Cliente</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Composição</th>
                                <th className="px-5 py-3.5">Financeiro</th>
                                <th className="px-5 py-3.5">Data</th>
                                <th className="px-6 py-3.5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/65">
                            {visible.map((order) => {
                                const itemCustomer = customerById.get(order.customerId);
                                return (
                                    <tr
                                        key={order.id}
                                        className="text-[13px] transition hover:bg-white/34"
                                    >
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {shortId(order.id)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p>
                                                {itemCustomer?.name ?? 'Cliente não identificado'}
                                            </p>
                                            <p className="mt-1 text-xs text-muted">
                                                {itemCustomer?.email ?? shortId(order.customerId)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Status status={order.status} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <p>{money(order.totalMinor, order.currency)}</p>
                                            <p className="mt-1 text-xs text-muted">
                                                Subtotal{' '}
                                                {money(order.subtotalMinor, order.currency)} ·
                                                desconto{' '}
                                                {money(order.discountMinor, order.currency)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p>Pago {money(order.paidMinor, order.currency)}</p>
                                            <p className="mt-1 text-xs text-muted">
                                                {order.refundedMinor
                                                    ? `Reembolsado ${money(order.refundedMinor, order.currency)}`
                                                    : `Saldo ${money(Math.max(0, order.totalMinor - order.paidMinor), order.currency)}`}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-muted">
                                            {dateTime(order.placedAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <TableActionButton
                                                label="Visualizar pedido"
                                                icon="eye"
                                                onClick={() => setSelected(order)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-white/65 px-5 py-4 text-xs text-muted sm:px-6">
                    <span>
                        {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="icon"
                            aria-label="Página anterior"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <Icon name="arrow-right" className="size-3.5 rotate-180" />
                        </Button>
                        <span>
                            Página {page} de {pages}
                        </span>
                        <Button
                            variant="icon"
                            aria-label="Próxima página"
                            disabled={page >= pages}
                            onClick={() => setPage(page + 1)}
                        >
                            <Icon name="arrow-right" className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </section>
            <Modal
                open={Boolean(selected)}
                onClose={() => setSelected(undefined)}
                labelledBy="order-detail-title"
            >
                {selected && (
                    <>
                        <ModalHeader
                            eyebrow="Venda"
                            title="Detalhes do pedido"
                            description={selected.id}
                            titleId="order-detail-title"
                            onClose={() => setSelected(undefined)}
                        />
                        <ModalBody>
                        <div className="flex items-center justify-between rounded-[22px] border border-brand/15 bg-brand-soft/35 p-5">
                            <div>
                                <p className="text-[11px] uppercase tracking-[.12em] text-muted">
                                    Total do pedido
                                </p>
                                <p className="mt-1 text-3xl tracking-[-.04em]">
                                    {money(selected.totalMinor, selected.currency)}
                                </p>
                            </div>
                            <Status status={selected.status} />
                        </div>
                        <Section title="Composição">
                            <Line
                                label="Subtotal"
                                value={money(selected.subtotalMinor, selected.currency)}
                            />
                            <Line
                                label="Desconto"
                                value={`− ${money(selected.discountMinor, selected.currency)}`}
                            />
                            <Line
                                label="Frete e impostos"
                                value={money(
                                    selected.shippingMinor + selected.taxMinor,
                                    selected.currency,
                                )}
                            />
                            <Line
                                label="Total"
                                value={money(selected.totalMinor, selected.currency)}
                            />
                        </Section>
                        <Section title="Cliente e financeiro">
                            <Line
                                label="Cliente"
                                value={customer?.name ?? 'Cliente não identificado'}
                                detail={customer?.email}
                            />
                            <Line
                                label="Valor pago"
                                value={money(selected.paidMinor, selected.currency)}
                            />
                            <Line
                                label="Valor reembolsado"
                                value={money(selected.refundedMinor, selected.currency)}
                            />
                            <Line label="Realizado em" value={dateTime(selected.placedAt)} />
                        </Section>
                        </ModalBody>
                        <ModalFooter>
                            {payment && (
                                <ButtonLink
                                    href={`/payments?payment=${encodeURIComponent(payment.id)}`}
                                    onClick={() => setSelected(undefined)}
                                >
                                    Ver pagamento <Icon name="arrow-right" className="size-3.5" />
                                </ButtonLink>
                            )}
                            <Button variant="secondary" onClick={() => setSelected(undefined)}>
                                Fechar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </Modal>
        </>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-6">
            <h3 className="text-[11px] uppercase tracking-[.12em] text-muted">{title}</h3>
            <dl className="mt-2 divide-y divide-border">{children}</dl>
        </section>
    );
}

function Line({ label, value, detail }: { label: string; value: string; detail?: string }) {
    return (
        <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-sm">
                {value}
                {detail && <span className="mt-1 block text-xs text-muted">{detail}</span>}
            </dd>
        </div>
    );
}

function Status({ status }: { status: string }) {
    const tone = ['paid', 'completed'].includes(status)
        ? 'border-emerald-100 bg-[#e8f7f1] text-success'
        : ['canceled', 'expired', 'abandoned'].includes(status)
          ? 'border-red-100 bg-red-50 text-danger'
          : 'border-amber-100 bg-[#fff3e5] text-warning';
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${tone}`}>
            {orderStatusLabel(status)}
        </span>
    );
}

function shortId(value: string) {
    return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

function dateTime(value: string) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
    );
}
