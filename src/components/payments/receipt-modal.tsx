'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import type { Payment } from '@/lib/api/types';

export interface PaymentReceipt {
    paymentId: string;
    orderId: string | null;
    status: string;
    method: string;
    cardBrand: string | null;
    recurring: boolean;
    merchantName: string;
    customer: { name: string; email?: string };
    items: { name: string; quantity: number; totalMinor: number }[];
    amountMinor: number;
    capturedMinor: number;
    refundedMinor: number;
    currency: string;
    approvedAt: string;
    shareUrl: string;
}

/** Só pagamentos aprovados alguma vez têm comprovante (inclui reembolsados e em disputa). */
export function hasReceipt(payment: Payment) {
    return payment.approvedAt !== null;
}

/**
 * Comprovante do pagamento: prévia no painel e um link público (assinado, sem o e-mail do
 * comprador) que abre a versão para imprimir ou salvar em PDF.
 */
export function ReceiptModal({ payment, onClose }: { payment?: Payment; onClose(): void }) {
    return (
        <Modal
            open={Boolean(payment)}
            onClose={onClose}
            labelledBy="receipt-title"
            maxWidth="max-w-lg"
        >
            {payment && <ReceiptContent key={payment.id} payment={payment} onClose={onClose} />}
        </Modal>
    );
}

function ReceiptContent({ payment, onClose }: { payment: Payment; onClose(): void }) {
    const [receipt, setReceipt] = useState<PaymentReceipt>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        void fetch(`/api/payments/${encodeURIComponent(payment.id)}/receipt`)
            .then(async (response) => {
                const payload = (await response.json().catch(() => ({}))) as {
                    data?: PaymentReceipt;
                    detail?: string;
                };
                if (!active) return;
                if (response.ok && payload.data) setReceipt(payload.data);
                else setError(payload.detail ?? 'Não foi possível carregar o comprovante.');
            })
            .catch(() => active && setError('Não foi possível carregar o comprovante.'));
        return () => {
            active = false;
        };
    }, [payment.id]);

    async function copyLink() {
        if (!receipt) return;
        await navigator.clipboard.writeText(receipt.shareUrl);
        showToast({ tone: 'success', description: 'Link do comprovante copiado.' });
    }

    async function share() {
        if (!receipt) return;
        const text = `Comprovante de pagamento de ${money(receipt.amountMinor, receipt.currency)} para ${receipt.merchantName}`;
        if (typeof navigator.share === 'function') {
            await navigator
                .share({ title: 'Comprovante de pagamento', text, url: receipt.shareUrl })
                .catch(() => undefined);
            return;
        }
        await copyLink();
    }

    return (
        <>
            <ModalHeader
                eyebrow="Comprovante"
                title={receipt?.merchantName ?? 'Comprovante de pagamento'}
                description={payment.id}
                titleId="receipt-title"
                onClose={onClose}
            />
            <ModalBody>
                {error && <p className="text-[13px] text-danger">{error}</p>}
                {!receipt && !error && <p className="text-[13px] text-muted">Carregando…</p>}
                {receipt && (
                    <div className="grid gap-4 text-[13px]">
                        <div className="rounded-2xl border border-border p-4">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                                Valor pago
                            </p>
                            <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em]">
                                {money(receipt.capturedMinor, receipt.currency)}
                            </p>
                            {receipt.refundedMinor > 0 && (
                                <p className="mt-1 text-[12px] text-muted">
                                    Reembolsado: {money(receipt.refundedMinor, receipt.currency)}
                                </p>
                            )}
                        </div>
                        {receipt.items.length > 0 && (
                            <ul className="grid gap-1.5">
                                {receipt.items.map((item) => (
                                    <li
                                        key={`${item.name}-${String(item.totalMinor)}`}
                                        className="flex justify-between gap-3"
                                    >
                                        <span>
                                            {item.quantity > 1 ? `${String(item.quantity)}× ` : ''}
                                            {item.name}
                                        </span>
                                        <span>{money(item.totalMinor, receipt.currency)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-[12px]">
                            <Line
                                label="Cliente"
                                value={receipt.customer.name}
                                detail={receipt.customer.email}
                            />
                            <Line label="Data" value={dateTime(receipt.approvedAt)} />
                            <Line
                                label="Forma de pagamento"
                                value={`${methodName(receipt.method)}${receipt.cardBrand ? ` · ${receipt.cardBrand}` : ''}`}
                            />
                            <Line label="Referência" value={receipt.orderId ?? receipt.paymentId} />
                        </dl>
                        <p className="text-[11px] leading-5 text-muted">
                            O link público mostra o comprovante sem o e-mail do cliente e vale por 2
                            anos.
                        </p>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button
                    type="button"
                    variant="secondary"
                    disabled={!receipt}
                    onClick={() => void copyLink()}
                >
                    <Icon name="copy" className="size-3.5" /> Copiar link
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    disabled={!receipt}
                    onClick={() => void share()}
                >
                    <Icon name="link" className="size-3.5" /> Compartilhar
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    disabled={!receipt}
                    onClick={() => receipt && window.open(receipt.shareUrl, '_blank', 'noopener')}
                >
                    <Icon name="download" className="size-3.5" /> Imprimir ou salvar PDF
                </Button>
            </ModalFooter>
        </>
    );
}

function Line({ label, value, detail }: { label: string; value: string; detail?: string }) {
    return (
        <div>
            <dt className="text-muted">{label}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
            {detail && <dd className="text-muted">{detail}</dd>}
        </div>
    );
}

function methodName(method: string) {
    return (
        { pix: 'Pix', card: 'Cartão', boleto: 'Boleto', bank_transfer: 'Transferência' }[method] ??
        method
    );
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

function dateTime(value: string) {
    return new Date(value).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
    });
}
