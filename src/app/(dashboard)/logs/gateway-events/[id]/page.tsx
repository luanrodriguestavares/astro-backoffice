import Link from 'next/link';

import { CopyValue } from '@/components/developer-logs/copy-value';
import { JsonBlock } from '@/components/developer-logs/json-block';
import {
    OutcomeBadge,
    statusLabels,
    statusOutcome,
} from '@/components/developer-logs/outcome-badge';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import { logTime } from '@/lib/developer-logs/format';
import type { GatewayEventDetail } from '@/lib/developer-logs/types';

export default async function GatewayEventLogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await apiFetch<GatewayEventDetail>(
        `/api/v1/developer/logs/gateway-events/${encodeURIComponent(id)}`,
    );
    return (
        <div className="astro-themed-page">
            <Link
                href="/webhooks?view=received"
                className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-foreground"
            >
                <Icon name="arrow-right" className="size-3 rotate-180" />
                Voltar para a central de webhooks
            </Link>
            <PageHeader
                eyebrow="Webhook recebido"
                title={event.eventType ?? 'Evento do gateway'}
                description={`Recebido de ${event.gateway?.name ?? event.provider} em ${logTime(event.receivedAt)}.`}
            />
            <section className="mb-4 glass-panel rounded-[26px] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <CopyValue value={event.id} label="Evento" />
                    <OutcomeBadge
                        outcome={statusOutcome(event.processingStatus)}
                        label={statusLabels[event.processingStatus] ?? event.processingStatus}
                    />
                </div>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="ID no provedor" value={event.providerEventId} />
                    <Detail label="Pagamento" value={event.paymentIntentId} />
                    <Detail label="Gateway" value={event.gateway?.id} />
                    <div>
                        <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                            Processado em
                        </dt>
                        <dd className="mt-1 font-mono text-[10px]">{logTime(event.processedAt)}</dd>
                    </div>
                </dl>
                {event.errorMessage && (
                    <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-[11px] text-danger">
                        {event.errorMessage}
                    </p>
                )}
            </section>
            <div className="grid gap-3 lg:grid-cols-2">
                <JsonBlock title="Headers sanitizados" value={event.headers} />
                <JsonBlock title="Payload sanitizado" value={event.payload} />
            </div>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="min-w-0">
            <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                {label}
            </dt>
            <dd className="mt-1">{value ? <CopyValue value={value} /> : '—'}</dd>
        </div>
    );
}
