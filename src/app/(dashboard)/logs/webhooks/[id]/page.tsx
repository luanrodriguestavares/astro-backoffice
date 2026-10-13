import Link from 'next/link';

import { CopyValue } from '@/components/developer-logs/copy-value';
import { JsonBlock } from '@/components/developer-logs/json-block';
import {
    OutcomeBadge,
    statusLabels,
    statusOutcome,
} from '@/components/developer-logs/outcome-badge';
import { ReplayWebhookButton } from '@/components/developer-logs/replay-webhook-button';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import { duration, logTime } from '@/lib/developer-logs/format';
import type { WebhookDeliveryDetail } from '@/lib/developer-logs/types';

export default async function WebhookDeliveryLogPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [delivery, permissions] = await Promise.all([
        apiFetch<WebhookDeliveryDetail>(
            `/api/v1/developer/logs/webhook-deliveries/${encodeURIComponent(id)}`,
        ),
        currentPermissions(),
    ]);
    const inProgress = delivery.status === 'pending' || delivery.status === 'delivering';

    return (
        <div className="astro-themed-page">
            <Link
                href="/webhooks?view=sent"
                className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-foreground"
            >
                <Icon name="arrow-right" className="size-3 rotate-180" />
                Voltar para a central de webhooks
            </Link>
            <PageHeader
                eyebrow="Entrega de webhook"
                title={delivery.eventType}
                description={`Enviado para ${delivery.endpoint.name}. Consulte o payload e cada tentativa de entrega.`}
                actions={
                    permissions.has('webhooks.manage') ? (
                        <ReplayWebhookButton deliveryId={delivery.id} disabled={inProgress} />
                    ) : undefined
                }
            />
            <section className="mb-4 glass-panel rounded-[26px] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[12px] font-semibold">{delivery.endpoint.name}</p>
                        <p className="mt-1 break-all font-mono text-[10px] text-muted">
                            {delivery.endpoint.url}
                        </p>
                    </div>
                    <OutcomeBadge
                        outcome={statusOutcome(delivery.status)}
                        label={statusLabels[delivery.status] ?? delivery.status}
                    />
                </div>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="Entrega" value={delivery.id} />
                    <Detail label="Evento" value={delivery.eventId} />
                    <Detail label="Pagamento" value={delivery.paymentIntentId} />
                    <div>
                        <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                            Tentativas
                        </dt>
                        <dd className="mt-1 text-[12px]">
                            {delivery.attemptCount} · {delivery.replayCount} reenvios
                        </dd>
                    </div>
                </dl>
            </section>
            <div className="mb-4">
                <JsonBlock title="Payload sanitizado" value={delivery.payload} />
            </div>
            <section className="glass-panel overflow-hidden rounded-[26px]">
                <header className="border-b border-border px-5 py-4 sm:px-6">
                    <h2 className="text-sm font-semibold">Histórico de tentativas</h2>
                    <p className="mt-1 text-[11px] text-muted">
                        Cada resposta recebida do endpoint, em ordem cronológica.
                    </p>
                </header>
                {delivery.attempts.length === 0 ? (
                    <p className="px-6 py-10 text-center text-[12px] text-muted">
                        A primeira tentativa ainda não foi executada.
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {delivery.attempts.map((attempt) => (
                            <article
                                key={`${attempt.attemptNumber}-${attempt.attemptedAt}`}
                                className="grid gap-3 px-5 py-4 sm:px-6"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[12px] font-semibold">
                                        Tentativa {attempt.attemptNumber}
                                    </span>
                                    <OutcomeBadge
                                        outcome={
                                            attempt.responseStatus && attempt.responseStatus < 300
                                                ? 'success'
                                                : 'failure'
                                        }
                                        label={
                                            attempt.responseStatus
                                                ? `HTTP ${attempt.responseStatus}`
                                                : (attempt.errorCode ?? 'Sem resposta')
                                        }
                                    />
                                    <time className="ml-auto font-mono text-[10px] text-muted">
                                        {logTime(attempt.attemptedAt)}
                                    </time>
                                    <span className="font-mono text-[10px] text-muted">
                                        {duration(attempt.durationMs) ?? '—'}
                                    </span>
                                </div>
                                {attempt.errorMessage && (
                                    <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] text-danger">
                                        {attempt.errorMessage}
                                    </p>
                                )}
                                <div className="grid gap-2 lg:grid-cols-2">
                                    <JsonBlock
                                        title="Headers enviados"
                                        value={attempt.requestHeaders}
                                    />
                                    <JsonBlock
                                        title="Resposta"
                                        value={{
                                            headers: attempt.responseHeaders,
                                            body: attempt.responseBodyExcerpt,
                                        }}
                                    />
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="min-w-0">
            <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                {label}
            </dt>
            <dd className="mt-1">{value ? <CopyValue value={value} /> : '—'}</dd>
        </div>
    );
}
