'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { FlowGraph, FlowNode } from '@/lib/api/types';
import {
    blockOf,
    estimatedHeight,
    isDecoration,
    nodeColor,
    nodeOutputs,
    outputTone,
    toneColor,
} from '@/lib/orchestration/flow';

import { flowTemplates, type FlowTemplate, type TemplateReferences } from './templates';

type Filter = 'all' | FlowTemplate['kind'];

/** Galeria de modelos sobre o quadro: miniatura do fluxo, etapas e o efeito de usar. */
export function TemplateGallery({
    references,
    onUse,
    onClose,
}: {
    references: TemplateReferences;
    onUse(template: FlowTemplate, graph: FlowGraph): void;
    onClose(): void;
}) {
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const built = useMemo(
        () => flowTemplates.map((template) => ({ template, graph: template.build(references) })),
        [references],
    );
    const term = query.trim().toLowerCase();
    const visible = built.filter(
        ({ template }) =>
            (filter === 'all' || template.kind === filter) &&
            (!term || `${template.title} ${template.description}`.toLowerCase().includes(term)),
    );

    useEffect(() => {
        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [onClose]);

    return (
        <section
            aria-label="Modelos de fluxo"
            className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-surface"
        >
            <header className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
                <div className="min-w-0 flex-1">
                    <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Modelos</h2>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                        Comece de um fluxo pronto e ajuste depois. Nada muda nas vendas até você
                        publicar.
                    </p>
                </div>
                <div className="ui-tabs" role="radiogroup" aria-label="Tipo de modelo">
                    {(
                        [
                            ['all', 'Todos'],
                            ['routing', 'Roteamento'],
                            ['automation', 'Automações'],
                        ] as const
                    ).map(([value, label]) => (
                        <Button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={filter === value}
                            data-active={filter === value}
                            onClick={() => setFilter(value)}
                            className="ui-tab whitespace-nowrap px-3.5 py-1 text-[12px] font-semibold"
                        >
                            {label}
                        </Button>
                    ))}
                </div>
                <label className="relative block w-[220px]">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                    />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar modelos…"
                        aria-label="Buscar modelos"
                        className="!h-9 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-8 pr-3 text-[12px] outline-none focus:border-brand/60"
                    />
                </label>
                <Button type="button" variant="secondary" className="!h-9 px-3.5" onClick={onClose}>
                    <Icon name="close" className="size-3.5" />
                    Voltar ao quadro
                </Button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {visible.length === 0 ? (
                    <p className="text-[13px] text-muted">Nenhum modelo encontrado.</p>
                ) : (
                    <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                        {visible.map(({ template, graph }) => (
                            <li key={template.id}>
                                <TemplateCard
                                    template={template}
                                    graph={graph}
                                    onUse={() => onUse(template, graph)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

function TemplateCard({
    template,
    graph,
    onUse,
}: {
    template: FlowTemplate;
    graph: FlowGraph;
    onUse(): void;
}) {
    const steps = stepsOf(graph);
    const automation = template.kind === 'automation';
    return (
        <button
            type="button"
            onClick={onUse}
            className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_14px_36px_rgba(16,18,20,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <div className="flow-canvas relative aspect-[16/9] w-full border-b border-border">
                <TemplateThumbnail graph={graph} />
                <span
                    className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${automation ? 'flow-tone-action' : 'flow-tone-logic'}`}
                >
                    {automation ? 'Automação' : 'Roteamento'}
                </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-[14px] font-semibold tracking-[-0.01em]">{template.title}</h3>
                <p className="mt-1 text-[12px] leading-5 text-muted">{template.description}</p>
                <ol className="mt-3 flex flex-wrap items-center gap-1 text-[10.5px] font-medium">
                    {steps.shown.map((step, index) => (
                        <li key={step.label} className="flex items-center gap-1">
                            {index > 0 && (
                                <Icon name="arrow-right" className="size-2.5 text-muted" />
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5">
                                <span
                                    className="size-1.5 rounded-full"
                                    style={{ background: step.color }}
                                />
                                {step.label}
                                {step.count > 1 && (
                                    <span className="text-muted">×{step.count}</span>
                                )}
                            </span>
                        </li>
                    ))}
                    {steps.hidden > 0 && <li className="text-muted">+{steps.hidden}</li>}
                </ol>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <span className="text-[11px] text-muted">
                        {automation ? 'Adiciona ao quadro' : 'Substitui o quadro'} ·{' '}
                        {graph.nodes.length} blocos
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold transition group-hover:gap-1.5">
                        Usar modelo <Icon name="arrow-right" className="size-3" />
                    </span>
                </div>
            </div>
        </button>
    );
}

const cardWidth = 236;

/** Desenho do fluxo em escala: blocos coloridos pelo tipo e ligações pela saída. */
function TemplateThumbnail({ graph }: { graph: FlowGraph }) {
    const dots = `flow-thumb-dots-${useId().replace(/:/g, '')}`;
    const nodes = graph.nodes.filter((node) => !isDecoration(node.type));
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const height = (node: FlowNode) => estimatedHeight(node);
    const left = Math.min(...nodes.map((node) => node.position.x));
    const top = Math.min(...nodes.map((node) => node.position.y));
    const right = Math.max(...nodes.map((node) => node.position.x + cardWidth));
    const bottom = Math.max(...nodes.map((node) => node.position.y + height(node)));
    const pad = 60;
    const viewBox = `${String(left - pad)} ${String(top - pad)} ${String(right - left + pad * 2)} ${String(bottom - top + pad * 2)}`;

    return (
        <svg
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 size-full"
            role="img"
            aria-label="Miniatura do fluxo"
        >
            <defs>
                <pattern id={dots} width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="2.4" fill="var(--flow-dot)" />
                </pattern>
            </defs>
            <rect
                x={left - pad * 4}
                y={top - pad * 4}
                width={right - left + pad * 8}
                height={bottom - top + pad * 8}
                fill={`url(#${dots})`}
            />
            {graph.edges.map((edge) => {
                const source = byId.get(edge.source);
                const target = byId.get(edge.target);
                if (!source || !target) return null;
                const outputs = nodeOutputs(source);
                const index = Math.max(
                    0,
                    outputs.findIndex((output) => output.id === edge.sourceHandle),
                );
                // Saídas ficam no rodapé do card, uma abaixo da outra.
                const sy =
                    outputs.length > 1
                        ? source.position.y + height(source) - (outputs.length - index) * 28 + 6
                        : source.position.y + height(source) / 2;
                const sx = source.position.x + cardWidth;
                const tx = target.position.x;
                const ty = target.position.y + height(target) / 2;
                const curve = Math.max(60, Math.abs(tx - sx) / 2);
                const tone = outputTone(source, edge.sourceHandle);
                return (
                    <path
                        key={edge.id}
                        d={`M ${String(sx)} ${String(sy)} C ${String(sx + curve)} ${String(sy)}, ${String(tx - curve)} ${String(ty)}, ${String(tx)} ${String(ty)}`}
                        fill="none"
                        stroke={toneColor(tone)}
                        strokeWidth={5}
                        strokeDasharray={tone === 'danger' ? '14 10' : undefined}
                        strokeLinecap="round"
                    />
                );
            })}
            {nodes.map((node) => {
                const h = height(node);
                const color = nodeColor(node.type);
                return (
                    <g
                        key={node.id}
                        transform={`translate(${String(node.position.x)} ${String(node.position.y)})`}
                    >
                        <rect
                            width={cardWidth}
                            height={h}
                            rx={20}
                            fill="var(--flow-card)"
                            stroke={color}
                            strokeOpacity={0.55}
                            strokeWidth={4}
                        />
                        <rect
                            x={16}
                            y={16}
                            width={40}
                            height={40}
                            rx={11}
                            fill={color}
                            fillOpacity={0.9}
                        />
                        <rect
                            x={70}
                            y={20}
                            width={120}
                            height={13}
                            rx={6.5}
                            fill="var(--foreground)"
                            fillOpacity={0.55}
                        />
                        <rect
                            x={70}
                            y={42}
                            width={78}
                            height={10}
                            rx={5}
                            fill="var(--foreground)"
                            fillOpacity={0.2}
                        />
                        {nodeOutputs(node).length > 1 &&
                            nodeOutputs(node).map((output, index, all) => (
                                <rect
                                    key={output.id}
                                    x={cardWidth - 78}
                                    y={h - (all.length - index) * 28}
                                    width={60}
                                    height={14}
                                    rx={7}
                                    fill={toneColor(output.tone)}
                                    fillOpacity={0.35}
                                />
                            ))}
                    </g>
                );
            })}
        </svg>
    );
}

/** Etapas em ordem de leitura (esquerda → direita), agrupando blocos repetidos. */
function stepsOf(graph: FlowGraph) {
    const ordered = [...graph.nodes]
        .filter((node) => !isDecoration(node.type))
        .sort(
            (left, right) =>
                left.position.x - right.position.x || left.position.y - right.position.y,
        );
    const steps: { label: string; color: string; count: number }[] = [];
    for (const node of ordered) {
        const label = node.type === 'gateway' ? 'Gateway' : blockOf(node).title;
        const existing = steps.find((step) => step.label === label);
        if (existing) existing.count += 1;
        else steps.push({ label, color: nodeColor(node.type), count: 1 });
    }
    const limit = 5;
    return { shown: steps.slice(0, limit), hidden: Math.max(0, steps.length - limit) };
}
