'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon, type IconName } from '@/components/ui/icon';

export type FunnelPageTemplateId = 'blank' | 'video' | 'vsl' | 'offer' | 'bridge';

/** Tipo do arraste da biblioteca para o canvas do funil. */
export const FUNNEL_PAGE_DRAG_TYPE = 'application/x-astro-funnel-page';

type PageTemplate = {
    id: FunnelPageTemplateId;
    title: string;
    description: string;
    icon: IconName;
    tone: string;
    group: 'pages' | 'templates';
};

export const pageTemplates: PageTemplate[] = [
    {
        id: 'blank',
        title: 'Página em branco',
        description: 'Título e botão para começar',
        icon: 'layout',
        tone: 'flow-tone-trigger',
        group: 'pages',
    },
    {
        id: 'video',
        title: 'Página de vídeo',
        description: 'Vídeo com chamada para avançar',
        icon: 'play',
        tone: 'flow-tone-gateway',
        group: 'pages',
    },
    {
        id: 'vsl',
        title: 'VSL com CTA',
        description: 'Oferta liberada durante o vídeo',
        icon: 'play',
        tone: 'flow-tone-gateway',
        group: 'templates',
    },
    {
        id: 'offer',
        title: 'Página de oferta',
        description: 'Argumento, benefícios e ação',
        icon: 'gift',
        tone: 'flow-tone-action',
        group: 'templates',
    },
    {
        id: 'bridge',
        title: 'Página ponte',
        description: 'Contextualiza antes do checkout',
        icon: 'arrow-right',
        tone: 'flow-tone-logic',
        group: 'templates',
    },
];

const groups: { id: PageTemplate['group']; title: string }[] = [
    { id: 'pages', title: 'Começar do zero' },
    { id: 'templates', title: 'Páginas prontas' },
];

export function FunnelPageLibrary({ onAdd }: { onAdd(template: FunnelPageTemplateId): void }) {
    const [query, setQuery] = useState('');
    const term = normalize(query);
    const visible = pageTemplates.filter(
        (template) =>
            !term || normalize(`${template.title} ${template.description}`).includes(term),
    );

    return (
        <aside className="ce-funnel-library" aria-label="Biblioteca de páginas do funil">
            <div className="ce-funnel-library-search">
                <label>
                    <Icon name="search" className="size-3.5" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                        placeholder="Buscar páginas…"
                        aria-label="Buscar páginas"
                    />
                </label>
            </div>

            <div className="ce-funnel-library-list">
                {groups.map(({ id, title }) => {
                    const items = visible.filter((template) => template.group === id);
                    if (!items.length) return null;
                    return (
                        <section key={id}>
                            <h3>{title}</h3>
                            <ul>
                                {items.map((template) => (
                                    <li key={template.id}>
                                        <button
                                            type="button"
                                            draggable
                                            onDragStart={(event) => {
                                                event.dataTransfer.setData(
                                                    FUNNEL_PAGE_DRAG_TYPE,
                                                    template.id,
                                                );
                                                event.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            onClick={() => onAdd(template.id)}
                                            title={`Clique ou arraste para o canvas: ${template.title.toLowerCase()}`}
                                        >
                                            <span className={template.tone}>
                                                <Icon name={template.icon} className="size-4" />
                                            </span>
                                            <span>
                                                <strong>{template.title}</strong>
                                                <small>{template.description}</small>
                                            </span>
                                            <Icon
                                                name="plus"
                                                className="ce-funnel-library-add size-3.5"
                                            />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
                {visible.length === 0 && <p>Nenhuma página encontrada.</p>}
            </div>
        </aside>
    );
}

/** Seletor rápido aberto pelo "+" de uma página, ao soltar uma ligação no vazio ou no menu. */
export function FunnelPagePicker({
    screen,
    onPick,
    onClose,
}: {
    screen: { x: number; y: number };
    onPick(template: FunnelPageTemplateId): void;
    onClose(): void;
}) {
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const root = useRef<HTMLDivElement>(null);
    const term = normalize(query);
    const options = pageTemplates.filter(
        (template) =>
            !term || normalize(`${template.title} ${template.description}`).includes(term),
    );

    useEffect(() => {
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) onClose();
        }

        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, [onClose]);

    return (
        <div
            ref={root}
            role="dialog"
            aria-label="Adicionar página"
            className="glass-popover fixed z-50 w-[260px] overflow-hidden rounded-2xl shadow-[0_18px_48px_rgba(16,18,20,0.18)]"
            style={{
                left: Math.min(screen.x, window.innerWidth - 280),
                top: Math.min(screen.y, window.innerHeight - 320),
            }}
        >
            <div className="border-b border-border p-2">
                <input
                    autoFocus
                    value={query}
                    placeholder="Qual página adicionar?"
                    aria-label="Buscar página"
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
                        if (event.key === 'Enter' && option) onPick(option.id);
                    }}
                    className="h-9 w-full rounded-lg bg-transparent px-2 text-[13px] outline-none"
                />
            </div>
            <ul className="max-h-[260px] overflow-y-auto p-1.5" role="listbox">
                {options.map((template, index) => (
                    <li key={template.id} role="option" aria-selected={index === active}>
                        <button
                            type="button"
                            onMouseEnter={() => setActive(index)}
                            onClick={() => onPick(template.id)}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition ${index === active ? 'bg-surface-muted' : ''}`}
                        >
                            <span
                                className={`grid size-7 shrink-0 place-items-center rounded-lg ${template.tone}`}
                            >
                                <Icon name={template.icon} className="size-3.5" />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[12.5px] font-semibold">
                                    {template.title}
                                </span>
                                <span className="block truncate text-[10.5px] text-muted">
                                    {template.description}
                                </span>
                            </span>
                        </button>
                    </li>
                ))}
                {options.length === 0 && (
                    <li className="px-2 py-3 text-[12px] text-muted">Nenhuma página encontrada.</li>
                )}
            </ul>
        </div>
    );
}

function normalize(value: string) {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
