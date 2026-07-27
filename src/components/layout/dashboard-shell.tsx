'use client';

import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { Brand } from '@/components/brand';
import { HeaderSearch } from '@/components/layout/header-search';
import { NotificationCenter } from '@/components/layout/notification-center';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { Icon, type IconName } from '@/components/ui/icon';
import type { CurrentUser, Organization } from '@/lib/api/types';

type NavigationItem = {
    label: string;
    href: string;
    icon: IconName;
    exact?: boolean;
    badge?: string;
};

const dashboardThemeStorageKey = 'astro-dashboard-theme';
const dashboardThemeChangeEvent = 'astro-dashboard-theme-change';

function subscribeDashboardTheme(onStoreChange: () => void) {
    window.addEventListener('storage', onStoreChange);
    window.addEventListener(dashboardThemeChangeEvent, onStoreChange);
    return () => {
        window.removeEventListener('storage', onStoreChange);
        window.removeEventListener(dashboardThemeChangeEvent, onStoreChange);
    };
}

function getDashboardTheme(): 'light' | 'dark' {
    const savedTheme = window.localStorage.getItem(dashboardThemeStorageKey);
    return savedTheme === 'light' ? 'light' : 'dark';
}

function getServerDashboardTheme(): 'dark' {
    return 'dark';
}

const overview: NavigationItem[] = [
    { label: 'Visão geral', href: '/dashboard', icon: 'home', exact: true },
];

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
    {
        label: 'Vendas',
        items: [
            { label: 'Produtos', href: '/products', icon: 'box', exact: true },
            { label: 'Checkouts', href: '/checkouts', icon: 'layout', exact: true },
            { label: 'Cupons', href: '/coupons', icon: 'tag' },
            { label: 'Pedidos', href: '/orders', icon: 'cart' },
            { label: 'Pagamentos', href: '/payments', icon: 'card' },
            { label: 'Assinaturas', href: '/subscriptions', icon: 'repeat' },
            { label: 'Clientes', href: '/customers', icon: 'users' },
        ],
    },
    {
        label: 'Conteúdo',
        items: [
            {
                label: 'Biblioteca de mídia',
                href: '/files',
                icon: 'image',
            },
        ],
    },
    {
        label: 'Comunidade',
        items: [
            {
                label: 'Roadmap',
                href: '/roadmap',
                icon: 'layout',
            },
        ],
    },
    {
        label: 'Produtos físicos',
        items: [
            {
                label: 'Estoque',
                href: '/inventory',
                icon: 'box',
                badge: 'Em breve',
            },
            {
                label: 'Frete',
                href: '/shipping',
                icon: 'link',
                badge: 'Em breve',
            },
        ],
    },
    {
        label: 'Financeiro',
        items: [
            { label: 'Faturas', href: '/invoices', icon: 'card' },
            { label: 'Reembolsos', href: '/refunds', icon: 'refund' },
        ],
    },
    {
        label: 'Integrações',
        items: [
            { label: 'Gateways', href: '/gateways', icon: 'plug' },
            { label: 'Webhooks', href: '/webhooks', icon: 'webhook' },
        ],
    },
    {
        label: 'Configurações',
        items: [
            { label: 'Equipe', href: '/team', icon: 'team' },
            { label: 'Conta', href: '/settings', icon: 'user', exact: true },
        ],
    },
];

export function DashboardShell({
    children,
    user,
    organization,
    organizations,
}: {
    children: React.ReactNode;
    user: CurrentUser;
    organization: Organization;
    organizations: Organization[];
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const [open, setOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const dashboardTheme = useSyncExternalStore(
        subscribeDashboardTheme,
        getDashboardTheme,
        getServerDashboardTheme,
    );
    const organizationName = organization.displayName ?? organization.legalName ?? 'Organização';
    const focusedEditor = /^\/checkouts\/[^/]+\/(?:builder|preview)\/?$/.test(pathname);
    const themeEnabled = !focusedEditor;
    const dashboardDark = themeEnabled && dashboardTheme === 'dark';

    useEffect(() => {
        document.documentElement.classList.toggle('astro-dark-portals', dashboardDark);
        return () => {
            document.documentElement.classList.remove('astro-dark-portals');
        };
    }, [dashboardDark]);

    function toggleDashboardTheme() {
        const nextTheme = dashboardTheme === 'dark' ? 'light' : 'dark';
        window.localStorage.setItem(dashboardThemeStorageKey, nextTheme);
        window.dispatchEvent(new Event(dashboardThemeChangeEvent));
    }

    if (focusedEditor) {
        return <div className="min-h-screen bg-[#f7f7fc]">{children}</div>;
    }

    return (
        <div
            className={`astro-shell min-h-screen transition-[grid-template-columns] duration-300 lg:grid ${dashboardDark ? 'dashboard-dark' : ''} ${collapsed ? 'lg:grid-cols-[76px_1fr]' : 'lg:grid-cols-[248px_1fr]'}`}
        >
            <AmbientBackground />

            {open && (
                <Button
                    type="button"
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-30 bg-[#17172c]/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`astro-sidebar fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-border/70 bg-white/62 px-4 py-5 shadow-[20px_0_80px_color-mix(in_srgb,var(--brand)_3.5%,transparent)] backdrop-blur-3xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-auto ${collapsed ? 'lg:px-2.5' : ''} ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <Button
                    type="button"
                    aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    aria-expanded={!collapsed}
                    title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    className="glass-panel-soft absolute -right-3 top-7 z-10 hidden size-7 place-items-center rounded-full text-muted shadow-[0_8px_22px_color-mix(in_srgb,var(--brand)_10%,transparent)] transition hover:scale-105 hover:text-brand lg:grid"
                    onClick={() => setCollapsed((value) => !value)}
                >
                    <Icon
                        name="arrow-right"
                        className={`size-3 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
                    />
                </Button>

                <div
                    className={`flex h-10 items-center justify-between ${collapsed ? 'lg:justify-center' : 'px-1'}`}
                >
                    <span className="lg:hidden">
                        <Brand />
                    </span>
                    <span className="hidden lg:inline-flex">
                        <Brand compact={collapsed} />
                    </span>
                    <Button
                        type="button"
                        aria-label="Fechar menu"
                        className="rounded-xl p-2 text-muted transition hover:bg-white/70 lg:hidden"
                        onClick={() => setOpen(false)}
                    >
                        <Icon name="close" />
                    </Button>
                </div>

                <WorkspaceSwitcher
                    current={organization}
                    organizations={organizations}
                    collapsed={collapsed}
                />

                <nav
                    className="mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 [scrollbar-width:none]"
                    aria-label="Navegação principal"
                >
                    {overview.map((item) => (
                        <NavItem
                            key={item.href}
                            label={item.label}
                            href={item.href}
                            icon={item.icon}
                            active={isActive(pathname, item.href, currentView, item.exact)}
                            collapsed={collapsed}
                            badge={item.badge}
                            onClick={() => setOpen(false)}
                        />
                    ))}
                    {navigationGroups.map((group) => (
                        <div key={group.label}>
                            <p
                                className={`shell-nav-label mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted ${collapsed ? 'lg:hidden' : ''}`}
                            >
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <NavItem
                                        key={`${group.label}-${item.label}`}
                                        label={item.label}
                                        href={item.href}
                                        icon={item.icon}
                                        active={isActive(
                                            pathname,
                                            item.href,
                                            currentView,
                                            item.exact,
                                        )}
                                        collapsed={collapsed}
                                        badge={item.badge}
                                        onClick={() => setOpen(false)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="mt-auto pt-4">{!collapsed && <ProCard />}</div>
            </aside>

            <div className="relative z-10 min-w-0">
                <header className="astro-topbar sticky top-0 z-20 flex h-[76px] items-center gap-3 bg-gradient-to-b from-background/95 via-background/75 to-transparent px-4 backdrop-blur-xl sm:px-6 lg:px-9">
                    <Button
                        type="button"
                        aria-label="Abrir menu"
                        className="glass-panel-soft rounded-xl p-2.5 text-muted lg:hidden"
                        onClick={() => setOpen(true)}
                    >
                        <Icon name="menu" />
                    </Button>

                    <HeaderSearch dark={dashboardDark} />

                    <div className="ml-auto flex items-center gap-2.5">
                        {themeEnabled && (
                            <Button
                                type="button"
                                role="switch"
                                aria-checked={dashboardDark}
                                aria-label={`Usar tema ${dashboardDark ? 'claro' : 'escuro'}`}
                                title={`Mudar para tema ${dashboardDark ? 'claro' : 'escuro'}`}
                                className="dashboard-theme-switch"
                                onClick={toggleDashboardTheme}
                            >
                                <Icon name="sun" className="size-3.5" />
                                <span className="dashboard-theme-switch-track" aria-hidden="true">
                                    <span className="dashboard-theme-switch-thumb" />
                                </span>
                                <Icon name="moon" className="size-3.5" />
                            </Button>
                        )}
                        <NotificationCenter />
                        <ProfileMenu
                            user={user}
                            contextLabel={organizationName}
                            settingsHref="/settings"
                            logoutAction="/api/auth/logout"
                        />
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1540px] px-4 pb-10 pt-3 sm:px-6 sm:pt-5 lg:px-10 lg:pb-14">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({
    label,
    href,
    icon,
    active,
    collapsed,
    badge,
    onClick,
}: {
    label: string;
    href: string;
    icon: IconName;
    active: boolean;
    collapsed: boolean;
    badge?: string;
    onClick: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            title={collapsed ? `${label}${badge ? ` · ${badge}` : ''}` : undefined}
            aria-label={collapsed ? label : undefined}
            data-active={active}
            className={`astro-nav-item group relative flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium text-muted transition-all duration-200 hover:bg-surface/55 hover:text-foreground ${collapsed ? 'lg:justify-center lg:gap-0 lg:px-2' : ''}`}
        >
            <Icon
                name={icon}
                className={`size-[16px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-brand' : 'text-muted'}`}
            />
            <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
            {badge && (
                <span
                    className={`coming-soon-badge ml-auto rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.06em] ${collapsed ? 'lg:hidden' : ''}`}
                >
                    {badge}
                </span>
            )}
            {active && !collapsed && !badge && (
                <span className="astro-nav-active-dot ml-auto size-1 rounded-full bg-brand" />
            )}
        </Link>
    );
}

function ProCard() {
    return (
        <div className="pro-glass-card group relative hidden overflow-hidden rounded-[22px] p-4 lg:block">
            <div className="relative z-10">
                <span className="pro-card-icon grid size-8 place-items-center rounded-xl border border-white/80 bg-white/55 text-brand backdrop-blur-xl transition duration-500 group-hover:-translate-y-0.5">
                    <Icon name="bolt" className="size-4" />
                </span>
                <p className="pro-card-title mt-3 text-[13px] font-semibold leading-5 tracking-[-0.02em] text-[#22233b]">
                    Eleve suas vendas com o Astro Pro
                </p>
                <p className="mt-1.5 text-[10px] leading-4 text-muted">
                    Recursos avançados, mais conversão e suporte prioritário.
                </p>
                <Link
                    href="/settings?view=plan"
                    className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand-strong transition-all duration-300 hover:gap-2"
                >
                    Conhecer o Pro
                    <Icon name="arrow-right" className="size-3" />
                </Link>
            </div>
        </div>
    );
}

function AmbientBackground() {
    return (
        <div
            className="astro-ambient pointer-events-none fixed inset-0 z-0 overflow-hidden"
            aria-hidden="true"
        >
            <div className="absolute -right-48 -top-56 size-[620px] rounded-full bg-brand opacity-[0.055] blur-[90px]" />
            <div className="absolute -bottom-52 left-[24%] size-[520px] rounded-full bg-brand opacity-[0.035] blur-[100px]" />
        </div>
    );
}

function isActive(pathname: string, href: string, currentView: string | null, exact = false) {
    const [path, query] = href.split('?');
    const targetView = query ? new URLSearchParams(query).get('view') : null;
    if (targetView) return pathname === path && currentView === targetView;
    return (
        (pathname === path && (!exact || currentView === null)) ||
        (!exact && path !== '/dashboard' && pathname.startsWith(`${path}/`))
    );
}
