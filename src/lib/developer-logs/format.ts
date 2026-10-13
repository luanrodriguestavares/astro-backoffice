import type { LogCategory, LogOutcome, LogSearchMatch } from './types';

export const categoryLabels: Record<LogCategory, string> = {
    status: 'Status',
    routing: 'Orquestração',
    attempt: 'Tentativa',
    gateway: 'Gateway',
    refund: 'Reembolso',
    cancellation: 'Cancelamento',
    reconciliation: 'Reconciliação',
    gateway_webhook: 'Webhook recebido',
    customer_webhook: 'Webhook enviado',
};

export const outcomeLabels: Record<LogOutcome, string> = {
    success: 'Sucesso',
    failure: 'Falha',
    warning: 'Alerta',
    info: 'Informação',
    automatic: 'Ação automática',
};

export const sourceLabels: Record<string, string> = {
    api: 'API',
    worker: 'Processamento',
    gateway_webhook: 'Webhook do gateway',
    scheduler: 'Rotina agendada',
};

export const outcomeTones: Record<LogOutcome, string> = {
    success: 'border-emerald-200/70 bg-[#e8f7f1] text-success',
    failure: 'border-red-200/70 bg-red-50 text-danger',
    warning: 'border-amber-200/70 bg-[#fff3e5] text-warning',
    info: 'border-border bg-surface-muted text-muted',
    automatic: 'border-brand/25 bg-brand-soft text-brand-strong',
};

export const outcomeDots: Record<LogOutcome, string> = {
    success: 'bg-success',
    failure: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-muted',
    automatic: 'bg-brand',
};

/** Data com segundos e milissegundos: a ordem dos eventos importa no diagnóstico. */
export function logTime(value: string | null | undefined, withDate = true) {
    if (!value) return '—';
    const date = new Date(value);
    const time = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const millis = String(date.getMilliseconds()).padStart(3, '0');
    if (!withDate) return `${time}.${millis}`;
    return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${time}.${millis}`;
}

export function duration(ms: number | null | undefined) {
    if (ms === null || ms === undefined) return null;
    if (ms < 1_000) return `${ms} ms`;
    if (ms < 60_000) return `${(ms / 1_000).toFixed(1)} s`;
    return `${Math.round(ms / 60_000)} min`;
}

export function httpTone(status: number | null | undefined) {
    if (status === null || status === undefined) return 'text-muted';
    if (status < 300) return 'text-success';
    if (status < 500) return 'text-warning';
    return 'text-danger';
}

export function searchMatchHref(match: LogSearchMatch) {
    if (match.kind === 'payment') return `/logs/payments/${match.id}`;
    if (match.kind === 'webhook_delivery') return `/logs/webhooks/${match.id}`;
    if (match.kind === 'gateway_event') return `/logs/gateway-events/${match.id}`;
    return `/logs?view=requests&requestId=${encodeURIComponent(match.id)}`;
}

/** Copia só os filtros conhecidos para a query da API, descartando valores vazios. */
export function filterQuery(
    params: Record<string, string | undefined>,
    allowed: readonly string[],
    extra: Record<string, string> = {},
) {
    const query = new URLSearchParams(extra);
    for (const key of allowed) {
        const value = params[key]?.trim();
        if (value) query.set(key, value);
    }
    return query;
}

/** Converte "2026-10-12T10:00" (input datetime-local) para ISO no fuso do navegador do servidor. */
export function periodValue(value: string | undefined) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function paymentStatusOutcome(status: string): LogOutcome {
    if (['approved', 'succeeded', 'refunded', 'partially_refunded'].includes(status))
        return 'success';
    if (['failed', 'rejected', 'canceled', 'expired'].includes(status)) return 'failure';
    if (status === 'unknown' || status === 'disputed') return 'warning';
    return 'info';
}
