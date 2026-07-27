'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { Brand } from '@/components/brand';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import type { CurrentUser } from '@/lib/api/types';

type AdminNavItem = {
    label: string;
    href: string;
    icon: IconName;
    exact?: boolean;
    badge?: string;
};

const themeKey = 'astro-dashboard-theme';
const themeEvent = 'astro-dashboard-theme-change';

const navigation: AdminNavItem[] = [
    { label: 'Visão geral', href: '/admin', icon: 'home', exact: true },
    { label: 'Empresas', href: '/admin/organizations', icon: 'box' },
    { label: 'Usuários', href: '/admin/users', icon: 'users' },
    { label: 'Planos e limites', href: '/admin/plans', icon: 'card' },
    { label: 'Roadmap', href: '/admin/roadmap', icon: 'layout' },
    { label: 'Auditoria', href: '/admin/audit', icon: 'file' },
];

function subscribe(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener(themeEvent, onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(themeEvent, onChange);
    };
}

function clientTheme(): 'light' | 'dark' {
    return window.localStorage.getItem(themeKey) === 'light' ? 'light' : 'dark';
}

export function AdminShell({
    user,
    children,
}: {
    user: CurrentUser;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useSyncExternalStore(subscribe, clientTheme, () => 'dark');
    const dark = theme === 'dark';

    useEffect(() => {
        document.documentElement.classList.toggle('astro-dark-portals', dark);
        return () => document.documentElement.classList.remove('astro-dark-portals');
    }, [dark]);

    function toggleTheme() {
        const next = dark ? 'light' : 'dark';
        window.localStorage.setItem(themeKey, next);
        window.dispatchEvent(new Event(themeEvent));
    }

    return (
        <div className={`admin-shell astro-shell min-h-screen lg:grid lg:grid-cols-[244px_1fr] ${dark ? 'dashboard-dark' : ''}`}>
            {mobileOpen && (
                <Button
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-30 bg-[#11111d]/35 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <aside
                className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col border-r border-border/70 bg-surface/92 px-4 py-5 shadow-[18px_0_70px_rgba(30,27,60,.06)] backdrop-blur-3xl transition lg:sticky lg:top-0 lg:h-screen lg:w-auto ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex h-10 items-center justify-between px-1">
                    <Brand href="/admin" />
                    <Button
                        aria-label="Fechar menu"
                        className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-muted lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    >
                        <Icon name="close" className="size-4" />
                    </Button>
                </div>

                <div className="mt-5 rounded-[20px] border border-brand/12 bg-brand-soft/60 p-3.5">
                    <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_24px_rgba(109,93,244,.2)]">
                            <Icon name="settings" className="size-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-brand-strong">
                                Plataforma
                            </p>
                            <p className="mt-0.5 truncate text-[12px] font-semibold">Super admin</p>
                        </div>
                    </div>
                </div>

                <nav className="mt-6 flex-1 space-y-1" aria-label="Administração da plataforma">
                    <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[.16em] text-muted">
                        Operação Astro
                    </p>
                    {navigation.map((item) => {
                        const active =
                            pathname === item.href ||
                            (!item.exact && pathname.startsWith(`${item.href}/`));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`group flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium transition ${
                                    active
                                        ? 'bg-brand-soft text-brand-strong shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_8%,transparent)]'
                                        : 'text-muted hover:bg-surface-muted hover:text-foreground'
                                }`}
                            >
                                <Icon
                                    name={item.icon}
                                    className={`size-4 ${active ? 'text-brand' : 'text-muted'}`}
                                />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="ml-auto rounded-full bg-brand-soft px-2 py-1 text-[8px] font-semibold text-brand-strong">
                                        {item.badge}
                                    </span>
                                )}
                                {active && <span className="ml-auto size-1 rounded-full bg-brand" />}
                            </Link>
                        );
                    })}
                </nav>

            </aside>

            <div className="relative z-10 min-w-0">
                <header className="admin-topbar sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-border/45 bg-background/78 px-4 backdrop-blur-2xl sm:px-6 lg:px-9">
                    <Button
                        aria-label="Abrir menu"
                        className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted lg:hidden"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Icon name="menu" className="size-4" />
                    </Button>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-brand-strong">
                            Console da plataforma
                        </p>
                        <p className="mt-0.5 hidden text-[11px] text-muted sm:block">
                            Gestão interna e segura da operação Astro
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            role="switch"
                            aria-checked={dark}
                            aria-label={`Usar tema ${dark ? 'claro' : 'escuro'}`}
                            className="dashboard-theme-switch"
                            onClick={toggleTheme}
                        >
                            <Icon name="sun" className="size-3.5" />
                            <span className="dashboard-theme-switch-track" aria-hidden="true">
                                <span className="dashboard-theme-switch-thumb" />
                            </span>
                            <Icon name="moon" className="size-3.5" />
                        </Button>
                        <ProfileMenu
                            user={user}
                            contextLabel="Super admin"
                            logoutAction="/api/auth/admin-logout"
                        />
                    </div>
                </header>
                <main className="mx-auto w-full max-w-[1540px] px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
