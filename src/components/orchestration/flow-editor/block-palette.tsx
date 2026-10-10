'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import type { FlowEvent, FlowNodeType } from '@/lib/api/types';
import { blocks, categoryLabels, type BlockCategory } from '@/lib/orchestration/flow';

export const blockDragType = 'application/astro-flow-block';

export function BlockPalette({
    hasTrigger,
    templatesOpen,
    onAdd,
    onOpenTemplates,
    onCloseTemplates,
}: {
    hasTrigger: boolean;
    templatesOpen: boolean;
    onAdd(type: FlowNodeType, event?: FlowEvent): void;
    onOpenTemplates(): void;
    onCloseTemplates(): void;
}) {
    return (
        <aside
            aria-label="Blocos do fluxo"
            className="flex h-full w-full flex-col overflow-hidden border-r border-border bg-surface"
        >
            <div role="tablist" className="flex gap-1 p-3 pb-0">
                <button
                    type="button"
                    role="tab"
                    aria-selected={!templatesOpen}
                    onClick={onCloseTemplates}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${!templatesOpen ? 'bg-surface-muted text-foreground' : 'text-muted hover:text-foreground'}`}
                >
                    Blocos
                </button>
                {/* Modelos abrem uma galeria sobre o quadro, com miniaturas de cada fluxo. */}
                <button
                    type="button"
                    role="tab"
                    aria-selected={templatesOpen}
                    onClick={onOpenTemplates}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${templatesOpen ? 'bg-surface-muted text-foreground' : 'text-muted hover:text-foreground'}`}
                >
                    <Icon name="layers" className="size-3.5" />
                    Modelos
                </button>
            </div>
            <BlockList hasTrigger={hasTrigger} onAdd={onAdd} />
        </aside>
    );
}

function BlockList({
    hasTrigger,
    onAdd,
}: {
    hasTrigger: boolean;
    onAdd(type: FlowNodeType, event?: FlowEvent): void;
}) {
    const [query, setQuery] = useState('');
    const term = normalize(query);
    const visible = blocks.filter(
        (block) =>
            (block.type !== 'trigger' || !hasTrigger) &&
            (!term ||
                normalize(`${block.title} ${block.description} ${block.keywords}`).includes(term)),
    );
    const categories = [...new Set(visible.map((block) => block.category))] as BlockCategory[];
    return (
        <>
            <div className="p-3">
                <label className="relative block">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                    />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar blocos…"
                        aria-label="Buscar blocos"
                        className="h-9 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-8 pr-3 text-[12px] outline-none focus:border-brand/60"
                    />
                </label>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
                {categories.map((category) => (
                    <section key={category}>
                        <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                            {categoryLabels[category]}
                        </h3>
                        <ul className="space-y-1">
                            {visible
                                .filter((block) => block.category === category)
                                .map((block) => (
                                    <li key={block.key}>
                                        <button
                                            type="button"
                                            draggable
                                            onDragStart={(event) => {
                                                event.dataTransfer.setData(
                                                    blockDragType,
                                                    block.event
                                                        ? `${block.type}:${block.event}`
                                                        : block.type,
                                                );
                                                event.dataTransfer.effectAllowed = 'move';
                                            }}
                                            onClick={() => onAdd(block.type, block.event)}
                                            title="Arraste para o canvas ou clique para adicionar"
                                            className="flow-palette-item flex w-full cursor-grab items-center gap-2.5 rounded-xl px-2 py-2 text-left transition active:cursor-grabbing"
                                        >
                                            <span
                                                className={`grid size-8 shrink-0 place-items-center rounded-lg ${block.tone}`}
                                            >
                                                <Icon name={block.icon} className="size-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-[12.5px] font-semibold">
                                                    {block.title}
                                                </span>
                                                <span className="block truncate text-[11px] text-muted">
                                                    {block.description}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </section>
                ))}
                {visible.length === 0 && (
                    <p className="px-1 text-[12px] text-muted">Nenhum bloco encontrado.</p>
                )}
            </div>
        </>
    );
}

function normalize(value: string) {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
