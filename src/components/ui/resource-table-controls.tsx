'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';

type State = { query: string; pageSize: number; page: number };

const defaultState: State = { query: '', pageSize: 10, page: 1 };
const states = new Map<string, State>();
const listeners = new Map<string, Set<() => void>>();

export function ResourceTableControls({
    tableId,
    total,
    position,
    initialQuery = '',
    focusId,
}: {
    tableId: string;
    total: number;
    position: 'top' | 'bottom';
    initialQuery?: string;
    focusId?: string;
}) {
    const initialization = useRef('');
    const state = useSyncExternalStore(
        (listener) => subscribe(tableId, listener),
        () => states.get(tableId) ?? defaultState,
        () => defaultState,
    );

    function update(next: Partial<State>) {
        const updated = { ...state, ...next };
        states.set(tableId, updated);
        for (const listener of listeners.get(tableId) ?? []) listener();
        apply(tableId, updated);
    }

    useEffect(() => {
        apply(tableId, state);
    }, [state, tableId]);

    useEffect(() => {
        if (position !== 'top') return;
        const signature = `${initialQuery}\u0000${focusId ?? ''}`;
        if (initialization.current === signature) return;
        initialization.current = signature;
        const query = normalize(initialQuery);
        const matching = rows(tableId).filter((row) =>
            (row.dataset.search ?? '').includes(query),
        );
        const focusIndex = focusId
            ? matching.findIndex((row) => row.dataset.resourceId === focusId)
            : -1;
        const next = {
            ...defaultState,
            query,
            page: focusIndex < 0 ? 1 : Math.floor(focusIndex / defaultState.pageSize) + 1,
        };
        states.set(tableId, next);
        for (const listener of listeners.get(tableId) ?? []) listener();
        apply(tableId, next);
        if (focusId)
            window.requestAnimationFrame(() =>
                document
                    .getElementById(`resource-row-${focusId}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
            );
    }, [focusId, initialQuery, position, tableId]);

    const matching = matchingCount(tableId, state.query) || (state.query ? 0 : total);
    const pages = Math.max(1, Math.ceil(matching / state.pageSize));
    const currentPage = Math.min(state.page, pages);

    if (position === 'top')
        return (
            <div className="flex flex-col gap-3 border-b border-white/65 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <label className="relative block w-full sm:max-w-sm">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                        value={state.query}
                        onChange={(event) =>
                            update({
                                query: normalize(event.target.value),
                                page: 1,
                            })
                        }
                        placeholder="Buscar nesta lista"
                        className="h-10 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-3 text-[13px] outline-none transition focus:border-brand/60"
                    />
                </label>
                <div className="w-40">
                    <span className="block">
                        <CustomSelect
                            name={`${tableId}-page-size`}
                            value={String(state.pageSize)}
                            onValueChange={(value) => update({ pageSize: Number(value), page: 1 })}
                            options={[10, 20, 50, 100].map((value) => ({
                                value: String(value),
                                label: `${value} por página`,
                            }))}
                        />
                    </span>
                </div>
            </div>
        );

    const start = matching ? (currentPage - 1) * state.pageSize + 1 : 0;
    const end = Math.min(currentPage * state.pageSize, matching);
    return (
        <div className="flex flex-col gap-3 border-t border-white/65 px-5 py-4 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
                {start}–{end} de {matching}
            </span>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="icon"
                    aria-label="Página anterior"
                    title="Página anterior"
                    disabled={currentPage === 1}
                    onClick={() => update({ page: currentPage - 1 })}
                >
                    <Icon name="arrow-right" className="size-3.5 rotate-180" />
                </Button>
                <span className="px-2">
                    Página {currentPage} de {pages}
                </span>
                <Button
                    type="button"
                    variant="icon"
                    aria-label="Próxima página"
                    title="Próxima página"
                    disabled={currentPage === pages}
                    onClick={() => update({ page: currentPage + 1 })}
                >
                    <Icon name="arrow-right" className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

function subscribe(tableId: string, listener: () => void) {
    const set = listeners.get(tableId) ?? new Set();
    set.add(listener);
    listeners.set(tableId, set);
    return () => {
        set.delete(listener);
    };
}

function rows(tableId: string) {
    if (typeof document === 'undefined') return [] as HTMLTableRowElement[];
    return [
        ...document.querySelectorAll<HTMLTableRowElement>(
            `#${CSS.escape(tableId)} [data-resource-row]`,
        ),
    ];
}

function matchingCount(tableId: string, query: string) {
    return rows(tableId).filter((row) => (row.dataset.search ?? '').includes(query)).length;
}

function apply(tableId: string, state: State) {
    const matching = rows(tableId).filter((row) =>
        (row.dataset.search ?? '').includes(state.query),
    );
    const pages = Math.max(1, Math.ceil(matching.length / state.pageSize));
    const page = Math.min(state.page, pages);
    const visible = new Set(matching.slice((page - 1) * state.pageSize, page * state.pageSize));
    for (const row of rows(tableId)) row.hidden = !visible.has(row);
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
}
