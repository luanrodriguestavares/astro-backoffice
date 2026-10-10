'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Icon, type IconName } from '@/components/ui/icon';

export type MenuEntry =
    | {
          readonly label: string;
          readonly icon: IconName;
          readonly shortcut?: string;
          readonly danger?: boolean;
          readonly disabled?: boolean;
          onSelect(): void;
      }
    | 'separator';

/** Menu do botão direito: abre no cursor e nunca sai da tela. */
export function ContextMenu({
    x,
    y,
    title,
    entries,
    onClose,
}: {
    x: number;
    y: number;
    title?: string;
    entries: MenuEntry[];
    onClose(): void;
}) {
    const root = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ left: x, top: y });

    useLayoutEffect(() => {
        const rect = root.current?.getBoundingClientRect();
        if (!rect) return;
        setPosition({
            left: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
            top: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
        });
    }, [x, y]);

    useEffect(() => {
        function close(event: Event) {
            if (event instanceof PointerEvent && root.current?.contains(event.target as Node))
                return;
            onClose();
        }
        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }
        window.addEventListener('pointerdown', close);
        window.addEventListener('wheel', close, { passive: true });
        window.addEventListener('resize', close);
        window.addEventListener('keydown', escape);
        root.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('wheel', close);
            window.removeEventListener('resize', close);
            window.removeEventListener('keydown', escape);
        };
    }, [onClose]);

    return (
        <div
            ref={root}
            role="menu"
            aria-label={title ?? 'Ações'}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                event.preventDefault();
                const items = [
                    ...(root.current?.querySelectorAll<HTMLButtonElement>(
                        'button:not(:disabled)',
                    ) ?? []),
                ];
                const index = items.indexOf(document.activeElement as HTMLButtonElement);
                const next =
                    event.key === 'ArrowDown'
                        ? items[(index + 1) % items.length]
                        : items[(index - 1 + items.length) % items.length];
                next?.focus();
            }}
            className="glass-popover fixed z-[100] w-64 rounded-xl p-1.5 shadow-[0_18px_48px_rgba(16,18,20,0.18)]"
            style={position}
        >
            {title && (
                <p className="truncate px-2.5 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {title}
                </p>
            )}
            {entries.map((entry, index) =>
                entry === 'separator' ? (
                    <div key={`separator-${String(index)}`} className="my-1 h-px bg-border" />
                ) : (
                    <button
                        key={entry.label}
                        type="button"
                        role="menuitem"
                        disabled={entry.disabled}
                        onClick={() => {
                            onClose();
                            entry.onSelect();
                        }}
                        className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[12.5px] outline-none transition hover:bg-surface-muted focus-visible:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent ${entry.danger ? 'text-danger' : ''}`}
                    >
                        <Icon
                            name={entry.icon}
                            className={`size-3.5 ${entry.danger ? '' : 'text-muted'}`}
                        />
                        <span className="flex-1">{entry.label}</span>
                        {entry.shortcut && (
                            <kbd className="font-sans text-[10.5px] text-muted">
                                {entry.shortcut}
                            </kbd>
                        )}
                    </button>
                ),
            )}
        </div>
    );
}
