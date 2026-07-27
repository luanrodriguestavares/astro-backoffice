'use client';

import { Button } from '@/components/ui/button';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icon } from '@/components/ui/icon';

export type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
    badge?: string;
};

export function CustomSelect({
    name,
    value,
    defaultValue,
    options,
    placeholder = 'Selecione',
    onValueChange,
    required,
    disabled,
}: {
    name: string;
    value?: string;
    defaultValue?: string;
    options: SelectOption[];
    placeholder?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
}) {
    const [internal, setInternal] = useState(defaultValue ?? '');
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [listboxStyle, setListboxStyle] = useState<React.CSSProperties>({});
    const selected = value ?? internal;
    const label = options.find((option) => option.value === selected)?.label;
    const hasOptions = options.length > 0;

    useEffect(() => {
        function close(event: PointerEvent) {
            const target = event.target as Node;
            if (!root.current?.contains(target) && !listboxRef.current?.contains(target))
                setOpen(false);
        }

        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', escape);
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', escape);
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        function position() {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const gap = 8;
            const viewportPadding = 12;
            const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
            const availableAbove = rect.top - gap - viewportPadding;
            const openAbove = availableBelow < 180 && availableAbove > availableBelow;
            const available = openAbove ? availableAbove : availableBelow;
            const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
            const left = Math.min(
                Math.max(viewportPadding, rect.left),
                window.innerWidth - width - viewportPadding,
            );

            setListboxStyle({
                position: 'fixed',
                ...(openAbove
                    ? { bottom: window.innerHeight - rect.top + gap }
                    : { top: rect.bottom + gap }),
                left,
                width,
                maxHeight: Math.max(96, Math.min(256, available)),
                zIndex: 220,
            });
        }

        position();
        window.addEventListener('resize', position);
        window.addEventListener('scroll', position, true);
        return () => {
            window.removeEventListener('resize', position);
            window.removeEventListener('scroll', position, true);
        };
    }, [open]);

    function choose(next: string) {
        setInternal(next);
        onValueChange?.(next);
        setOpen(false);
    }

    const listbox = open && (
        <div
            ref={listboxRef}
            role="listbox"
            aria-disabled={!hasOptions}
            style={listboxStyle}
            className="custom-select-popover max-h-64 overflow-y-auto rounded-2xl border border-white bg-white p-1.5 shadow-[0_20px_55px_rgba(39,33,82,.18)]"
        >
            {hasOptions ? (
                options.map((option) => (
                    <Button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={selected === option.value}
                        disabled={option.disabled}
                        onClick={() => choose(option.value)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${selected === option.value ? 'bg-brand-soft text-brand-strong' : 'hover:bg-surface-muted'} disabled:cursor-not-allowed disabled:opacity-55`}
                    >
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                        {option.badge && (
                            <span className="rounded-full bg-brand-soft px-2 py-1 text-[9px] font-semibold uppercase tracking-[.06em] text-brand-strong">
                                {option.badge}
                            </span>
                        )}
                        {selected === option.value && (
                            <Icon name="check" className="size-3.5 shrink-0 text-brand" />
                        )}
                    </Button>
                ))
            ) : (
                <div className="px-3 py-2.5 text-[13px] text-muted">Sem opções disponíveis</div>
            )}
        </div>
    );

    return (
        <div ref={root} className="relative">
            <input type="hidden" name={name} value={selected} required={required} />
            <Button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                className={`custom-select-trigger flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-3.5 text-left text-[13px] font-normal outline-none transition focus-visible:border-brand/70 focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_16%,transparent)] ${open ? 'border-brand/70 bg-white shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_16%,transparent)]' : 'border-border bg-white/70 hover:border-brand/45'} disabled:opacity-50`}
            >
                <span className={label ? 'text-foreground' : 'text-muted'}>
                    {label ?? placeholder}
                </span>
                <Icon
                    name="arrow-right"
                    className={`size-3.5 shrink-0 text-muted transition-transform ${open ? '-rotate-90 text-brand' : 'rotate-90'}`}
                />
            </Button>
            {listbox && createPortal(listbox, document.body)}
        </div>
    );
}
