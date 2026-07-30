export const orderStatusLabels: Record<string, string> = {
    open: 'Aberto',
    placed: 'Realizado',
    awaiting_payment: 'Aguardando pagamento',
    pending: 'Pendente',
    paid: 'Pago',
    completed: 'Concluído',
    partially_refunded: 'Parcialmente reembolsado',
    refunded: 'Reembolsado',
    canceled: 'Cancelado',
    expired: 'Expirado',
    abandoned: 'Abandonado',
};

export const paymentStatusLabels: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    requires_action: 'Ação necessária',
    authorized: 'Autorizado',
    approved: 'Aprovado',
    paid: 'Pago',
    captured: 'Capturado',
    succeeded: 'Concluído',
    failed: 'Falhou',
    rejected: 'Recusado',
    canceled: 'Cancelado',
    expired: 'Expirado',
    unknown: 'Confirmação pendente',
    partially_refunded: 'Parcialmente reembolsado',
    refunded: 'Reembolsado',
    disputed: 'Em disputa',
};

export function orderStatusLabel(status: string) {
    return orderStatusLabels[status] ?? humanizeStatus(status);
}

export function paymentStatusLabel(status: string) {
    return paymentStatusLabels[status] ?? humanizeStatus(status);
}

function humanizeStatus(status: string) {
    return status
        .replaceAll('_', ' ')
        .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'));
}
