'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import type { PlatformBillingSummary } from '@/lib/api/types';

type BillingTab = 'plan' | 'usage' | 'history';

interface CheckoutState {
    clientSecret: string;
    stripe: PromiseLike<Stripe | null>;
    planName: string;
}

export function PlatformBillingManager({
    summary,
    canManage,
}: {
    summary: PlatformBillingSummary;
    canManage: boolean;
}) {
    const [tab, setTab] = useState<BillingTab>('plan');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [checkout, setCheckout] = useState<CheckoutState | null>(null);
    const [canceling, setCanceling] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const { subscription } = summary;
    const hasContractedPlan = ['active', 'trialing', 'past_due'].includes(subscription.status);
    const closeCheckout = useCallback(() => setCheckout(null), []);
    const closeCancellation = useCallback(() => setCancelOpen(false), []);

    async function choosePlan(plan: PlatformBillingSummary['plans'][number]) {
        setSelectedPlan(plan.code);
        try {
            const response = await fetch('/api/platform-billing/checkout', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ planCode: plan.code }),
            });
            const payload = (await response.json()) as {
                data?: {
                    clientSecret: string | null;
                    publishableKey: string;
                    status: 'requires_payment' | 'updated';
                };
                detail?: string;
            };
            if (!response.ok || payload.data === undefined)
                throw new Error(payload.detail ?? 'Não foi possível preparar a cobrança.');
            if (payload.data.status === 'updated' || payload.data.clientSecret === null) {
                showToast({
                    tone: 'success',
                    description: 'Plano atualizado. Os novos dados aparecerão em instantes.',
                });
                window.location.reload();
                return;
            }
            setCheckout({
                clientSecret: payload.data.clientSecret,
                stripe: loadStripe(payload.data.publishableKey),
                planName: plan.name,
            });
        } catch (error) {
            showToast({
                tone: 'error',
                description: error instanceof Error ? error.message : 'Tente novamente.',
            });
        } finally {
            setSelectedPlan(null);
        }
    }

    async function cancelSubscription() {
        setCanceling(true);
        try {
            const response = await fetch('/api/platform-billing/cancel', { method: 'POST' });
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok) throw new Error(payload.detail ?? 'Não foi possível cancelar.');
            showToast({
                tone: 'success',
                description: 'As próximas cobranças foram interrompidas.',
            });
            setCancelOpen(false);
            window.location.reload();
        } catch (error) {
            showToast({
                tone: 'error',
                description: error instanceof Error ? error.message : 'Tente novamente.',
            });
        } finally {
            setCanceling(false);
        }
    }

    return (
        <div className="space-y-5" data-tour="platform-billing">
            {!summary.billingConfigured && (
                <section className="flex items-start gap-3 rounded-[22px] border border-warning/20 bg-warning/10 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
                        <Icon name="card" className="size-4" />
                    </span>
                    <div>
                        <p className="text-[13px] font-semibold">Cobrança em configuração</p>
                        <p className="mt-1 text-[12px] leading-5 text-muted">
                            O formulário ficará disponível assim que as chaves da conta Stripe do
                            Astro forem configuradas.
                        </p>
                    </div>
                </section>
            )}

            <section className="glass-panel overflow-hidden rounded-[28px] p-6 sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 place-items-center rounded-2xl border border-border bg-brand-soft text-brand-strong">
                                <Icon name="card" className="size-5" />
                            </span>
                            <div>
                                <p className="text-[13px] font-medium text-muted">
                                    {hasContractedPlan ? 'Plano atual' : 'Assinatura do Astro'}
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                                    {hasContractedPlan
                                        ? subscription.planName
                                        : 'Nenhum plano contratado'}
                                </h2>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px]">
                            <StatusBadge status={subscription.status} />
                            {hasContractedPlan && (
                                <span className="rounded-full border border-border bg-surface-muted/55 px-3 py-1.5 text-muted">
                                    {subscription.cancelAtPeriodEnd
                                        ? `Acesso até ${date(subscription.currentPeriodEndsAt)}`
                                        : `Renova em ${date(subscription.currentPeriodEndsAt)}`}
                                </span>
                            )}
                            {hasContractedPlan && subscription.paymentMethod && (
                                <span className="rounded-full border border-border bg-surface-muted/55 px-3 py-1.5 text-muted">
                                    Pagamento por {paymentMethod(subscription.paymentMethod)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-left lg:text-right">
                        {hasContractedPlan ? (
                            <p className="text-3xl font-semibold tracking-[-0.05em]">
                                {money(subscription.priceMinor, subscription.currency)}
                                <span className="ml-1 text-[13px] font-medium tracking-normal text-muted">
                                    /mês
                                </span>
                            </p>
                        ) : (
                            <p className="text-lg font-semibold tracking-[-0.03em]">
                                Nenhuma cobrança ativa
                            </p>
                        )}
                        <p className="mt-2 text-[12px] text-muted">
                            Cobrança recorrente processada com segurança pelo Stripe
                        </p>
                        <div className="mt-4 flex lg:justify-end">
                            {subscription.status === 'pending' ? (
                                <Button type="button" variant="secondary" disabled>
                                    Aguardando contratação
                                </Button>
                            ) : subscription.status === 'canceled' ? (
                                <Button type="button" variant="secondary" disabled>
                                    Assinatura encerrada
                                </Button>
                            ) : subscription.providerSubscriptionId === null ? (
                                <Button type="button" variant="secondary" disabled>
                                    Sem cobrança recorrente
                                </Button>
                            ) : subscription.cancelAtPeriodEnd ? (
                                <Button type="button" variant="secondary" disabled>
                                    Renovação cancelada
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="danger"
                                    disabled={!canManage || canceling}
                                    title={
                                        canManage
                                            ? 'Interromper as próximas cobranças'
                                            : 'Somente administradores podem cancelar a assinatura'
                                    }
                                    onClick={() => setCancelOpen(true)}
                                >
                                    Cancelar assinatura
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                {subscription.status === 'past_due' && (
                    <div className="mt-5 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-[12px]">
                        O último pagamento falhou. Regularize até{' '}
                        {date(subscription.gracePeriodEndsAt)} para evitar a interrupção do plano.
                    </div>
                )}
            </section>

            <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface-muted/45 p-1" aria-label="Seções da assinatura">
                <TabButton active={tab === 'plan'} onClick={() => setTab('plan')} icon="card">
                    Plano e pagamento
                </TabButton>
                <TabButton active={tab === 'usage'} onClick={() => setTab('usage')} icon="chart">
                    Uso e limites
                </TabButton>
                <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon="clock">
                    Histórico de cobranças
                </TabButton>
            </nav>

            {tab === 'plan' && (
                <div className="space-y-5">
                    <section>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold tracking-[-0.03em]">
                                Escolha seu plano
                            </h2>
                            <p className="mt-1 text-[13px] text-muted">
                                O cartão é preenchido sem sair do painel do Astro.
                            </p>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {summary.plans.map((plan) => {
                                const current =
                                    hasContractedPlan && plan.code === subscription.planCode;
                                const alreadySubscribed =
                                    current && subscription.providerSubscriptionId !== null;
                                const loading = selectedPlan === plan.code;
                                return (
                                    <article
                                        key={plan.id}
                                        className={`glass-panel flex min-h-[270px] flex-col rounded-[24px] p-6 ${current ? 'ring-1 ring-brand/35' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-semibold">{plan.name}</h3>
                                                <p className="mt-2 text-[13px] leading-5 text-muted">
                                                    {plan.description}
                                                </p>
                                            </div>
                                            {current && (
                                                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-strong">
                                                    Atual
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-6 text-3xl font-semibold tracking-[-0.05em]">
                                            {plan.pricingType === 'custom'
                                                ? 'Sob consulta'
                                                : money(plan.priceMinor, plan.currency)}
                                            {plan.pricingType === 'fixed' && (
                                                <span className="ml-1 text-[12px] font-medium tracking-normal text-muted">
                                                    /mês
                                                </span>
                                            )}
                                        </p>
                                        <div className="mt-auto pt-7">
                                            <Button
                                                type="button"
                                                variant={alreadySubscribed ? 'secondary' : 'primary'}
                                                disabled={
                                                    !canManage ||
                                                    !summary.billingConfigured ||
                                                    alreadySubscribed ||
                                                    loading ||
                                                    plan.pricingType === 'custom'
                                                }
                                                onClick={() => void choosePlan(plan)}
                                                className="w-full disabled:cursor-not-allowed disabled:opacity-55"
                                            >
                                                {loading
                                                    ? 'Preparando…'
                                                    : alreadySubscribed
                                                      ? 'Plano atual'
                                                      : current
                                                        ? 'Cadastrar cartão'
                                                      : plan.pricingType === 'custom'
                                                        ? 'Fale com a Astro'
                                                        : 'Escolher plano'}
                                            </Button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                </div>
            )}

            {tab === 'usage' && (
                <section className="glass-panel rounded-[26px] p-6 sm:p-7">
                    <div>
                        <h2 className="text-lg font-semibold">Uso no ciclo atual</h2>
                        <p className="mt-1 text-[13px] text-muted">
                            Período de {date(subscription.currentPeriodStartsAt)} a{' '}
                            {date(subscription.currentPeriodEndsAt)}.
                        </p>
                    </div>
                    <div className="mt-7 grid gap-6 lg:grid-cols-2">
                        {summary.usage
                            .filter((item) => item.enabled)
                            .map((item) => <UsageRow key={item.feature} item={item} />)}
                        {summary.usage.filter((item) => item.enabled).length === 0 && (
                            <p className="text-[13px] text-muted">
                                Nenhum limite mensurável neste plano.
                            </p>
                        )}
                    </div>
                </section>
            )}

            {tab === 'history' && <BillingHistory history={summary.history} />}

            <Modal open={checkout !== null} onClose={closeCheckout} labelledBy="stripe-payment-title">
                {checkout && (
                    <>
                        <ModalHeader
                            eyebrow="Pagamento seguro"
                            title={`Assinar ${checkout.planName}`}
                            description="Informe o cartão que será usado nesta cobrança e nas próximas renovações."
                            titleId="stripe-payment-title"
                            onClose={closeCheckout}
                        />
                        <ModalBody>
                            <Elements
                                stripe={checkout.stripe}
                                options={{
                                    clientSecret: checkout.clientSecret,
                                    locale: 'pt-BR',
                                    appearance: {
                                        theme: 'stripe',
                                        variables: {
                                            colorPrimary: '#6c5ce7',
                                            borderRadius: '12px',
                                            fontFamily: 'Inter, system-ui, sans-serif',
                                        },
                                    },
                                }}
                            >
                                <StripePaymentForm />
                            </Elements>
                        </ModalBody>
                    </>
                )}
            </Modal>

            <Modal
                open={cancelOpen}
                onClose={closeCancellation}
                labelledBy="cancel-subscription-title"
                maxWidth="max-w-lg"
            >
                <ModalHeader
                    eyebrow="Assinatura do Astro"
                    title="Cancelar assinatura?"
                    description="Confirme para interromper todas as próximas cobranças recorrentes."
                    titleId="cancel-subscription-title"
                    onClose={closeCancellation}
                />
                <ModalBody>
                    <div className="rounded-2xl border border-danger/15 bg-danger/5 p-5">
                        <p className="text-[13px] font-semibold">
                            Nenhuma nova cobrança será feita após a confirmação.
                        </p>
                        <p className="mt-2 text-[12px] leading-5 text-muted">
                            Seu plano {subscription.planName} continuará disponível até{' '}
                            <strong className="text-foreground">
                                {date(subscription.currentPeriodEndsAt)}
                            </strong>
                            , pois esse período já está pago. O histórico de cobranças permanecerá
                            acessível.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={canceling}
                        onClick={closeCancellation}
                    >
                        Manter assinatura
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        disabled={canceling}
                        onClick={() => void cancelSubscription()}
                    >
                        {canceling ? 'Cancelando…' : 'Confirmar cancelamento'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}

function StripePaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!stripe || !elements) return;
        setSubmitting(true);
        setError(null);
        const result = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/settings?view=plan&billing=paid` },
            redirect: 'if_required',
        });
        if (result.error) {
            setError(result.error.message ?? 'Não foi possível confirmar o pagamento.');
            setSubmitting(false);
            return;
        }
        showToast({
            tone: 'success',
            description: 'Pagamento confirmado. Atualizando sua assinatura…',
        });
        window.setTimeout(() => window.location.reload(), 900);
    }

    return (
        <form onSubmit={(event) => void submit(event)}>
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && (
                <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-[12px] text-danger">
                    {error}
                </p>
            )}
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
                <p className="max-w-xs text-[11px] leading-5 text-muted">
                    Os dados completos do cartão não passam pelos servidores do Astro.
                </p>
                <Button type="submit" variant="primary" disabled={!stripe || submitting}>
                    {submitting ? 'Confirmando…' : 'Confirmar assinatura'}
                </Button>
            </div>
        </form>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick(): void;
    icon: IconName;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold transition ${active ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
        >
            <Icon name={icon} className="size-4" />
            {children}
        </button>
    );
}

function BillingHistory({ history }: { history: PlatformBillingSummary['history'] }) {
    return (
        <section className="glass-panel overflow-hidden rounded-[26px]">
            <div className="flex items-center justify-between px-6 py-5 sm:px-7">
                <div>
                    <h2 className="text-lg font-semibold">Histórico de cobranças</h2>
                    <p className="mt-1 text-[13px] text-muted">
                        Pagamentos, renovações, falhas e alterações dos últimos 50 eventos.
                    </p>
                </div>
                <span className="rounded-full border border-border bg-surface-muted px-3 py-1.5 text-[11px] font-semibold text-muted">
                    {history.length} registros
                </span>
            </div>
            <div className="max-h-[520px] overflow-auto border-t border-border">
                {history.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <Icon name="file" className="mx-auto size-6 text-muted" />
                        <p className="mt-3 text-[13px] text-muted">
                            Nenhuma cobrança foi registrada ainda.
                        </p>
                    </div>
                ) : (
                    <table className="w-full min-w-[700px] text-left text-[13px]">
                        <thead className="sticky top-0 bg-surface/95 text-muted backdrop-blur-xl">
                            <tr>
                                <th className="px-6 py-3 font-medium">Data</th>
                                <th className="px-6 py-3 font-medium">Cobrança</th>
                                <th className="px-6 py-3 font-medium">Situação</th>
                                <th className="px-6 py-3 text-right font-medium">Valor</th>
                                <th className="px-6 py-3 font-medium">Comprovante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {history.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-muted">
                                        {dateTime(item.occurredAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium">{eventLabel(item.type)}</p>
                                        {item.failureReason && (
                                            <p className="mt-1 max-w-xs text-[11px] text-danger">
                                                {item.failureReason}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold">
                                        {money(item.amountMinor, item.currency)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.receiptUrl ? (
                                            <a
                                                href={item.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-semibold text-brand-strong hover:underline"
                                            >
                                                Abrir fatura
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

function UsageRow({ item }: { item: PlatformBillingSummary['usage'][number] }) {
    const label =
        typeof item.metadata.label === 'string' ? item.metadata.label : featureLabel(item.feature);
    return (
        <div className="rounded-2xl border border-border bg-surface-muted/25 p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold">{label}</p>
                <p className="text-[12px] text-muted">
                    {item.used.toLocaleString('pt-BR')} de{' '}
                    {item.limit === null ? 'ilimitado' : item.limit.toLocaleString('pt-BR')}
                </p>
            </div>
            {item.limit !== null && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <span
                        className="block h-full rounded-full bg-brand transition-[width]"
                        style={{ width: `${Math.max(2, item.usagePercent ?? 0)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const label: Record<string, string> = {
        active: 'Ativo',
        trialing: 'Em teste',
        past_due: 'Pagamento pendente',
        canceled: 'Cancelado',
        paid: 'Pago',
        failed: 'Falhou',
        pending: 'Aguardando contratação',
        updated: 'Atualizado',
    };
    return (
        <span className="inline-flex rounded-full border border-border bg-surface-muted/60 px-2.5 py-1 text-[11px] font-semibold">
            {label[status] ?? status}
        </span>
    );
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}
function date(value: string | null) {
    return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—';
}
function dateTime(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}
function paymentMethod(value: string) {
    return value.toLowerCase() === 'card' ? 'cartão' : value.toUpperCase();
}
function eventLabel(value: string) {
    return (
        {
            'invoice.paid': 'Cobrança paga',
            'invoice.payment_failed': 'Falha na cobrança',
            'customer.subscription.updated': 'Assinatura atualizada',
            'customer.subscription.deleted': 'Assinatura encerrada',
            'subscription.completed': 'Assinatura ativada',
            'subscription.renewed': 'Renovação',
            'subscription.payment_failed': 'Falha na cobrança',
            'subscription.cancelled': 'Cancelamento',
            'subscription.plan_changed': 'Plano alterado',
        } as Record<string, string>
    )[value] ?? value;
}
function featureLabel(value: string) {
    return (
        {
            'commerce.orders': 'Pedidos processados',
            'analytics.events': 'Eventos de analytics',
            api_keys: 'Chaves de API',
            'notifications.sale_email': 'E-mail por venda',
            'checkout.abandoned_recovery': 'Recuperação de carrinho',
        } as Record<string, string>
    )[value] ?? value;
}
