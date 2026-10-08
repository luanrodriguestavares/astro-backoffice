/** Textos das categorias de recusa padronizadas pela API. */
export const declineCategoryLabels: Record<string, string> = {
    insufficient_funds: 'Saldo ou limite insuficiente',
    fraud_suspected: 'Suspeita de fraude',
    invalid_data: 'Dados do cartão inválidos',
    card_restricted: 'Cartão bloqueado ou não aceito',
    authentication_required: 'Autenticação do banco necessária',
    issuer_declined: 'Recusado pelo banco emissor',
    gateway_error: 'Erro no gateway',
    gateway_unavailable: 'Gateway indisponível',
    configuration_error: 'Configuração do gateway',
    unknown: 'Motivo não informado',
};

export const retryAdviceLabels: Record<string, string> = {
    other_gateway: 'Vale tentar em outro gateway',
    later: 'Pode passar mais tarde',
    never: 'Não adianta repetir',
};

export function declineLabel(category: string | null | undefined) {
    return declineCategoryLabels[category ?? 'unknown'] ?? declineCategoryLabels.unknown;
}

/** Espelha a API: o que fazer quando uma venda é recusada por esta categoria. */
export function retryAdviceFor(category: string) {
    if (category === 'insufficient_funds') return 'later';
    if (
        ['fraud_suspected', 'invalid_data', 'card_restricted', 'authentication_required'].includes(
            category,
        )
    )
        return 'never';
    return 'other_gateway';
}
