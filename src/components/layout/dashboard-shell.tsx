'use client';

import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Brand } from '@/components/brand';
import { isHiddenInV1 } from '@/lib/features/release';
import { AppearanceOnboarding } from '@/components/dashboard/appearance-onboarding';
import { setAccentTheme } from '@/components/layout/accent-theme-controller';
import { HeaderSearch } from '@/components/layout/header-search';
import { NotificationCenter } from '@/components/layout/notification-center';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { ShellActionsProvider } from '@/components/layout/shell-actions';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { Icon, type IconName } from '@/components/ui/icon';
import type { CurrentUser, Organization } from '@/lib/api/types';
import { canAccessNavigationItem } from '@/lib/navigation/access';

type NavigationItem = {
    label: string;
    href: string;
    icon: IconName;
    exact?: boolean;
    badge?: string;
    permission?: string;
    feature?: string;
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

function getServerDashboardTheme(): 'light' {
    return 'light';
}

const overview: NavigationItem[] = [
    { label: 'Visão geral', href: '/dashboard', icon: 'home', exact: true },
    {
        label: 'Analytics',
        href: '/analytics',
        icon: 'chart',
        exact: true,
        permission: 'analytics.read',
        feature: 'reports.essential',
    },
];

const navigationGroups: { label: string; icon: IconName; items: NavigationItem[] }[] = [
    { label: 'Painel', icon: 'bolt', items: overview },
    {
        label: 'Vendas',
        icon: 'cart',
        items: [
            {
                label: 'Produtos',
                href: '/products',
                icon: 'box',
                exact: true,
                permission: 'products.read',
                feature: 'catalog.active_products',
            },
            {
                label: 'Checkouts',
                href: '/checkouts',
                icon: 'layout',
                exact: true,
                permission: 'products.read',
                feature: 'checkout.published',
            },
            {
                label: 'Cupons',
                href: '/coupons',
                icon: 'tag',
                permission: 'products.read',
                feature: 'coupons',
            },
            {
                label: 'Pedidos',
                href: '/orders',
                icon: 'cart',
                permission: 'payments.read',
                feature: 'commerce.orders',
            },
            {
                label: 'Pagamentos',
                href: '/payments',
                icon: 'card',
                permission: 'payments.read',
                feature: 'commerce.orders',
            },
            {
                label: 'Assinaturas',
                href: '/subscriptions',
                icon: 'repeat',
                permission: 'subscriptions.read',
                feature: 'subscriptions.active',
            },
            {
                label: 'Clientes',
                href: '/customers',
                icon: 'users',
                permission: 'products.read',
                feature: 'catalog.active_products',
            },
        ],
    },
    {
        label: 'Conteúdo',
        icon: 'folder',
        items: [
            {
                label: 'Biblioteca de mídia',
                href: '/files',
                icon: 'image',
                permission: 'products.read',
                feature: 'media.storage_bytes',
            },
        ],
    },
    {
        label: 'Comunidade',
        icon: 'heart',
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
        icon: 'box',
        items: [
            {
                label: 'Estoque',
                href: '/inventory',
                icon: 'box',
                badge: 'Em breve',
                permission: 'products.read',
                feature: 'products.physical',
            },
            {
                label: 'Frete',
                href: '/shipping',
                icon: 'link',
                badge: 'Em breve',
                permission: 'products.read',
                feature: 'products.physical',
            },
        ],
    },
    {
        label: 'Financeiro',
        icon: 'card',
        items: [
            {
                label: 'Faturas',
                href: '/invoices',
                icon: 'card',
                permission: 'invoices.read',
                feature: 'commerce.orders',
            },
            {
                label: 'Reembolsos',
                href: '/refunds',
                icon: 'refund',
                permission: 'payments.read',
                feature: 'commerce.orders',
            },
        ],
    },
    {
        // Decide por onde cada venda é cobrada; Integrações só conecta os provedores.
        label: 'Orquestração',
        icon: 'route',
        items: [
            {
                label: 'Resumo',
                href: '/orchestration',
                icon: 'pulse',
                exact: true,
                permission: 'payments.read',
                feature: 'gateways.connected',
            },
            {
                label: 'Regras',
                href: '/orchestration/rules',
                icon: 'route',
                permission: 'gateway_connections.manage',
                feature: 'gateways.connected',
            },
            {
                label: 'Taxas',
                href: '/orchestration/costs',
                icon: 'coins',
                permission: 'gateway_connections.manage',
                feature: 'gateways.connected',
            },
        ],
    },
    {
        label: 'Integrações',
        icon: 'plug',
        items: [
            {
                label: 'Gateways',
                href: '/gateways',
                icon: 'plug',
                permission: 'gateway_connections.manage',
                feature: 'gateways.connected',
            },
            {
                label: 'Webhooks',
                href: '/webhooks',
                icon: 'webhook',
                permission: 'webhooks.manage',
                feature: 'webhooks.custom',
            },
            {
                label: 'Pixels',
                href: '/pixels',
                icon: 'chart',
                permission: 'tracking.manage',
                feature: 'marketing.pixels',
            },
            {
                label: 'Desenvolvedores',
                href: '/developer',
                icon: 'code',
                permission: 'api_keys.manage',
                feature: 'api',
            },
        ],
    },
    {
        label: 'Configurações',
        icon: 'settings',
        items: [
            {
                label: 'Equipe',
                href: '/team',
                icon: 'team',
                permission: 'members.manage',
                feature: 'workspace.members',
            },
            {
                label: 'Domínios do checkout',
                href: '/domains',
                icon: 'link',
                permission: 'checkouts.publish',
                feature: 'domains.custom',
            },
            {
                label: 'Plano e cobrança',
                href: '/settings?view=plan',
                icon: 'card',
            },
            { label: 'Conta', href: '/settings', icon: 'user', exact: true },
        ],
    },
];

export function DashboardShell({
    children,
    user,
    organization,
    organizations,
    billingAccess,
}: {
    children: React.ReactNode;
    user: CurrentUser;
    organization: Organization;
    organizations: Organization[];
    billingAccess: { active: boolean; features: string[] };
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const appearanceOnboarding = searchParams.get('onboarding') === 'appearance';
    const [open, setOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const dashboardTheme = useSyncExternalStore(
        subscribeDashboardTheme,
        getDashboardTheme,
        getServerDashboardTheme,
    );
    const organizationName = organization.displayName ?? organization.legalName ?? 'Organização';
    const permissions = new Set(organization.permissions ?? []);
    const canSee = (item: NavigationItem) =>
        !isHiddenInV1(item.href) && canAccessNavigationItem(item, permissions, billingAccess);
    const visibleNavigationGroups = navigationGroups
        .map((group) => ({
            ...group,
            items: group.items.filter(canSee),
        }))
        .filter((group) => group.items.length > 0);
    const inaccessibleRoute = navigationGroups
        .flatMap((group) => group.items)
        .filter((item) => item.feature !== undefined)
        .find((item) => matchesNavigationPath(pathname, item.href) && !canSee(item));
    const activeGroup =
        visibleNavigationGroups.find((group) =>
            group.items.some((item) => isActive(pathname, item.href, currentView, item.exact)),
        )?.label ?? null;
    const [expandedGroup, setExpandedGroup] = useState<string | null>(activeGroup);
    const [previousActiveGroup, setPreviousActiveGroup] = useState(activeGroup);
    if (activeGroup !== previousActiveGroup) {
        setPreviousActiveGroup(activeGroup);
        if (activeGroup !== null) setExpandedGroup(activeGroup);
    }
    const focusedEditor = /^\/checkouts\/[^/]+\/(?:builder|preview)\/?$/.test(pathname);
    const dashboardDark = dashboardTheme === 'dark';

    useEffect(() => {
        document.documentElement.classList.toggle('astro-dark-portals', dashboardDark);
        document.documentElement.classList.toggle('dashboard-dark', dashboardDark);
        return () => {
            document.documentElement.classList.remove('astro-dark-portals');
            document.documentElement.classList.remove('dashboard-dark');
        };
    }, [dashboardDark]);

    useEffect(() => {
        setAccentTheme(organization.accentTheme ?? 'astro');
    }, [organization.accentTheme]);

    useEffect(() => {
        if (inaccessibleRoute !== undefined) router.replace('/settings?view=plan');
    }, [inaccessibleRoute, router]);

    function toggleDashboardTheme() {
        const nextTheme = dashboardTheme === 'dark' ? 'light' : 'dark';
        window.localStorage.setItem(dashboardThemeStorageKey, nextTheme);
        window.dispatchEvent(new Event(dashboardThemeChangeEvent));
    }

    if (inaccessibleRoute !== undefined) {
        return (
            <div className="grid min-h-screen place-items-center bg-background text-[13px] text-muted">
                Redirecionando para os planos disponíveis…
            </div>
        );
    }

    if (focusedEditor) {
        return (
            <div
                className={
                    dashboardDark ? 'dashboard-dark min-h-screen' : 'min-h-screen bg-[#f6f6f6]'
                }
            >
                {children}
            </div>
        );
    }

    return (
        <div
            className={`astro-shell relative min-h-screen transition-[grid-template-columns] duration-200 ease-out lg:grid lg:h-screen lg:overflow-hidden ${dashboardDark ? 'dashboard-dark' : ''} ${collapsed ? 'lg:grid-cols-[76px_1fr]' : 'lg:grid-cols-[248px_1fr]'}`}
        >
            {/* Estende a faixa verde da logo por trás do canto arredondado do painel. */}
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 hidden h-16 bg-[#C6F448] transition-[width] duration-200 ease-out lg:block ${collapsed ? 'w-[100px]' : 'w-[272px]'}`}
            />

            <AppearanceOnboarding
                open={appearanceOnboarding}
                organization={organization}
                verification={searchParams.get('verification')}
            />

            {open && (
                <Button
                    type="button"
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-30 bg-[#111111]/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                data-tour="main-navigation"
                className={`astro-sidebar fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col px-4 py-5 transition-all duration-200 ease-out max-lg:border-r max-lg:border-border max-lg:bg-surface/96 max-lg:shadow-[18px_0_50px_rgb(16_18_20_/_8%)] max-lg:backdrop-blur-md lg:sticky lg:top-0 lg:h-screen lg:w-auto ${collapsed ? 'lg:px-2.5' : ''} ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <Button
                    type="button"
                    aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    aria-expanded={!collapsed}
                    title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    className="shell-header-control absolute -right-3 top-[50px] z-10 hidden size-7 place-items-center rounded-full text-muted shadow-[0_8px_22px_color-mix(in_srgb,var(--brand)_10%,transparent)] transition hover:scale-105 hover:text-brand lg:grid"
                    onClick={() => setCollapsed((value) => !value)}
                >
                    <Icon
                        name="arrow-right"
                        className={`size-3 transition-transform duration-200 ease-out ${collapsed ? '' : 'rotate-180'}`}
                    />
                </Button>

                <div
                    className={`relative -mx-4 -mt-5 flex h-16 items-center justify-center bg-[#C6F448] px-5 ${collapsed ? 'lg:-mx-2.5 lg:px-2.5' : ''}`}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted transition hover:bg-white/70 lg:hidden"
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
                    className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-width:none]"
                    aria-label="Navegação principal"
                >
                    {visibleNavigationGroups.map((group) => (
                        <NavGroup
                            key={group.label}
                            label={group.label}
                            icon={group.icon}
                            expanded={collapsed || expandedGroup === group.label}
                            containsActive={activeGroup === group.label}
                            collapsed={collapsed}
                            onToggle={() =>
                                setExpandedGroup((current) =>
                                    current === group.label ? null : group.label,
                                )
                            }
                        >
                            {group.items.map((item) => (
                                <NavItem
                                    key={`${group.label}-${item.label}`}
                                    label={item.label}
                                    href={item.href}
                                    icon={item.icon}
                                    active={isActive(pathname, item.href, currentView, item.exact)}
                                    collapsed={collapsed}
                                    badge={item.badge}
                                    onClick={() => setOpen(false)}
                                />
                            ))}
                        </NavGroup>
                    ))}
                </nav>

                {/* <div className="mt-auto pt-4">{!collapsed && <ProCard />}</div> */}

                <div className="shell-sidebar-footer mt-3 border-t border-border/70 pt-3">
                    <div data-tour="account-menu">
                        <ProfileMenu
                            user={user}
                            contextLabel={organizationName}
                            settingsHref="/settings"
                            logoutAction="/api/auth/logout"
                            placement="sidebar"
                            collapsed={collapsed}
                            theme={{ dark: dashboardDark, onToggle: toggleDashboardTheme }}
                        />
                    </div>
                </div>
            </aside>

            <div className="astro-shell-panel relative z-10 min-w-0 lg:h-screen lg:overflow-hidden lg:rounded-l-[24px]">
                <AmbientBackground />
                <div className="astro-shell-scroll relative lg:h-full lg:overflow-y-auto">
                    <header className="astro-topbar sticky top-0 z-20 flex h-16 items-center gap-3 bg-gradient-to-b from-background/95 via-background/75 to-transparent px-4 backdrop-blur-xl sm:px-6 lg:hidden">
                        <Button
                            type="button"
                            aria-label="Abrir menu"
                            className="glass-panel-soft rounded-xl p-2.5 text-muted"
                            onClick={() => setOpen(true)}
                        >
                            <Icon name="menu" />
                        </Button>
                        <Brand />
                    </header>

                    <main className="mx-auto w-full max-w-[1540px] px-4 pb-10 pt-3 sm:px-6 sm:pt-5 lg:px-10 lg:pb-14 lg:pt-8">
                        <ShellActionsProvider
                            actions={
                                <>
                                    <span data-tour="global-search">
                                        <HeaderSearch
                                            dark={dashboardDark}
                                            permissions={organization.permissions ?? []}
                                            billingAccess={billingAccess}
                                        />
                                    </span>
                                    <NotificationCenter
                                        storageScope={`${user.id}:${organization.id}`}
                                    />
                                </>
                            }
                        >
                            {children}
                        </ShellActionsProvider>
                    </main>
                </div>
            </div>
        </div>
    );
}

const navGroupTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] } as const;

function NavGroup({
    label,
    icon,
    expanded,
    containsActive,
    collapsed,
    onToggle,
    children,
}: {
    label: string;
    icon: IconName;
    expanded: boolean;
    containsActive: boolean;
    collapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    const reduceMotion = useReducedMotion();
    const transition = reduceMotion ? { duration: 0 } : navGroupTransition;

    return (
        <div className="astro-nav-group" data-collapsed={collapsed}>
            <Button
                type="button"
                aria-expanded={expanded}
                onClick={onToggle}
                data-expanded={expanded}
                className={`shell-nav-group group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted/80 transition-colors duration-200 hover:bg-foreground/[0.04] hover:text-foreground ${collapsed ? 'lg:hidden' : ''}`}
            >
                <Icon
                    name={icon}
                    className="shell-nav-group-icon size-[16px] shrink-0 text-muted transition-colors duration-200 group-hover:text-foreground"
                />
                <span className="flex-1 truncate">{label}</span>
                {containsActive && !expanded && (
                    <span className="astro-nav-active-dot size-1 rounded-full bg-brand" />
                )}
                <motion.span
                    className="grid place-items-center text-muted"
                    initial={false}
                    animate={{ rotate: expanded ? 0 : -90 }}
                    transition={transition}
                >
                    <Icon name="chevron-down" className="size-3" />
                </motion.span>
            </Button>
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="items"
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={transition}
                    >
                        <motion.div
                            className={`shell-nav-group-items space-y-0.5 pb-1.5 pt-0.5 ${collapsed ? 'lg:ml-0 lg:border-l-0 lg:pl-0' : ''} ml-[19.5px] border-l border-border pl-2`}
                            initial={{ y: -6 }}
                            animate={{ y: 0 }}
                            exit={{ y: -6 }}
                            transition={transition}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
    const reduceMotion = useReducedMotion();

    return (
        <motion.div whileHover={reduceMotion ? undefined : 'hover'} initial="rest" animate="rest">
            <Link
                href={href}
                onClick={onClick}
                title={collapsed ? `${label}${badge ? ` · ${badge}` : ''}` : undefined}
                aria-label={collapsed ? label : undefined}
                data-active={active}
                className={`astro-nav-item group relative flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium text-muted transition-all duration-200 hover:bg-foreground/[0.04] hover:text-foreground ${collapsed ? 'lg:justify-center lg:gap-0 lg:px-2' : ''}`}
            >
                <motion.span
                    className="grid shrink-0 place-items-center"
                    variants={{
                        rest: {
                            y: 0,
                            rotate: 0,
                            scale: 1,
                            transition: { type: 'spring', stiffness: 360, damping: 24 },
                        },
                        hover: {
                            y: -1,
                            rotate: -3,
                            scale: 1.04,
                            transition: { type: 'spring', stiffness: 480, damping: 34 },
                        },
                    }}
                >
                    <Icon
                        name={icon}
                        className={`size-[16px] ${active ? 'text-brand' : 'text-muted'}`}
                    />
                </motion.span>
                <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
                {badge && (
                    <span
                        className={`coming-soon-badge ml-auto rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.06em] ${collapsed ? 'lg:hidden' : ''}`}
                    >
                        {badge}
                    </span>
                )}
            </Link>
        </motion.div>
    );
}

/* function ProCard() {
    return (
        <div className="pro-glass-card group relative hidden overflow-hidden rounded-[22px] p-4 lg:block">
            <div className="relative z-10">
                <span className="pro-card-icon grid size-8 place-items-center rounded-xl border border-white/80 bg-white/55 text-brand backdrop-blur-xl transition duration-500 group-hover:-translate-y-0.5">
                    <Icon name="bolt" className="size-4" />
                </span>
                <p className="pro-card-title mt-3 text-[13px] font-semibold leading-5 tracking-[-0.02em] text-[#1a1a1a]">
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
} */

function AmbientBackground() {
    return (
        <div
            className="astro-ambient pointer-events-none fixed inset-0 z-0 overflow-hidden lg:absolute"
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

function matchesNavigationPath(pathname: string, href: string) {
    const [path] = href.split('?');
    return pathname === path || (path !== '/dashboard' && pathname.startsWith(`${path}/`));
}
