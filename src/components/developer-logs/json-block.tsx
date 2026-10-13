'use client';

import { Icon } from '@/components/ui/icon';

import { copyText } from './copy-value';

/** Bloco de JSON já mascarado pela API, com cópia do conteúdo formatado. */
export function JsonBlock({ title, value }: { title: string; value: unknown }) {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-[var(--control-bg)]">
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {title}
                </span>
                <button
                    type="button"
                    onClick={() => void copyText(text, `${title} copiado.`)}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name="copy" className="size-3" />
                    Copiar
                </button>
            </div>
            <pre className="max-h-[360px] overflow-auto p-3 font-mono text-[11px] leading-relaxed">
                {text}
            </pre>
        </div>
    );
}
