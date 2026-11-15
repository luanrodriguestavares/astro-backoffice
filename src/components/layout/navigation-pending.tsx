'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SKELETON_AFTER_MS = 350;
const GIVE_UP_AFTER_MS = 15_000;

type Phase = 'idle' | 'pending' | 'slow';

export function NavigationPending({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [navigation, setNavigation] = useState<{ from: string; slow: boolean } | null>(null);
    const timers = useRef<number[]>([]);
    const [seenPathname, setSeenPathname] = useState(pathname);
    if (seenPathname !== pathname) {
        setSeenPathname(pathname);
        setNavigation(null);
    }
    const phase: Phase =
        navigation === null || navigation.from !== pathname
            ? 'idle'
            : navigation.slow
              ? 'slow'
              : 'pending';

    useEffect(() => {
        function onClick(event: MouseEvent) {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            )
                return;
            const anchor = (event.target as Element | null)?.closest?.('a[href]');
            if (!(anchor instanceof HTMLAnchorElement)) return;
            if (anchor.target && anchor.target !== '_self') return;
            if (anchor.hasAttribute('download')) return;
            const url = new URL(anchor.href, window.location.href);
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname) return;
            const from = window.location.pathname;
            timers.current.forEach((timer) => window.clearTimeout(timer));
            setNavigation({ from, slow: false });
            timers.current.length = 0;
            timers.current.push(
                window.setTimeout(
                    () =>
                        setNavigation((current) =>
                            current?.from === from ? { from, slow: true } : current,
                        ),
                    SKELETON_AFTER_MS,
                ),
                window.setTimeout(() => setNavigation(null), GIVE_UP_AFTER_MS),
            );
        }
        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, []);

    useEffect(() => {
        const pending = timers.current;
        return () => pending.forEach((timer) => window.clearTimeout(timer));
    }, []);

    return (
        <>
            <span className="nav-progress" data-phase={phase} aria-hidden />
            {phase === 'slow' && <PageSkeleton />}
            <div style={{ display: phase === 'slow' ? 'none' : 'contents' }}>{children}</div>
        </>
    );
}

export function PageSkeleton() {
    return (
        <div className="page-skeleton" role="status" aria-label="Carregando">
            <div className="mb-7 flex items-center justify-between gap-5">
                <div className="space-y-3">
                    <span className="skeleton-block block h-3 w-28 rounded-full" />
                    <span className="skeleton-block block h-8 w-64 rounded-xl" />
                    <span className="skeleton-block block h-3 w-80 max-w-[70vw] rounded-full" />
                </div>
                <span className="skeleton-block hidden h-11 w-40 rounded-full sm:block" />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="space-y-3 rounded-[22px] border border-border bg-surface p-5"
                    >
                        <span className="skeleton-block block h-3 w-20 rounded-full" />
                        <span className="skeleton-block block h-7 w-28 rounded-lg" />
                    </div>
                ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-[22px] border border-border bg-surface">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                    <div
                        key={row}
                        className="flex items-center gap-4 border-b border-border/70 px-5 py-4 last:border-b-0"
                    >
                        <span className="skeleton-block size-9 shrink-0 rounded-xl" />
                        <span className="flex-1 space-y-2">
                            <span className="skeleton-block block h-3 w-1/3 rounded-full" />
                            <span className="skeleton-block block h-2.5 w-1/2 rounded-full" />
                        </span>
                        <span className="skeleton-block hidden h-3 w-20 rounded-full sm:block" />
                    </div>
                ))}
            </div>
        </div>
    );
}
