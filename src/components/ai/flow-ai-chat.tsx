'use client';


import { Icon, type IconName } from '@/components/ui/icon';
import type { FlowGraph } from '@/lib/api/types';
import { autoLayout } from '@/lib/orchestration/flow';

import {
    AiChat,
    aiRequest,
    AppliedCard,
    markAiApplied,
    ResultActions,
    useAiApplied,
    type AiReply,
} from './ai-chat';

export interface FlowGeneration {
    id: string;
    status: 'succeeded' | 'invalid';
    reply: string;
    /** Nulo quando a IA só respondeu, sem fluxo novo. */
    graph: FlowGraph | null;
    unsupported: string[];
    /** Avisos do servidor: gateways simulados usados e provedores pedidos sem conexão. */
    simulated?: string[];
    issues: { severity: string; message: string }[];
    summary: string[];
    credits: { charged: number; remaining: number | null };
}

const suggestions = [
    'Cartão na Stripe com reserva no Mercado Pago; Pix no gateway mais barato.',
    'Vendas acima de R$ 1.000 vão para um gateway dedicado.',
    'Divida 20% do tráfego para testar outro gateway.',
    'Quando aprovar, avise a equipe por e-mail e mande webhook para o meu sistema.',
] as const;

const loadingSteps = [
    'Lendo seu pedido…',
    'Conferindo seus gateways…',
    'Montando o fluxo…',
    'Validando as regras de publicação…',
] as const;

/** Chat do orquestrador: descreve o roteamento em texto e aplica o fluxo gerado no quadro. */
export function FlowAiChat({
    onApply,
    compact = false,
    storageKey,
}: {
    onApply(graph: FlowGraph): void;
    compact?: boolean;
    storageKey?: string;
}) {
    return (
        <AiChat<FlowGeneration>
            task="payment_flow"
            title="Descreva como os pagamentos devem rodar"
            subtitle="Diga em português quais gateways usar, para quais formas e valores, e o que fazer quando recusar. A IA monta o fluxo com os gateways da sua conta; você confere antes de aplicar."
            placeholder={
                compact
                    ? 'Ex.: cartão na Stripe, reserva no Mercado Pago…'
                    : 'Ex.: cartão na Stripe e, se recusar, no Mercado Pago. Pix no AbacatePay.'
            }
            suggestions={suggestions}
            loadingSteps={loadingSteps}
            maxLength={1500}
            compact={compact}
            {...(storageKey ? { storageKey } : {})}
            generate={async (
                request,
                previousGenerationId,
                conversation,
            ): Promise<AiReply<FlowGeneration>> => {
                const result = await aiRequest<FlowGeneration>(
                    '/api/ai/payment-flow-generations',
                    {
                        request,
                        conversation,
                        ...(previousGenerationId ? { previousGenerationId } : {}),
                    },
                );
                return {
                    id: result.id,
                    text: result.reply,
                    hasResult: result.graph !== null,
                    result,
                    remaining: result.credits.remaining,
                };
            }}
            renderResult={(result, _reply, latest) =>
                result.graph && (
                <FlowResult result={result} graph={result.graph} latest={latest} onApply={onApply} />
            )
            }
        />
    );
}

export function FlowResult({
    result,
    graph,
    latest,
    onApply,
}: {
    result: FlowGeneration;
    graph: FlowGraph;
    latest: boolean;
    onApply(graph: FlowGraph): void;
}) {
    const applied = useAiApplied(result.id);
    const errors = result.issues.filter((issue) => issue.severity === 'error');
    const warnings = result.issues.filter((issue) => issue.severity !== 'error');
    const blocks = graph.nodes.length;
    if (applied)
        return (
            <AppliedCard
                title="Proposta aplicada no fluxo"
                items={appliedItems(graph, result.simulated?.length ?? 0)}
                actionLabel="Ver no fluxo"
            />
        );
    return (
        <article className="ai-result overflow-hidden rounded-2xl border border-border bg-surface">
            {(result.simulated?.length ?? 0) > 0 && (
                <div className="ai-simulated mx-4 mt-4 flex gap-2.5 rounded-xl border px-3.5 py-3 text-[12px] leading-5">
                    <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                    <div>
                        <p className="font-semibold">Este fluxo usa dados de simulação</p>
                        <ul className="mt-1 space-y-1">
                            {result.simulated?.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            <div className="mx-4 mt-4 rounded-xl bg-surface-muted px-3.5 py-3">
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Proposta de fluxo
                </p>
                <ol className="space-y-0.5 text-[12.5px] leading-5">
                    {result.summary.map((line, index) => {
                        const depth = line.length - line.trimStart().length;
                        const text = line.trim();
                        const branch = text.endsWith(':');
                        return (
                            <li
                                key={`${String(index)}-${text}`}
                                style={{ paddingLeft: `${String(depth * 6)}px` }}
                                className={branch ? 'font-medium text-muted' : ''}
                            >
                                {!branch && (
                                    <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-foreground/40" />
                                )}
                                {text}
                            </li>
                        );
                    })}
                </ol>
            </div>
            {result.unsupported.length > 0 && (
                <Notice tone="warning" title="O que o Astro ainda não faz">
                    {result.unsupported}
                </Notice>
            )}
            {errors.length > 0 && (
                <Notice tone="danger" title="Precisa de ajuste antes de publicar">
                    {errors.map((issue) => issue.message)}
                </Notice>
            )}
            {warnings.length > 0 && (
                <Notice tone="neutral" title="Atenção">
                    {warnings.map((issue) => issue.message)}
                </Notice>
            )}
            <ResultActions
                note={`${String(blocks)} blocos · Ctrl+Z desfaz · nada muda nas vendas até publicar`}
                label="Aplicar no quadro"
                doneLabel="Aplicado"
                confirmText="Substituir o fluxo atual por este? Dá para desfazer com Ctrl+Z."
                disabled={!latest}
                generationId={result.id}
                onConfirm={() => {
                    markAiApplied(result.id);
                    onApply(autoLayout(graph));
                }}
            />
        </article>
    );
}

function Notice({
    tone,
    title,
    children,
}: {
    tone: 'warning' | 'danger' | 'neutral';
    title: string;
    children: string[];
}) {
    const palette =
        tone === 'danger'
            ? 'border-[#f2cbd0] bg-[#fff7f8] text-danger dark:bg-[rgb(120_20_40/14%)]'
            : tone === 'warning'
              ? 'border-[#f1dfb5] bg-[#fffaf0] text-[#8a5a00] dark:bg-[rgb(140_100_0/14%)] dark:text-[#f2c66d]'
              : 'border-border bg-surface-muted text-muted';
    return (
        <div className={`mx-4 mt-3 rounded-xl border px-3.5 py-2.5 text-[12px] leading-5 ${palette}`}>
            <p className="font-semibold">{title}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {children.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
}

function plural(count: number, one: string, many: string) {
    return `${String(count)} ${count === 1 ? one : many}`;
}

/** Resumo do que entrou no quadro, contado a partir do próprio grafo aplicado. */
function appliedItems(graph: FlowGraph, simulatedNotices: number) {
    const gateways = new Set<string>();
    let rules = 0;
    let emails = 0;
    let webhooks = 0;
    for (const node of graph.nodes) {
        const config = node.config as {
            gatewayConnectionId?: string | null;
            gatewayConnectionIds?: string[];
            cases?: unknown[];
        };
        if (node.type === 'gateway' && config.gatewayConnectionId) gateways.add(config.gatewayConnectionId);
        if (node.type === 'cheapest') for (const id of config.gatewayConnectionIds ?? []) gateways.add(id);
        if (node.type === 'switch') rules += (config.cases?.length ?? 0) + 1;
        if (node.type === 'condition' || node.type === 'split') rules += 1;
        if (node.type === 'send_email') emails += 1;
        if (node.type === 'send_webhook') webhooks += 1;
    }
    const items: { icon: IconName; label: string }[] = [];
    if (gateways.size > 0)
        items.push({
            icon: 'layers',
            label: `${plural(gateways.size, 'gateway configurado', 'gateways configurados')}${simulatedNotices > 0 ? ' (inclui simulados)' : ''}`,
        });
    if (rules > 0) items.push({ icon: 'route', label: plural(rules, 'regra de roteamento', 'regras de roteamento') });
    if (emails > 0) items.push({ icon: 'mail', label: plural(emails, 'envio de e-mail', 'envios de e-mail') });
    if (webhooks > 0) items.push({ icon: 'webhook', label: plural(webhooks, 'webhook', 'webhooks') });
    return items;
}
