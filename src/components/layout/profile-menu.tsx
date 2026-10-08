'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { applyDashboardThemeClasses } from '@/components/ui/theme-switch';
import type { CurrentUser } from '@/lib/api/types';

export function ProfileMenu({
    user,
    contextLabel,
    logoutAction,
    settingsHref,
    placement = 'header',
    collapsed = false,
    theme,
}: {
    user: CurrentUser;
    contextLabel: string;
    logoutAction: string;
    settingsHref?: string;
    placement?: 'header' | 'sidebar';
    collapsed?: boolean;
    theme?: { dark: boolean; onToggle: () => void };
}) {
    const sidebar = placement === 'sidebar';
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
                title={sidebar && collapsed ? user.name : undefined}
                className={
                    sidebar
                        ? `shell-profile group flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-foreground/[0.04] ${open ? 'bg-foreground/[0.04]' : ''} ${collapsed ? 'lg:justify-center lg:p-1' : ''}`
                        : 'shell-profile shell-header-control group flex min-h-11 items-center gap-2.5 rounded-2xl px-1.5 py-1 text-left transition hover:-translate-y-0.5'
                }
            >
                <span className="shell-avatar grid size-9 shrink-0 place-items-center rounded-full bg-highlight text-[10px] font-bold text-highlight-contrast">
                    {initials(user.name)}
                </span>
                <span
                    className={
                        sidebar
                            ? `min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`
                            : 'hidden min-w-0 xl:block'
                    }
                >
                    <span className="shell-user-name block max-w-32 truncate text-[11px] font-semibold text-[#1a1a1a]">
                        {user.name}
                    </span>
                    <span className="mt-0.5 block max-w-32 truncate text-[9px] text-muted">
                        {contextLabel}
                    </span>
                </span>
                <Icon
                    name="chevron-down"
                    className={`size-3 shrink-0 text-muted transition-transform ${
                        sidebar ? `mr-1 ${collapsed ? 'lg:hidden' : ''}` : 'hidden xl:block'
                    } ${open !== sidebar ? 'rotate-180' : ''}`}
                />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                            reduceMotion
                                ? { opacity: 0 }
                                : {
                                      opacity: 0,
                                      y: -2,
                                      transition: { duration: 0.1, ease: 'easeIn' },
                                  }
                        }
                        transition={
                            reduceMotion
                                ? { duration: 0 }
                                : { duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }
                        }
                        style={{
                            transformOrigin: sidebar ? 'bottom left' : 'top right',
                        }}
                        className={`glass-popover absolute z-[120] w-[260px] overflow-hidden rounded-[20px] p-2 ${
                            sidebar
                                ? `bottom-[calc(100%+8px)] left-0 ${collapsed ? 'lg:bottom-0 lg:left-[calc(100%+10px)]' : ''}`
                                : 'right-0 top-[calc(100%+10px)]'
                        }`}
                    >
                        <div className="border-b border-border px-3 py-3">
                            <p className="truncate text-[12px] font-semibold">{user.name}</p>
                            <p className="mt-1 truncate text-[10px] text-muted">{user.email}</p>
                        </div>
                        <div className="py-1.5">
                            {theme && (
                                <Button
                                    type="button"
                                    role="menuitemcheckbox"
                                    aria-checked={theme.dark}
                                    onClick={() => {
                                        applyDashboardThemeClasses(!theme.dark);
                                        theme.onToggle();
                                    }}
                                    className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[11px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                                >
                                    <Icon name={theme.dark ? 'moon' : 'sun'} className="size-4" />
                                    <span className="flex-1">Tema escuro</span>
                                    <span
                                        aria-hidden="true"
                                        className={`relative h-[18px] w-[30px] rounded-full transition-colors duration-200 ${theme.dark ? 'bg-brand' : 'bg-border'}`}
                                    >
                                        <span
                                            className={`absolute left-[3px] top-[3px] size-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${theme.dark ? 'translate-x-3' : ''}`}
                                        />
                                    </span>
                                </Button>
                            )}
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
