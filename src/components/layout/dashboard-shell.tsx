'use client';

import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { Brand } from '@/components/brand';
import { HeaderSearch } from '@/components/layout/header-search';
import { NotificationCenter } from '@/components/layout/notification-center';
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
                className={`astro-sidebar fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[#7770b4]/8 bg-white/62 px-4 py-5 shadow-[20px_0_80px_rgba(57,53,100,.035)] backdrop-blur-3xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-auto ${collapsed ? 'lg:px-2.5' : ''} ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <Button
                    type="button"
                    aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    aria-expanded={!collapsed}
                    title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    className="glass-panel-soft absolute -right-3 top-7 z-10 hidden size-7 place-items-center rounded-full text-[#8b899b] shadow-[0_8px_22px_rgba(55,50,105,.1)] transition hover:scale-105 hover:text-brand lg:grid"
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
                                className={`shell-nav-label mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a88a0] ${collapsed ? 'lg:hidden' : ''}`}
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
                <header className="astro-topbar sticky top-0 z-20 flex h-[76px] items-center gap-3 bg-gradient-to-b from-[#fafafe]/95 via-[#fafafe]/75 to-transparent px-4 backdrop-blur-xl sm:px-6 lg:px-9">
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
                        <Link
                            href="/settings"
                            aria-label="Abrir perfil e configurações"
                            className="shell-profile group flex items-center gap-2.5 rounded-2xl px-1.5 py-1 transition hover:bg-white/45"
                        >
                            <span className="shell-avatar grid size-9 shrink-0 place-items-center rounded-full border border-white/90 bg-gradient-to-br from-[#e9e5ff] to-white text-[10px] font-bold text-brand-strong shadow-sm">
                                {initials(user.name)}
                            </span>
                            <span className="hidden min-w-0 xl:block">
                                <span className="shell-user-name block max-w-28 truncate text-[11px] font-semibold text-[#24253c]">
                                    {user.name}
                                </span>
                                <span className="mt-0.5 block max-w-28 truncate text-[9px] text-muted">
                                    {organizationName}
                                </span>
                            </span>
                            <Icon
                                name="arrow-right"
                                className="hidden size-3 text-muted transition-transform group-hover:translate-x-0.5 xl:block"
                            />
                        </Link>
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
            className={`astro-nav-item group relative flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-all duration-200 ${collapsed ? 'lg:justify-center lg:gap-0 lg:px-2' : ''} ${active ? 'bg-gradient-to-r from-[#f0edff] to-[#f7f5ff] text-brand-strong shadow-[inset_0_0_0_1px_rgba(119,98,242,.08),0_8px_24px_rgba(99,82,190,.06)]' : 'text-[#656579] hover:bg-white/55 hover:text-[#26263d]'}`}
        >
            <Icon
                name={icon}
                className={`size-[16px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-brand' : 'text-[#858398]'}`}
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
                <span className="ml-auto size-1 rounded-full bg-brand shadow-[0_0_8px_rgba(109,93,244,.65)]" />
            )}
        </Link>
    );
}

function ProCard() {
    return (
        <div className="pro-glass-card group relative hidden overflow-hidden rounded-[22px] p-4 lg:block">
            <div className="relative z-10">
                <span className="grid size-8 place-items-center rounded-xl border border-white/80 bg-white/55 text-brand shadow-[inset_0_1px_0_white,0_8px_20px_rgba(100,78,225,.12)] backdrop-blur-xl transition duration-500 group-hover:-translate-y-0.5 group-hover:shadow-[inset_0_1px_0_white,0_10px_26px_rgba(100,78,225,.2)]">
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
            <div className="absolute -right-48 -top-56 size-[620px] rounded-full bg-[#cfc7ff]/8 blur-[90px]" />
            <div className="absolute -bottom-52 left-[24%] size-[520px] rounded-full bg-[#dce8ff]/11 blur-[100px]" />
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

function initials(value: string) {
    return (
        value
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'A'
    );
}
