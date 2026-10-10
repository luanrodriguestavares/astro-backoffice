'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import type { FlowEvent, FlowNodeType } from '@/lib/api/types';
import { blocks, isDecoration, isTrigger, type BlockCategory } from '@/lib/orchestration/flow';

/** Seletor rápido aberto pelo "+" de uma saída ou ao soltar uma ligação no vazio. */
export function BlockPicker({
    screen,
    allowTrigger,
    allowRoutingTrigger,
    excludeCategories = [],
    onPick,
    onClose,
}: {
    screen: { x: number; y: number };
    /** Gatilhos não recebem ligações: só aparecem quando o bloco não sai de uma saída. */
    allowTrigger: boolean;
    /** "Venda iniciada" só pode existir uma vez no quadro. */
    allowRoutingTrigger: boolean;
    /** Categorias que não cabem onde o bloco vai entrar (ex.: gateways depois do pagamento). */
    excludeCategories?: readonly BlockCategory[];
    onPick(type: FlowNodeType, event?: FlowEvent): void;
    onClose(): void;
}) {
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const root = useRef<HTMLDivElement>(null);
    const term = query.trim().toLowerCase();
    const options = blocks.filter(
        (block) =>
            !isDecoration(block.type) &&
            (allowTrigger || !isTrigger(block.type)) &&
            (allowRoutingTrigger || block.type !== 'trigger') &&
            !excludeCategories.includes(block.category) &&
            (!term || `${block.title} ${block.keywords}`.toLowerCase().includes(term)),
    );

    useEffect(() => {
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) onClose();
        }
        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, [onClose]);

    const left = Math.min(screen.x, window.innerWidth - 280);
    const top = Math.min(screen.y, window.innerHeight - 380);

    return (
        <div
            ref={root}
            role="dialog"
            aria-label="Adicionar bloco"
            className="glass-popover fixed z-50 w-[260px] overflow-hidden rounded-2xl shadow-[0_18px_48px_rgba(16,18,20,0.18)]"
            style={{ left, top }}
        >
            <div className="border-b border-border p-2">
                <input
                    autoFocus
                    value={query}
                    placeholder="Qual bloco adicionar?"
                    aria-label="Buscar bloco"
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActive(0);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') onClose();
                        if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setActive((value) => Math.min(value + 1, options.length - 1));
                        }
                        if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setActive((value) => Math.max(value - 1, 0));
                        }
                        const option = options[active];
                        if (event.key === 'Enter' && option) onPick(option.type, option.event);
                    }}
                    className="h-9 w-full rounded-lg bg-transparent px-2 text-[13px] outline-none"
                />
            </div>
            <ul className="max-h-[300px] overflow-y-auto p-1.5" role="listbox">
                {options.map((block, index) => (
                    <li key={block.key} role="option" aria-selected={index === active}>
                        <button
                            type="button"
                            onMouseEnter={() => setActive(index)}
                            onClick={() => onPick(block.type, block.event)}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition ${index === active ? 'bg-surface-muted' : ''}`}
                        >
                            <span
                                className={`grid size-7 shrink-0 place-items-center rounded-lg ${block.tone}`}
                            >
                                <Icon name={block.icon} className="size-3.5" />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[12.5px] font-semibold">
                                    {block.title}
                                </span>
                                <span className="block truncate text-[10.5px] text-muted">
                                    {block.description}
                                </span>
                            </span>
                        </button>
                    </li>
                ))}
                {options.length === 0 && (
                    <li className="px-2 py-3 text-[12px] text-muted">Nenhum bloco encontrado.</li>
                )}
            </ul>
        </div>
    );
}
