import Link from 'next/link';

import { Brand } from '@/components/brand';
import { Icon } from '@/components/ui/icon';

export function AuthFrame({
    mode,
    children,
}: {
    mode: 'login' | 'register';
    children: React.ReactNode;
}) {
    const login = mode === 'login';
    return (
        <div className="astro-shell relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-8">
            <div
                className={`relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[32px] border border-border bg-surface shadow-[0_24px_72px_rgb(16_18_20_/_8%)] sm:min-h-[calc(100vh-4rem)] ${login ? 'lg:grid-cols-[.9fr_1.1fr]' : 'lg:grid-cols-[.78fr_1.22fr]'}`}
            >
                <aside className="relative hidden overflow-hidden border-r border-border bg-[#efefe9] p-10 lg:flex lg:flex-col xl:p-12">
                    <div className="absolute inset-x-0 top-0 h-1 bg-highlight" />
                    <div className="relative">
                        <Brand />
                    </div>
                    <div className="relative my-auto max-w-md">
                        <span className="grid size-12 place-items-center rounded-2xl border border-highlight bg-highlight text-highlight-contrast">
                            <Icon name={login ? 'chart' : 'bolt'} className="size-5" />
                        </span>
                        <p className="mt-7 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                            {login ? 'Sua operação em um só lugar' : 'Comece com uma base sólida'}
                        </p>
                        <h1 className="mt-3 text-4xl font-semibold leading-[1.12] tracking-[-0.05em] text-[#111111]">
                            {login ? (
                                <>
                                    Venda mais.
                                    <br />
                                    Opere com clareza.
                                </>
                            ) : (
                                <>
                                    Seu checkout.
                                    <br />
                                    Sua operação.
                                </>
                            )}
                        </h1>
                        <p className="mt-5 text-[14px] leading-6 text-muted">
                            {login
                                ? 'Produtos, pagamentos, assinaturas e clientes organizados em uma experiência simples.'
                                : 'Configure a organização e prepare sua primeira experiência de venda com segurança.'}
                        </p>
                        <div className="mt-8 space-y-3">
                            {(login
                                ? [
                                      'Checkouts e produtos em um só painel',
                                      'Pagamentos e recorrência integrados',
                                      'Indicadores claros para decidir',
                                  ]
                                : [
                                      'Crie sua conta e organização',
                                      'Conecte seu gateway preferido',
                                      'Cadastre e publique seu produto',
                                  ]
                            ).map((text, index) => (
                                <div
                                    key={text}
                                    className="flex items-center gap-3 text-[13px] font-medium text-[#4f514d]"
                                >
                                    <span className="grid size-7 place-items-center rounded-full border border-border bg-surface text-foreground">
                                        {login ? (
                                            <Icon name="check" className="size-3.5" />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="relative text-[11px] text-muted">
                        Astro · Infraestrutura para negócios digitais
                    </p>
                </aside>
                <main className="flex min-w-0 items-center justify-center p-5 sm:p-9 lg:p-12">
                    <div className={`w-full ${login ? 'max-w-md' : 'max-w-2xl'}`}>
                        <div className="mb-9 flex items-center justify-between lg:justify-end">
                            <div className="lg:hidden">
                                <Brand />
                            </div>
                            <p className="text-[13px] text-muted">
                                {login ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
                                <Link
                                    href={login ? '/register' : '/login'}
                                    className="font-semibold text-brand-strong hover:underline"
                                >
                                    {login ? 'Começar agora' : 'Entrar'}
                                </Link>
                            </p>
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
