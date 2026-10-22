'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon, type IconName } from '@/components/ui/icon';

/*
 * Prévia ilustrativa da vitrine de login/cadastro: a janela do backoffice (sidebar
 * escura) mostrando o que diferencia o Astro, em blocos no estilo n8n:
 * - login: o orquestrador de pagamentos (roteador, gateway principal e reserva);
 * - cadastro: o funil de vendas (páginas ligadas pelos gatilhos de avanço).
 * É o mesmo elemento nos dois modos, então a troca anima em vez de remontar.
 */

export type ShowcaseMode = 'login' | 'register';
export type Glyph = 'chart' | 'bolt' | 'flow' | 'funnel' | 'layout';

/** Ícones preenchidos e arredondados dos destaques da vitrine. */
export function FeatureGlyph({ name }: { name: Glyph }) {
    const common = { viewBox: '0 0 24 24', className: 'size-5', fill: 'currentColor' } as const;
    switch (name) {
        case 'chart':
            return (
                <svg {...common}>
                    <rect x="4" y="12" width="4" height="8" rx="2" />
                    <rect x="10" y="7" width="4" height="13" rx="2" />
                    <rect x="16" y="3.5" width="4" height="16.5" rx="2" />
                </svg>
            );
        case 'bolt':
            return (
                <svg {...common}>
                    <path d="M13.4 2.6c.5-.6 1.4-.1 1.2.6l-1.6 6.3h5.2c.8 0 1.2.9.7 1.5l-8.3 10.4c-.5.6-1.4.1-1.2-.6l1.6-6.3H5.8c-.8 0-1.2-.9-.7-1.5l8.3-10.4Z" />
                </svg>
            );
        case 'flow':
            return (
                <svg {...common}>
                    <rect x="2.5" y="9" width="6" height="6" rx="2" />
                    <rect x="15.5" y="3.5" width="6" height="6" rx="2" />
                    <rect x="15.5" y="14.5" width="6" height="6" rx="2" opacity=".55" />
                    <path
                        d="M8.5 12h2.2c1.2 0 2-.8 2-2V8.5c0-1 .8-2 2-2h1M10.7 12c1.2 0 2 .8 2 2v1.5c0 1 .8 2 2 2h1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'funnel':
            return (
                <svg {...common}>
                    <path d="M3.5 5.2c0-.9.7-1.7 1.7-1.7h13.6c.9 0 1.7.8 1.7 1.7 0 .4-.1.8-.4 1.1L15 12.6v5.1c0 .6-.3 1.1-.8 1.4l-2.6 1.6c-.8.5-1.6-.1-1.6-.9v-7.2L3.9 6.3c-.3-.3-.4-.7-.4-1.1Z" />
                </svg>
            );
        case 'layout':
            return (
                <svg {...common}>
                    <rect x="3" y="3.5" width="18" height="6" rx="2" />
                    <rect x="3" y="11.5" width="8" height="9" rx="2" />
                    <rect x="13" y="11.5" width="8" height="9" rx="2" opacity=".55" />
                </svg>
            );
    }
}

const SCENE_W = 620;

/**
 * Cena da prévia: mede o espaço disponível para escalar a composição (mesmo tamanho
 * relativo no login e no cadastro) e inclina o plano na direção do mouse.
 * O mouse só escreve variáveis CSS (sem re-render); as transições ficam no CSS.
 */
function usePreviewScene() {
    const frame = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState<number>();
    useEffect(() => {
        const element = frame.current;
        if (!element) return;
        const resize = new ResizeObserver(([entry]) => {
            const width = entry?.contentRect.width ?? SCENE_W;
            setScale(Math.max(0.6, Math.min(1, width / SCENE_W)));
        });
        resize.observe(element);
        const media = window.matchMedia(
            '(hover: hover) and (prefers-reduced-motion: no-preference)',
        );
        if (!media.matches) return () => resize.disconnect();
        let raf = 0;
        const apply = (x: number, y: number) => {
            element.style.setProperty('--auth-tilt-x', `${(-y * 3.5).toFixed(2)}deg`);
            element.style.setProperty('--auth-tilt-y', `${(x * 4.5).toFixed(2)}deg`);
        };
        const onMove = (event: PointerEvent) => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const scene = element.firstElementChild?.getBoundingClientRect();
                if (!scene) return;
                const margin = 48;
                const inside =
                    event.clientX > scene.left - margin &&
                    event.clientX < scene.right + margin &&
                    event.clientY > scene.top - margin &&
                    event.clientY < scene.bottom + margin;
                if (!inside) return apply(0, 0);
                const x = ((event.clientX - scene.left) / scene.width) * 2 - 1;
                const y = ((event.clientY - scene.top) / scene.height) * 2 - 1;
                apply(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
            });
        };
        const onLeave = () => apply(0, 0);
        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
        return () => {
            resize.disconnect();
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener('pointerleave', onLeave);
        };
    }, []);
    return { frame, scale };
}

/* ------------------------------------------------------------------ */
/* Canvas em blocos                                                     */
/* ------------------------------------------------------------------ */

type Tone = 'trigger' | 'logic' | 'page' | 'neutral' | 'success' | 'danger';
type Anchor = 'left' | 'right' | 'top' | 'bottom';

interface MiniNode {
    id: string;
    x: number;
    y: number;
    title: string;
    detail: string;
    tone: Tone;
    icon?: IconName;
    logo?: string;
    badge?: string;
}

interface MiniEdge {
    from: string;
    to: string;
    out?: Anchor;
    in?: Anchor;
    tone?: 'success' | 'danger' | 'brand';
    label?: string;
    /** Rota "feliz": recebe o pulso de luz que percorre a ligação. */
    pulse?: boolean;
}

const NODE_W = 118;
const NODE_H = 46;
const CANVAS_W = 430;
const CANVAS_H = 262;

const flows: Record<
    ShowcaseMode,
    { title: string; detail: string; nodes: MiniNode[]; edges: MiniEdge[] }
> = {
    login: {
        title: 'Orquestrador',
        detail: 'Roteamento de pagamentos',
        nodes: [
            {
                id: 'router',
                x: 0,
                y: 108,
                title: 'Roteador',
                detail: 'Cartão · Pix',
                tone: 'logic',
                icon: 'split',
            },
            {
                id: 'stripe',
                x: 156,
                y: 14,
                title: 'Stripe',
                detail: 'Principal · cartão',
                tone: 'neutral',
                logo: '/images/gateways/stripe.png',
            },
            {
                id: 'backup',
                x: 156,
                y: 108,
                title: 'Mercado Pago',
                detail: 'Assume se falhar',
                tone: 'neutral',
                logo: '/images/gateways/mercado-pago.png',
                badge: 'Reserva',
            },
            {
                id: 'pix',
                x: 156,
                y: 202,
                title: 'Asaas',
                detail: 'Pix',
                tone: 'neutral',
                logo: '/images/gateways/asaas.png',
            },
            {
                id: 'paid',
                x: 312,
                y: 60,
                title: 'Aprovado',
                detail: 'Pedido pago',
                tone: 'success',
                icon: 'check-circle',
            },
            {
                id: 'failed',
                x: 312,
                y: 168,
                title: 'Recusado',
                detail: 'Avisa o cliente',
                tone: 'danger',
                icon: 'x-circle',
            },
        ],
        edges: [
            { from: 'router', to: 'stripe', label: 'Cartão', pulse: true },
            { from: 'router', to: 'pix', label: 'Pix' },
            {
                from: 'stripe',
                to: 'backup',
                out: 'bottom',
                in: 'top',
                tone: 'danger',
                label: 'falhou',
            },
            { from: 'stripe', to: 'paid', tone: 'success', pulse: true },
            { from: 'backup', to: 'paid', tone: 'success' },
            { from: 'backup', to: 'failed', tone: 'danger' },
            { from: 'pix', to: 'paid', tone: 'success' },
        ],
    },
    register: {
        title: 'Funil de vendas',
        detail: 'Lançamento · 5 páginas',
        nodes: [
            {
                id: 'video',
                x: 0,
                y: 30,
                title: 'Vídeo',
                detail: 'Página de vendas',
                tone: 'trigger',
                icon: 'play',
            },
            {
                id: 'checkout',
                x: 156,
                y: 30,
                title: 'Checkout',
                detail: 'Coleta os dados',
                tone: 'page',
                icon: 'cart',
            },
            {
                id: 'payment',
                x: 312,
                y: 30,
                title: 'Pagamento',
                detail: 'Com reserva',
                tone: 'trigger',
                icon: 'bolt',
            },
            {
                id: 'upsell',
                x: 156,
                y: 180,
                title: 'Oferta extra',
                detail: 'Upsell em 1 clique',
                tone: 'page',
                icon: 'gift',
            },
            {
                id: 'thanks',
                x: 312,
                y: 180,
                title: 'Obrigado',
                detail: 'Compra aprovada',
                tone: 'success',
                icon: 'check-circle',
            },
        ],
        edges: [
            { from: 'video', to: 'checkout', label: 'Botão do vídeo', pulse: true },
            { from: 'checkout', to: 'payment', label: 'Pagar', pulse: true },
            {
                from: 'payment',
                to: 'thanks',
                out: 'bottom',
                in: 'top',
                tone: 'success',
                label: 'Aprovado',
                pulse: true,
            },
            {
                from: 'thanks',
                to: 'upsell',
                out: 'left',
                in: 'right',
                tone: 'brand',
                label: 'Upsell',
            },
        ],
    },
};

function anchorPoint(node: MiniNode, anchor: Anchor) {
    switch (anchor) {
        case 'left':
            return { x: node.x, y: node.y + NODE_H / 2, dx: -1, dy: 0 };
        case 'right':
            return { x: node.x + NODE_W, y: node.y + NODE_H / 2, dx: 1, dy: 0 };
        case 'top':
            return { x: node.x + NODE_W / 2, y: node.y, dx: 0, dy: -1 };
        case 'bottom':
            return { x: node.x + NODE_W / 2, y: node.y + NODE_H, dx: 0, dy: 1 };
    }
}

/** Curva cúbica entre duas âncoras, como as ligações do editor. */
function edgeGeometry(edge: MiniEdge, nodes: MiniNode[]) {
    const source = nodes.find((node) => node.id === edge.from)!;
    const target = nodes.find((node) => node.id === edge.to)!;
    const a = anchorPoint(source, edge.out ?? 'right');
    const b = anchorPoint(target, edge.in ?? 'left');
    const reach = Math.max(28, Math.hypot(b.x - a.x, b.y - a.y) * 0.42);
    const c1 = { x: a.x + a.dx * reach, y: a.y + a.dy * reach };
    const c2 = { x: b.x + b.dx * reach, y: b.y + b.dy * reach };
    const mid = {
        x: 0.125 * a.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * b.x,
        y: 0.125 * a.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * b.y,
    };
    return { path: `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`, mid };
}

const toneClass: Record<Tone, string> = {
    trigger: 'border-[#cfe9a0]',
    logic: 'border-[#f6d2b0]',
    page: 'border-[#bfe6ee]',
    neutral: 'border-[#e8eaec]',
    success: 'border-[#bfe3c9] bg-[#f6fbf7]',
    danger: 'border-[#f2c9d0] bg-[#fdf7f8]',
};

const iconClass: Record<Tone, string> = {
    trigger: 'bg-[#eef8dc] text-[#5a8f12]',
    logic: 'bg-[#fdf0e3] text-[#d0731c]',
    page: 'bg-[#e6f6f9] text-[#1b8aa0]',
    neutral: 'bg-[#f2f3f4] text-[#3a3e42]',
    success: 'bg-[#e3f4e8] text-[#2f8a4b]',
    danger: 'bg-[#fbe7ea] text-[#c33b53]',
};

function FlowCanvas({ mode }: { mode: ShowcaseMode }) {
    const flow = flows[mode];
    return (
        <div
            className="auth-flow-canvas relative mt-4 overflow-hidden rounded-2xl border border-[#eef0f1]"
            style={{ height: CANVAS_H + 28, width: CANVAS_W + 20 }}
        >
            <div key={mode} className="auth-swap absolute left-[10px] top-[14px]">
                <svg
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="absolute inset-0 overflow-visible"
                    aria-hidden="true"
                >
                    {flow.edges.map((edge, index) => {
                        const { path } = edgeGeometry(edge, flow.nodes);
                        return (
                            <g key={`${edge.from}-${edge.to}`}>
                                <path d={path} className="auth-flow-edge" data-tone={edge.tone} />
                                {edge.pulse && (
                                    <path
                                        d={path}
                                        pathLength={100}
                                        className="auth-flow-pulse"
                                        style={{ animationDelay: `${index * 0.45}s` }}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
                <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
                    {flow.nodes.map((node) => (
                        <div
                            key={node.id}
                            className={`absolute flex items-center gap-1.5 rounded-[12px] border bg-white px-1.5 shadow-[0_1px_2px_rgb(16_18_20_/_4%),0_6px_16px_-8px_rgb(16_18_20_/_12%)] ${toneClass[node.tone]}`}
                            style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
                        >
                            {node.badge && (
                                <span className="absolute -top-2 right-2 rounded-full bg-[#6366f1] px-1.5 py-px text-[7px] font-semibold text-white">
                                    {node.badge}
                                </span>
                            )}
                            {node.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element -- logo estático decorativo
                                <img
                                    src={node.logo}
                                    alt=""
                                    className="size-[26px] shrink-0 rounded-lg bg-white object-contain p-[3px] shadow-[inset_0_0_0_1px_rgb(16_18_20_/_6%)]"
                                />
                            ) : (
                                <span
                                    className={`grid size-[26px] shrink-0 place-items-center rounded-lg ${iconClass[node.tone]}`}
                                >
                                    <Icon name={node.icon ?? 'bolt'} className="size-3.5" />
                                </span>
                            )}
                            <span className="min-w-0">
                                <span className="block truncate text-[9.5px] font-semibold text-[#101214]">
                                    {node.title}
                                </span>
                                <span className="block truncate text-[7.5px] text-[#8a8f94]">
                                    {node.detail}
                                </span>
                            </span>
                            {/* Portas de entrada e saída, como no editor. */}
                            <span className="absolute -left-[3.5px] top-1/2 size-[7px] -translate-y-1/2 rounded-full border border-[#d5d9dd] bg-white" />
                            <span className="absolute -right-[3.5px] top-1/2 size-[7px] -translate-y-1/2 rounded-full border border-[#d5d9dd] bg-white" />
                        </div>
                    ))}
                    {flow.edges
                        .filter((edge) => edge.label)
                        .map((edge) => {
                            const { mid } = edgeGeometry(edge, flow.nodes);
                            return (
                                <span
                                    key={`${edge.from}-${edge.to}-label`}
                                    className="auth-flow-pill absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-1.5 py-px text-[7px] font-semibold"
                                    data-tone={edge.tone}
                                    style={{ left: mid.x, top: mid.y }}
                                >
                                    {edge.label}
                                </span>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Composição                                                           */
/* ------------------------------------------------------------------ */

const menu: { icon: IconName; label: string; mode?: ShowcaseMode }[] = [
    { icon: 'home', label: 'Início' },
    { icon: 'cart', label: 'Vendas' },
    { icon: 'layout', label: 'Checkouts' },
    { icon: 'route', label: 'Funis', mode: 'register' },
    { icon: 'split', label: 'Orquestrador', mode: 'login' },
    { icon: 'users', label: 'Clientes' },
];

/** Prévia ilustrativa do painel, inclinada em perspectiva entre o texto e o card. */
export function ProductPreview({ mode }: { mode: ShowcaseMode }) {
    const login = mode === 'login';
    const flow = flows[mode];
    const { frame, scale } = usePreviewScene();
    return (
        // Faixa entre o texto e o card; a cena é centralizada na vertical e escalada
        // para caber nela. Mesmo elemento nos dois modos: só o conteúdo transita.
        <div
            ref={frame}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -right-4 left-[max(46%,440px)] hidden select-none items-center min-[1440px]:flex"
        >
            <div
                className="auth-scene relative shrink-0 origin-left transition-[scale,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ width: SCENE_W, scale, opacity: scale === undefined ? 0 : 1 }}
            >
                <div className="auth-scene-plane relative">
                    <div className="auth-layer" style={{ '--z': '0px' } as React.CSSProperties}>
                        {/* Mesma composição do painel: sidebar escura e área de conteúdo clara por cima. */}
                        <div className="auth-preview-shell flex overflow-hidden rounded-[24px]">
                            <div className="w-[148px] shrink-0 bg-[#111514] py-5 pl-3 pr-6">
                                <div className="flex justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem otimização */}
                                    <img src="/astro-logo.svg" alt="" className="h-[17px] w-auto" />
                                </div>
                                <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/[.045] px-2 py-1.5">
                                    <span className="grid size-5 place-items-center rounded-md bg-[#91cf24] text-[8px] font-bold text-[#101214]">
                                        A
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[8.5px] font-semibold text-[#f1f2ee]">
                                            Astro Store
                                        </span>
                                        <span className="block text-[7px] text-[#8e938f]">
                                            Workspace
                                        </span>
                                    </span>
                                    <Icon name="chevron-down" className="size-2.5 text-[#77767c]" />
                                </div>
                                <p className="mt-5 px-2 text-[7.5px] font-semibold uppercase tracking-[.1em] text-[#77767c]">
                                    Principal
                                </p>
                                <ul className="mt-1.5 space-y-1">
                                    {menu.map((item) => {
                                        const active = item.mode === mode;
                                        return (
                                            <li
                                                key={item.label}
                                                className={`flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[10.5px] font-medium transition-[background-color,color,box-shadow] duration-500 ${active ? 'bg-[#1b201e] text-[#f1f2ee] shadow-[inset_0_0_0_1px_rgb(255_255_255_/_8%),0_7px_18px_rgb(0_0_0_/_12%)]' : 'text-[#9a999e]'}`}
                                            >
                                                <Icon
                                                    name={item.icon}
                                                    className={`size-3.5 transition-colors duration-500 ${active ? 'text-[#91cf24]' : 'text-[#77767c]'}`}
                                                />
                                                {item.label}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <div className="auth-preview-panel -ml-3.5 min-w-0 flex-1 rounded-l-[18px] px-4 py-5">
                                <div key={mode} className="auth-swap flex items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="auth-display text-[17px] font-bold tracking-[-.02em] text-[#101214]">
                                            {flow.title}
                                        </p>
                                        <p className="text-[9.5px] text-[#80848a]">{flow.detail}</p>
                                    </div>
                                    <span className="flex items-center gap-1.5 rounded-full bg-[#eef8dc] px-2 py-1 text-[8.5px] font-semibold text-[#4f8410]">
                                        <span className="size-1.5 rounded-full bg-[#7cbd1c]" />
                                        {login ? 'Ativo' : 'Publicado'}
                                    </span>
                                </div>
                                <FlowCanvas mode={mode} />
                            </div>
                        </div>
                    </div>

                    <div
                        className="auth-layer absolute left-[28px] top-[296px] w-[284px]"
                        style={{ '--z': '70px' } as React.CSSProperties}
                    >
                        <div className="auth-preview-surface rounded-[20px] p-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-10 place-items-center rounded-xl bg-white text-[#101214] shadow-[0_6px_16px_rgb(16_18_20_/_7%)]">
                                    <Icon name="cart" className="size-[18px]" />
                                </span>
                                <div className="flex-1">
                                    <p className="auth-display text-[13px] font-bold tracking-[-.02em]">
                                        Checkout Astro
                                    </p>
                                    <p className="text-[9.5px] text-[#80848a]">
                                        {login ? 'Pagamento aprovado' : 'Pagamento rápido e seguro'}
                                    </p>
                                </div>
                                {login ? (
                                    <span className="grid size-8 place-items-center rounded-full bg-[#dff2bd] text-[#4f8410]">
                                        <Icon name="check" className="size-4" />
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 rounded-full bg-[#eaf6d6] px-2.5 py-1 text-[9.5px] font-semibold text-[#4f8410]">
                                        <span className="size-1.5 rounded-full bg-[#7fc21a]" />
                                        Ativo
                                    </span>
                                )}
                            </div>
                            {login ? (
                                <div
                                    key="order"
                                    className="auth-swap mt-3.5 border-t border-[#eef0f1] pt-3.5"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura estática decorativa */}
                                        <img
                                            src="/images/auth-product-headset.webp"
                                            alt=""
                                            width={44}
                                            height={44}
                                            className="size-11 rounded-xl object-cover shadow-[0_6px_14px_rgb(16_18_20_/_10%)]"
                                        />
                                        <span className="flex-1">
                                            <span className="block text-[11.5px] font-semibold">
                                                Headset Pro
                                            </span>
                                            <span className="block text-[9.5px] text-[#80848a]">
                                                Via Stripe · cartão
                                            </span>
                                        </span>
                                        <span className="text-[12.5px] font-bold">R$ 599,90</span>
                                    </div>
                                </div>
                            ) : (
                                <ul
                                    key="methods"
                                    className="auth-swap mt-3.5 space-y-1.5 border-t border-[#eef0f1] pt-3.5"
                                >
                                    {(
                                        [
                                            {
                                                icon: 'card',
                                                label: 'Cartão de crédito',
                                                hint: 'até 12x',
                                            },
                                            {
                                                icon: 'qr',
                                                label: 'Pix',
                                                hint: 'Aprovação imediata',
                                            },
                                        ] satisfies {
                                            icon: IconName;
                                            label: string;
                                            hint: string;
                                        }[]
                                    ).map((method) => (
                                        <li
                                            key={method.label}
                                            className="flex items-center gap-2.5 rounded-xl border border-[#eef0f1] bg-white/70 px-2.5 py-1.5"
                                        >
                                            <span className="grid size-7 place-items-center rounded-lg bg-[#f2f3f4] text-[#2a2d30]">
                                                <Icon name={method.icon} className="size-3.5" />
                                            </span>
                                            <span className="flex-1">
                                                <span className="block text-[10.5px] font-semibold">
                                                    {method.label}
                                                </span>
                                                <span className="block text-[8.5px] text-[#80848a]">
                                                    {method.hint}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div
                        className="auth-layer absolute left-[372px] top-[-40px] w-[196px]"
                        style={{ '--z': '120px' } as React.CSSProperties}
                    >
                        <div className="auth-preview-surface flex items-center gap-3 rounded-[18px] px-3.5 py-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-[#eaf6d6] text-[#5a8f12]">
                                <FeatureGlyph name={login ? 'flow' : 'chart'} />
                            </span>
                            <span key={mode} className="auth-swap">
                                <span className="block text-[14px] font-bold tracking-[-.02em]">
                                    {login ? '98,4%' : '+23%'}
                                </span>
                                <span className="block text-[8.5px] text-[#80848a]">
                                    {login ? 'de aprovação com reserva' : 'de conversão no funil'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
