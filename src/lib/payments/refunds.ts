import type { Payment, Refund } from '@/lib/api/types';

export const refundStatusLabels: Record<string, string> = {
    requested: 'Solicitado',
    processing: 'Em processamento no gateway',
    succeeded: 'Concluído',
    failed: 'Falhou',
};

/** Pedidos ainda abertos ou concluídos reservam o valor, como a API faz ao validar um novo. */
const reservingStatuses = new Set(['requested', 'processing', 'succeeded']);

/** Quanto ainda pode ser reembolsado: considera reembolsos em andamento e os feitos no gateway. */
export function refundableMinor(payment: Payment, refunds: Refund[]) {
    const reserved = refunds
        .filter((refund) => refund.paymentId === payment.id && reservingStatuses.has(refund.status))
        .reduce((sum, refund) => sum + refund.amountMinor, 0);
    return Math.max(0, payment.capturedMinor - Math.max(payment.refundedMinor, reserved));
}
