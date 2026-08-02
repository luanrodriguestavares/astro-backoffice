'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

type ToastInput = {
    title?: string;
    description: string;
    tone?: ToastTone;
    duration?: number;
};

type ToastItem = Required<Pick<ToastInput, 'description' | 'tone' | 'duration'>> &
    Pick<ToastInput, 'title'> & { id: string };

const toastEvent = 'astro:toast';

export function showToast(input: ToastInput) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent<ToastItem>(toastEvent, {
            detail: {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                description: input.description,
                title: input.title,
                tone: input.tone ?? 'info',
                duration: input.duration ?? 4_500,
            },
        }),
    );
}

export function ToastViewport() {
    const [items, setItems] = useState<ToastItem[]>([]);

    useEffect(() => {
        function receive(event: Event) {
            const item = (event as CustomEvent<ToastItem>).detail;
            setItems((current) => [...current.slice(-3), item]);
        }

        window.addEventListener(toastEvent, receive);
        return () => window.removeEventListener(toastEvent, receive);
    }, []);

    const dismiss = useCallback((id: string) => {
        setItems((current) => current.filter((item) => item.id !== id));
    }, []);

    return (
        <div
            aria-label="Notificações"
            className="pointer-events-none fixed right-4 top-4 z-[220] flex w-[min(390px,calc(100vw-2rem))] flex-col gap-2.5 sm:right-6 sm:top-6"
        >
            {items.map((item) => (
                <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
            ))}
        </div>
    );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
    const [closing, setClosing] = useState(false);
    const close = useCallback(() => {
        setClosing(true);
        window.setTimeout(onDismiss, 220);
    }, [onDismiss]);

    useEffect(() => {
        const timeout = window.setTimeout(close, item.duration);
        return () => window.clearTimeout(timeout);
    }, [close, item.duration]);

    const presentation = toastPresentation(item.tone);
    return (
        <section
            role={item.tone === 'error' ? 'alert' : 'status'}
            aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
            data-closing={closing}
            className="astro-toast pointer-events-auto overflow-hidden rounded-2xl border border-border bg-surface/96 shadow-[0_22px_65px_rgba(31,27,60,.18)] backdrop-blur-xl"
        >
            <div className="flex items-start gap-3.5 p-4 pr-3">
                <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl ${presentation.iconClass}`}
                >
                    <Icon name={presentation.icon} className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[12px] font-semibold text-foreground">
                        {item.title ?? presentation.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">{item.description}</p>
                </div>
                <Button
                    type="button"
                    aria-label="Fechar aviso"
                    onClick={close}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name="close" className="size-3.5" />
                </Button>
            </div>
            <span className="mx-3 mb-2 block h-1 overflow-hidden rounded-full bg-surface-muted">
                <span
                    className={`toast-progress block h-full origin-left rounded-full ${presentation.progressClass}`}
                    style={{ animationDuration: `${item.duration}ms` }}
                />
            </span>
        </section>
    );
}

function toastPresentation(tone: ToastTone): {
    title: string;
    icon: IconName;
    iconClass: string;
    progressClass: string;
} {
    if (tone === 'success')
        return {
            title: 'Tudo certo',
            icon: 'check',
            iconClass: 'bg-success/10 text-success',
            progressClass: 'bg-success',
        };
    if (tone === 'error')
        return {
            title: 'Não foi possível concluir',
            icon: 'close',
            iconClass: 'bg-danger/10 text-danger',
            progressClass: 'bg-danger',
        };
    if (tone === 'warning')
        return {
            title: 'Atenção',
            icon: 'bolt',
            iconClass: 'bg-warning/10 text-warning',
            progressClass: 'bg-warning',
        };
    return {
        title: 'Informação',
        icon: 'bell',
        iconClass: 'bg-brand-soft text-brand-strong',
        progressClass: 'bg-brand',
    };
}
