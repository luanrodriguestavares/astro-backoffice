'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Prévia do produto desligada: a cena em 3D poluía a vitrine. Para voltar, descomente aqui e
// o <ProductPreview /> na vitrine abaixo.
// import { ProductPreview } from '@/components/auth/auth-preview';
import { Brand } from '@/components/brand';
import { landingPublicUrl } from '@/lib/api/config';

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
        features: ['Funis de venda', 'Checkout builder', 'Orquestrador de pagamentos'],
    },
    register: {
        title: ['Seu checkout.', 'Suas regras.'],
        accent: 'Mais resultados.',
        description:
            'Monte o funil página a página, personalize o checkout e ligue gateways com reserva automática, sem escrever código.',
        features: ['Funil visual', 'Checkout personalizado', 'Gateway reserva'],
    },
} satisfies Record<
    string,
    {
        title: string[];
        accent: string;
        description: string;
        features: string[];
    }
>;

export function AuthFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const mode = pathname.startsWith('/register') ? 'register' : 'login';
    const copy = showcase[mode];
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
            <div className="relative mx-auto flex min-h-screen max-w-[1360px] gap-6 px-4 py-5 sm:px-8 lg:gap-16 lg:px-12 xl:gap-24">
                <aside className="relative hidden min-w-0 flex-1 flex-col lg:flex">
                    <Brand href={landingPublicUrl()} tone="light" />
                    {/* Vitrine no traço do hero da landing: rótulo, título, uma frase e respiro. */}
                    <div
                        key={mode}
                        data-leaving={leaving}
                        className="auth-leave relative z-10 my-auto max-w-[620px] py-10"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#34e380]">
                            Uma plataforma completa
                        </p>
                        <h1 className="auth-display mt-6 whitespace-nowrap text-[clamp(44px,4.2vw,68px)] leading-[1.04] tracking-[-.045em] text-[#f4f4f4]">
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
                            className="auth-swap mt-7 max-w-[440px] text-[16px] leading-[1.7] text-[#b4c0b9]"
                            style={{ animationDelay: '200ms' }}
                        >
                            {copy.description}
                        </p>
                    </div>
                    {/* Índice numerado com linha fina, como o "01 Experiência ↘" da landing. */}
                    <ol
                        key={`${mode}-index`}
                        className="auth-index auth-swap relative z-10 flex max-w-[760px]"
                        style={{ animationDelay: '260ms' }}
                    >
                        {copy.features.map((feature, index) => (
                            <li
                                key={feature}
                                className="flex flex-1 items-baseline gap-3 whitespace-nowrap py-5 pr-6 text-[13px] text-[#e9eeeb]"
                            >
                                <span className="text-[10px] tabular-nums text-[#8fa197]">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ol>
                    {/* <ProductPreview mode={mode} /> */}
                </aside>

                <div className="relative z-10 flex w-full flex-col lg:w-[440px] lg:shrink-0 xl:w-[460px] 2xl:w-[480px]">
                    <div className="flex flex-1 items-center py-1">
                        <div className="relative w-full">
                            <span aria-hidden="true" className="auth-star hidden lg:block" />
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
