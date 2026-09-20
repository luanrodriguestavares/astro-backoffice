'use client';

import { Button } from '@/components/ui/button';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Icon, type IconName } from '@/components/ui/icon';

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
    const [position, setPosition] = useState<{
        left: number;
        top: number;
        width: number;
    } | null>(null);

    const navigationResults = useMemo(() => {
        const granted = new Set(permissions);
        const planFeatures = new Set(billingAccess.features);
        const available = destinations.filter(
            (item) =>
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
        query.trim().length >= 2 &&
        (globalSearch.query !== query.trim() || globalSearch.loading);

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

        function updatePosition() {
            const rect = rootRef.current?.getBoundingClientRect();
            if (!rect) return;
            setPosition({ left: rect.left, top: rect.bottom + 8, width: rect.width });
        }

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
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
        <div ref={rootRef} className="relative hidden w-full max-w-[460px] md:block">
            <div
                className={`global-search shell-header-control flex h-11 items-center gap-2.5 rounded-2xl px-4 transition ${open ? 'border-brand/70 shadow-[0_0_0_3px_rgba(109,93,244,.16)]' : ''}`}
            >
                <motion.span
                    className="grid shrink-0 place-items-center text-[#77758d]"
                    animate={
                        reduceMotion || !open
                            ? { y: 0, rotate: 0, scale: 1 }
                            : { y: -2.5, rotate: -8, scale: 1.09 }
                    }
                    transition={
                        reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 420, damping: 20 }
                    }
                >
                    <Icon name="search" className="size-4" />
                </motion.span>
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                        setActiveIndex(0);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar no Astro..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-label="Buscar páginas no Astro"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls="astro-search-results"
                    className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted"
                />
                {query ? (
                    <Button
                        type="button"
                        aria-label="Limpar busca"
                        onClick={() => {
                            setQuery('');
                            inputRef.current?.focus();
                        }}
                        className="rounded-lg p-1 text-muted transition hover:bg-white/70 hover:text-foreground"
                    >
                        <Icon name="close" className="size-3" />
                    </Button>
                ) : (
                    <kbd className="flex h-6 items-center gap-1 rounded-lg border border-white/90 bg-white/65 px-2 font-sans text-[9px] font-semibold leading-none text-[#77758d] shadow-sm">
                        <span className="text-[11px]">⌘</span>
                        <span>K</span>
                    </kbd>
                )}
            </div>

            {position &&
                createPortal(
                    <>
                        {open && (
                            <Button
                                type="button"
                                aria-label="Fechar busca"
                                style={{ top: position.top - 8 }}
                                className="fixed inset-x-0 bottom-0 z-[90] cursor-default bg-transparent"
                                onClick={() => setOpen(false)}
                            />
                        )}
                        <AnimatePresence>
                            {open && (
                                <motion.div
                                    ref={resultsRef}
                                    id="astro-search-results"
                                    role="listbox"
                                    initial={
                                        reduceMotion
                                            ? false
                                            : {
                                                  opacity: 0,
                                                  y: -8,
                                                  scale: 0.97,
                                                  filter: 'blur(5px)',
                                              }
                                    }
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        filter: 'blur(0px)',
                                    }}
                                    exit={
                                        reduceMotion
                                            ? { opacity: 0 }
                                            : {
                                                  opacity: 0,
                                                  y: -5,
                                                  scale: 0.98,
                                                  filter: 'blur(3px)',
                                              }
                                    }
                                    transition={
                                        reduceMotion
                                            ? { duration: 0 }
                                            : {
                                                  type: 'spring',
                                                  stiffness: 430,
                                                  damping: 32,
                                                  mass: 0.72,
                                              }
                                    }
                                    style={{ ...position, transformOrigin: 'top left' }}
                                    className={`glass-popover fixed z-[100] flex max-h-[min(520px,calc(100vh-96px))] flex-col overflow-hidden rounded-[20px] p-2 ${dark ? 'dashboard-search-popover' : ''}`}
                                >
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
                                                    aria-selected={index === activeIndex}
                                                    onMouseEnter={() => setActiveIndex(index)}
                                                    onClick={() => navigate(item.href)}
                                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${index === activeIndex ? 'bg-[#efecff] text-brand-strong' : 'text-foreground hover:bg-white/55'}`}
                                                >
                                                    <motion.span
                                                        className={`grid size-8 place-items-center rounded-xl ${index === activeIndex ? 'bg-white/70 text-brand' : 'bg-white/45 text-muted'}`}
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
                                                                y: -2.5,
                                                                rotate: -8,
                                                                scale: 1.09,
                                                                transition: {
                                                                    type: 'spring',
                                                                    stiffness: 420,
                                                                    damping: 20,
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>,
                    document.body,
                )}
        </div>
    );
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
