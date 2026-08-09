'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceArea,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { orderStatusLabels, paymentStatusLabels } from '@/lib/commerce-status';

type Period = '24h' | '7d' | '30d' | '90d' | '12m';
type Tab = 'overview' | 'performance' | 'customers' | 'reports';
type ChartKind = 'metric' | 'line' | 'bar' | 'funnel' | 'table';
type Row = Record<string, unknown>;
type ReportResult = {
    report: string;
    title: string;
    columns: string[];
    rows: Row[];
    meta: { note?: string; trackingEvent?: string };
};
type ReportDefinition = { slug: string; title: string; kind: ChartKind; tab: Tab; wide?: boolean };
type ReportFilters = { q: string; status: string; gateway: string; product: string };

const reports: ReportDefinition[] = [
    ['total-revenue', 'Receita bruta', 'metric', 'overview'],
    ['revenue-change', 'Variação da receita', 'metric', 'overview'],
    ['approved-orders', 'Pedidos aprovados', 'metric', 'overview'],
    ['average-ticket', 'Ticket médio', 'metric', 'overview'],
    ['conversion-rate', 'Conversão geral', 'metric', 'overview'],
    ['mrr', 'MRR', 'metric', 'overview'],
    ['churn-rate', 'Taxa de cancelamento', 'metric', 'overview'],
    ['active-subscriptions', 'Assinaturas ativas', 'metric', 'overview'],
    ['payment-success-rate', 'Sucesso de pagamentos', 'metric', 'overview'],
    ['total-refunded', 'Total reembolsado', 'metric', 'overview'],
    ['recovered-sales', 'Vendas recuperadas', 'metric', 'overview'],
    ['revenue-over-time', 'Receita ao longo do tempo', 'line', 'overview', true],
    ['orders-over-time', 'Pedidos ao longo do tempo', 'line', 'overview'],
    ['average-ticket-over-time', 'Ticket médio ao longo do tempo', 'line', 'overview'],
    ['mrr-over-time', 'MRR ao longo do tempo', 'line', 'overview'],
    ['conversion-over-time', 'Conversão ao longo do tempo', 'line', 'overview'],
    [
        'subscriptions-created-vs-canceled',
        'Assinaturas criadas vs canceladas',
        'line',
        'overview',
        true,
    ],
    ['revenue-by-gateway', 'Receita por gateway', 'bar', 'performance'],
    ['orders-by-gateway', 'Pedidos por gateway', 'bar', 'performance'],
    ['revenue-by-product', 'Top produtos por receita', 'bar', 'performance', true],
    ['orders-by-product', 'Top produtos por pedidos', 'bar', 'performance', true],
    ['orders-by-payment-method', 'Métodos de pagamento', 'bar', 'performance'],
    ['revenue-by-checkout', 'Receita por checkout', 'bar', 'performance'],
    ['checkout-funnel', 'Funil do checkout', 'funnel', 'customers', true],
    ['customers-by-plan', 'Clientes por plano recorrente', 'bar', 'customers'],
    ['checkouts-by-revenue', 'Checkouts por receita', 'bar', 'performance'],
    ['checkouts-by-sales', 'Checkouts por vendas', 'bar', 'performance'],
    ['checkouts-by-conversion', 'Checkouts por conversão', 'bar', 'performance'],
    ['checkout-visits', 'Visitas por checkout', 'bar', 'performance'],
    ['cart-abandonment-rate', 'Taxa de abandono', 'metric', 'customers'],
    ['new-vs-returning-customers', 'Novos vs recorrentes', 'bar', 'customers'],
    ['average-ltv', 'LTV médio', 'metric', 'customers'],
    ['subscriptions-by-status', 'Assinaturas por situação', 'bar', 'customers'],
    ['subscription-renewals', 'Renovações bem-sucedidas vs falhas', 'bar', 'customers'],
    ['orders', 'Pedidos', 'table', 'reports', true],
    ['subscriptions', 'Assinaturas', 'table', 'reports', true],
    ['customers', 'Clientes', 'table', 'reports', true],
    ['refunds', 'Reembolsos', 'table', 'reports', true],
    ['activity', 'Histórico de atividades', 'table', 'reports', true],
    ['failed-payment-attempts', 'Tentativas de pagamento falhas', 'table', 'reports', true],
    ['platform-usage', 'Uso da plataforma', 'bar', 'reports'],
    ['revenue-projection', 'Projeção para 30 dias', 'metric', 'reports'],
].map(([slug, title, kind, tab, wide]) => ({
    slug: String(slug),
    title: String(title),
    kind: kind as ChartKind,
    tab: tab as Tab,
    wide: Boolean(wide),
}));

const tabs: { value: Tab; label: string; description: string }[] = [
    { value: 'overview', label: 'Resumo', description: 'Indicadores e tendências' },
    { value: 'performance', label: 'Desempenho', description: 'Produtos, gateways e checkouts' },
    { value: 'customers', label: 'Clientes', description: 'Funil, recorrência e assinaturas' },
    { value: 'reports', label: 'Relatórios', description: 'Tabelas completas e exportação' },
];

const metricPresentation: Record<
    string,
    {
        layout: string;
        icon: 'card' | 'chart' | 'cart' | 'tag' | 'repeat' | 'users' | 'refund';
        detail: string;
        featured?: boolean;
    }
> = {
    'total-revenue': {
        layout: 'xl:col-span-4',
        icon: 'card',
        detail: 'Volume bruto aprovado',
        featured: true,
    },
    mrr: {
        layout: 'xl:col-span-3',
        icon: 'repeat',
        detail: 'Receita recorrente mensal',
        featured: true,
    },
    'revenue-change': {
        layout: 'xl:col-span-2',
        icon: 'chart',
        detail: 'Contra o período anterior',
    },
    'approved-orders': { layout: 'xl:col-span-3', icon: 'cart', detail: 'Vendas concluídas' },
    'average-ticket': { layout: 'xl:col-span-3', icon: 'tag', detail: 'Média por pedido aprovado' },
    'conversion-rate': {
        layout: 'xl:col-span-3',
        icon: 'chart',
        detail: 'Sessões que viraram venda',
    },
    'active-subscriptions': {
        layout: 'xl:col-span-3',
        icon: 'users',
        detail: 'Ativas e em período de teste',
    },
    'churn-rate': { layout: 'xl:col-span-3', icon: 'repeat', detail: 'Cancelamentos no período' },
    'payment-success-rate': {
        layout: 'xl:col-span-4',
        icon: 'card',
        detail: 'Aprovações sobre tentativas',
    },
    'total-refunded': { layout: 'xl:col-span-4', icon: 'refund', detail: 'Reembolsos concluídos' },
    'recovered-sales': {
        layout: 'xl:col-span-4',
        icon: 'cart',
        detail: 'Compras concluídas após o e-mail',
    },
};

export function AnalyticsDashboard() {
    const [period, setPeriod] = useState<Period>('30d');
    const [tab, setTab] = useState<Tab>('overview');
    const [filters, setFilters] = useState<ReportFilters>({
        q: '',
        status: 'all',
        gateway: 'all',
        product: 'all',
    });
    const visible = useMemo(() => reports.filter((report) => report.tab === tab), [tab]);

    return (
        <div className="space-y-5" data-tour="analytics-dashboard">
            <section
                data-tour="analytics-controls"
                className="glass-panel flex flex-col gap-4 rounded-[24px] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
                <div className="flex min-w-0 gap-1 overflow-x-auto">
                    {tabs.map((item) => (
                        <Button
                            key={item.value}
                            data-tour={`analytics-tab-${item.value}`}
                            aria-pressed={tab === item.value}
                            onClick={() => setTab(item.value)}
                            className="dashboard-period-option shrink-0 rounded-xl px-4 py-2.5 text-left text-muted transition hover:bg-surface-muted/60 hover:text-foreground"
                        >
                            <span className="block text-[12px] font-semibold">{item.label}</span>
                            <span className="hidden text-[10px] opacity-70 sm:block">
                                {item.description}
                            </span>
                        </Button>
                    ))}
                </div>
                <div
                    data-tour="analytics-period"
                    className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-[var(--control-bg)] p-1"
                >
                    {(['24h', '7d', '30d', '90d', '12m'] as const).map((value) => (
                        <Button
                            key={value}
                            aria-pressed={period === value}
                            onClick={() => setPeriod(value)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${period === value ? 'bg-surface text-brand-strong shadow-sm' : 'text-muted hover:text-foreground'}`}
                        >
                            {value.toUpperCase()}
                        </Button>
                    ))}
                </div>
            </section>

            {tab === 'reports' && <ReportFilterBar filters={filters} onApply={setFilters} />}

            {tab === 'overview' && (
                <div
                    data-tour="analytics-metrics"
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12"
                >
                    {visible
                        .filter((report) => report.kind === 'metric')
                        .map((report) => (
                            <MetricCard
                                key={`${report.slug}-${period}`}
                                report={report}
                                period={period}
                            />
                        ))}
                </div>
            )}

            <div className="grid gap-4 xl:grid-cols-12">
                {visible
                    .filter((report) => tab !== 'overview' || report.kind !== 'metric')
                    .map((report) => (
                        <ReportPanel
                            key={`${report.slug}-${period}-${JSON.stringify(filters)}`}
                            report={report}
                            period={period}
                            filters={filters}
                        />
                    ))}
            </div>
        </div>
    );
}

function MetricCard({ report, period }: { report: ReportDefinition; period: Period }) {
    const state = useReport(report.slug, period);
    const row = state.data?.rows[0];
    const presentation = metricPresentation[report.slug] ?? {
        layout: 'xl:col-span-3',
        icon: 'chart' as const,
        detail: 'Período selecionado',
    };
    return (
        <article
            className={`dashboard-stat-card glass-panel group relative flex flex-col overflow-hidden rounded-[22px] p-5 transition hover:-translate-y-0.5 ${presentation.layout} ${presentation.featured ? 'min-h-[184px]' : 'min-h-[158px]'}`}
        >
            <div className="absolute -right-10 -top-10 size-28 rounded-full bg-brand-soft opacity-55 blur-2xl transition group-hover:opacity-80" />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="dashboard-stat-label text-[12px] font-medium text-muted">
                        {report.title}
                    </p>
                    {state.loading ? (
                        <div className="mt-4 h-8 w-28 animate-pulse rounded-lg bg-surface-muted" />
                    ) : state.error ? (
                        <p className="mt-5 text-[12px] text-danger">Não foi possível carregar</p>
                    ) : (
                        <p
                            className={`${presentation.featured ? 'text-[31px]' : 'text-[25px]'} mt-2.5 truncate font-semibold tracking-[-.055em] text-foreground`}
                        >
                            {formatValue(row?.value, row?.unit)}
                        </p>
                    )}
                </div>
                <span className="dashboard-stat-icon grid size-9 shrink-0 place-items-center rounded-full border border-border bg-brand-soft text-brand-strong">
                    <Icon name={presentation.icon} className="size-4" />
                </span>
            </div>
            <div className="relative mt-auto flex items-center justify-between gap-3 pt-7">
                <p className="truncate text-[11px] text-muted">{presentation.detail}</p>
                <Download report={report.slug} period={period} compact />
            </div>
        </article>
    );
}

function ReportPanel({
    report,
    period,
    filters,
}: {
    report: ReportDefinition;
    period: Period;
    filters: ReportFilters;
}) {
    const state = useReport(report.slug, period, filters);
    return (
        <article
            data-tour={report.slug === 'revenue-over-time' ? 'analytics-trend' : undefined}
            className={`glass-panel min-w-0 rounded-[26px] p-5 sm:p-6 ${report.wide ? 'xl:col-span-12' : 'xl:col-span-6'}`}
        >
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold tracking-[-.025em]">{report.title}</h2>
                    <p className="mt-1 text-[11px] text-muted">
                        Atualizado para {period.toUpperCase()}
                    </p>
                </div>
                <Download report={report.slug} period={period} filters={filters} />
            </div>
            {state.loading ? (
                <PanelSkeleton />
            ) : state.error ? (
                <PanelError message={state.error} />
            ) : (
                <ReportVisualization kind={report.kind} result={state.data!} />
            )}
        </article>
    );
}

function ReportVisualization({ kind, result }: { kind: ChartKind; result: ReportResult }) {
    const [selection, setSelection] = useState<ChartSelection | null>(null);
    const selectionAnchor = useRef<number | null>(null);
    const dragging = useRef(false);

    if (result.rows.length === 0) return <EmptyState />;
    if (kind === 'table') return <DataTable result={result} />;
    if (kind === 'funnel') return <FunnelView result={result} />;
    if (kind === 'metric') {
        const row = result.rows[0];
        return (
            <div className="py-5">
                <p className="text-4xl font-semibold tracking-[-.06em]">
                    {formatValue(row?.value, row?.unit)}
                </p>
            </div>
        );
    }
    const dataKeys = result.columns.filter(
        (column) => !['date', 'label', 'position', 'checkoutId'].includes(column),
    );
    const labelKey = result.columns.includes('date') ? 'date' : 'label';
    const singleLine = kind === 'line' && dataKeys.length === 1;
    const Chart = singleLine ? AreaChart : kind === 'line' ? LineChart : BarChart;
    const gradientId = `analytics-${result.report.replace(/[^a-z0-9-]/gi, '')}`;
    const canSelectRange = kind === 'line' && result.rows.length > 1;

    function beginSelection(state: unknown) {
        if (!canSelectRange) return;
        const index = analyticsChartIndex(state, result.rows, labelKey);
        if (index === null) return;
        dragging.current = true;
        selectionAnchor.current = index;
        setSelection({ start: index, end: index });
    }

    function extendSelection(state: unknown) {
        if (!canSelectRange || !dragging.current || selectionAnchor.current === null) return;
        const index = analyticsChartIndex(state, result.rows, labelKey);
        if (index !== null) setSelection({ start: selectionAnchor.current, end: index });
    }

    function finishSelection() {
        dragging.current = false;
        selectionAnchor.current = null;
        setSelection((current) => (current && current.start !== current.end ? current : null));
    }

    const selectedRange = selection
        ? {
              start: Math.min(selection.start, selection.end),
              end: Math.max(selection.start, selection.end),
          }
        : null;
    return (
        <>
            <div
                className="dashboard-chart w-full select-none"
                style={{
                    height:
                        kind === 'bar'
                            ? Math.min(520, Math.max(280, result.rows.length * 40))
                            : 310,
                }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <Chart
                        data={result.rows}
                        layout={kind === 'bar' ? 'vertical' : 'horizontal'}
                        margin={{
                            top: 12,
                            right: 16,
                            left: kind === 'bar' ? 8 : -10,
                            bottom: 4,
                        }}
                        onMouseDown={canSelectRange ? beginSelection : undefined}
                        onMouseMove={canSelectRange ? extendSelection : undefined}
                        onMouseUp={canSelectRange ? finishSelection : undefined}
                        onMouseLeave={canSelectRange ? finishSelection : undefined}
                        style={{
                            outline: 'none',
                            cursor: canSelectRange ? 'crosshair' : 'default',
                        }}
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.24} />
                                <stop offset="72%" stopColor="var(--brand)" stopOpacity={0.06} />
                                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            vertical={kind === 'bar'}
                            horizontal={kind !== 'bar'}
                            stroke="var(--dashboard-chart-grid, #8f8aa8)"
                            strokeOpacity={0.1}
                        />
                        {kind === 'bar' ? (
                            <>
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                        fontSize: 11,
                                        fill: 'var(--dashboard-chart-muted, #89899b)',
                                    }}
                                    tickFormatter={(value: number) =>
                                        compactChartValue(value, result.report)
                                    }
                                />
                                <YAxis
                                    type="category"
                                    dataKey={labelKey}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    width={124}
                                    tick={{
                                        fontSize: 11,
                                        fill: 'var(--dashboard-chart-muted, #89899b)',
                                    }}
                                    tickFormatter={(value: unknown) =>
                                        shortChartLabel(String(value))
                                    }
                                />
                            </>
                        ) : (
                            <>
                                <XAxis
                                    dataKey={labelKey}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={18}
                                    textAnchor="middle"
                                    tick={{
                                        fontSize: 11,
                                        fill: 'var(--dashboard-chart-muted, #89899b)',
                                    }}
                                    dy={10}
                                    tickFormatter={(value: unknown) =>
                                        labelKey === 'date'
                                            ? formatChartDate(String(value), true)
                                            : shortChartLabel(String(value))
                                    }
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    width={66}
                                    tick={{
                                        fontSize: 11,
                                        fill: 'var(--dashboard-chart-muted, #89899b)',
                                    }}
                                    tickFormatter={(value: number) =>
                                        compactChartValue(value, result.report)
                                    }
                                />
                            </>
                        )}
                        <Tooltip
                            cursor={
                                kind === 'line'
                                    ? {
                                          stroke: 'var(--brand)',
                                          strokeOpacity: 0.2,
                                          strokeDasharray: '3 4',
                                      }
                                    : {
                                          fill: 'var(--brand-soft)',
                                          fillOpacity: 0.45,
                                      }
                            }
                            wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                            content={
                                <AnalyticsTooltip
                                    result={result}
                                    labelKey={labelKey}
                                    selection={selectedRange}
                                />
                            }
                        />
                        {kind === 'line' && selectedRange && (
                            <ReferenceArea
                                x1={result.rows[selectedRange.start]?.[labelKey] as string | number}
                                x2={result.rows[selectedRange.end]?.[labelKey] as string | number}
                                fill="var(--brand)"
                                fillOpacity={0.1}
                                stroke="var(--brand)"
                                strokeOpacity={0.28}
                                ifOverflow="extendDomain"
                            />
                        )}
                        {dataKeys.length > 1 && (
                            <Legend
                                formatter={(value: string) => columnLabel(value)}
                                wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }}
                            />
                        )}
                        {dataKeys.map((key, index) =>
                            singleLine ? (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke="var(--brand)"
                                    strokeWidth={2.2}
                                    fill={`url(#${gradientId})`}
                                    dot={false}
                                    animationDuration={850}
                                    activeDot={{
                                        r: 4.5,
                                        fill: 'var(--brand)',
                                        stroke: 'var(--dashboard-chart-surface, #fff)',
                                        strokeWidth: 2,
                                    }}
                                />
                            ) : kind === 'line' ? (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={chartColor(index)}
                                    strokeWidth={2.2}
                                    dot={false}
                                    animationDuration={850}
                                    activeDot={{
                                        r: 4.5,
                                        fill: chartColor(index),
                                        stroke: 'var(--dashboard-chart-surface, #fff)',
                                        strokeWidth: 2,
                                    }}
                                />
                            ) : (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={chartColor(index)}
                                    radius={[2, 7, 7, 2]}
                                    maxBarSize={42}
                                    animationDuration={800}
                                    activeBar={{
                                        fill: chartColor(index),
                                        fillOpacity: 0.76,
                                        stroke: 'none',
                                    }}
                                />
                            ),
                        )}
                    </Chart>
                </ResponsiveContainer>
            </div>
            {result.meta.note && (
                <p className="mt-3 text-[11px] leading-5 text-muted">{result.meta.note}</p>
            )}
            {canSelectRange && (
                <p className="mt-2 text-center text-[11px] text-muted">
                    Clique e arraste no gráfico para selecionar um período
                </p>
            )}
        </>
    );
}

type ChartSelection = { start: number; end: number };

function analyticsChartIndex(state: unknown, rows: Row[], labelKey: string) {
    if (!state || typeof state !== 'object') return null;
    const chartState = state as { activeTooltipIndex?: number | string; activeLabel?: unknown };
    const numericIndex = Number(chartState.activeTooltipIndex);
    if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < rows.length) {
        return numericIndex;
    }
    if (chartState.activeLabel !== undefined) {
        const index = rows.findIndex((row) => row[labelKey] === chartState.activeLabel);
        return index >= 0 ? index : null;
    }
    return null;
}

function AnalyticsTooltip({
    active,
    payload,
    label,
    result,
    labelKey,
    selection,
}: {
    active?: boolean;
    payload?: Array<{
        dataKey?: string | number;
        value?: unknown;
        color?: string;
        fill?: string;
    }>;
    label?: unknown;
    result: ReportResult;
    labelKey: string;
    selection: ChartSelection | null;
}) {
    if (!active || !payload?.length) return null;
    if (selection) {
        const selectedRows = result.rows.slice(selection.start, selection.end + 1);
        const firstLabel = String(selectedRows[0]?.[labelKey] ?? '');
        const lastLabel = String(selectedRows[selectedRows.length - 1]?.[labelKey] ?? '');
        const dataKeys = result.columns.filter(
            (column) => !['date', 'label', 'position', 'checkoutId'].includes(column),
        );
        const useAverage =
            result.report.includes('ticket') ||
            result.report.includes('conversion') ||
            result.report === 'mrr-over-time';
        return (
            <div className="dashboard-chart-tooltip min-w-[210px] rounded-2xl border border-white/85 bg-white/78 px-4 py-3 shadow-[0_18px_50px_rgba(45,39,91,.14)] backdrop-blur-2xl">
                <p className="text-[11px] font-medium uppercase tracking-[.08em] text-muted">
                    Período selecionado
                </p>
                <p className="mt-1 text-[12px] font-semibold text-foreground">
                    {formatChartRange(firstLabel, lastLabel, labelKey)}
                </p>
                <div className="mt-2 space-y-1.5">
                    {dataKeys.map((key, index) => {
                        const total = selectedRows.reduce(
                            (sum, row) => sum + Number(row[key] ?? 0),
                            0,
                        );
                        const value =
                            useAverage && selectedRows.length ? total / selectedRows.length : total;
                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between gap-5 text-[12px]"
                            >
                                <span className="flex items-center gap-2 text-muted">
                                    <span
                                        className="size-1.5 rounded-full"
                                        style={{ background: chartColor(index) }}
                                    />
                                    {dataKeys.length === 1
                                        ? useAverage
                                            ? 'Média'
                                            : 'Total'
                                        : columnLabel(key)}
                                </span>
                                <strong className="font-semibold text-foreground">
                                    {formatChartValue(value, result.report)}
                                </strong>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    const formattedLabel =
        labelKey === 'date'
            ? formatChartDate(String(label ?? ''), false)
            : localizeLabel(String(label ?? ''));
    return (
        <div className="dashboard-chart-tooltip min-w-[170px] rounded-2xl border border-white/85 bg-white/78 px-4 py-3 shadow-[0_18px_50px_rgba(45,39,91,.14)] backdrop-blur-2xl">
            <p className="text-[12px] font-medium text-muted">{formattedLabel}</p>
            <div className="mt-2 space-y-1.5">
                {payload.map((item) => (
                    <div
                        key={String(item.dataKey)}
                        className="flex items-center justify-between gap-5 text-[12px]"
                    >
                        <span className="flex items-center gap-2 text-muted">
                            <span
                                className="size-1.5 rounded-full"
                                style={{ background: item.color ?? item.fill ?? 'var(--brand)' }}
                            />
                            {columnLabel(String(item.dataKey ?? 'value'))}
                        </span>
                        <strong className="font-semibold text-foreground">
                            {formatChartValue(item.value, result.report)}
                        </strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatChartRange(first: string, last: string, labelKey: string) {
    const start = labelKey === 'date' ? formatChartDate(first, false) : localizeLabel(first);
    const end = labelKey === 'date' ? formatChartDate(last, false) : localizeLabel(last);
    return start === end ? start : `${start} – ${end}`;
}

function DataTable({ result }: { result: ReportResult }) {
    return (
        <div>
            <div className="max-h-[520px] overflow-auto rounded-2xl border border-border">
                <table className="w-full min-w-[760px] text-left text-[12px]">
                    <thead className="sticky top-0 z-10 bg-surface-muted text-muted shadow-[0_1px_0_var(--border)]">
                        <tr>
                            {result.columns.map((column) => (
                                <th
                                    key={column}
                                    className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[.08em]"
                                >
                                    {columnLabel(column)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {result.rows.map((row, index) => (
                            <tr
                                key={String(row.id ?? index)}
                                className="border-t border-border transition hover:bg-surface-muted/30"
                            >
                                {result.columns.map((column) => (
                                    <td key={column} className="max-w-[240px] truncate px-3 py-3">
                                        {isStatusColumn(column) ? (
                                            <StatusBadge value={String(row[column] ?? '')} />
                                        ) : (
                                            formatCell(row[column], column)
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-right text-[11px] text-muted">
                {result.rows.length.toLocaleString('pt-BR')} registros nesta visualização · use o
                CSV para o relatório integral
            </p>
        </div>
    );
}

function FunnelView({ result }: { result: ReportResult }) {
    const maximum = Math.max(...result.rows.map((row) => Number(row.value ?? 0)), 1);
    return (
        <div className="space-y-3 py-2">
            {result.rows.map((row, index) => {
                const value = Number(row.value ?? 0);
                const percentage = Math.max((value / maximum) * 100, 4);
                const previousValue = index > 0 ? Number(result.rows[index - 1]?.value ?? 0) : 0;
                const stepRate = previousValue > 0 ? (value / previousValue) * 100 : 100;
                return (
                    <div key={String(row.label ?? index)}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
                            <span className="font-medium text-foreground">
                                {localizeLabel(String(row.label ?? ''))}
                            </span>
                            <span className="text-muted">
                                {value.toLocaleString('pt-BR')}
                                {index > 0 &&
                                    ` · ${stepRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
                            </span>
                        </div>
                        <div className="h-9 overflow-hidden rounded-xl bg-surface-muted/70">
                            <div
                                className="flex h-full items-center rounded-xl bg-brand px-3 text-[11px] font-semibold text-white transition-[width]"
                                style={{ width: `${percentage}%`, opacity: 1 - index * 0.12 }}
                            >
                                {index === 0 ? 'Entrada' : `Etapa ${index + 1}`}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function Download({
    report,
    period,
    compact = false,
    filters,
}: {
    report: string;
    period: Period;
    compact?: boolean;
    filters?: ReportFilters;
}) {
    const search = reportSearch(period, filters, 'csv');
    return (
        <a
            data-tour={report === 'revenue-over-time' ? 'analytics-download' : undefined}
            href={`/api/analytics/${encodeURIComponent(report)}?${search}`}
            className={`${compact ? 'grid size-7' : 'inline-flex h-8 px-3'} shrink-0 place-items-center items-center gap-1.5 rounded-lg border border-border bg-[var(--control-bg)] text-[11px] font-semibold text-muted transition hover:border-brand/25 hover:text-brand-strong`}
            title="Baixar CSV"
        >
            <Icon name="download" className="size-3" />
            {!compact && 'CSV'}
        </a>
    );
}

function useReport(report: string, period: Period, filters?: ReportFilters) {
    const [data, setData] = useState<ReportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const queryString = reportSearch(period, filters);
    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/analytics/${encodeURIComponent(report)}?${queryString}`, {
            signal: controller.signal,
        })
            .then(async (response) => {
                const payload = (await response.json()) as { data?: ReportResult; detail?: string };
                if (!response.ok || !payload.data)
                    throw new Error(payload.detail ?? 'Falha ao carregar relatório.');
                setData(payload.data);
            })
            .catch((reason: unknown) => {
                if (reason instanceof DOMException && reason.name === 'AbortError') return;
                setError(reason instanceof Error ? reason.message : 'Falha ao carregar relatório.');
            });
        return () => controller.abort();
    }, [report, queryString]);
    return { data, error, loading: data === null && error === null };
}

function ReportFilterBar({
    filters,
    onApply,
}: {
    filters: ReportFilters;
    onApply: (filters: ReportFilters) => void;
}) {
    const [draft, setDraft] = useState(filters);
    return (
        <form
            className="glass-panel grid gap-3 rounded-[22px] p-4 md:grid-cols-[minmax(220px,1fr)_150px_170px_170px_auto]"
            onSubmit={(event) => {
                event.preventDefault();
                onApply({
                    q: draft.q.trim(),
                    status: normalizeStatusFilter(draft.status),
                    gateway: draft.gateway.trim() || 'all',
                    product: draft.product.trim() || 'all',
                });
            }}
        >
            <FilterInput
                label="Buscar"
                placeholder="ID, cliente, e-mail ou produto"
                value={draft.q}
                onChange={(q) => setDraft((current) => ({ ...current, q }))}
            />
            <FilterInput
                label="Situação"
                placeholder="Todos, pago, ativo..."
                value={draft.status === 'all' ? '' : draft.status}
                onChange={(status) => setDraft((current) => ({ ...current, status }))}
            />
            <FilterInput
                label="Gateway"
                placeholder="Todos ou ID público"
                value={draft.gateway === 'all' ? '' : draft.gateway}
                onChange={(gateway) => setDraft((current) => ({ ...current, gateway }))}
            />
            <FilterInput
                label="Produto"
                placeholder="Todos ou ID público"
                value={draft.product === 'all' ? '' : draft.product}
                onChange={(product) => setDraft((current) => ({ ...current, product }))}
            />
            <Button variant="primary" type="submit" className="self-end">
                Aplicar
            </Button>
        </form>
    );
}

function FilterInput({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
}) {
    return (
        <label>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-muted">
                {label}
            </span>
            <input
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3 text-[12px] outline-none transition placeholder:text-muted/60 focus:border-brand/35"
            />
        </label>
    );
}

function reportSearch(period: Period, filters?: ReportFilters, format = 'json') {
    const search = new URLSearchParams({ period, format });
    if (filters) {
        for (const [key, value] of Object.entries(filters)) search.set(key, value);
    }
    return search.toString();
}

function normalizeStatusFilter(status: string) {
    const normalized = status.trim().toLocaleLowerCase('pt-BR');
    const aliases: Record<string, string> = {
        pago: 'paid',
        aprovado: 'approved',
        ativo: 'active',
        ativa: 'active',
        cancelado: 'canceled',
        cancelada: 'canceled',
        pendente: 'pending',
        falhou: 'failed',
        reembolsado: 'refunded',
        reembolsada: 'refunded',
    };
    return aliases[normalized] ?? (normalized || 'all');
}

function formatValue(value: unknown, unit: unknown) {
    const number = Number(value ?? 0);
    if (unit === 'currency')
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            number / 100,
        );
    if (unit === 'percent')
        return `${number.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    return number.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function formatCell(value: unknown, column: string) {
    if (value === null || value === undefined || value === '') return '—';
    if (['value', 'totalSpent', 'amountMinor'].includes(column))
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            Number(value) / 100,
        );
    const normalizedColumn = column.toLowerCase();
    if (
        normalizedColumn.includes('date') ||
        normalizedColumn.endsWith('at') ||
        normalizedColumn.includes('cycle') ||
        normalizedColumn.includes('purchase')
    ) {
        const parsed = Date.parse(String(value));
        if (!Number.isNaN(parsed)) {
            const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
            return new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                ...(dateOnly ? { timeZone: 'UTC' } : { timeStyle: 'short' }),
            }).format(parsed);
        }
    }
    return String(value);
}

function columnLabel(column: string) {
    const labels: Record<string, string> = {
        id: 'ID',
        name: 'Nome',
        date: 'Data',
        customer: 'Cliente',
        email: 'E-mail',
        products: 'Produtos',
        product: 'Produto',
        value: 'Valor',
        currency: 'Moeda',
        status: 'Situação',
        gateway: 'Gateway',
        nextCycle: 'Próximo ciclo',
        createdAt: 'Criada em',
        totalSpent: 'Total gasto',
        lastPurchase: 'Última compra',
        orders: 'Pedidos',
        source: 'Origem',
        reason: 'Motivo',
        entityType: 'Tipo',
        reference: 'Referência',
        fromStatus: 'Situação anterior',
        toStatus: 'Nova situação',
        paymentId: 'Pagamento',
        intentId: 'Intenção',
        failureCode: 'Código da falha',
        failureMessage: 'Detalhes da falha',
        currentValue: 'Valor atual',
        previousValue: 'Valor anterior',
        limit: 'Limite',
        percent: 'Uso',
        sessions: 'Sessões',
        created: 'Criadas',
        canceled: 'Canceladas',
    };
    return (
        labels[column] ??
        column.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
    );
}
function chartColor(index: number) {
    return ['var(--brand)', 'var(--success)', 'var(--warning)', 'var(--danger)'][index % 4];
}

function shortChartLabel(value: string) {
    const localized = localizeLabel(value);
    return localized.length > 18 ? `${localized.slice(0, 17)}…` : localized;
}

function formatChartDate(value: string, compact: boolean) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(
        'pt-BR',
        compact
            ? { day: '2-digit', month: '2-digit', timeZone: 'UTC' }
            : { dateStyle: 'short', timeZone: 'UTC' },
    ).format(date);
}

function formatChartValue(value: unknown, report: string) {
    const number = Number(value ?? 0);
    if (report.includes('revenue') || report.includes('ticket') || report === 'mrr-over-time')
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(number / 100);
    if (report.includes('conversion'))
        return `${number.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    return number.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function compactChartValue(value: number, report: string) {
    if (report.includes('revenue') || report.includes('ticket') || report === 'mrr-over-time') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value / 100);
    }
    if (report.includes('conversion')) {
        return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    }
    return new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

function isStatusColumn(column: string) {
    return ['status', 'fromStatus', 'toStatus', 'source', 'entityType'].includes(column);
}

function StatusBadge({ value }: { value: string }) {
    const positive = new Set(['approved', 'paid', 'active', 'trialing', 'succeeded', 'completed']);
    const negative = new Set(['failed', 'rejected', 'canceled', 'expired', 'refunded', 'unpaid']);
    const warning = new Set([
        'pending',
        'processing',
        'past_due',
        'awaiting_payment',
        'unknown',
        'requires_action',
    ]);
    const tone = positive.has(value)
        ? 'bg-success/10 text-success'
        : negative.has(value)
          ? 'bg-danger/10 text-danger'
          : warning.has(value)
            ? 'bg-warning/10 text-warning'
            : 'bg-surface-muted text-muted';
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}>
            {localizeLabel(value)}
        </span>
    );
}

function localizeLabel(value: string) {
    const labels: Record<string, string> = {
        active: 'Ativa',
        trialing: 'Em teste',
        past_due: 'Pagamento pendente',
        unpaid: 'Não paga',
        paused: 'Pausada',
        cancel_scheduled: 'Cancelamento agendado',
        incomplete: 'Incompleta',
        incomplete_expired: 'Incompleta expirada',
        canceled: 'Cancelada',
        cancelled: 'Cancelada',
        expired: 'Expirada',
        pending: 'Pendente',
        processing: 'Processando',
        approved: 'Aprovada',
        authorized: 'Autorizada',
        captured: 'Capturada',
        succeeded: 'Concluída',
        completed: 'Concluída',
        failed: 'Falhou',
        rejected: 'Recusada',
        refunded: 'Reembolsada',
        partially_refunded: 'Parcialmente reembolsada',
        disputed: 'Em disputa',
        unknown: 'Confirmação pendente',
        requires_action: 'Ação necessária',
        awaiting_payment: 'Aguardando pagamento',
        abandoned: 'Abandonada',
        open: 'Aberta',
        placed: 'Realizada',
        draft: 'Rascunho',
        voided: 'Cancelada',
        payment: 'Pagamento',
        checkout: 'Checkout',
        gateway_webhook: 'Webhook do gateway',
        gateway_poll: 'Consulta ao gateway',
        customer_webhook: 'Webhook do cliente',
        provider_create: 'Criação no provedor',
        manual_action: 'Ação manual',
        system_reconciliation: 'Reconciliação automática',
        api_request: 'Requisição da API',
        outbox: 'Fila de eventos',
        bullmq: 'Fila de processamento',
        checkout_session: 'Sessão de checkout',
        card: 'Cartão',
        credit_card: 'Cartão de crédito',
        debit_card: 'Cartão de débito',
        bank_slip: 'Boleto',
        bank_transfer: 'Transferência bancária',
        pix: 'PIX',
        boleto: 'Boleto',
        'commerce.orders': 'Pedidos processados',
        'Bem-sucedidas': 'Bem-sucedidas',
        Falhas: 'Falhas',
        Novos: 'Novos',
        Recorrentes: 'Recorrentes',
    };
    if (labels[value]) return labels[value];
    if (paymentStatusLabels[value]) return paymentStatusLabels[value];
    if (orderStatusLabels[value]) return orderStatusLabels[value];
    return value;
}
function PanelSkeleton() {
    return <div className="h-[280px] animate-pulse rounded-2xl bg-surface-muted/60" />;
}
function PanelError({ message }: { message: string }) {
    return (
        <div className="grid h-[180px] place-items-center rounded-2xl border border-danger/15 bg-danger/5 px-5 text-center text-[11px] text-danger">
            {message}
        </div>
    );
}
function EmptyState() {
    return (
        <div className="grid h-[180px] place-items-center rounded-2xl border border-dashed border-border text-center">
            <div>
                <Icon name="chart" className="mx-auto size-5 text-muted" />
                <p className="mt-2 text-[11px] font-semibold">Sem dados neste período</p>
                <p className="mt-1 text-[10px] text-muted">
                    Altere o período para ampliar a análise.
                </p>
            </div>
        </div>
    );
}
