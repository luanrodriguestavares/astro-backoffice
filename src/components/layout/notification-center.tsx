'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { NotificationItem, NotificationTone } from '@/lib/notifications/types';

const toneClasses: Record<NotificationTone, string> = {
    brand: 'bg-brand-soft text-brand',
    success: 'bg-[#e8f7f1] text-success',
    warning: 'bg-[#fff5e9] text-warning',
};

const seenNotificationsKey = 'astro.seen-notifications';
const notificationOccurrencesKey = 'astro.notification-occurrences';

export function NotificationCenter({ storageScope }: { storageScope: string }) {
    const root = useRef<HTMLDivElement>(null);
    const loadedRef = useRef(false);
    const openRef = useRef(false);
    const [open, setOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unseenCount, setUnseenCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        if (!loadedRef.current) setLoading(true);
        try {
            const response = await fetch('/api/notifications?limit=30', { cache: 'no-store' });
            const payload = (await response.json()) as { data?: NotificationItem[] };
            const notifications = stabilizeNotificationOccurrences(
                storageScope,
                response.ok ? (payload.data ?? []) : [],
            ).sort(
                (left, right) =>
                    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
            );
            const seen = readSeenNotifications(storageScope);
            setItems(notifications);
            if (openRef.current) {
                writeSeenNotifications(
                    storageScope,
                    notifications.map((item) => item.id),
                );
                setUnseenCount(0);
            } else {
                setUnseenCount(notifications.filter((item) => !seen.has(item.id)).length);
            }
        } finally {
            setLoading(false);
            setLoaded(true);
            loadedRef.current = true;
        }
    }, [storageScope]);

    useEffect(() => {
        void loadNotifications();
        const interval = window.setInterval(() => void loadNotifications(), 30_000);
        function refreshWhenVisible() {
            if (document.visibilityState === 'visible') void loadNotifications();
        }
        document.addEventListener('visibilitychange', refreshWhenVisible);
        window.addEventListener('focus', refreshWhenVisible);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', refreshWhenVisible);
            window.removeEventListener('focus', refreshWhenVisible);
        };
    }, [loadNotifications]);

    useEffect(() => {
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) {
                openRef.current = false;
                setOpen(false);
            }
        }

        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                openRef.current = false;
                setOpen(false);
            }
        }

        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', escape);
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', escape);
        };
    }, []);

    function toggle() {
        const nextOpen = !open;
        openRef.current = nextOpen;
        setOpen(nextOpen);
        if (nextOpen) {
            writeSeenNotifications(
                storageScope,
                items.map((item) => item.id),
            );
            setUnseenCount(0);
            void loadNotifications();
        }
    }

    return (
        <div ref={root} className="relative">
            <Button
                type="button"
                className="shell-icon-button shell-header-control relative grid size-11 place-items-center rounded-2xl text-[#737187] transition hover:-translate-y-0.5 hover:text-brand"
                aria-label={
                    unseenCount > 0
                        ? `Abrir notificações: ${unseenCount} não vistas`
                        : 'Abrir notificações'
                }
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={toggle}
            >
                <Icon name="bell" className="size-[17px]" />
                {loaded && unseenCount > 0 && (
                    <span
                        className="notification-unseen-badge absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--brand)_38%,transparent)]"
                        aria-hidden="true"
                    >
                        {unseenCount > 99 ? '99+' : unseenCount}
                    </span>
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
                            onClick={() => {
                                openRef.current = false;
                                setOpen(false);
                            }}
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
                            items.slice(0, 5).map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => {
                                        openRef.current = false;
                                        setOpen(false);
                                    }}
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

function readSeenNotifications(storageScope: string): Set<string> {
    try {
        const stored = JSON.parse(
            window.localStorage.getItem(`${seenNotificationsKey}:${storageScope}`) ?? '[]',
        );
        return new Set(
            Array.isArray(stored)
                ? stored.filter((id): id is string => typeof id === 'string')
                : [],
        );
    } catch {
        return new Set();
    }
}

function writeSeenNotifications(storageScope: string, ids: string[]) {
    try {
        const seen = [...new Set([...readSeenNotifications(storageScope), ...ids])].slice(-200);
        window.localStorage.setItem(
            `${seenNotificationsKey}:${storageScope}`,
            JSON.stringify(seen),
        );
    } catch {
        // A indisponibilidade do armazenamento não deve impedir o uso do header.
    }
}

function stabilizeNotificationOccurrences(
    storageScope: string,
    notifications: NotificationItem[],
): NotificationItem[] {
    try {
        const key = `${notificationOccurrencesKey}:${storageScope}`;
        const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}') as unknown;
        const stored =
            typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
                ? (parsed as Record<string, unknown>)
                : {};
        const occurrences = new Map<string, string>();
        for (const [id, value] of Object.entries(stored))
            if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime()))
                occurrences.set(id, value);

        const stabilized = notifications.map((item) => {
            const createdAt = occurrences.get(item.id) ?? item.createdAt;
            occurrences.set(item.id, createdAt);
            return { ...item, createdAt };
        });
        window.localStorage.setItem(
            key,
            JSON.stringify(Object.fromEntries([...occurrences.entries()].slice(-200))),
        );
        return stabilized;
    } catch {
        return notifications;
    }
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
