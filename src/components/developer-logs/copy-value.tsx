'use client';

import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';

export async function copyText(
    value: string,
    description = 'Copiado para a área de transferência.',
) {
    try {
        await navigator.clipboard.writeText(value);
        showToast({ tone: 'success', description });
    } catch {
        showToast({
            tone: 'error',
            description: 'Não foi possível copiar. Selecione e copie manualmente.',
        });
    }
}

/** Identificador técnico em fonte mono com botão de copiar ao lado. */
export function CopyValue({
    value,
    label,
    className = '',
}: {
    value: string;
    label?: string;
    className?: string;
}) {
    return (
        <span className={`inline-flex min-w-0 max-w-full items-center gap-1 ${className}`}>
            {label && <span className="shrink-0 text-[10px] text-muted">{label}</span>}
            <code className="truncate font-mono text-[11px]" title={value}>
                {value}
            </code>
            <button
                type="button"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void copyText(value);
                }}
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-muted hover:text-foreground"
                aria-label={`Copiar ${label ?? value}`}
                title="Copiar"
            >
                <Icon name="copy" className="size-3" />
            </button>
        </span>
    );
}
