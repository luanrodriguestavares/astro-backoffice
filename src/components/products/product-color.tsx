'use client';

import type { CSSProperties } from 'react';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';

/** Tons sóbrios: funcionam como acento sobre o grafite/branco do painel, sem neon. */
export const productColorPresets: ReadonlyArray<{ value: string; label: string }> = [
    { value: '#52525b', label: 'Grafite' },
    { value: '#2563eb', label: 'Azul' },
    { value: '#4f46e5', label: 'Índigo' },
    { value: '#7c3aed', label: 'Violeta' },
    { value: '#db2777', label: 'Rosa' },
    { value: '#e11d48', label: 'Rubi' },
    { value: '#d97706', label: 'Âmbar' },
    { value: '#059669', label: 'Esmeralda' },
    { value: '#0e7490', label: 'Petróleo' },
];

export const defaultProductColor = '#2563eb';

const hexColor = /^#[0-9a-f]{6}$/i;

export function isProductColor(value: string | null | undefined): value is string {
    return typeof value === 'string' && hexColor.test(value);
}

/** Fundo sólido na cor do produto, sem contorno escuro e com glifo sempre branco. */
export function productColorStyle(color: string | null | undefined): CSSProperties {
    const resolvedColor = isProductColor(color) ? color : defaultProductColor;
    return {
        color: '#ffffff',
        background: resolvedColor,
        borderColor: 'transparent',
        boxShadow: `0 7px 20px color-mix(in srgb, ${resolvedColor} 22%, transparent)`,
    };
}

/** Ícone do produto com fundo sólido e glifo branco; registros antigos usam o azul padrão. */
export function ProductGlyph({
    icon,
    color,
    className = 'size-10 rounded-[13px]',
    iconClassName = 'size-4',
}: {
    icon: IconName;
    color: string | null | undefined;
    className?: string;
    iconClassName?: string;
}) {
    const style = productColorStyle(color);
    return (
        <span
            style={style}
            className={`relative grid shrink-0 place-items-center overflow-hidden border ${className}`}
        >
            <Icon name={icon} className={iconClassName} />
        </span>
    );
}

export function ProductColorPicker({
    value,
    icon,
    onChange,
}: {
    value: string;
    icon: IconName;
    onChange(value: string): void;
}) {
    return (
        <div className="text-[13px] font-semibold">
            Cor do produto
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-[var(--control-bg)] p-3">
                <ProductGlyph icon={icon} color={value} className="size-11 rounded-[14px]" />
                <div className="min-w-0 flex-1">
                    <div
                        role="radiogroup"
                        aria-label="Cor do produto"
                        className="flex flex-nowrap items-center gap-1"
                    >
                        {productColorPresets.map((preset) => (
                            <Swatch
                                key={preset.value}
                                label={preset.label}
                                color={preset.value}
                                selected={value?.toLowerCase() === preset.value}
                                onSelect={() => onChange(preset.value)}
                            />
                        ))}
                    </div>
                    <p className="mt-2 text-[11px] font-normal text-muted">
                        Aplicada ao ícone do produto no catálogo.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Swatch({
    label,
    color,
    selected,
    onSelect,
}: {
    label: string;
    color: string;
    selected: boolean;
    onSelect(): void;
}) {
    return (
        <Button
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={onSelect}
            className={`grid size-[26px] shrink-0 place-items-center rounded-full border transition ${
                selected
                    ? 'border-transparent shadow-[0_0_0_2px_var(--control-bg),0_0_0_3.5px_color-mix(in_srgb,var(--brand)_55%,transparent)]'
                    : 'border-border hover:scale-105'
            }`}
            style={{ background: color }}
        >
            {selected && (
                <span className="text-white">
                    <Icon name="check" className="size-3" />
                </span>
            )}
        </Button>
    );
}
