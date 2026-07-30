import Link from 'next/link';

import {
    GatewayDonut,
    RevenueAreaChart,
    type GatewayDatum,
} from '@/components/dashboard/dashboard-charts';
import { ButtonLink } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { apiFetch } from '@/lib/api/server';
import type {
    Checkout,
    CurrentUser,
    GatewayConnection,
    Payment,
    Product,
    Refund,
    Subscription,
} from '@/lib/api/types';

const approvedStatuses = new Set(['approved', 'paid', 'captured', 'succeeded']);

export default async function DashboardPage() {
    const [user, payments, subscriptions, gateways, products, checkouts, refunds] =
        await Promise.all([
            apiFetch<CurrentUser>('/api/v1/auth/me'),
            apiFetch<Payment[]>('/api/v1/payments'),
            apiFetch<Subscription[]>('/api/v1/subscriptions'),
            apiFetch<GatewayConnection[]>('/api/v1/gateway-connections'),
            apiFetch<Product[]>('/api/v1/products?limit=100'),
            apiFetch<Checkout[]>('/api/v1/checkouts'),
            apiFetch<Refund[]>('/api/v1/refunds'),
        ]);

    const approved = payments.filter((payment) => approvedStatuses.has(payment.status));
    const revenue = approved.reduce((sum, payment) => sum + capturedValue(payment), 0);
    const activeSubscriptions = subscriptions.filter((item) =>
        ['active', 'trialing'].includes(item.status),
    ).length;
    const currency = payments[0]?.currency ?? 'BRL';
    const timeline = revenueTimeline(approved, 365);
    const hourlyTimeline = revenueHourlyTimeline(approved);
    const recentTimeline = timeline.slice(-12);
    const salesTimeline = countTimeline(approved, 12);
    const ticketTimeline = recentTimeline.map((point, index) =>
        salesTimeline[index] ? Math.round(point.value / salesTimeline[index]) : 0,
    );
    const approvalTimeline = paymentApprovalTimeline(payments, 12);
    const currentPeriod = periodMetrics(payments, 0, 30);
    const previousPeriod = periodMetrics(payments, 30, 30);
    const hasGateway = gateways.some((item) => item.status === 'active');
    const hasProduct = products.some((item) => item.status === 'active');
    const setupDone = Number(hasGateway) + Number(hasProduct) + 1;
    const gatewayData = gatewayBreakdown(approved, gateways);
    const activities = recentActivities({
        payments,
        subscriptions,
        refunds,
        products,
        checkouts,
    });

    return (
        <div className="dashboard-home">
            <PageHeader
                hero
                eyebrow={`Bem-vindo de volta, ${firstName(user.name)}`}
                title={
                    <>
                        Suas vendas em{' '}
                        <span className="font-serif font-normal italic text-brand">órbita.</span>
                    </>
                }
                description="Acompanhe e gerencie sua operação de pagamentos."
                actions={
                    <ButtonLink
                        href="/checkouts"
                        className="h-12 gap-3"
                    >
                        <Icon name="plus" className="size-4" />
                        Criar checkout
                        <Icon
                            name="arrow-right"
                            className="size-3.5 opacity-70 transition-transform group-hover:translate-x-0.5"
                        />
                    </ButtonLink>
                }
            />

            <section
                aria-label="Indicadores da operação"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                <StatCard
                    label="Receita bruta"
                    value={money(revenue, currency)}
                    detail="Vendas aprovadas"
                    icon="card"
                    href="/payments"
                    sparkline={valuesWithActivity(recentTimeline.map((point) => point.value))}
                    change={variation(currentPeriod.revenue, previousPeriod.revenue)}
                />
                <StatCard
                    label="Pedidos"
                    value={String(approved.length)}
                    detail={`${payments.length} tentativas processadas`}
                    icon="cart"
                    href="/payments"
                    tone="success"
                    sparkline={valuesWithActivity(salesTimeline)}
                    chartType="bar"
                    change={variation(currentPeriod.approved, previousPeriod.approved)}
                />
                <StatCard
                    label="Taxa de conversão"
                    value={percentage(
                        payments.length ? (approved.length / payments.length) * 100 : 0,
                    )}
                    detail="Tentativas convertidas em venda"
                    icon="chart"
                    href="/payments"
                    sparkline={valuesWithActivity(approvalTimeline)}
                    change={difference(currentPeriod.approvalRate, previousPeriod.approvalRate)}
                />
                <StatCard
                    label="Ticket médio"
                    value={money(
                        approved.length ? Math.round(revenue / approved.length) : 0,
                        currency,
                    )}
                    detail={`${activeSubscriptions} assinaturas ativas`}
                    icon="tag"
                    href="/subscriptions"
                    tone="warning"
                    sparkline={valuesWithActivity(ticketTimeline)}
                    change={variation(currentPeriod.ticket, previousPeriod.ticket)}
                />
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.95fr)]">
                <article className="glass-panel min-w-0 rounded-[28px] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold tracking-[-0.02em]">
                                    Receita ao longo do tempo
                                </h2>
                                <span className="grid size-4 place-items-center rounded-full border border-brand/15 text-[12px] font-semibold text-brand">
                                    i
                                </span>
                            </div>
                            <p className="mt-1 text-[12px] text-muted">
                                Valores aprovados e capturados
                            </p>
                        </div>
                        <p className="hidden text-right sm:block">
                            <span className="block text-[12px] uppercase tracking-[0.1em] text-muted">
                                Últimos 30 dias
                            </span>
                            <span className="mt-1 block text-sm font-semibold">
                                {money(currentPeriod.revenue, currency)}
                            </span>
                        </p>
                    </div>
                    <RevenueAreaChart
                        points={timeline}
                        hourlyPoints={hourlyTimeline}
                        currency={currency}
                    />
                </article>

                {setupDone < 3 ? (
                    <OnboardingCard
                        setupDone={setupDone}
                        hasGateway={hasGateway}
                        hasProduct={hasProduct}
                    />
                ) : (
                    <article className="glass-panel flex min-w-0 flex-col rounded-[28px] p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold tracking-[-0.02em]">
                                        Receita por gateway
                                    </h2>
                                    <span className="grid size-4 place-items-center rounded-full border border-brand/15 text-[12px] font-semibold text-brand">
                                        i
                                    </span>
                                </div>
                                <p className="mt-1 text-[12px] text-muted">
                                    Distribuição das vendas aprovadas
                                </p>
                            </div>
                            <Link
                                href="/gateways"
                                className="dashboard-details-button rounded-xl border border-white/80 bg-white/40 px-3 py-2 text-[12px] font-semibold text-muted transition hover:text-brand-strong"
                            >
                                Ver detalhes
                            </Link>
                        </div>
                        <GatewayDonut data={gatewayData} currency={currency} />
                    </article>
                )}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-2">
                <RecentCheckouts checkouts={checkouts.slice(0, 4)} />
                <RecentActivities activities={activities.slice(0, 5)} />
            </section>
        </div>
    );
}

function OnboardingCard({
    setupDone,
    hasGateway,
    hasProduct,
}: {
    setupDone: number;
    hasGateway: boolean;
    hasProduct: boolean;
}) {
    const nextAction = !hasGateway
        ? { href: '/gateways', label: 'Conectar gateway' }
        : { href: '/products', label: 'Cadastrar produto' };
    return (
        <article className="glass-panel relative overflow-hidden rounded-[28px] p-5 sm:p-6">
            <div className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-brand-strong/70">
                            Configuração inicial
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                            Prepare sua operação
                        </h2>
                    </div>
                    <span className="rounded-full border border-white/80 bg-white/55 px-2.5 py-1 text-[13px] font-semibold text-brand-strong">
                        {setupDone}/3
                    </span>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-muted">
                    Conclua os passos essenciais para começar a receber pagamentos.
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-brand/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-strong transition-all duration-700"
                        style={{ width: `${(setupDone / 3) * 100}%` }}
                    />
                </div>
                <ol className="mt-5 space-y-2">
                    <SetupStep done label="Conta criada" />
                    <SetupStep done={hasGateway} label="Gateway conectado" href="/gateways" />
                    <SetupStep done={hasProduct} label="Produto cadastrado" href="/products" />
                </ol>
                <ButtonLink
                    href={nextAction.href}
                    className="mt-5 w-full rounded-full px-4"
                >
                    {nextAction.label}
                    <Icon name="arrow-right" className="size-3.5" />
                </ButtonLink>
            </div>
        </article>
    );
}

function SetupStep({ done, label, href }: { done: boolean; label: string; href?: string }) {
    const content = (
        <>
            <span
                className={`grid size-7 place-items-center rounded-full border ${done ? 'border-brand bg-brand text-white' : 'border-brand/20 bg-white/40 text-brand/45'}`}
            >
                {done ? (
                    <Icon name="check" className="size-3.5" />
                ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                )}
            </span>
            <span
                className={`text-[13px] font-semibold ${done ? 'text-muted' : 'text-foreground'}`}
            >
                {label}
            </span>
            {href && !done && (
                <Icon name="arrow-right" className="ml-auto size-3.5 text-brand/60" />
            )}
        </>
    );
    return (
        <li>
            {href && !done ? (
                <Link
                    href={href}
                    className="dashboard-setup-link flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/45"
                >
                    {content}
                </Link>
            ) : (
                <div className="flex items-center gap-3 p-2">{content}</div>
            )}
        </li>
    );
}

function RecentCheckouts({ checkouts }: { checkouts: Checkout[] }) {
    return (
        <article className="glass-panel overflow-hidden rounded-[28px]">
            <SectionHeader
                title="Checkouts recentes"
                description="Últimas experiências criadas"
                href="/checkouts"
            />
            {checkouts.length ? (
                <div className="dashboard-list px-3 pb-3 sm:px-4">
                    {checkouts.map((checkout) => (
                        <Link
                            key={checkout.id}
                            href={`/checkouts/${checkout.id}/builder`}
                            className="dashboard-list-row group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-white/38 sm:grid-cols-[minmax(0,1fr)_70px_80px_auto]"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-[12px] font-semibold text-foreground">
                                    {checkout.name}
                                </span>
                                <span className="mt-1 block truncate text-[12px] text-muted">
                                    /checkout/{checkout.slug}
                                </span>
                            </span>
                            <span className="hidden text-[12px] text-muted sm:block">
                                — visitas
                            </span>
                            <span className="hidden text-[12px] text-muted sm:block">
                                — conversão
                            </span>
                            <span className="flex items-center gap-2">
                                <CheckoutStatus status={checkout.status} />
                                <Icon name="dots" className="size-3.5 text-muted" />
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyList
                    icon="layout"
                    title="Nenhum checkout criado"
                    description="Seus checkouts aparecerão aqui."
                />
            )}
        </article>
    );
}

type Activity = {
    id: string;
    icon: IconName;
    tone: string;
    title: string;
    detail: string;
    date: string;
};

function RecentActivities({ activities }: { activities: Activity[] }) {
    return (
        <article className="glass-panel overflow-hidden rounded-[28px]">
            <SectionHeader
                title="Atividades recentes"
                description="Movimentações da sua operação"
                href="/payments"
            />
            {activities.length ? (
                <div className="dashboard-list px-3 pb-3 sm:px-4">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="dashboard-list-row flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-white/38"
                        >
                            <span
                                className={`dashboard-activity-icon grid size-8 shrink-0 place-items-center rounded-full ${activity.tone}`}
                            >
                                <Icon name={activity.icon} className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-semibold text-foreground">
                                    {activity.title}
                                </span>
                                <span className="mt-1 block truncate text-[12px] text-muted">
                                    {activity.detail}
                                </span>
                            </span>
                            <time
                                dateTime={activity.date}
                                className="shrink-0 text-[12px] text-muted"
                            >
                                {relativeTime(activity.date)}
                            </time>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyList
                    icon="clock"
                    title="Nenhuma atividade recente"
                    description="As movimentações aparecerão aqui."
                />
            )}
        </article>
    );
}

function SectionHeader({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
            <div>
                <h2 className="text-sm font-semibold tracking-[-0.02em]">{title}</h2>
                <p className="mt-1 text-[12px] text-muted">{description}</p>
            </div>
            <Link
                href={href}
                className="text-[12px] font-semibold text-brand-strong transition hover:opacity-65"
            >
                Ver todos
            </Link>
        </div>
    );
}

function EmptyList({
    icon,
    title,
    description,
}: {
    icon: IconName;
    title: string;
    description: string;
}) {
    return (
        <div className="px-5 py-10 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-brand-soft/70 text-brand">
                <Icon name={icon} className="size-4" />
            </span>
            <p className="mt-3 text-[13px] font-semibold">{title}</p>
            <p className="mt-1 text-[12px] text-muted">{description}</p>
        </div>
    );
}

function CheckoutStatus({ status }: { status: Checkout['status'] }) {
    const active = status === 'published';
    return (
        <span
            className={`dashboard-checkout-status rounded-full px-2.5 py-1 text-[12px] font-semibold ${active ? 'bg-[#e7f7f0] text-success' : 'bg-white/60 text-muted'}`}
        >
            {active
                ? 'Ativo'
                : status === 'draft'
                  ? 'Rascunho'
                  : status === 'paused'
                    ? 'Pausado'
                    : 'Arquivado'}
        </span>
    );
}

function gatewayBreakdown(payments: Payment[], gateways: GatewayConnection[]): GatewayDatum[] {
    const byId = new Map(gateways.map((gateway) => [gateway.id, gateway]));
    const totals = new Map<string, number>();
    for (const payment of payments)
        totals.set(
            payment.gatewayConnectionId,
            (totals.get(payment.gatewayConnectionId) ?? 0) + capturedValue(payment),
        );
    return [...totals.entries()]
        .map(([id, value]) => {
            const gateway = byId.get(id);
            return {
                id,
                value,
                name: gateway?.name ?? 'Outros',
                provider: gateway?.provider ?? 'other',
            };
        })
        .sort((a, b) => b.value - a.value);
}

function recentActivities(input: {
    payments: Payment[];
    subscriptions: Subscription[];
    refunds: Refund[];
    products: Product[];
    checkouts: Checkout[];
}): Activity[] {
    const items: Activity[] = [];
    for (const payment of input.payments.filter((item) => approvedStatuses.has(item.status)))
        items.push({
            id: `payment-${payment.id}`,
            icon: 'check',
            tone: 'bg-[#e8f7f1] text-success',
            title: 'Pagamento aprovado',
            detail: `Pedido ${payment.orderId ?? payment.id}`,
            date: payment.approvedAt ?? payment.createdAt,
        });
    for (const subscription of input.subscriptions)
        items.push({
            id: `subscription-${subscription.id}`,
            icon: 'repeat',
            tone: 'bg-brand-soft text-brand',
            title: 'Nova assinatura criada',
            detail: `Assinatura ${subscription.id}`,
            date: subscription.createdAt,
        });
    for (const refund of input.refunds.filter((item) =>
        ['completed', 'succeeded', 'approved'].includes(item.status),
    ))
        items.push({
            id: `refund-${refund.id}`,
            icon: 'refund',
            tone: 'bg-[#fff3e5] text-warning',
            title: 'Reembolso processado',
            detail: `Pagamento ${refund.paymentId}`,
            date: refund.completedAt ?? refund.createdAt,
        });
    for (const checkout of input.checkouts)
        items.push({
            id: `checkout-${checkout.id}`,
            icon: 'layout',
            tone: 'bg-brand-soft text-brand',
            title: checkout.status === 'published' ? 'Checkout publicado' : 'Checkout atualizado',
            detail: checkout.name,
            date: checkout.updatedAt,
        });
    for (const product of input.products)
        items.push({
            id: `product-${product.id}`,
            icon: 'edit',
            tone: 'bg-brand-soft text-brand',
            title: 'Produto atualizado',
            detail: product.name,
            date: product.updatedAt,
        });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function periodMetrics(payments: Payment[], offsetDays: number, days: number) {
    const end = new Date();
    end.setDate(end.getDate() - offsetDays);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    const selected = payments.filter((item) => {
        const date = new Date(item.createdAt);
        return date >= start && date < end;
    });
    const approved = selected.filter((item) => approvedStatuses.has(item.status));
    const revenue = approved.reduce((sum, item) => sum + capturedValue(item), 0);
    return {
        revenue,
        approved: approved.length,
        approvalRate: selected.length ? (approved.length / selected.length) * 100 : 0,
        ticket: approved.length ? revenue / approved.length : 0,
    };
}

function revenueTimeline(payments: Payment[], length: number) {
    const days = baseDays(length);
    const byDate = new Map(days.map((day) => [day.key, day]));
    for (const payment of payments) {
        const bucket = byDate.get(localDateKey(new Date(payment.approvedAt ?? payment.createdAt)));
        if (bucket) bucket.value += capturedValue(payment);
    }
    return days.map(({ key, ...day }) => ({ ...day, date: key }));
}

function revenueHourlyTimeline(payments: Payment[]) {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const hours = Array.from({ length: 24 }, (_, index) => {
        const date = new Date(now);
        date.setHours(date.getHours() - (23 - index));
        return {
            key: date.toISOString().slice(0, 13),
            date: date.toISOString(),
            label: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit' }).format(date),
            value: 0,
        };
    });
    const byHour = new Map(hours.map((hour) => [hour.key, hour]));
    for (const payment of payments) {
        const date = new Date(payment.approvedAt ?? payment.createdAt);
        const bucket = byHour.get(date.toISOString().slice(0, 13));
        if (bucket) bucket.value += capturedValue(payment);
    }
    return hours.map((hour) => ({ date: hour.date, label: hour.label, value: hour.value }));
}

function countTimeline(payments: Payment[], length: number) {
    const days = baseDays(length).map((day) => ({ ...day, count: 0 }));
    const byDate = new Map(days.map((day) => [day.key, day]));
    for (const payment of payments) {
        const bucket = byDate.get(localDateKey(new Date(payment.approvedAt ?? payment.createdAt)));
        if (bucket) bucket.count += 1;
    }
    return days.map((day) => day.count);
}

function paymentApprovalTimeline(payments: Payment[], length: number) {
    const all = countTimeline(payments, length);
    const approved = countTimeline(
        payments.filter((item) => approvedStatuses.has(item.status)),
        length,
    );
    return all.map((total, index) => (total ? Math.round((approved[index] / total) * 100) : 0));
}

function baseDays(length: number) {
    return Array.from({ length }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (length - 1 - index));
        return {
            key: localDateKey(date),
            label: new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: 'short',
            }).format(date),
            value: 0,
        };
    });
}

function capturedValue(payment: Payment) {
    return payment.capturedMinor || payment.amountMinor;
}

function variation(current: number, previous: number) {
    return previous ? ((current - previous) / previous) * 100 : current ? 100 : null;
}

function difference(current: number, previous: number) {
    return current || previous ? current - previous : null;
}

function valuesWithActivity(values: number[]) {
    return values.some((value) => value > 0) ? values : undefined;
}

function percentage(value: number) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}%`;
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value / 100);
}

function firstName(name: string) {
    return name.trim().split(/\s+/)[0] || 'por aí';
}

function localDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function relativeTime(value: string) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return 'agora';
    if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} h`;
    return `há ${Math.floor(seconds / 86400)} d`;
}
