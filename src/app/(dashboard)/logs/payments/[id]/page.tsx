import Link from 'next/link';

import { CopyValue } from '@/components/developer-logs/copy-value';
import { OutcomeBadge } from '@/components/developer-logs/outcome-badge';
import { PaymentTimelineView } from '@/components/developer-logs/payment-timeline';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard, money } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import { logTime, paymentStatusOutcome } from '@/lib/developer-logs/format';
import type { PaymentTimeline } from '@/lib/developer-logs/types';

export default async function PaymentLogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const timeline = await apiFetch<PaymentTimeline>(
        `/api/v1/developer/logs/payments/${encodeURIComponent(id)}`,
    );

    return (
        <div className="astro-themed-page">
            <Link
                href="/logs"
                className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition hover:text-foreground"
            >
                <Icon name="arrow-right" className="size-3 rotate-180" />
                Voltar para logs
            </Link>
            <PageHeader
                eyebrow="Linha do tempo do pagamento"
                title="Diagnóstico do pagamento"
                description="Todos os eventos abaixo estão em ordem cronológica e os dados sensíveis já foram mascarados."
            />
            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Valor"
                    value={money(timeline.intent.amountMinor, timeline.intent.currency)}
                    detail={timeline.intent.paymentMethod.replaceAll('_', ' ')}
                    icon="card"
                />
                <SummaryCard
                    label="Status atual"
                    value={timeline.payment?.status ?? timeline.intent.status}
                    detail={
                        timeline.payment
                            ? `Pagamento ${timeline.payment.id}`
                            : 'Intent sem pagamento concluído'
                    }
                    icon="pulse"
                />
                <SummaryCard
                    label="Tentativas"
                    value={String(timeline.attempts.length)}
                    detail={`${timeline.events.length} eventos registrados`}
                    icon="route"
                />
                <SummaryCard
                    label="Gateway final"
                    value={timeline.payment?.gateway?.name ?? 'Não definido'}
                    detail={timeline.payment?.providerPaymentId ?? 'Sem ID no provedor'}
                    icon="plug"
                />
            </section>

            <section className="mb-4 glass-panel rounded-[26px] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-semibold">Resumo técnico</h2>
                        <p className="mt-1 text-[11px] text-muted">
                            Criado em {logTime(timeline.intent.createdAt)}
                        </p>
                    </div>
                    <OutcomeBadge
                        outcome={paymentStatusOutcome(
                            timeline.payment?.status ?? timeline.intent.status,
                        )}
                        label={timeline.payment?.status ?? timeline.intent.status}
                    />
                </div>
                <dl className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="Intent" value={timeline.intent.id} />
                    <Detail label="Pagamento" value={timeline.payment?.id} />
                    <Detail label="Pedido" value={timeline.intent.orderId} />
                    <Detail label="Correlation ID" value={timeline.intent.correlationId} />
                </dl>
            </section>

            {timeline.attempts.length > 0 && (
                <section className="mb-4">
                    <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                        Tentativas de processamento
                    </h2>
                    <div className="grid gap-2 lg:grid-cols-2">
                        {timeline.attempts.map((attempt) => (
                            <article key={attempt.id} className="glass-panel rounded-[20px] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[12px] font-semibold">
                                            Tentativa {attempt.attemptNumber} ·{' '}
                                            {attempt.gateway?.name ?? 'Gateway não definido'}
                                        </p>
                                        <div className="mt-1">
                                            <CopyValue value={attempt.id} />
                                        </div>
                                    </div>
                                    <OutcomeBadge
                                        outcome={paymentStatusOutcome(attempt.status)}
                                        label={attempt.status}
                                    />
                                </div>
                                <p className="mt-3 text-[11px] text-muted">
                                    {attempt.failureMessage ??
                                        attempt.providerPaymentId ??
                                        'Sem detalhes adicionais'}
                                    {attempt.latencyMs !== null ? ` · ${attempt.latencyMs} ms` : ''}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <PaymentTimelineView events={timeline.events} />
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="min-w-0">
            <dt className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                {label}
            </dt>
            <dd>{value ? <CopyValue value={value} /> : '—'}</dd>
        </div>
    );
}
