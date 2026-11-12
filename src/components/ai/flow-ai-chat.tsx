'use client';


import type { FlowGraph } from '@/lib/api/types';
import { autoLayout } from '@/lib/orchestration/flow';

import { AiChat, aiRequest, markAiApplied, ResultActions, type AiReply } from './ai-chat';

interface FlowGeneration {
    id: string;
    status: 'succeeded' | 'invalid';
    reply: string;
    /** Nulo quando a IA só respondeu, sem fluxo novo. */
    graph: FlowGraph | null;
    unsupported: string[];
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

function FlowResult({
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
    const errors = result.issues.filter((issue) => issue.severity === 'error');
    const warnings = result.issues.filter((issue) => issue.severity !== 'error');
    const blocks = graph.nodes.length;
    return (
        <article className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="mx-4 mt-4 rounded-xl bg-surface-muted px-3.5 py-3">
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Como o fluxo funciona
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
