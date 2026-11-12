'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import type { Payment } from '@/lib/api/types';

/** Reembolso cabe em pagamento capturado, sem disputa e com saldo a devolver. */
export function canRefund(payment: Payment) {
    return (
        ['approved', 'partially_refunded'].includes(payment.status) &&
        payment.capturedMinor > payment.refundedMinor
    );
}

/**
 * Reembolso como ação própria: resumo do que foi pago e do que resta, o valor (padrão = restante,
 * nunca acima) e a confirmação. A chave de idempotência nasce com o modal, então um clique duplo
 * ou reenvio não devolve duas vezes.
 */
export function RefundModal({
    payment,
    customerName,
    availableMinor,
    onClose,
}: {
    payment?: Payment;
    customerName?: string;
    /** Disponível considerando reembolsos ainda em andamento. */
    availableMinor?: number;
    onClose(): void;
}) {
    return (
        <Modal
            open={Boolean(payment)}
            onClose={onClose}
            labelledBy="refund-title"
            maxWidth="max-w-lg"
        >
            {payment && (
                <RefundContent
                    key={payment.id}
                    payment={payment}
                    customerName={customerName}
                    availableMinor={availableMinor}
                    onClose={onClose}
                />
            )}
        </Modal>
    );
}

function RefundContent({
    payment,
    customerName,
    availableMinor,
    onClose,
}: {
    payment: Payment;
    customerName?: string;
    availableMinor?: number;
    onClose(): void;
}) {
    const router = useRouter();
    const remainingMinor =
        availableMinor ?? Math.max(0, payment.capturedMinor - payment.refundedMinor);
    const [amount, setAmount] = useState((remainingMinor / 100).toFixed(2).replace('.', ','));
    const [reason, setReason] = useState('');
    const [cancelSubscription, setCancelSubscription] = useState(false);
    const [sending, setSending] = useState(false);
    const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
    const amountMinor = Math.round(Number(amount.replace(/\./g, '').replace(',', '.')) * 100);
    const valid = Number.isInteger(amountMinor) && amountMinor > 0 && amountMinor <= remainingMinor;
    const partial = valid && amountMinor < remainingMinor;

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!valid || sending) return;
        setSending(true);
        const response = await fetch(`/api/payments/${encodeURIComponent(payment.id)}/refunds`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                amountMinor,
                ...(reason.trim() ? { reason: reason.trim() } : {}),
                ...(payment.recurring && cancelSubscription ? { cancelSubscription: true } : {}),
                idempotencyKey,
            }),
        });
        setSending(false);
        const payload = (await response.json().catch(() => ({}))) as { detail?: string };
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: payload.detail ?? 'Não foi possível solicitar o reembolso.',
            });
            return;
        }
        showToast({
            tone: 'success',
            title: 'Reembolso solicitado',
            description: 'O gateway processa o estorno; o status atualiza sozinho.',
        });
        onClose();
        router.refresh();
    }

    return (
        <form onSubmit={submit}>
            <ModalHeader
                eyebrow="Financeiro"
                title="Reembolsar pagamento"
                description={payment.id}
                titleId="refund-title"
                onClose={onClose}
            />
            <ModalBody className="grid gap-4">
                <dl className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface-muted/50 p-4 text-[12px]">
                    <Amount label="Pago" value={money(payment.capturedMinor, payment.currency)} />
                    <Amount
                        label="Reembolsado ou em andamento"
                        value={money(payment.capturedMinor - remainingMinor, payment.currency)}
                    />
                    <Amount
                        label="Disponível"
                        value={money(remainingMinor, payment.currency)}
                        strong
                    />
                </dl>
                {customerName && (
                    <p className="text-[12px] text-muted">
                        O valor volta para {customerName} pelo mesmo meio de pagamento.
                    </p>
                )}
                <label className="text-[13px] font-semibold">
                    Valor a reembolsar
                    <input
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        aria-invalid={!valid}
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none focus:border-brand/60"
                    />
                    <span className="mt-1.5 block text-[11px] font-normal text-muted">
                        {valid
                            ? partial
                                ? 'Reembolso parcial: o restante continua com você.'
                                : 'Reembolso total do valor disponível.'
                            : `Informe um valor entre R$ 0,01 e ${money(remainingMinor, payment.currency)}.`}
                    </span>
                </label>
                <label className="text-[13px] font-semibold">
                    Motivo (opcional)
                    <input
                        value={reason}
                        maxLength={500}
                        placeholder="Ex.: pedido do cliente"
                        onChange={(event) => setReason(event.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none focus:border-brand/60"
                    />
                </label>
                {payment.recurring && (
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 text-[12px] leading-5">
                        <input
                            type="checkbox"
                            checked={cancelSubscription}
                            onChange={(event) => setCancelSubscription(event.target.checked)}
                            className="mt-1"
                        />
                        <span>
                            <b className="block text-[13px]">Cancelar também a assinatura</b>
                            <span className="text-muted">
                                Sem isso, a assinatura continua ativa e o próximo ciclo é cobrado.
                            </span>
                        </span>
                    </label>
                )}
            </ModalBody>
            <ModalFooter>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={!valid || sending}>
                    {sending
                        ? 'Solicitando…'
                        : valid
                          ? `Reembolsar ${money(amountMinor, payment.currency)}`
                          : 'Reembolsar'}
                </Button>
            </ModalFooter>
        </form>
    );
}

function Amount({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div>
            <dt className="text-muted">{label}</dt>
            <dd className={`mt-1 text-[14px] ${strong ? 'font-semibold text-foreground' : ''}`}>
                {value}
            </dd>
        </div>
    );
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}
