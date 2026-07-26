'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { NotificationItem, NotificationTone } from '@/lib/notifications/types';

const toneClasses: Record<NotificationTone, string> = {
    brand: 'bg-brand-soft text-brand',
    success: 'bg-[#e8f7f1] text-success',
    warning: 'bg-[#fff5e9] text-warning',
};

export function NotificationCenter() {
    const root = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);

    useEffect(() => {
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
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

    async function toggle() {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (!nextOpen || loaded || loading) return;
        setLoading(true);
        try {
            const response = await fetch('/api/notifications?limit=5');
            const payload = (await response.json()) as {
                data?: NotificationItem[];
            };
            setItems(response.ok ? (payload.data ?? []) : []);
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    }

    return (
        <div ref={root} className="relative">
            <Button
                type="button"
                className="shell-icon-button glass-panel-soft relative grid size-11 place-items-center rounded-2xl text-[#737187] transition hover:-translate-y-0.5 hover:text-brand"
                aria-label="Abrir notificações"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={toggle}
            >
                <Icon name="bell" className="size-[17px]" />
                {loaded && items.length > 0 && (
                    <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-brand ring-2 ring-white" />
                )}
            </Button>

            {open && (
                <section
                    role="dialog"
                    aria-label="Notificações recentes"
                    className="notification-popover glass-popover absolute right-0 top-[calc(100%+10px)] z-[90] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-[22px]"
                >
                    <header className="flex items-center justify-between gap-4 border-b border-white/70 px-4 py-4">
                        <div>
                            <h2 className="text-[13px] font-semibold">Notificações recentes</h2>
                            <p className="mt-1 text-[10px] text-muted">
                                Atualizações da sua operação
                            </p>
                        </div>
                        <Link
                            href="/notifications"
                            onClick={() => setOpen(false)}
                            className="text-[11px] font-semibold text-brand-strong hover:underline"
                        >
                            Ver todas
                        </Link>
                    </header>

                    <div className="max-h-[380px] overflow-y-auto p-2">
                        {loading ? (
                            <p className="px-3 py-8 text-center text-[12px] text-muted">
                                Carregando notificações...
                            </p>
                        ) : items.length ? (
                            items.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-white/55"
                                >
                                    <span
                                        className={`grid size-8 shrink-0 place-items-center rounded-xl ${toneClasses[item.tone]}`}
                                    >
                                        <Icon name={item.icon} className="size-3.5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[12px] font-semibold">
                                            {item.title}
                                        </span>
                                        <span className="mt-1 block truncate text-[11px] text-muted">
                                            {item.description}
                                        </span>
                                        <time
                                            dateTime={item.createdAt}
                                            className="mt-1.5 block text-[10px] text-muted"
                                        >
                                            {relativeTime(item.createdAt)}
                                        </time>
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <div className="px-4 py-10 text-center">
                                <Icon name="bell" className="mx-auto size-5 text-brand/55" />
                                <p className="mt-3 text-[12px] font-semibold">
                                    Nenhuma notificação recente
                                </p>
                                <p className="mt-1 text-[11px] text-muted">
                                    As atualizações da operação aparecerão aqui.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

function relativeTime(value: string) {
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (elapsed < 60) return 'Agora';
    if (elapsed < 3600) return `Há ${Math.floor(elapsed / 60)} min`;
    if (elapsed < 86_400) return `Há ${Math.floor(elapsed / 3600)} h`;
    if (elapsed < 604_800) return `Há ${Math.floor(elapsed / 86_400)} d`;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}
