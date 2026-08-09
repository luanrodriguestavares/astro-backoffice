'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { TableActionButton } from '@/components/ui/table-action-button';
import type { Customer, GatewayConnection, Payment } from '@/lib/api/types';
import { paymentStatusLabel, paymentStatusLabels } from '@/lib/commerce-status';

const successful = new Set(['approved', 'paid', 'captured', 'succeeded']);

export function PaymentsTable({
    payments,
    customers,
    gateways,
    highlightedPaymentId,
}: {
    payments: Payment[];
    customers: Customer[];
    gateways: GatewayConnection[];
    highlightedPaymentId?: string;
}) {
    const customerById = useMemo(
        () => new Map(customers.map((item) => [item.id, item])),
        [customers],
    );
    const gatewayById = useMemo(() => new Map(gateways.map((item) => [item.id, item])), [gateways]);
    const [selected, setSelected] = useState<Payment>();
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(() => {
        const index = highlightedPaymentId
            ? payments.findIndex((payment) => payment.id === highlightedPaymentId)
            : -1;
        return index < 0 ? 1 : Math.floor(index / 10) + 1;
    });
    const filtered = payments.filter((payment) => {
        const customer = customerById.get(payment.customerId);
        const haystack =
            `${payment.id} ${payment.orderId ?? ''} ${customer?.name ?? ''} ${customer?.email ?? ''} ${gatewayById.get(payment.gatewayConnectionId)?.name ?? ''} ${payment.paymentMethod} ${paymentStatusLabel(payment.status)}`.toLocaleLowerCase(
                'pt-BR',
            );
        return (
            (status === 'all' || payment.status === status) &&
            haystack.includes(query.toLocaleLowerCase('pt-BR'))
        );
    });
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
    const selectedCustomer = selected ? customerById.get(selected.customerId) : undefined;

    useEffect(() => {
        if (!highlightedPaymentId) return;
        requestAnimationFrame(() =>
            document
                .getElementById(`payment-${highlightedPaymentId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        );
    }, [highlightedPaymentId, page]);

    return (
        <>
            <section data-tour="page-primary" className="glass-panel overflow-hidden rounded-[28px]">
                <div className="border-b border-white/65 px-5 py-5 sm:px-6">
                    <h2 className="text-sm font-semibold">Transações recentes</h2>
                    <p className="mt-1 text-[12px] text-muted">
                        Use a ação de visualização para consultar os detalhes financeiros.
                    </p>
                </div>
                <div className="grid gap-3 border-b border-white/65 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:px-6">
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
                            placeholder="Buscar por cliente, pagamento ou pedido"
                            className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-3 text-[13px] outline-none"
                        />
                    </label>
                    <CustomSelect
                        name="payment-status"
                        value={status}
                        onValueChange={(value) => {
                            setStatus(value);
                            setPage(1);
                        }}
                        options={[
                            { value: 'all', label: 'Todos os status' },
                            ...[...new Set(payments.map((item) => item.status))].map((value) => ({
                                value,
                                label: paymentStatusLabels[value] ?? paymentStatusLabel(value),
                            })),
                        ]}
                    />
                    <CustomSelect
                        name="payments-page-size"
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
                    <table className="w-full min-w-[960px] text-left">
                        <thead className="bg-white/24 text-[12px] uppercase tracking-[0.09em] text-muted">
                            <tr>
                                <th className="px-6 py-3.5">Pagamento</th>
                                <th className="px-5 py-3.5">Cliente</th>
                                <th className="px-5 py-3.5">Processamento</th>
                                <th className="px-5 py-3.5">Valor</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Data</th>
                                <th className="px-6 py-3.5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/65">
                            {visible.map((payment) => {
                                const customer = customerById.get(payment.customerId);
                                return (
                                    <tr
                                        id={`payment-${payment.id}`}
                                        key={payment.id}
                                        className={`text-[13px] transition hover:bg-white/34 ${highlightedPaymentId === payment.id ? 'bg-brand-soft/70 ring-1 ring-inset ring-brand/30' : ''}`}
                                    >
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {shortId(payment.id)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p>{customer?.name ?? 'Cliente'}</p>
                                            <p className="mt-1 text-xs text-muted">
                                                {customer?.email ?? shortId(payment.customerId)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p>{method(payment.paymentMethod)}</p>
                                            <p className="mt-1 text-xs text-muted">
                                                {gatewayById.get(payment.gatewayConnectionId)
                                                    ?.name ?? shortId(payment.gatewayConnectionId)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {money(payment.amountMinor, payment.currency)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Status value={payment.status} />
                                        </td>
                                        <td className="px-5 py-4 text-xs text-muted">
                                            {dateTime(payment.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <TableActionButton
                                                label="Visualizar pagamento"
                                                icon="eye"
                                                onClick={() => setSelected(payment)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!visible.length && (
                        <p className="px-6 py-12 text-center text-sm text-muted">
                            Nenhum pagamento corresponde aos filtros.
                        </p>
                    )}
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
                labelledBy="payment-detail-title"
            >
                {selected && (
                    <>
                        <ModalHeader
                            eyebrow="Transação financeira"
                            title="Detalhes do pagamento"
                            description={selected.id}
                            titleId="payment-detail-title"
                            onClose={() => setSelected(undefined)}
                        />
                        <ModalBody>
                        <div className="flex flex-col gap-5 rounded-[22px] border border-brand/15 bg-brand-soft/35 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[.12em] text-muted">
                                    Valor solicitado
                                </p>
                                <p className="mt-1 text-3xl tracking-[-.04em]">
                                    {money(selected.amountMinor, selected.currency)}
                                </p>
                            </div>
                            <Status value={selected.status} />
                        </div>
                        <DetailSection title="Liquidação">
                            <Detail
                                label="Capturado"
                                value={money(selected.capturedMinor, selected.currency)}
                            />
                            <Detail
                                label="Reembolsado"
                                value={money(selected.refundedMinor, selected.currency)}
                            />
                            <Detail
                                label="Método e gateway"
                                value={`${method(selected.paymentMethod)} · ${gatewayById.get(selected.gatewayConnectionId)?.name ?? 'Conexão não identificada'}`}
                            />
                        </DetailSection>
                        <DetailSection title="Origem">
                            <Detail
                                label="Cliente"
                                value={selectedCustomer?.name ?? 'Cliente não identificado'}
                                detail={selectedCustomer?.email}
                            />
                            <Detail
                                label="Pedido relacionado"
                                value={selected.orderId ?? 'Não vinculado'}
                            />
                            <Detail label="Criado em" value={dateTime(selected.createdAt)} />
                            <Detail
                                label="Aprovado em"
                                value={
                                    selected.approvedAt
                                        ? dateTime(selected.approvedAt)
                                        : 'Ainda não aprovado'
                                }
                            />
                        </DetailSection>
                        </ModalBody>
                        <ModalFooter>
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

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-6">
            <h3 className="text-[11px] uppercase tracking-[.12em] text-muted">{title}</h3>
            <dl className="mt-2 divide-y divide-border">{children}</dl>
        </section>
    );
}

function Detail({ label, value, detail }: { label: string; value: string; detail?: string }) {
    return (
        <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
            <dt className="text-[12px] text-muted">{label}</dt>
            <dd className="break-all text-sm">
                {value}
                {detail && <span className="mt-1 block text-xs text-muted">{detail}</span>}
            </dd>
        </div>
    );
}

function Status({ value }: { value: string }) {
    const tone = successful.has(value)
        ? 'border-emerald-100 bg-[#e8f7f1] text-success'
        : ['rejected', 'failed', 'canceled'].includes(value)
          ? 'border-red-100 bg-red-50 text-danger'
          : 'border-amber-100 bg-[#fff3e5] text-warning';
    return (
        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] ${tone}`}>
            {paymentStatusLabel(value)}
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

function method(value: string) {
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
