'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import {
    categoryLabels,
    duration,
    httpTone,
    logTime,
    outcomeDots,
    sourceLabels,
} from '@/lib/developer-logs/format';
import type { LogCategory, TimelineEvent } from '@/lib/developer-logs/types';

import { copyText, CopyValue } from './copy-value';
import { JsonBlock } from './json-block';
import { OutcomeBadge } from './outcome-badge';

interface GatewayExchange {
    method: string;
    url: string;
    status?: number;
    durationMs: number;
    startedAt: string;
    requestHeaders: Record<string, string>;
    requestBody?: unknown;
    responseHeaders?: Record<string, string>;
    responseBody?: unknown;
    error?: string;
}

/**
 * Linha do tempo do pagamento: cada evento abre para mostrar identificadores, requisição e
 * resposta do gateway e demais metadados (já mascarados pela API).
 */
export function PaymentTimelineView({ events }: { events: TimelineEvent[] }) {
    const [expanded, setExpanded] = useState<Set<string>>(
        () => new Set(events.filter((event) => event.outcome === 'failure').map((e) => e.id)),
    );
    const [hidden, setHidden] = useState<Set<LogCategory>>(new Set());
    const [problemsOnly, setProblemsOnly] = useState(false);
    const categories = useMemo(() => [...new Set(events.map((event) => event.category))], [events]);
    const visible = events.filter(
        (event) =>
            !hidden.has(event.category) &&
            (!problemsOnly || event.outcome === 'failure' || event.outcome === 'warning'),
    );
    const allExpanded = visible.length > 0 && visible.every((event) => expanded.has(event.id));

    function toggle(id: string) {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <section className="glass-panel overflow-hidden rounded-[26px]">
            <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3 sm:px-6">
                <p className="mr-auto text-[12px] font-semibold">
                    {visible.length} de {events.length} eventos
                </p>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-muted">
                    <input
                        type="checkbox"
                        checked={problemsOnly}
                        onChange={(event) => setProblemsOnly(event.target.checked)}
                        className="accent-[var(--brand)]"
                    />
                    Só falhas e alertas
                </label>
                <button
                    type="button"
                    onClick={() =>
                        setExpanded(allExpanded ? new Set() : new Set(visible.map((e) => e.id)))
                    }
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    {allExpanded ? 'Recolher tudo' : 'Expandir tudo'}
                </button>
                <button
                    type="button"
                    onClick={() =>
                        void copyText(
                            JSON.stringify(visible, null, 2),
                            'Linha do tempo copiada em JSON.',
                        )
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name="copy" className="size-3" />
                    Copiar JSON
                </button>
            </header>
            <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-2.5 sm:px-6">
                {categories.map((category) => {
                    const active = !hidden.has(category);
                    return (
                        <button
                            key={category}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                                setHidden((current) => {
                                    const next = new Set(current);
                                    if (next.has(category)) next.delete(category);
                                    else next.add(category);
                                    return next;
                                })
                            }
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${active ? 'border-brand/30 bg-brand-soft text-brand-strong' : 'border-border text-muted line-through'}`}
                        >
                            {categoryLabels[category]} ·{' '}
                            {events.filter((event) => event.category === category).length}
                        </button>
                    );
                })}
            </div>
            {visible.length === 0 ? (
                <p className="px-6 py-10 text-center text-[12px] text-muted">
                    Nenhum evento com os filtros selecionados.
                </p>
            ) : (
                <ol className="relative px-5 py-4 sm:px-6">
                    {visible.map((event, index) => (
                        <TimelineRow
                            key={event.id}
                            event={event}
                            last={index === visible.length - 1}
                            previous={visible[index - 1]}
                            open={expanded.has(event.id)}
                            onToggle={() => toggle(event.id)}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}

function TimelineRow({
    event,
    previous,
    last,
    open,
    onToggle,
}: {
    event: TimelineEvent;
    previous: TimelineEvent | undefined;
    last: boolean;
    open: boolean;
    onToggle(): void;
}) {
    const gap =
        previous === undefined
            ? null
            : new Date(event.occurredAt).getTime() - new Date(previous.occurredAt).getTime();
    return (
        <li className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-3">
            <div className="relative flex justify-center">
                {!last && <span className="absolute top-5 bottom-0 w-px bg-border" />}
                <span
                    className={`relative mt-[7px] size-2.5 rounded-full ring-4 ring-[var(--surface)] ${outcomeDots[event.outcome]}`}
                />
            </div>
            <div className="min-w-0 pb-4">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className="group flex w-full min-w-0 flex-col gap-1 rounded-xl px-2 py-1.5 text-left transition hover:bg-surface-muted/50"
                >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
                        <time dateTime={event.occurredAt} className="font-mono">
                            {logTime(event.occurredAt)}
                        </time>
                        {gap !== null && gap > 0 && <span>+{duration(gap)}</span>}
                        <span className="font-medium text-foreground/70">
                            {categoryLabels[event.category]}
                        </span>
                        <span>· {sourceLabels[event.source] ?? event.source}</span>
                    </span>
                    <span className="flex min-w-0 items-start gap-2">
                        <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug">
                            {event.summary}
                        </span>
                        <Icon
                            name="chevron-down"
                            className={`mt-0.5 size-3.5 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`}
                        />
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                        <OutcomeBadge outcome={event.outcome} />
                        <code className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-muted">
                            {event.type}
                        </code>
                        {event.httpStatus !== null && (
                            <span
                                className={`font-mono text-[10px] font-semibold ${httpTone(event.httpStatus)}`}
                            >
                                HTTP {event.httpStatus}
                            </span>
                        )}
                        {event.durationMs !== null && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                                <Icon name="clock" className="size-3" />
                                {duration(event.durationMs)}
                            </span>
                        )}
                        {event.errorCode && (
                            <code className="rounded-md bg-red-50 px-1.5 py-0.5 font-mono text-[10px] text-danger">
                                {event.errorCode}
                            </code>
                        )}
                    </span>
                </button>
                {open && <EventDetails event={event} />}
            </div>
        </li>
    );
}

function EventDetails({ event }: { event: TimelineEvent }) {
    const { http, ...details } = (event.details ?? {}) as {
        http?: GatewayExchange[];
    } & Record<string, unknown>;
    const references: { label: string; value: string | null; href?: string }[] = [
        { label: 'Evento', value: event.id },
        { label: 'Tentativa', value: event.attemptId },
        { label: 'Pagamento', value: event.paymentId },
        { label: 'Reembolso', value: event.refundId },
        { label: 'Gateway', value: event.gatewayConnectionId },
        {
            label: 'Webhook enviado',
            value: event.webhookDeliveryId,
            ...(event.webhookDeliveryId
                ? { href: `/logs/webhooks/${event.webhookDeliveryId}` }
                : {}),
        },
        {
            label: 'Webhook recebido',
            value: event.gatewayEventId,
            ...(event.gatewayEventId
                ? { href: `/logs/gateway-events/${event.gatewayEventId}` }
                : {}),
        },
        {
            label: 'Request ID',
            value: event.requestId,
            ...(event.requestId
                ? { href: `/logs?view=requests&requestId=${encodeURIComponent(event.requestId)}` }
                : {}),
        },
        { label: 'Correlation ID', value: event.correlationId },
    ];
    return (
        <div className="mt-2 grid gap-3 rounded-2xl border border-border bg-surface/70 p-3 sm:p-4">
            {event.errorMessage && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-danger">
                    {event.errorMessage}
                </p>
            )}
            <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {references
                    .filter((reference) => reference.value !== null)
                    .map((reference) => (
                        <div key={reference.label} className="flex min-w-0 items-center gap-2">
                            <dt className="w-28 shrink-0 text-[10px] text-muted">
                                {reference.href ? (
                                    <Link
                                        href={reference.href}
                                        className="underline-offset-2 hover:underline"
                                    >
                                        {reference.label} ↗
                                    </Link>
                                ) : (
                                    reference.label
                                )}
                            </dt>
                            <dd className="min-w-0">
                                <CopyValue value={reference.value ?? ''} />
                            </dd>
                        </div>
                    ))}
                {event.actor && (
                    <div className="flex min-w-0 items-center gap-2">
                        <dt className="w-28 shrink-0 text-[10px] text-muted">Executado por</dt>
                        <dd className="truncate text-[11px]">{event.actor.name}</dd>
                    </div>
                )}
            </dl>
            {http?.map((exchange, index) => (
                <HttpExchange key={`${exchange.startedAt}-${String(index)}`} exchange={exchange} />
            ))}
            {Object.keys(details).length > 0 && <JsonBlock title="Detalhes" value={details} />}
        </div>
    );
}

function HttpExchange({ exchange }: { exchange: GatewayExchange }) {
    return (
        <div className="grid gap-2 rounded-xl border border-border p-2.5">
            <p className="flex min-w-0 flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono font-semibold">
                    {exchange.method}
                </span>
                <code
                    className="min-w-0 flex-1 truncate font-mono text-[11px]"
                    title={exchange.url}
                >
                    {exchange.url}
                </code>
                <span className={`font-mono font-semibold ${httpTone(exchange.status)}`}>
                    {exchange.status ?? 'sem resposta'}
                </span>
                <span className="text-muted">{duration(exchange.durationMs)}</span>
            </p>
            {exchange.error && <p className="text-[11px] text-danger">{exchange.error}</p>}
            <div className="grid gap-2 lg:grid-cols-2">
                <JsonBlock
                    title="Requisição"
                    value={{ headers: exchange.requestHeaders, body: exchange.requestBody ?? null }}
                />
                <JsonBlock
                    title="Resposta"
                    value={{
                        headers: exchange.responseHeaders ?? {},
                        body: exchange.responseBody ?? null,
                    }}
                />
            </div>
        </div>
    );
}
