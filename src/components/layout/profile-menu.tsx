'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { CurrentUser } from '@/lib/api/types';

export function ProfileMenu({
    user,
    contextLabel,
    logoutAction,
    settingsHref,
}: {
    user: CurrentUser;
    contextLabel: string;
    logoutAction: string;
    settingsHref?: string;
}) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        function outside(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }

        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        window.addEventListener('pointerdown', outside);
        window.addEventListener('keydown', escape);
        return () => {
            window.removeEventListener('pointerdown', outside);
            window.removeEventListener('keydown', escape);
        };
    }, []);

    return (
        <div ref={root} className="relative">
            <Button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Abrir menu do perfil"
                onClick={() => setOpen((current) => !current)}
                className="shell-profile shell-header-control group flex min-h-11 items-center gap-2.5 rounded-2xl px-1.5 py-1 text-left transition hover:-translate-y-0.5"
            >
                <span className="shell-avatar grid size-9 shrink-0 place-items-center rounded-full border border-white/90 bg-gradient-to-br from-[#e9e5ff] to-white text-[10px] font-bold text-brand-strong shadow-sm">
                    {initials(user.name)}
                </span>
                <span className="hidden min-w-0 xl:block">
                    <span className="shell-user-name block max-w-32 truncate text-[11px] font-semibold text-[#24253c]">
                        {user.name}
                    </span>
                    <span className="mt-0.5 block max-w-32 truncate text-[9px] text-muted">
                        {contextLabel}
                    </span>
                </span>
                <Icon
                    name="chevron-down"
                    className={`hidden size-3 text-muted transition-transform xl:block ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        initial={
                            reduceMotion
                                ? false
                                : { opacity: 0, y: -8, scale: 0.97, filter: 'blur(5px)' }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: -5, scale: 0.98, filter: 'blur(3px)' }
                        }
                        transition={
                            reduceMotion
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 430, damping: 32, mass: 0.72 }
                        }
                        style={{ transformOrigin: 'top right' }}
                        className="glass-popover absolute right-0 top-[calc(100%+10px)] z-[120] w-[260px] overflow-hidden rounded-[20px] p-2"
                    >
                    <div className="border-b border-border px-3 py-3">
                        <p className="truncate text-[12px] font-semibold">{user.name}</p>
                        <p className="mt-1 truncate text-[10px] text-muted">{user.email}</p>
                    </div>
                    <div className="py-1.5">
                        {settingsHref && (
                            <Link
                                href={settingsHref}
                                role="menuitem"
                                onClick={() => setOpen(false)}
                                className="flex h-10 items-center gap-3 rounded-xl px-3 text-[11px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                            >
                                <Icon name="settings" className="size-4" />
                                Perfil e configurações
                            </Link>
                        )}
                        <form action={logoutAction} method="post">
                            <Button
                                type="submit"
                                role="menuitem"
                                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[11px] font-medium text-danger transition hover:bg-danger/8"
                            >
                                <Icon name="arrow-right" className="size-4 rotate-180" />
                                Sair
                            </Button>
                        </form>
                    </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function initials(name: string) {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'A'
    );
}
