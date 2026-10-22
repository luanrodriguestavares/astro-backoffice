'use client';

import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/ui/icon';

type Period = '7d' | '30d' | '90d';
type FunnelRow = { label?: string; value?: number; position?: number };
type FunnelReport = { rows: FunnelRow[]; period: { from: string; to: string } };

export function CheckoutFunnelAnalytics({ checkoutId }: { checkoutId: string }) {
    const [period, setPeriod] = useState<Period>('30d');
    const [report, setReport] = useState<FunnelReport>();
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        void fetch(`/api/analytics/checkout-funnel?period=${period}&checkout=${encodeURIComponent(checkoutId)}`, {
            signal: controller.signal,
        })
            .then(async (response) => {
                const body = (await response.json()) as { data?: FunnelReport; detail?: string };
                if (!response.ok || !body.data) throw new Error(body.detail ?? 'Não foi possível carregar o funil.');
                setError('');
                setReport(body.data);
            })
            .catch((reason: unknown) => {
                if (!controller.signal.aborted)
                    setReport(undefined);
                if (!controller.signal.aborted)
                    setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o funil.');
            });
        return () => controller.abort();
    }, [checkoutId, period, retry]);

    const stages = useMemo(
        () =>
            (report?.rows ?? [])
                .map((row) => ({
                    label: row.label ?? 'Etapa',
                    value: Number(row.value ?? 0),
                    position: Number(row.position ?? 99),
                }))
                .sort((a, b) => a.position - b.position),
        [report],
    );
    const entry = stages[0]?.value ?? 0;
    const completed = stages.at(-1)?.value ?? 0;
    const conversion = entry > 0 ? (completed / entry) * 100 : 0;
    const abandonment = entry > 0 ? Math.max(0, ((entry - completed) / entry) * 100) : 0;
    const available = report !== undefined && !error;

    return (
        <div className="space-y-4">
            <div className="glass-panel flex flex-col gap-4 rounded-[22px] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {(['7d', '30d', '90d'] as const).map((value) => (
                        <button key={value} type="button" aria-pressed={period === value} onClick={() => {
                            if (period === value) return;
                            setError('');
                            setReport(undefined);
                            setPeriod(value);
                        }} className={`h-9 rounded-xl border px-4 text-[12px] font-semibold transition ${period === value ? 'border-foreground bg-foreground text-background' : 'border-border bg-surface text-muted hover:text-foreground'}`}>
                            {value === '7d' ? '7 dias' : value === '30d' ? '30 dias' : '90 dias'}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-muted">Período aplicado a todas as etapas da jornada</p>
            </div>

            <section className="grid gap-3 sm:grid-cols-3">
                <Metric label="Entradas no funil" value={available ? formatNumber(entry) : '—'} detail={available ? 'Sessões únicas na primeira etapa' : 'Dados indisponíveis'} icon="users" />
                <Metric label="Conversão final" value={available ? `${conversion.toFixed(1).replace('.', ',')}%` : '—'} detail={available ? `${formatNumber(completed)} chegaram à última etapa` : 'Dados indisponíveis'} icon="chart" />
                <Metric label="Abandono" value={available ? `${abandonment.toFixed(1).replace('.', ',')}%` : '—'} detail={available ? `${formatNumber(Math.max(0, entry - completed))} saíram antes do final` : 'Dados indisponíveis'} icon="alert" />
            </section>

            <section className="glass-panel overflow-hidden rounded-[28px]">
                <div className="border-b border-border px-6 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-brand-strong">Jornada por página</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-.035em]">Onde os visitantes avançam ou abandonam</h2>
                    <p className="mt-1 text-[12.5px] text-muted">Cada etapa considera sessões únicas no período selecionado.</p>
                </div>
                {error ? (
                    <div className="m-6 flex flex-col items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-5">
                        <div><strong className="text-[13px] text-danger">Não foi possível carregar a jornada</strong><p className="mt-1 text-[11.5px] text-muted">{error}</p></div>
                        <button type="button" onClick={() => setRetry((value) => value + 1)} className="h-9 rounded-xl border border-border bg-surface px-4 text-[11.5px] font-semibold">Tentar novamente</button>
                    </div>
                ) : report === undefined ? (
                    <div className="grid min-h-80 place-items-center text-[13px] text-muted">Carregando jornada…</div>
                ) : stages.length === 0 || entry === 0 ? (
                    <div className="grid min-h-80 place-items-center px-6 text-center">
                        <div><Icon name="chart" className="mx-auto size-7 text-brand" /><h3 className="mt-3 text-sm font-semibold">Ainda não há tráfego neste período</h3><p className="mt-1 text-[12px] text-muted">Publique o checkout e compartilhe o link. As etapas aparecerão aqui conforme os visitantes avançarem.</p></div>
                    </div>
                ) : (
                    <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-7">
                        <div className="space-y-3">
                            {stages.map((stage, index) => {
                                const previous = stages[index - 1]?.value ?? stage.value;
                                const retained = previous > 0 ? (stage.value / previous) * 100 : 0;
                                const width = entry > 0 ? Math.max(8, (stage.value / entry) * 100) : 8;
                                return (
                                    <div key={`${stage.position}:${stage.label}`} className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4">
                                        <span className="absolute inset-y-0 left-0 bg-brand-soft/70" style={{ width: `${width}%` }} />
                                        <div className="relative flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-xl bg-foreground text-[11px] font-bold text-background">{index + 1}</span><div><h3 className="text-[13px] font-semibold">{stage.label}</h3><p className="text-[11px] text-muted">{index === 0 ? 'Entrada' : `${retained.toFixed(1).replace('.', ',')}% avançaram da etapa anterior`}</p></div></div>
                                            <strong className="text-lg tracking-[-.03em]">{formatNumber(stage.value)}</strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <aside className="rounded-2xl border border-border bg-surface-muted/65 p-5">
                            <Icon name="bolt" className="size-5 text-brand" />
                            <h3 className="mt-3 text-sm font-semibold">Leitura rápida</h3>
                            <p className="mt-2 text-[12px] leading-5 text-muted">A maior queda acontece entre etapas consecutivas. Use essa diferença para revisar a página, a oferta ou o gatilho de navegação correspondente.</p>
                            <div className="mt-5 border-t border-border pt-4 text-[11px] leading-5 text-muted">Os dados começaram a ser registrados após a ativação dos eventos de jornada.</div>
                        </aside>
                    </div>
                )}
            </section>
        </div>
    );
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: 'users' | 'chart' | 'alert' }) {
    return <article className="glass-panel rounded-[22px] p-5"><span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><Icon name={icon} className="size-4" /></span><p className="mt-4 text-[11px] font-semibold uppercase tracking-[.12em] text-muted">{label}</p><strong className="mt-1 block text-2xl tracking-[-.04em]">{value}</strong><p className="mt-1 text-[11.5px] text-muted">{detail}</p></article>;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('pt-BR').format(value);
}
