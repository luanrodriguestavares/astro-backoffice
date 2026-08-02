'use client';

import { Button } from '@/components/ui/button';

import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type RevenuePoint = { date: string; label: string; value: number };

type Period = '24H' | '7D' | '30D' | '90D' | '12M';

const periods: Period[] = ['24H', '7D', '30D', '90D', '12M'];

export function RevenueAreaChart({
    points,
    hourlyPoints,
    currency,
}: {
    points: RevenuePoint[];
    hourlyPoints: RevenuePoint[];
    currency: string;
}) {
    const [period, setPeriod] = useState<Period>('30D');
    const data = useMemo(
        () => (period === '24H' ? hourlyPoints : periodData(points, period)),
        [hourlyPoints, period, points],
    );
    const empty = data.every((point) => point.value === 0);

    return (
        <div className="mt-5">
            <div className="mb-4 flex justify-end">
                <div className="dashboard-period-picker inline-flex rounded-xl border border-white/75 bg-white/38 p-1 shadow-[inset_0_1px_0_white] backdrop-blur-xl">
                    {periods.map((option) => (
                        <Button
                            key={option}
                            type="button"
                            aria-pressed={period === option}
                            onClick={() => setPeriod(option)}
                            className="dashboard-period-option rounded-lg px-3 py-1.5 text-[12px] font-semibold text-muted transition-all hover:text-foreground"
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="dashboard-chart relative h-[260px] w-full sm:h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.24} />
                                <stop offset="72%" stopColor="var(--brand)" stopOpacity={0.06} />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            vertical={false}
                            stroke="var(--dashboard-chart-grid, #8f8aa8)"
                            strokeOpacity={0.1}
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            minTickGap={28}
                            tick={{ fill: 'var(--dashboard-chart-muted, #89899b)', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            width={58}
                            tick={{ fill: 'var(--dashboard-chart-muted, #89899b)', fontSize: 10 }}
                            tickFormatter={(value: number) => compactMoney(value, currency)}
                        />
                        <Tooltip
                            cursor={{
                                stroke: 'var(--brand)',
                                strokeOpacity: 0.2,
                                strokeDasharray: '3 4',
                            }}
                            wrapperStyle={{ zIndex: 30 }}
                            content={<RevenueTooltip currency={currency} data={data} />}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--brand)"
                            strokeWidth={2.2}
                            fill="url(#revenueArea)"
                            animationDuration={850}
                            activeDot={{
                                r: 4.5,
                                fill: 'var(--brand)',
                                stroke: 'var(--dashboard-chart-surface, #fff)',
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
                {empty && (
                    <div className="pointer-events-none absolute bottom-6 left-10 right-2 top-0 z-10 grid place-items-center">
                        <div className="dashboard-chart-empty rounded-2xl border border-white/80 bg-white/62 px-5 py-3 text-center shadow-sm backdrop-blur-xl">
                            <p className="text-[13px] font-semibold text-foreground">
                                Sem receita no período
                            </p>
                            <p className="mt-1 text-[12px] text-muted">
                                As vendas aprovadas aparecerão aqui.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function RevenueTooltip({
    active,
    payload,
    label,
    currency,
    data,
}: {
    active?: boolean;
    payload?: Array<{ value?: number; payload?: RevenuePoint }>;
    label?: string;
    currency: string;
    data: RevenuePoint[];
}) {
    if (!active || !payload?.[0]) return null;
    const value = Number(payload[0].value ?? 0);
    const index = data.findIndex((point) => point.label === label);
    const previous = index > 0 ? data[index - 1].value : 0;
    const variation = previous ? ((value - previous) / previous) * 100 : null;
    return (
        <div className="dashboard-chart-tooltip rounded-2xl border border-white/85 bg-white/78 px-4 py-3 shadow-[0_18px_50px_rgba(45,39,91,.14)] backdrop-blur-2xl">
            <p className="text-[12px] font-medium text-muted">
                {formatChartDate(payload[0].payload?.date ?? label)}
            </p>
            <p className="mt-1 text-sm font-bold tracking-[-0.02em] text-foreground">
                {money(value, currency)}
            </p>
            {variation !== null && (
                <p
                    className={`mt-1 text-[12px] font-semibold ${variation >= 0 ? 'text-success' : 'text-danger'}`}
                >
                    {variation >= 0 ? '↗' : '↘'} {Math.abs(variation).toFixed(1)}% vs. período
                    anterior
                </p>
            )}
        </div>
    );
}

function formatChartDate(value: string | undefined) {
    if (!value) return '—';
    const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

export type GatewayDatum = {
    id: string;
    name: string;
    provider: string;
    value: number;
};

const gatewayColors = ['var(--brand)', 'var(--brand-strong)', '#67b9aa', '#9ba4b9', '#c8ccd7'];

export function GatewayDonut({ data, currency }: { data: GatewayDatum[]; currency: string }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const chartData = data.length
        ? data
        : [{ id: 'empty', name: 'Sem vendas', provider: 'other', value: 1 }];

    return (
        <div className="mt-4 grid min-h-[280px] flex-1 content-center items-center gap-5 sm:grid-cols-[minmax(180px,.95fr)_minmax(180px,1.05fr)]">
            <div className="dashboard-chart relative z-10 mx-auto h-[230px] w-full max-w-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="64%"
                            outerRadius="88%"
                            paddingAngle={data.length > 1 ? 2 : 0}
                            stroke="var(--dashboard-chart-surface, rgba(255,255,255,.75))"
                            strokeWidth={2}
                            animationDuration={900}
                        >
                            {chartData.map((item, index) => (
                                <Cell
                                    key={item.id}
                                    fill={
                                        data.length
                                            ? gatewayColors[index % gatewayColors.length]
                                            : 'var(--dashboard-chart-empty, #e7e7ef)'
                                    }
                                />
                            ))}
                        </Pie>
                        {data.length > 0 && (
                            <Tooltip
                                wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                                content={<GatewayTooltip currency={currency} total={total} />}
                            />
                        )}
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                        <p className="text-[12px] text-muted">Total</p>
                        <p className="mt-1 text-lg font-bold tracking-[-0.04em] text-foreground">
                            {compactMoney(total, currency)}
                        </p>
                    </div>
                </div>
            </div>
            <div className="relative z-0 space-y-1.5">
                {data.length ? (
                    data.slice(0, 4).map((item, index) => (
                        <div
                            key={item.id}
                            className="dashboard-gateway-row flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/40"
                        >
                            <span
                                className="grid size-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-white shadow-sm"
                                style={{
                                    background: gatewayColors[index % gatewayColors.length],
                                }}
                            >
                                {gatewayInitial(item.provider)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[12px] font-semibold text-foreground">
                                    {item.name}
                                </p>
                                <p className="mt-0.5 text-[12px] text-muted">
                                    {money(item.value, currency)}
                                </p>
                            </div>
                            <span className="text-[12px] font-semibold text-foreground">
                                {total ? ((item.value / total) * 100).toFixed(1) : '0.0'}%
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="dashboard-gateway-empty rounded-xl bg-white/30 px-3 py-4 text-center text-[12px] leading-4 text-muted">
                        As vendas serão distribuídas por gateway aqui.
                    </p>
                )}
            </div>
        </div>
    );
}

function GatewayTooltip({
    active,
    payload,
    currency,
    total,
}: {
    active?: boolean;
    payload?: Array<{ name?: string; value?: number }>;
    currency: string;
    total: number;
}) {
    if (!active || !payload?.[0]) return null;
    const value = Number(payload[0].value ?? 0);
    return (
        <div className="dashboard-chart-tooltip rounded-xl border border-white/85 bg-white/80 px-3 py-2 shadow-xl backdrop-blur-2xl">
            <p className="text-[12px] font-semibold text-foreground">{payload[0].name}</p>
            <p className="mt-0.5 text-[12px] text-muted">
                {money(value, currency)} · {total ? ((value / total) * 100).toFixed(1) : 0}%
            </p>
        </div>
    );
}

export function MetricChart({
    values,
    color,
    type = 'line',
}: {
    values: number[];
    color: string;
    type?: 'line' | 'bar';
}) {
    const data = values.map((value, index) => ({ index, value }));
    return (
        <div className="dashboard-chart h-10 w-[86px] shrink-0 opacity-85 transition group-hover:opacity-100">
            <ResponsiveContainer width="100%" height="100%">
                {type === 'bar' ? (
                    <BarChart data={data} barCategoryGap={3}>
                        <Bar
                            dataKey="value"
                            fill={color}
                            radius={[2, 2, 0, 0]}
                            animationDuration={650}
                        />
                    </BarChart>
                ) : (
                    <AreaChart data={data}>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={1.7}
                            fill="none"
                            dot={false}
                            animationDuration={650}
                        />
                    </AreaChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}

function periodData(points: RevenuePoint[], period: Period) {
    if (period !== '12M') return points.slice(-Number(period.replace('D', '')));
    const months = new Map<string, RevenuePoint>();
    for (const point of points) {
        const date = new Date(`${point.date}T12:00:00`);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const existing = months.get(key);
        if (existing) existing.value += point.value;
        else
            months.set(key, {
                date: point.date,
                label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date),
                value: point.value,
            });
    }
    return [...months.values()].slice(-12);
}

function gatewayInitial(provider: string) {
    return provider === 'stripe'
        ? 'S'
        : provider === 'mercado_pago'
          ? 'MP'
          : provider === 'abacate_pay'
            ? 'A'
            : '＋';
}

function compactMoney(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value / 100);
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value / 100);
}
