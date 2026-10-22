'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FeatureGlyph, ProductPreview, type Glyph } from '@/components/auth/auth-preview';

import { Brand } from '@/components/brand';
import { showToast } from '@/components/ui/toast';

/*
 * Moldura das telas de login e cadastro: vitrine do produto à esquerda
 * (só em telas largas) e o card de vidro do formulário à direita.
 * Fica no layout compartilhado das duas rotas: ao alternar entre login e cadastro
 * só o que muda é animado (texto, prévia, largura e altura do card).
 * As faixas de vidro do fundo são uma imagem renderizada em 3D
 * (scripts/auth-backdrop/render.html → public/images/auth-backdrop.webp).
 */

const showcase = {
    login: {
        title: ['Tudo para o', 'seu negócio ir'],
        accent: 'mais longe.',
        description:
            'Funis de venda, checkouts e um orquestrador que escolhe o melhor gateway a cada pagamento, tudo desenhado em blocos.',
        features: [
            { glyph: 'funnel', text: ['Funis', 'de venda'] },
            { glyph: 'layout', text: ['Checkout', 'builder'] },
            { glyph: 'flow', text: ['Orquestrador', 'de pagamentos'] },
        ],
    },
    register: {
        title: ['Seu checkout.', 'Suas regras.'],
        accent: 'Mais resultados.',
        description:
            'Monte o funil página a página, personalize o checkout e ligue gateways com reserva automática, sem escrever código.',
        features: [
            { glyph: 'funnel', text: ['Funil', 'visual'] },
            { glyph: 'layout', text: ['Checkout', 'personalizado'] },
            { glyph: 'flow', text: ['Gateway', 'reserva'] },
        ],
    },
} satisfies Record<
    string,
    {
        title: string[];
        accent: string;
        description: string;
        features: { glyph: Glyph; text: [string, string] }[];
    }
>;

export function AuthFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const mode = pathname.startsWith('/register') ? 'register' : 'login';
    const copy = showcase[mode];
    const login = mode === 'login';
    const router = useRouter();
    // Rota de onde estamos saindo: quando a nova chega, `leaving` volta a false sozinho.
    const [leavingFrom, setLeavingFrom] = useState<string | null>(null);
    const leaving = leavingFrom === pathname;

    useEffect(() => {
        router.prefetch('/login');
        router.prefetch('/register');
    }, [router]);

    /*
     * Links entre login e cadastro: primeiro o conteúdo atual sai (fade curto), depois
     * a rota troca e o novo entra. Sem isso o conteúdo antigo sumia de uma vez.
     */
    function interceptSwitch(event: React.MouseEvent) {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = (event.target as HTMLElement).closest('a');
        if (!anchor || anchor.target === '_blank') return;
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname !== '/login' && url.pathname !== '/register') return;
        if (url.pathname === pathname) return;
        event.preventDefault();
        setLeavingFrom(pathname);
        window.setTimeout(() => router.push(`${url.pathname}${url.search}`), 170);
    }

    return (
        <div
            className="auth-stage relative min-h-screen overflow-hidden"
            onClickCapture={interceptSwitch}
        >
            <div aria-hidden="true" className="auth-dots" />
            <div className="relative mx-auto flex min-h-screen max-w-[1680px] gap-6 px-4 py-5 sm:px-8 lg:px-12 xl:px-16">
                <aside className="relative hidden min-w-0 flex-1 flex-col lg:flex">
                    <Brand href={login ? '/login' : '/register'} tone="dark" />
                    <div
                        key={mode}
                        data-leaving={leaving}
                        className="auth-leave relative z-10 mt-auto max-w-[500px] pb-4 pt-10"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[.2em] text-[#3a3e42] shadow-[0_1px_2px_rgb(16_18_20_/_4%),inset_0_0_0_1px_rgb(16_18_20_/_5%)] backdrop-blur">
                            <span className="size-1.5 rounded-full bg-[#91cf24]" />
                            Uma plataforma completa
                        </span>
                        <h1 className="auth-display mt-6 whitespace-nowrap text-[clamp(40px,3.5vw,58px)] font-extrabold leading-[1.05] tracking-[-.03em] text-[#0b0d0e]">
                            {copy.title.map((line, index) => (
                                <span
                                    key={line}
                                    className="auth-swap block"
                                    style={{ animationDelay: `${index * 70}ms` }}
                                >
                                    {line}
                                </span>
                            ))}
                            <span className="auth-swap block" style={{ animationDelay: '140ms' }}>
                                <span className="auth-accent-text">{copy.accent}</span>
                            </span>
                        </h1>
                        <p
                            className="auth-swap mt-6 max-w-[410px] text-[17px] leading-[1.65] text-[#53575b]"
                            style={{ animationDelay: '200ms' }}
                        >
                            {copy.description}
                        </p>
                        <ul
                            className="auth-swap mt-9 flex items-center gap-7"
                            style={{ animationDelay: '260ms' }}
                        >
                            {copy.features.map((feature) => (
                                <li
                                    key={feature.text.join(' ')}
                                    className="flex shrink-0 items-center gap-3"
                                >
                                    <span className="auth-feature-icon grid size-10 shrink-0 place-items-center rounded-[13px] text-[#2a2d30]">
                                        <FeatureGlyph name={feature.glyph} />
                                    </span>
                                    <span className="text-[13.5px] font-medium leading-[1.35] text-[#3a3e42]">
                                        {feature.text[0]}
                                        <br />
                                        {feature.text[1]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="relative z-10 mt-auto flex items-center gap-4 pt-10 text-[9px] font-medium uppercase leading-4 tracking-[.22em] text-[#6b6f73]">
                        <span className="h-px w-10 bg-[#91cf24]" />
                        <span>
                            Mais do que ferramentas.
                            <br />
                            Liberdade para crescer.
                        </span>
                    </p>
                    <ProductPreview mode={mode} />
                </aside>

                <div className="relative z-10 flex w-full flex-col lg:w-[440px] lg:shrink-0 xl:w-[460px] 2xl:w-[480px]">
                    <div className="flex flex-1 items-center py-1">
                        <section className="auth-glass w-full rounded-[28px] px-6 py-8 sm:px-10 sm:py-9">
                            {/* No desktop o logo fica no canto; no celular o canto some, então ele aparece aqui. */}
                            <div className="mb-7 flex justify-center lg:hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem otimização */}
                                <img
                                    src="/astro-logo-dark.svg"
                                    alt="Astro"
                                    width={120}
                                    height={28}
                                    className="h-7 w-auto"
                                />
                            </div>
                            <MorphHeight contentKey={pathname}>
                                <div data-leaving={leaving} className="auth-leave">
                                    <div key={pathname} className="auth-swap">
                                        {children}
                                    </div>
                                </div>
                            </MorphHeight>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Anima a altura do card quando o conteúdo muda (troca de rota ou de etapa).
 * Só recorta o conteúdo durante a transição, para não cortar menus abertos.
 */
function MorphHeight({ contentKey, children }: { contentKey: string; children: React.ReactNode }) {
    const inner = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>();
    const [animating, setAnimating] = useState(false);
    const firstKey = useRef(contentKey);
    // Na troca de rota, recorta antes do primeiro quadro: senão o conteúdo novo aparece
    // por um instante transbordando o card antigo (os links do rodapé "surgiam secos").
    useLayoutEffect(() => {
        if (firstKey.current === contentKey) return;
        firstKey.current = contentKey;
        setAnimating(true);
        const timer = window.setTimeout(() => setAnimating(false), 700);
        return () => window.clearTimeout(timer);
    }, [contentKey]);
    useLayoutEffect(() => {
        const element = inner.current;
        if (!element) return;
        const observer = new ResizeObserver(() => {
            setHeight((previous) => {
                const next = element.offsetHeight;
                if (previous !== undefined && previous !== next) setAnimating(true);
                return next;
            });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return (
        <div
            className="auth-morph"
            style={{ height, overflow: animating ? 'hidden' : undefined }}
            onTransitionEnd={(event) => {
                if (event.target === event.currentTarget) setAnimating(false);
            }}
        >
            <div ref={inner}>{children}</div>
        </div>
    );
}

export function AuthDivider() {
    return (
        <div className="my-5 flex items-center gap-3 text-[11.5px] text-[#9a9ea3]">
            <span className="h-px flex-1 bg-[#eceef0]" />
            ou
            <span className="h-px flex-1 bg-[#eceef0]" />
        </div>
    );
}

/**
 * Entrar/cadastrar com Google. A integração com a API ainda não existe: o botão
 * fica no lugar definitivo e, por enquanto, só avisa ao ser clicado.
 */
export function GoogleButton() {
    return (
        <button
            type="button"
            onClick={() =>
                showToast({
                    title: 'Google ainda não disponível',
                    description: 'Por enquanto, use e-mail e senha.',
                    tone: 'info',
                })
            }
            className="auth-secondary flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[14px] font-medium text-[#2b2e31]"
        >
            <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
                />
            </svg>
            Continuar com Google
        </button>
    );
}
