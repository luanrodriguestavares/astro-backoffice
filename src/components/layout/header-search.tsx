'use client';

import { Button } from '@/components/ui/button';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Icon, type IconName } from '@/components/ui/icon';
import { isHiddenInV1 } from '@/lib/features/release';

type SearchResult = {
    id?: string;
    label: string;
    group: string;
    href: string;
    icon: IconName;
    description?: string;
    badge?: string;
};

const destinations: (SearchResult & {
    keywords?: string;
    permission?: string;
    feature?: string;
})[] = [
    {
        label: 'Visão geral',
        group: 'Principal',
        href: '/dashboard',
        icon: 'home',
        keywords: 'início dashboard',
    },
    {
        label: 'Produtos',
        group: 'Vendas',
        href: '/products',
        icon: 'box',
        permission: 'products.read',
        feature: 'catalog.active_products',
    },
    {
        label: 'Checkouts',
        group: 'Vendas',
        href: '/checkouts',
        icon: 'layout',
        permission: 'products.read',
        feature: 'checkout.published',
    },
    {
        label: 'Cupons',
        group: 'Vendas',
        href: '/coupons',
        icon: 'tag',
        permission: 'products.read',
        feature: 'coupons',
    },
    {
        label: 'Pedidos',
        group: 'Vendas',
        href: '/orders',
        icon: 'cart',
        permission: 'payments.read',
        feature: 'commerce.orders',
    },
    {
        label: 'Pagamentos',
        group: 'Vendas',
        href: '/payments',
        icon: 'card',
        permission: 'payments.read',
        feature: 'commerce.orders',
    },
    {
        label: 'Assinaturas',
        group: 'Vendas',
        href: '/subscriptions',
        icon: 'repeat',
        permission: 'subscriptions.read',
        feature: 'subscriptions.active',
    },
    {
        label: 'Clientes',
        group: 'Vendas',
        href: '/customers',
        icon: 'users',
        permission: 'products.read',
        feature: 'catalog.active_products',
    },
    {
        label: 'Estoque',
        group: 'Produtos físicos',
        href: '/inventory',
        icon: 'box',
        badge: 'Em breve',
        permission: 'products.read',
        feature: 'products.physical',
    },
    {
        label: 'Frete',
        group: 'Produtos físicos',
        href: '/shipping',
        icon: 'link',
        badge: 'Em breve',
        permission: 'products.read',
        feature: 'products.physical',
    },
    {
        label: 'Faturas',
        group: 'Financeiro',
        href: '/invoices',
        icon: 'card',
        permission: 'invoices.read',
        feature: 'commerce.orders',
    },
    {
        label: 'Reembolsos',
        group: 'Financeiro',
        href: '/refunds',
        icon: 'refund',
        permission: 'payments.read',
        feature: 'commerce.orders',
    },
    {
        label: 'Resumo da orquestração',
        group: 'Orquestração',
        href: '/orchestration',
        icon: 'pulse',
        permission: 'payments.read',
        feature: 'gateways.connected',
        keywords: 'aprovação recusas gateway reserva',
    },
    {
        label: 'Regras de recebimento',
        group: 'Orquestração',
        href: '/orchestration/rules',
        icon: 'route',
        permission: 'gateway_connections.manage',
        feature: 'gateways.connected',
        keywords: 'roteamento gateway reserva contingência',
    },
    {
        label: 'Taxas dos gateways',
        group: 'Orquestração',
        href: '/orchestration/costs',
        icon: 'coins',
        permission: 'gateway_connections.manage',
        feature: 'gateways.connected',
        keywords: 'custos tarifa percentual',
    },
    {
        label: 'Gateways',
        group: 'Integrações',
        href: '/gateways',
        icon: 'plug',
        permission: 'gateway_connections.manage',
        feature: 'gateways.connected',
    },
    {
        label: 'Webhooks',
        group: 'Integrações',
        href: '/webhooks',
        icon: 'webhook',
        permission: 'webhooks.manage',
        feature: 'webhooks.custom',
    },
    {
        label: 'Pixels e conversões',
        group: 'Integrações',
        href: '/pixels',
        icon: 'chart',
        keywords: 'meta facebook google analytics ads tiktok conversões capi tracking',
        permission: 'tracking.manage',
        feature: 'marketing.pixels',
    },
    {
        label: 'Desenvolvedores',
        group: 'Integrações',
        href: '/developer',
        icon: 'code',
        keywords: 'api chaves integração',
        permission: 'api_keys.manage',
        feature: 'api',
    },
    {
        label: 'Biblioteca de mídia',
        group: 'Conteúdo',
        href: '/files',
        icon: 'image',
        keywords: 'arquivos imagens documentos pdf',
        permission: 'products.read',
        feature: 'media.storage_bytes',
    },
    {
        label: 'Roadmap',
        group: 'Comunidade',
        href: '/roadmap',
        icon: 'layout',
        keywords: 'ideias sugestões comunidade melhorias',
    },
    {
        label: 'Equipe',
        group: 'Configurações',
        href: '/team',
        icon: 'team',
        permission: 'members.manage',
        feature: 'workspace.members',
    },
    {
        label: 'Domínios do checkout',
        group: 'Configurações',
        href: '/domains',
        icon: 'link',
        permission: 'checkouts.publish',
        feature: 'domains.custom',
        keywords: 'domínio dns cname checkout white label',
    },
    {
        label: 'Plano e cobrança',
        group: 'Configurações',
        href: '/settings?view=plan',
        icon: 'card',
        keywords: 'plano assinatura cobrança pagamento',
    },
    {
        label: 'Conta',
        group: 'Configurações',
        href: '/settings',
        icon: 'user',
        keywords: 'perfil organização',
    },
    {
        label: 'Notificações',
        group: 'Principal',
        href: '/notifications',
        icon: 'bell',
        keywords: 'atividade atualizações recentes',
    },
];

export function HeaderSearch({
    dark = false,
    permissions = [],
    billingAccess,
}: {
    dark?: boolean;
    permissions?: string[];
    billingAccess: { active: boolean; features: string[] };
}) {
    const shortcutLabel = useSyncExternalStore(
        subscribeNothing,
        () => (/mac|iphone|ipad/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K'),
        () => 'Ctrl K',
    );
    const router = useRouter();
    const rootRef = useRef<HTMLDivElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [globalSearch, setGlobalSearch] = useState<{
        query: string;
        results: SearchResult[];
        loading: boolean;
    }>({ query: '', results: [], loading: false });
    const reduceMotion = useReducedMotion();
    const mounted = useSyncExternalStore(
        subscribeNothing,
        () => true,
        () => false,
    );

    const navigationResults = useMemo(() => {
        const granted = new Set(permissions);
        const planFeatures = new Set(billingAccess.features);
        const available = destinations.filter(
            (item) =>
                !isHiddenInV1(item.href) &&
                (item.permission === undefined || granted.has(item.permission)) &&
                (item.feature === undefined ||
                    (billingAccess.active && planFeatures.has(item.feature))),
        );
        const normalized = normalize(query.trim());
        if (!normalized) return available.slice(0, 7);
        return available.filter((item) =>
            normalize(`${item.label} ${item.group} ${item.keywords ?? ''}`).includes(normalized),
        );
    }, [billingAccess, permissions, query]);

    const results = useMemo(() => {
        if (!query.trim()) return navigationResults;
        const unique = new Map<string, SearchResult>();
        const globalResults = globalSearch.query === query.trim() ? globalSearch.results : [];
        for (const result of [...globalResults, ...navigationResults])
            if (!unique.has(result.href)) unique.set(result.href, result);
        return [...unique.values()].slice(0, 21);
    }, [globalSearch, navigationResults, query]);
    const searching =
        query.trim().length >= 2 && (globalSearch.query !== query.trim() || globalSearch.loading);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) return;

        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setGlobalSearch({ query: term, results: [], loading: true });
            try {
                const response = await fetch(`/api/global-search?q=${encodeURIComponent(term)}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const payload = (await response.json()) as { data?: SearchResult[] };
                if (response.ok)
                    setGlobalSearch({ query: term, results: payload.data ?? [], loading: false });
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError'))
                    setGlobalSearch({ query: term, results: [], loading: false });
            }
        }, 240);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query]);

    useEffect(() => {
        function handleShortcut(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen(true);
                window.requestAnimationFrame(() => inputRef.current?.focus());
            }
            if (event.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
            }
        }

        function handleOutside(event: PointerEvent) {
            const target = event.target as Node;
            if (!rootRef.current?.contains(target) && !resultsRef.current?.contains(target))
                setOpen(false);
        }

        window.addEventListener('keydown', handleShortcut);
        window.addEventListener('pointerdown', handleOutside);
        return () => {
            window.removeEventListener('keydown', handleShortcut);
            window.removeEventListener('pointerdown', handleOutside);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        return () => {
            window.cancelAnimationFrame(frame);
            document.body.style.overflow = overflow;
        };
    }, [open]);

    function navigate(href: string) {
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
        router.push(href);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter' && results[activeIndex]) {
            event.preventDefault();
            navigate(results[activeIndex].href);
        }
    }

    return (
        <div ref={rootRef}>
            <Button
                type="button"
                aria-label="Buscar no Astro"
                title={`Buscar (${shortcutLabel})`}
                aria-keyshortcuts="Control+K Meta+K"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(true)}
                className="shell-search-trigger shell-header-control flex h-11 items-center gap-2.5 rounded-2xl px-3.5 text-[#737373] transition hover:text-foreground"
            >
                <Icon name="search" className="size-[17px]" />
                <kbd className="hidden rounded-md border border-border px-1.5 py-1 font-sans text-[9px] font-semibold leading-none text-muted sm:block">
                    {shortcutLabel}
                </kbd>
            </Button>

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                key="search"
                                className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: reduceMotion ? 0 : 0.12 }}
                            >
                                <Button
                                    type="button"
                                    aria-label="Fechar busca"
                                    tabIndex={-1}
                                    className="absolute inset-0 cursor-default bg-[#0b0c10]/30"
                                    onClick={() => setOpen(false)}
                                />
                                <motion.div
                                    ref={resultsRef}
                                    id="astro-search-results"
                                    role="dialog"
                                    aria-label="Busca"
                                    initial={reduceMotion ? false : { y: -6, scale: 0.98 }}
                                    animate={{ y: 0, scale: 1 }}
                                    exit={reduceMotion ? undefined : { y: -4, scale: 0.99 }}
                                    transition={
                                        reduceMotion
                                            ? { duration: 0 }
                                            : { duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }
                                    }
                                    className={`glass-popover relative flex max-h-[min(560px,calc(100vh-24vh))] w-full max-w-[580px] flex-col overflow-hidden rounded-[20px] ${dark ? 'dashboard-search-popover' : ''}`}
                                >
                                    <div className="global-search ui-control-frame m-3 flex h-11 items-center gap-3 px-3.5">
                                        <Icon
                                            name="search"
                                            className="size-4 shrink-0 text-muted"
                                        />
                                        <input
                                            ref={inputRef}
                                            value={query}
                                            onChange={(event) => {
                                                setQuery(event.target.value);
                                                setActiveIndex(0);
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Buscar páginas, clientes, pedidos..."
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="none"
                                            spellCheck={false}
                                            aria-label="Buscar no Astro"
                                            role="combobox"
                                            aria-autocomplete="list"
                                            aria-expanded={open}
                                            aria-controls="astro-search-results"
                                            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted"
                                        />
                                        {query && (
                                            <Button
                                                type="button"
                                                aria-label="Limpar busca"
                                                onClick={() => {
                                                    setQuery('');
                                                    inputRef.current?.focus();
                                                }}
                                                className="rounded-lg p-1 text-muted transition hover:bg-surface-muted hover:text-foreground"
                                            >
                                                <Icon name="close" className="size-3" />
                                            </Button>
                                        )}
                                        <kbd className="rounded-md border border-border px-1.5 py-0.5 font-sans text-[9px] font-semibold text-muted">
                                            esc
                                        </kbd>
                                    </div>
                                    <div className="flex min-h-0 flex-1 flex-col p-2">
                                        <div className="min-h-0 flex-1 overflow-y-auto">
                                            <p className="px-3 pb-2 pt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted">
                                                {query
                                                    ? searching
                                                        ? 'Buscando em toda a operação…'
                                                        : `${results.length} resultado${results.length === 1 ? '' : 's'}`
                                                    : 'Acesso rápido'}
                                            </p>
                                            {results.length ? (
                                                <div className="space-y-0.5">
                                                    {results.map((item, index) => (
                                                        <motion.div
                                                            key={`${item.href}-${item.label}`}
                                                            initial="rest"
                                                            animate="rest"
                                                            whileHover={
                                                                reduceMotion ? undefined : 'hover'
                                                            }
                                                        >
                                                            <Button
                                                                type="button"
                                                                role="option"
                                                                aria-selected={
                                                                    index === activeIndex
                                                                }
                                                                onMouseEnter={() =>
                                                                    setActiveIndex(index)
                                                                }
                                                                onClick={() => navigate(item.href)}
                                                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${index === activeIndex ? 'bg-surface-muted text-foreground' : 'text-foreground hover:bg-surface-muted'}`}
                                                            >
                                                                <motion.span
                                                                    className={`grid size-8 place-items-center rounded-xl ${index === activeIndex ? 'border border-border bg-surface text-foreground' : 'bg-surface-muted text-muted'}`}
                                                                    variants={{
                                                                        rest: {
                                                                            y: 0,
                                                                            rotate: 0,
                                                                            scale: 1,
                                                                            transition: {
                                                                                type: 'spring',
                                                                                stiffness: 360,
                                                                                damping: 24,
                                                                            },
                                                                        },
                                                                        hover: {
                                                                            y: -1,
                                                                            rotate: -3,
                                                                            scale: 1.04,
                                                                            transition: {
                                                                                type: 'spring',
                                                                                stiffness: 480,
                                                                                damping: 34,
                                                                            },
                                                                        },
                                                                    }}
                                                                >
                                                                    <Icon
                                                                        name={item.icon}
                                                                        className="size-3.5"
                                                                    />
                                                                </motion.span>
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate text-[11px] font-semibold">
                                                                        {item.label}
                                                                    </span>
                                                                    <span className="mt-0.5 block truncate text-[9px] text-muted">
                                                                        {item.description
                                                                            ? `${item.group} · ${item.description}`
                                                                            : item.group}
                                                                    </span>
                                                                </span>
                                                                {item.badge && (
                                                                    <span className="coming-soon-badge rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.06em]">
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                                <Icon
                                                                    name="arrow-right"
                                                                    className="size-3.5 text-muted"
                                                                />
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-7 text-center">
                                                    <span className="mx-auto grid size-9 place-items-center rounded-full bg-brand-soft text-brand">
                                                        <Icon name="search" className="size-4" />
                                                    </span>
                                                    <p className="mt-3 text-xs font-semibold">
                                                        {searching
                                                            ? 'Buscando itens…'
                                                            : 'Nenhum item encontrado'}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-muted">
                                                        {searching
                                                            ? 'Consultando clientes, vendas e catálogo.'
                                                            : 'Tente buscar por outro nome, código, e-mail ou identificador.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-3 border-t border-white/70 px-3 pt-2 text-[9px] text-muted">
                                            <span>↑↓ navegar</span>
                                            <span>↵ abrir</span>
                                            <span>esc fechar</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}

function subscribeNothing() {
    return () => {};
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
