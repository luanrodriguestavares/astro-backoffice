'use client';

import { FieldLabel } from '@puckeditor/core';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

const quickColors = [
    '#6d5df4',
    '#2563eb',
    '#0891b2',
    '#059669',
    '#ca8a04',
    '#ea580c',
    '#dc2626',
    '#db2777',
    '#18181b',
    '#ffffff',
];

type Hsv = { h: number; s: number; v: number };

export function ColorPickerField({
    label,
    name,
    value,
    onChange,
}: {
    label?: string;
    name: string;
    value?: string;
    onChange: (value: string) => void;
}) {
    const selected = normalizeColor(value);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<Hsv>(() => hexToHsv(selected));
    const [hexInput, setHexInput] = useState(selected);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const popover = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function close(event: PointerEvent) {
            const target = event.target as Node;
            if (!root.current?.contains(target) && !popover.current?.contains(target))
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
            if (!trigger.current) return;
            const rect = trigger.current.getBoundingClientRect();
            const viewportPadding = 12;
            const gap = 8;
            const width = Math.min(304, window.innerWidth - viewportPadding * 2);
            const preferredLeft = rect.right - width;
            const left = Math.min(
                Math.max(viewportPadding, preferredLeft),
                window.innerWidth - width - viewportPadding,
            );
            const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
            const availableAbove = rect.top - gap - viewportPadding;
            const openAbove = availableBelow < 390 && availableAbove > availableBelow;

            setPopoverStyle({
                position: 'fixed',
                ...(openAbove
                    ? { bottom: window.innerHeight - rect.top + gap }
                    : { top: rect.bottom + gap }),
                left,
                width,
                maxHeight: Math.max(
                    240,
                    Math.min(430, openAbove ? availableAbove : availableBelow),
                ),
                zIndex: 160,
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

    function openPicker() {
        const next = hexToHsv(selected);
        setDraft(next);
        setHexInput(selected);
        setOpen((current) => !current);
    }

    function updateDraft(next: Hsv) {
        const safe = { h: clamp(next.h, 0, 360), s: clamp(next.s, 0, 1), v: clamp(next.v, 0, 1) };
        const hex = hsvToHex(safe);
        setDraft(safe);
        setHexInput(hex);
        onChange(hex);
    }

    function chooseQuickColor(color: string) {
        const normalized = normalizeColor(color);
        setDraft(hexToHsv(normalized));
        setHexInput(normalized);
        onChange(normalized);
    }

    const picker = open && (
        <div
            ref={popover}
            role="dialog"
            aria-label={`Selecionar ${label?.toLowerCase() ?? 'cor'}`}
            style={popoverStyle}
            className="overflow-y-auto rounded-2xl border border-[#e1dfea] bg-white p-3.5 text-[#24253c] shadow-[0_22px_65px_rgba(35,30,74,.22)]"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <strong className="block text-[13px]">Personalizar cor</strong>
                    <span className="mt-0.5 block text-[10px] text-muted">
                        As alterações são aplicadas em tempo real.
                    </span>
                </div>
                <Button
                    type="button"
                    aria-label="Fechar seletor"
                    onClick={() => setOpen(false)}
                    className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-muted"
                >
                    <Icon name="close" className="size-3.5" />
                </Button>
            </div>

            <SaturationValue value={draft} onChange={updateDraft} />

            <label className="mt-3 grid gap-1.5 text-[11px] font-semibold text-[#67677b]">
                Matiz
                <input
                    className="checkout-color-hue"
                    type="range"
                    min={0}
                    max={360}
                    value={Math.round(draft.h)}
                    aria-label="Matiz da cor"
                    onChange={(event) =>
                        updateDraft({ ...draft, h: Number(event.currentTarget.value) })
                    }
                />
            </label>

            <div className="mt-3 grid grid-cols-[42px_minmax(0,1fr)] gap-2">
                <span
                    className="rounded-xl border border-black/10"
                    style={{ background: hsvToHex(draft) }}
                    aria-hidden="true"
                />
                <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#77778a]">
                    Hexadecimal
                    <input
                        value={hexInput}
                        maxLength={7}
                        spellCheck={false}
                        className="h-10 rounded-xl border border-[#dcd9e8] bg-white px-3 font-mono text-[13px] uppercase text-[#24253c] outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,244,.13)]"
                        onChange={(event) => {
                            const next = event.currentTarget.value;
                            setHexInput(next);
                            if (/^#[0-9a-f]{6}$/i.test(next)) {
                                const normalized = next.toLowerCase();
                                setDraft(hexToHsv(normalized));
                                onChange(normalized);
                            }
                        }}
                        onBlur={() => {
                            if (!/^#[0-9a-f]{6}$/i.test(hexInput)) setHexInput(hsvToHex(draft));
                        }}
                    />
                </label>
            </div>

            <div className="mt-3">
                <span className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#77778a]">
                    Cores rápidas
                </span>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {quickColors.map((color) => (
                        <Button
                            key={color}
                            type="button"
                            aria-label={`Selecionar ${color}`}
                            aria-pressed={hexInput.toLowerCase() === color}
                            onClick={() => chooseQuickColor(color)}
                            className={`h-8 rounded-lg border transition ${hexInput.toLowerCase() === color ? 'border-brand shadow-[0_0_0_2px_rgba(109,93,244,.18)]' : 'border-black/10 hover:scale-[1.04]'}`}
                            style={{ background: color }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <FieldLabel label={label ?? 'Cor'}>
            <div ref={root}>
                <input type="hidden" name={name} value={selected} />
                <Button
                    ref={trigger}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={openPicker}
                    className={`flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-2.5 text-left outline-none transition ${open ? 'border-brand shadow-[0_0_0_3px_rgba(109,93,244,.13)]' : 'border-[#dedce8] hover:border-brand/40'}`}
                >
                    <span
                        className="size-7 shrink-0 rounded-lg border border-black/10 shadow-inner"
                        style={{ background: selected }}
                    />
                    <span className="min-w-0 flex-1">
                        <span className="block text-[9px] font-semibold uppercase tracking-[.08em] text-muted">
                            Cor atual
                        </span>
                        <span className="block font-mono text-[12px] uppercase text-foreground">
                            {selected}
                        </span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand">
                        Editar <Icon name="edit" className="size-3" />
                    </span>
                </Button>
                {picker && createPortal(picker, document.body)}
            </div>
        </FieldLabel>
    );
}

function SaturationValue({ value, onChange }: { value: Hsv; onChange: (value: Hsv) => void }) {
    const surface = useRef<HTMLDivElement>(null);

    function update(event: React.PointerEvent<HTMLDivElement>) {
        const rect = surface.current?.getBoundingClientRect();
        if (!rect) return;
        onChange({
            h: value.h,
            s: clamp((event.clientX - rect.left) / rect.width, 0, 1),
            v: clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1),
        });
    }

    return (
        <div
            ref={surface}
            className="relative mt-3 h-36 touch-none cursor-crosshair overflow-hidden rounded-xl border border-black/10"
            style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${value.h} 100% 50%)`,
            }}
            onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                update(event);
            }}
            onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event);
            }}
        >
            <span
                className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,.55)]"
                style={{
                    left: `${value.s * 100}%`,
                    top: `${(1 - value.v) * 100}%`,
                    background: hsvToHex(value),
                }}
            />
        </div>
    );
}

function normalizeColor(value?: string, fallback = '#6d5df4') {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
        ? value.toLowerCase()
        : fallback;
}

function hexToHsv(hex: string): Hsv {
    const normalized = normalizeColor(hex).slice(1);
    const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
    const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
    const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta) {
        if (max === r) h = 60 * (((g - b) / delta) % 6);
        else if (max === g) h = 60 * ((b - r) / delta + 2);
        else h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;
    return { h, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv) {
    const chroma = v * s;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - chroma;
    let [r, g, b] =
        h < 60
            ? [chroma, x, 0]
            : h < 120
              ? [x, chroma, 0]
              : h < 180
                ? [0, chroma, x]
                : h < 240
                  ? [0, x, chroma]
                  : h < 300
                    ? [x, 0, chroma]
                    : [chroma, 0, x];
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
