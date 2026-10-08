'use client';

import Link from 'next/link';
import { useState } from 'react';

import { providerPresentation } from '@/components/gateways/connected-gateway-card';
import { GatewayMark } from '@/components/gateways/gateway-mark';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import type { GatewayConnection, GatewayInsights, GatewayRoutingRule } from '@/lib/api/types';
import { declineLabel, retryAdviceLabels } from '@/lib/payments/decline';

const methodLabels: Record<string, string> = {
    card: 'Cartão',
    pix: 'Pix',
    boleto: 'Boleto',
    bank_transfer: 'Transferência',
};

interface Recommendation {
    readonly tone: 'action' | 'warning' | 'ok';
    readonly title: string;
    readonly description: string;
    readonly action?: { readonly label: string; readonly href: string };
}

export function OrchestrationOverview({
    insights,
    connections,
    rules,
}: {
    insights: GatewayInsights;
    connections: GatewayConnection[];
    rules: GatewayRoutingRule[];
}) {
    return (
        <div className="space-y-4">
            <NextSteps insights={insights} connections={connections} rules={rules} />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
                <Gateways insights={insights} connections={connections} />
                <DeclineReasons insights={insights} />
            </div>
            <TechnicalDetails insights={insights} connections={connections} />
        </div>
    );
}

/** Traduz o estado da operação em no máximo três próximos passos. */
function recommendations(
    insights: GatewayInsights,
    connections: GatewayConnection[],
    rules: GatewayRoutingRule[],
): Recommendation[] {
    const items: Recommendation[] = [];
    const unstable = connections.filter((connection) => connection.status === 'degraded');
    if (connections.length === 0)
        return [
            {
                tone: 'action',
                title: 'Conecte um gateway para começar a receber',
                description: 'O gateway é a empresa que processa o pagamento do seu cliente.',
                action: { label: 'Conectar gateway', href: '/gateways' },
            },
        ];
    for (const connection of unstable)
        items.push({
            tone: 'warning',
            title: `${connection.name} está instável`,
            description:
                'Enquanto isso, suas vendas vão primeiro para os outros gateways. Nada a fazer se ele voltar sozinho.',
            action: { label: 'Ver gateway', href: '/gateways' },
        });
    if (connections.length === 1)
        items.push({
            tone: 'action',
            title: 'Adicione um gateway reserva',
            description:
                'Se o seu gateway sair do ar, as vendas param. Com um reserva, elas passam por ele automaticamente.',
            action: { label: 'Conectar outro gateway', href: '/gateways' },
        });
    else if (insights.summary.recoveredByFailover === 0 && rules.length === 0)
        items.push({
            tone: 'action',
            title: 'Use o segundo gateway como reserva',
            description:
                'Você já tem mais de um gateway. No checkout, em Prontidão, adicione o segundo como reserva.',
            action: { label: 'Abrir checkouts', href: '/checkouts' },
        });
    const usesCost = rules.some(
        (rule) => rule.status === 'active' && rule.strategy === 'lowest_cost',
    );
    const missingFees = connections.filter(
        (connection) => Object.keys(connection.feeSchedule ?? {}).length === 0,
    );
    if (usesCost && missingFees.length > 0)
        items.push({
            tone: 'action',
            title: 'Informe as taxas dos seus gateways',
            description:
                'Uma regra escolhe o gateway mais barato, mas falta a taxa de alguns deles para comparar.',
            action: { label: 'Informar taxas', href: '/orchestration/costs' },
        });
    if (items.length === 0)
        items.push({
            tone: 'ok',
            title: 'Tudo certo por aqui',
            description:
                insights.summary.recoveredByFailover > 0
                    ? `Seu gateway reserva já salvou ${String(insights.summary.recoveredByFailover)} ${insights.summary.recoveredByFailover === 1 ? 'venda' : 'vendas'} neste período.`
                    : 'Seus gateways estão funcionando e as vendas estão sendo cobradas normalmente.',
        });
    return items.slice(0, 3);
}

function NextSteps({
    insights,
    connections,
    rules,
}: {
    insights: GatewayInsights;
    connections: GatewayConnection[];
    rules: GatewayRoutingRule[];
}) {
    const items = recommendations(insights, connections, rules);
    const icons: Record<Recommendation['tone'], IconName> = {
        action: 'bolt',
        warning: 'clock',
        ok: 'check',
    };
    const tones: Record<Recommendation['tone'], string> = {
        action: 'bg-brand-soft text-brand-strong',
        warning: 'bg-[#fff5e9] text-warning',
        ok: 'bg-[#e8f7f1] text-success',
    };
    return (
        <Panel title={items[0]?.tone === 'ok' ? 'Situação' : 'O que fazer agora'}>
            <ul className="divide-y divide-border/70">
                {items.map((item) => (
                    <li
                        key={item.title}
                        className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                        <span
                            className={`grid size-9 shrink-0 place-items-center rounded-full ${tones[item.tone]}`}
                        >
                            <Icon name={icons[item.tone]} className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-semibold tracking-[-0.01em]">
                                {item.title}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-5 text-muted">
                                {item.description}
                            </p>
                        </div>
                        {item.action && (
                            <Link
                                href={item.action.href}
                                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-[var(--control-bg)] px-4 text-[13px] font-semibold transition hover:border-foreground/30"
                            >
                                {item.action.label}
                                <Icon name="arrow-right" className="size-3.5" />
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

function Gateways({
    insights,
    connections,
}: {
    insights: GatewayInsights;
    connections: GatewayConnection[];
}) {
    const metrics = new Map(insights.gateways.map((item) => [item.gatewayConnectionId, item]));
    return (
        <Panel title="Seus gateways" link={{ label: 'Gerenciar', href: '/gateways' }}>
            {connections.length === 0 ? (
                <Empty text="Nenhum gateway conectado ainda." />
            ) : (
                <ul className="divide-y divide-border/70">
                    {connections.map((connection) => {
                        const item = metrics.get(connection.id);
                        const presentation = providerPresentation(connection.provider);
                        const decided = (item?.approved ?? 0) + (item?.declined ?? 0);
                        const unstable = connection.status === 'degraded';
                        return (
                            <li
                                key={connection.id}
                                className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                            >
                                <GatewayMark
                                    initials={presentation.initials}
                                    color={presentation.color}
                                    logo={presentation.logo}
                                    logoFill={presentation.logoFill}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[14px] font-semibold">
                                        {connection.name}
                                    </p>
                                    <p
                                        className={`mt-0.5 flex items-center gap-1.5 text-[12px] ${unstable ? 'text-warning' : 'text-muted'}`}
                                    >
                                        <span
                                            className={`size-1.5 rounded-full ${unstable ? 'bg-warning' : 'bg-success'}`}
                                        />
                                        {unstable ? 'Instável agora' : 'Funcionando'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[15px] font-semibold tabular-nums">
                                        {item?.approvalRate == null
                                            ? '—'
                                            : percent(item.approvalRate)}
                                    </p>
                                    <p className="text-[12px] text-muted">
                                        {decided > 0
                                            ? `${String(item?.approved ?? 0)} de ${String(decided)} aprovadas`
                                            : (item?.failovers ?? 0) > 0
                                              ? `${String(item?.failovers)} passaram para o reserva`
                                              : 'sem vendas ainda'}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}

function DeclineReasons({ insights }: { insights: GatewayInsights }) {
    const total = insights.declineReasons.reduce((sum, item) => sum + item.count, 0);
    return (
        <Panel title="Por que vendas não passaram">
            {total === 0 ? (
                <Empty text="Nenhuma venda recusada nos últimos 30 dias." />
            ) : (
                <ul className="space-y-4">
                    {insights.declineReasons.map((item) => (
                        <li key={item.category}>
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-[13px] font-semibold">
                                    {declineLabel(item.category)}
                                </span>
                                <span className="text-[12px] tabular-nums text-muted">
                                    {item.count} {item.count === 1 ? 'venda' : 'vendas'}
                                </span>
                            </div>
                            <p className="mt-0.5 text-[12px] text-muted">
                                {retryAdviceLabels[item.retry] ?? ''}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}

/** Métricas para quem quer investigar; fechado por padrão para não poluir o resumo. */
function TechnicalDetails({
    insights,
    connections,
}: {
    insights: GatewayInsights;
    connections: GatewayConnection[];
}) {
    const [breakdown, setBreakdown] = useState<'method' | 'brand' | 'bin'>('method');
    const names = new Map(connections.map((connection) => [connection.id, connection.name]));
    const rows =
        breakdown === 'method'
            ? insights.methods.map((item) => ({
                  key: item.paymentMethod,
                  label: methodLabels[item.paymentMethod] ?? item.paymentMethod,
                  ...item,
              }))
            : breakdown === 'brand'
              ? insights.brands.map((item) => ({
                    key: item.brand,
                    label: brandLabel(item.brand),
                    ...item,
                }))
              : insights.bins.map((item) => ({
                    key: item.bin,
                    label: `${item.bin}${item.brand ? ` · ${brandLabel(item.brand)}` : ''}`,
                    ...item,
                }));
    return (
        <details className="group glass-panel rounded-[24px]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                <span>
                    <span className="block text-[14px] font-semibold">Detalhes técnicos</span>
                    <span className="block text-[12px] text-muted">
                        Tempo de resposta, erros e aprovação por forma de pagamento, bandeira e BIN.
                    </span>
                </span>
                <Icon
                    name="chevron-down"
                    className="size-4 shrink-0 text-muted transition group-open:rotate-180"
                />
            </summary>
            <div className="space-y-6 border-t border-border/70 px-5 py-5 sm:px-6">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-[12px]">
                        <thead className="text-muted">
                            <tr>
                                <th className="pb-2 font-medium">Gateway</th>
                                <th className="pb-2 font-medium">Tentativas</th>
                                <th className="pb-2 font-medium">Passou para o reserva</th>
                                <th className="pb-2 font-medium">Erros do gateway</th>
                                <th className="pb-2 font-medium">Tempo de resposta (p95)</th>
                            </tr>
                        </thead>
                        <tbody className="tabular-nums">
                            {insights.gateways.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-3 text-muted">
                                        Sem tentativas no período.
                                    </td>
                                </tr>
                            )}
                            {insights.gateways.map((item) => (
                                <tr
                                    key={item.gatewayConnectionId}
                                    className="border-t border-border/60"
                                >
                                    <td className="py-2.5 font-medium">
                                        {names.get(item.gatewayConnectionId) ?? 'Gateway removido'}
                                    </td>
                                    <td className="py-2.5">{item.attempts}</td>
                                    <td className="py-2.5">{item.failovers}</td>
                                    <td className="py-2.5">
                                        {item.attempts === 0
                                            ? '—'
                                            : percent(item.technicalFailures / item.attempts)}
                                    </td>
                                    <td className="py-2.5">
                                        {item.p95LatencyMs === null
                                            ? '—'
                                            : latency(item.p95LatencyMs)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold">Aprovação por</p>
                        <div className="ui-tabs">
                            {(
                                [
                                    { value: 'method', label: 'Forma de pagamento' },
                                    { value: 'brand', label: 'Bandeira' },
                                    { value: 'bin', label: 'BIN' },
                                ] as const
                            ).map((item) => (
                                <Button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setBreakdown(item.value)}
                                    data-active={breakdown === item.value}
                                    aria-pressed={breakdown === item.value}
                                    className="ui-tab whitespace-nowrap px-3.5 py-1 text-[12px] font-semibold"
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {rows.length === 0 ? (
                        <p className="mt-3 text-[12px] text-muted">
                            {breakdown === 'method'
                                ? 'Sem vendas decididas no período.'
                                : 'Aparece conforme os gateways informam os dados do cartão.'}
                        </p>
                    ) : (
                        <ul className="mt-3 grid gap-x-10 gap-y-2 md:grid-cols-2">
                            {rows.map((row) => (
                                <li
                                    key={row.key}
                                    className="flex items-center justify-between gap-4 border-b border-border/60 py-2 text-[12px]"
                                >
                                    <span className="truncate font-medium">{row.label}</span>
                                    <span className="tabular-nums text-muted">
                                        <span className="font-semibold text-foreground">
                                            {row.approvalRate === null
                                                ? '—'
                                                : percent(row.approvalRate)}
                                        </span>{' '}
                                        · {row.approved} de {row.approved + row.declined}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </details>
    );
}

function Panel({
    title,
    link,
    children,
}: {
    title: string;
    link?: { label: string; href: string };
    children: React.ReactNode;
}) {
    return (
        <section className="glass-panel min-w-0 rounded-[24px] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold tracking-[-0.02em]">{title}</h2>
                {link && (
                    <Link
                        href={link.href}
                        className="text-[13px] font-semibold text-muted transition hover:text-foreground"
                    >
                        {link.label}
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

function Empty({ text }: { text: string }) {
    return <p className="text-[13px] text-muted">{text}</p>;
}

function brandLabel(brand: string) {
    const known: Record<string, string> = {
        visa: 'Visa',
        master: 'Mastercard',
        mastercard: 'Mastercard',
        amex: 'American Express',
        elo: 'Elo',
        hipercard: 'Hipercard',
        unknown: 'Não informada',
    };
    return known[brand] ?? brand;
}

function percent(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 }).format(
        value,
    );
}

function latency(ms: number) {
    return ms >= 1000
        ? `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}s`
        : `${String(ms)}ms`;
}
