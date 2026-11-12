'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { PlatformBillingSummary } from '@/lib/api/types';

type Plan = PlatformBillingSummary['plans'][number];

/*
 * Topo da assinatura no bloco de preços da landing: o vidro com a comissão do Astro à esquerda
 * e o papel claro à direita. Sem plano, o papel é o simulador que sugere o plano pelos pedidos
 * do mês; com plano, mostra o consumo do ciclo atual.
 */
export function BillingHero({
    summary,
    hasContractedPlan,
    canSubscribe,
    selectedPlan,
    onChoosePlan,
    footer,
}: {
    summary: PlatformBillingSummary;
    hasContractedPlan: boolean;
    canSubscribe: boolean;
    selectedPlan: string | null;
    onChoosePlan(plan: Plan): void;
    footer?: React.ReactNode;
}) {
    const feeBasisPoints =
        summary.usage.find((item) => item.feature === 'astro.transaction_fee_basis_points')
            ?.limit ?? 0;

    return (
        <section className="aurora-block grid gap-3 p-3 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.4fr)] lg:gap-[18px] lg:p-[18px]">
            <article className="aurora-glass relative flex min-h-[240px] flex-col rounded-[24px] p-7 lg:min-h-[380px] lg:p-9">
                <p className="aurora-figure text-[96px] leading-[1.05] tracking-[-0.08em] text-[#f4f4f4] lg:text-[128px]">
                    {(feeBasisPoints / 100).toLocaleString('pt-BR')}
                    <span className="aurora-accent text-[0.45em] tracking-[-0.06em]">%</span>
                </p>
                <h2 className="mt-2 text-[24px] leading-[1.12] text-[#f4f4f4] lg:text-[28px]">
                    de comissão do Astro
                    <br />
                    sobre suas vendas.
                </h2>
                <p className="mt-4 text-[13px] leading-6 text-[#c4d2ca]">
                    Seu produto cresce.
                    <br />
                    Sua receita continua sendo sua.
                </p>
                <Icon
                    name="arrow-right"
                    className="aurora-accent absolute bottom-7 right-7 size-9 -rotate-45 lg:bottom-9 lg:right-9"
                />
            </article>

            <article className="aurora-paper flex flex-col rounded-[24px] p-6 lg:p-9">
                {hasContractedPlan ? (
                    <CurrentCycle summary={summary} />
                ) : (
                    <PlanSimulator
                        plans={summary.plans}
                        canSubscribe={canSubscribe}
                        selectedPlan={selectedPlan}
                        onChoosePlan={onChoosePlan}
                    />
                )}
                <p className="mt-6 border-t border-border pt-5 text-[13px] leading-6 text-muted">
                    O valor é fixo dentro da faixa — as taxas de processamento seguem o gateway que
                    você conectar.
                </p>
                {footer}
            </article>
        </section>
    );
}

function PlanSimulator({
    plans,
    canSubscribe,
    selectedPlan,
    onChoosePlan,
}: {
    plans: Plan[];
    canSubscribe: boolean;
    selectedPlan: string | null;
    onChoosePlan(plan: Plan): void;
}) {
    const largestLimit = Math.max(
        0,
        ...plans.map((plan) => (plan.limits.monthlySalesMinor ?? 0) / 100).filter(Number.isFinite),
    );
    // Um pouco além da maior faixa, para o simulador alcançar o plano sob consulta.
    const max = Math.max(10_000, Math.ceil((largestLimit * 1.2) / 10_000) * 10_000);
    const [sales, setSales] = useState(Math.min(25_000, max));
    const plan = suggestedPlan(plans, sales * 100);
    const fill = `${(sales / max) * 100}%`;

    return (
        <div className="grid flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-center">
            <div>
                <h3 className="max-w-[300px] text-[26px] leading-[1.1] lg:text-[30px]">
                    Quanto você vende por mês?
                </h3>
                <output
                    htmlFor="billing-sales"
                    className="aurora-figure mt-6 block text-[34px] tracking-[-0.04em]"
                >
                    {sales >= max ? `${reais(max)}+` : reais(sales)}
                    <span className="ml-2 font-sans text-[13px] font-normal tracking-normal text-muted">
                        em vendas
                    </span>
                </output>
                <label htmlFor="billing-sales" className="sr-only">
                    Volume de vendas por mês, em reais
                </label>
                <input
                    id="billing-sales"
                    type="range"
                    min={0}
                    max={max}
                    step={1_000}
                    value={sales}
                    onChange={(event) => setSales(Number(event.target.value))}
                    className="aurora-range mt-5"
                    style={{ '--fill': fill } as React.CSSProperties}
                />
                <div className="mt-3 flex justify-between text-[11px] text-muted">
                    <span>0</span>
                    <span>{reais(max)}+</span>
                </div>
            </div>

            {plan && (
                <div className="aurora-plan rounded-[22px] p-6" aria-live="polite">
                    <PlanSummary plan={plan} />
                    <Button
                        type="button"
                        variant="primary"
                        disabled={
                            !canSubscribe ||
                            plan.pricingType === 'custom' ||
                            selectedPlan === plan.code
                        }
                        onClick={() => onChoosePlan(plan)}
                        className="mt-5 w-full disabled:cursor-not-allowed disabled:opacity-55"
                    >
                        {selectedPlan === plan.code
                            ? 'Preparando…'
                            : plan.pricingType === 'custom'
                              ? 'Fale com a Astro'
                              : `Assinar ${plan.name}`}
                    </Button>
                </div>
            )}
        </div>
    );
}

function CurrentCycle({ summary }: { summary: PlatformBillingSummary }) {
    const { subscription } = summary;
    const plan = summary.plans.find((item) => item.code === subscription.planCode);
    const usage = (feature: string) => summary.usage.find((item) => item.feature === feature);
    const sales = usage('commerce.sales_volume_minor');
    const percent = sales?.usagePercent ?? 0;

    return (
        <div className="grid flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-center">
            <div>
                <h3 className="max-w-[300px] text-[26px] leading-[1.1] lg:text-[30px]">
                    Vendas neste ciclo
                </h3>
                <p className="aurora-figure mt-6 text-[34px] tracking-[-0.04em]">
                    {money(sales?.used ?? 0, 'BRL')}
                    <span className="ml-2 font-sans text-[13px] font-normal tracking-normal text-muted">
                        {sales?.limit == null ? 'em vendas' : `de ${money(sales.limit, 'BRL')}`}
                    </span>
                </p>
                {sales?.limit != null && (
                    <div
                        className="aurora-meter mt-5"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={sales.limit}
                        aria-valuenow={sales.used}
                        aria-label="Vendas do ciclo em relação à faixa do plano"
                    >
                        <span style={{ width: `${percent}%` }} />
                        <i style={{ left: `${Math.min(100, Math.max(0, percent))}%` }} />
                    </div>
                )}
                <p className="mt-4 text-[11px] text-muted">
                    Ciclo de {date(subscription.currentPeriodStartsAt)} a{' '}
                    {date(subscription.currentPeriodEndsAt)}
                </p>
            </div>

            {plan && (
                <div className="aurora-plan rounded-[22px] p-6">
                    <PlanSummary
                        plan={plan}
                        used={{
                            checkouts: usage('checkout.published')?.used,
                            domains: usage('domains.custom')?.used,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function PlanSummary({
    plan,
    used,
}: {
    plan: Plan;
    used?: { checkouts?: number; domains?: number };
}) {
    const { monthlySalesMinor, publishedCheckouts, customDomains, connectedGateways } =
        plan.limits;
    return (
        <>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted">
                        Seu plano
                    </p>
                    <p className="aurora-figure mt-1.5 text-[21px] leading-tight tracking-[-0.03em]">
                        {plan.name}
                    </p>
                </div>
                <span className="aurora-commission">0% de comissão</span>
            </div>
            <p className="mt-5 flex items-baseline gap-2">
                <span className="aurora-figure text-[40px] tracking-[-0.045em]">
                    {plan.pricingType === 'custom'
                        ? 'Sob consulta'
                        : money(plan.priceMinor, plan.currency)}
                </span>
                {plan.pricingType === 'fixed' && (
                    <span className="text-[13px] text-muted">/ mês</span>
                )}
            </p>
            <p className="mt-2 text-[12px] text-muted">
                {monthlySalesMinor === null
                    ? 'Vendas sem limite de faixa'
                    : `Até ${money(monthlySalesMinor, 'BRL')} em vendas por mês`}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-[12px] text-muted">
                <Limit
                    used={used?.checkouts}
                    limit={publishedCheckouts}
                    label={publishedCheckouts === 1 ? 'checkout' : 'checkouts'}
                />
                <Limit
                    used={used?.domains}
                    limit={customDomains}
                    label={customDomains === 1 ? 'domínio próprio' : 'domínios próprios'}
                />
                <Limit
                    limit={connectedGateways}
                    label={connectedGateways === 1 ? 'gateway' : 'gateways'}
                />
            </div>
        </>
    );
}

function Limit({ used, limit, label }: { used?: number; limit: number | null; label: string }) {
    return (
        <span>
            {used !== undefined && limit !== null ? (
                <>
                    <b className="aurora-figure mr-0.5 text-[17px] text-foreground">
                        {number(used)}
                    </b>
                    /{number(limit)}{' '}
                </>
            ) : (
                <b className="aurora-figure mr-1 text-[17px] text-foreground">
                    {limit === null ? 'Ilimitados' : number(limit)}
                </b>
            )}
            {label}
        </span>
    );
}

/** O menor plano cuja faixa comporta as vendas (em centavos); acima de todas, o sob consulta. */
function suggestedPlan(plans: Plan[], salesMinor: number) {
    const fixed = plans
        .filter((plan) => plan.pricingType === 'fixed' && plan.limits.monthlySalesMinor !== null)
        .toSorted((left, right) => left.priceMinor - right.priceMinor);
    return (
        fixed.find((plan) => salesMinor <= (plan.limits.monthlySalesMinor ?? 0)) ??
        plans.find((plan) => plan.limits.monthlySalesMinor === null) ??
        fixed.at(-1)
    );
}

function reais(value: number) {
    return `R$ ${value.toLocaleString('pt-BR')}`;
}

function number(value: number) {
    return value.toLocaleString('pt-BR');
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        maximumFractionDigits: value % 100 === 0 ? 0 : 2,
    }).format(value / 100);
}

function date(value: string | null) {
    return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—';
}
