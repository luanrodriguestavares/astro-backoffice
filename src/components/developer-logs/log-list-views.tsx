import Link from 'next/link';

import { CopyValue } from '@/components/developer-logs/copy-value';
import {
    OutcomeBadge,
    statusLabels,
    statusOutcome,
} from '@/components/developer-logs/outcome-badge';
import { Icon } from '@/components/ui/icon';
import { ResourceTable } from '@/components/ui/resource-table';
import { categoryLabels, duration, logTime } from '@/lib/developer-logs/format';
import type {
    ApiRequestLog,
    GatewayEventLog,
    TimelineEvent,
    WebhookDeliveryLog,
} from '@/lib/developer-logs/types';

export function PaymentEventList({ rows }: { rows: TimelineEvent[] }) {
    const groups = groupPaymentEvents(rows);

    return (
        <section className="glass-panel overflow-hidden rounded-[26px]">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                <div>
                    <h2 className="text-sm font-semibold">Vendas processadas</h2>
                    <p className="mt-1 text-[11px] text-muted">
                        Cada bloco reúne todos os eventos que pertencem ao mesmo pagamento.
                    </p>
                </div>
                <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-muted">
                    {groups.length} {groups.length === 1 ? 'venda' : 'vendas'} · {rows.length}{' '}
                    eventos
                </span>
            </header>
            {groups.length === 0 ? (
                <div className="px-6 py-14 text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
                        <Icon name="search" className="size-4" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">Nenhuma venda encontrada</h3>
                    <p className="mt-1 text-[12px] text-muted">
                        Tente remover ou ajustar os filtros aplicados.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {groups.map((group) => (
                        <PaymentEventGroup key={group.id} group={group} />
                    ))}
                </div>
            )}
        </section>
    );
}

interface PaymentEventGroupData {
    id: string;
    events: TimelineEvent[];
    headline: TimelineEvent;
    paymentId: string | null;
    startedAt: string;
    endedAt: string;
}

function PaymentEventGroup({ group }: { group: PaymentEventGroupData }) {
    const failures = group.events.filter((event) => event.outcome === 'failure').length;
    const preview = group.events.slice(-4);
    const elapsed = new Date(group.endedAt).getTime() - new Date(group.startedAt).getTime();

    return (
        <article className="px-5 py-5 transition hover:bg-surface-muted/20 sm:px-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(260px,.75fr)_minmax(420px,1.35fr)_auto]">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted">
                            Venda
                        </span>
                        <OutcomeBadge outcome={group.headline.outcome} />
                        {failures > 0 && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-danger">
                                {failures} {failures === 1 ? 'falha' : 'falhas'}
                            </span>
                        )}
                    </div>
                    <h3 className="mt-2 text-[14px] font-semibold leading-5">
                        {group.headline.summary}
                    </h3>
                    <div className="mt-2">
                        <CopyValue value={group.paymentId ?? group.id} />
                    </div>
                    {group.paymentId && (
                        <div className="mt-1">
                            <CopyValue value={group.id} label="Intent" />
                        </div>
                    )}
                    <p className="mt-3 text-[10px] text-muted">
                        {group.events.length} eventos · {logTime(group.startedAt)}
                        {elapsed > 0 ? ` · ${duration(elapsed)}` : ''}
                    </p>
                </div>

                <ol className="relative space-y-2.5 border-l border-border pl-4">
                    {preview.map((event) => (
                        <li key={event.id} className="relative grid min-w-0 gap-0.5">
                            <span
                                className={`absolute -left-[20.5px] top-1.5 size-2 rounded-full ring-[3px] ring-[var(--surface)] ${event.outcome === 'failure' ? 'bg-danger' : event.outcome === 'warning' ? 'bg-warning' : event.outcome === 'success' ? 'bg-success' : 'bg-brand'}`}
                            />
                            <div className="flex min-w-0 items-baseline gap-2">
                                <span className="shrink-0 text-[9px] font-medium text-muted">
                                    {categoryLabels[event.category]}
                                </span>
                                <time className="ml-auto shrink-0 font-mono text-[9px] text-muted">
                                    {logTime(event.occurredAt, false)}
                                </time>
                            </div>
                            <p className="truncate text-[11px]" title={event.summary}>
                                {event.summary}
                            </p>
                        </li>
                    ))}
                    {group.events.length > preview.length && (
                        <li className="text-[9px] text-muted">
                            + {group.events.length - preview.length} eventos anteriores
                        </li>
                    )}
                </ol>

                <div className="flex items-center xl:justify-end">
                    <Link
                        href={`/logs/payments/${encodeURIComponent(group.id)}`}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-[var(--control-bg)] px-4 text-[11px] font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
                    >
                        Ver diagnóstico
                        <Icon name="arrow-right" className="size-3" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

function groupPaymentEvents(rows: TimelineEvent[]): PaymentEventGroupData[] {
    const grouped = new Map<string, TimelineEvent[]>();
    for (const event of rows)
        grouped.set(event.paymentIntentId, [...(grouped.get(event.paymentIntentId) ?? []), event]);
    return [...grouped.entries()]
        .map(([id, events]) => {
            const ordered = [...events].sort(
                (left, right) =>
                    new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime(),
            );
            const latest = ordered.at(-1) as TimelineEvent;
            const headline =
                [...ordered].reverse().find((event) => event.category === 'status') ?? latest;
            return {
                id,
                events: ordered,
                headline,
                paymentId:
                    [...ordered].reverse().find((event) => event.paymentId)?.paymentId ?? null,
                startedAt: ordered[0]?.occurredAt ?? latest.occurredAt,
                endedAt: latest.occurredAt,
            };
        })
        .sort(
            (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
        );
}

export function WebhookDeliveryList({ rows }: { rows: WebhookDeliveryLog[] }) {
    return (
        <ResourceTable
            rows={rows}
            searchable={false}
            title="Webhooks enviados"
            description="Entregas feitas pelo Astro aos endpoints da sua organização."
            empty="Nenhuma entrega de webhook foi encontrada com esses filtros."
            columns={[
                {
                    label: 'Criado em',
                    value: (row) => row.createdAt,
                    render: (row: WebhookDeliveryLog) => (
                        <time className="whitespace-nowrap font-mono text-[10px] text-muted">
                            {logTime(row.createdAt)}
                        </time>
                    ),
                },
                {
                    label: 'Evento',
                    value: (row) => row.eventType,
                    render: (row: WebhookDeliveryLog) => (
                        <Link
                            href={`/logs/webhooks/${encodeURIComponent(row.id)}`}
                            className="font-mono text-[11px] font-semibold underline-offset-2 hover:text-brand hover:underline"
                        >
                            {row.eventType}
                        </Link>
                    ),
                },
                {
                    label: 'Endpoint',
                    value: (row) => `${row.endpoint.name} ${row.endpoint.url}`,
                    render: (row: WebhookDeliveryLog) => (
                        <div className="max-w-[300px]">
                            <p className="text-[12px] font-medium">{row.endpoint.name}</p>
                            <p
                                className="mt-1 truncate font-mono text-[9px] text-muted"
                                title={row.endpoint.url}
                            >
                                {row.endpoint.url}
                            </p>
                        </div>
                    ),
                },
                {
                    label: 'Status',
                    value: (row) => row.status,
                    render: (row: WebhookDeliveryLog) => (
                        <OutcomeBadge
                            outcome={statusOutcome(row.status)}
                            label={statusLabels[row.status] ?? row.status}
                        />
                    ),
                },
                {
                    label: 'Tentativas',
                    value: (row) => row.attemptCount,
                    render: (row: WebhookDeliveryLog) => (
                        <span className="text-[11px]">
                            {row.attemptCount}
                            {row.replayCount ? ` (+${row.replayCount} reenvios)` : ''}
                        </span>
                    ),
                },
                {
                    label: 'Resposta',
                    value: (row) => row.lastResponseStatus,
                    render: (row: WebhookDeliveryLog) => (
                        <span className="font-mono text-[11px]">
                            {row.lastResponseStatus
                                ? `HTTP ${row.lastResponseStatus}`
                                : (row.lastErrorCode ?? '—')}
                        </span>
                    ),
                },
            ]}
        />
    );
}

export function GatewayEventList({ rows }: { rows: GatewayEventLog[] }) {
    return (
        <ResourceTable
            rows={rows}
            searchable={false}
            title="Webhooks recebidos"
            description="Eventos recebidos diretamente dos provedores de pagamento."
            empty="Nenhum webhook de gateway foi encontrado com esses filtros."
            columns={[
                {
                    label: 'Recebido em',
                    value: (row) => row.receivedAt,
                    render: (row: GatewayEventLog) => (
                        <time className="whitespace-nowrap font-mono text-[10px] text-muted">
                            {logTime(row.receivedAt)}
                        </time>
                    ),
                },
                {
                    label: 'Evento',
                    value: (row) => row.eventType,
                    render: (row: GatewayEventLog) => (
                        <Link
                            href={`/logs/gateway-events/${encodeURIComponent(row.id)}`}
                            className="font-mono text-[11px] font-semibold underline-offset-2 hover:text-brand hover:underline"
                        >
                            {row.eventType ?? 'Evento sem tipo'}
                        </Link>
                    ),
                },
                { label: 'Provedor', value: (row) => row.gateway?.name ?? row.provider },
                {
                    label: 'Status',
                    value: (row) => row.processingStatus,
                    render: (row: GatewayEventLog) => (
                        <OutcomeBadge
                            outcome={statusOutcome(row.processingStatus)}
                            label={statusLabels[row.processingStatus] ?? row.processingStatus}
                        />
                    ),
                },
                {
                    label: 'Pagamento',
                    value: (row) => row.paymentIntentId,
                    render: (row: GatewayEventLog) =>
                        row.paymentIntentId ? <CopyValue value={row.paymentIntentId} /> : '—',
                },
            ]}
        />
    );
}

export function ApiRequestList({ rows }: { rows: ApiRequestLog[] }) {
    return (
        <ResourceTable
            rows={rows}
            searchable={false}
            title="Chamadas à API"
            description="Método, rota, status, latência e identificadores de cada requisição."
            empty="Nenhuma chamada à API foi encontrada com esses filtros."
            columns={[
                {
                    label: 'Horário',
                    value: (row) => row.occurredAt,
                    render: (row: ApiRequestLog) => (
                        <time className="whitespace-nowrap font-mono text-[10px] text-muted">
                            {logTime(row.occurredAt)}
                        </time>
                    ),
                },
                {
                    label: 'Requisição',
                    value: (row) => `${row.method} ${row.route} ${row.path}`,
                    render: (row: ApiRequestLog) => (
                        <div className="max-w-[390px]">
                            <span className="mr-2 rounded-md bg-surface-muted px-1.5 py-1 font-mono text-[10px] font-semibold">
                                {row.method}
                            </span>
                            <code className="font-mono text-[11px]">{row.route}</code>
                        </div>
                    ),
                },
                {
                    label: 'Status',
                    value: (row) => row.statusCode,
                    render: (row: ApiRequestLog) => (
                        <OutcomeBadge
                            outcome={
                                row.statusCode >= 500
                                    ? 'failure'
                                    : row.statusCode >= 400
                                      ? 'warning'
                                      : 'success'
                            }
                            label={String(row.statusCode)}
                        />
                    ),
                },
                {
                    label: 'Duração',
                    value: (row) => row.durationMs,
                    render: (row: ApiRequestLog) => (
                        <span className="font-mono text-[11px]">{duration(row.durationMs)}</span>
                    ),
                },
                {
                    label: 'Request ID',
                    value: (row) => row.requestId,
                    render: (row: ApiRequestLog) => <CopyValue value={row.requestId} />,
                },
                {
                    label: 'Origem',
                    value: (row) => (row.actorType === 'api_key' ? 'Chave de API' : 'Usuário'),
                },
            ]}
        />
    );
}
