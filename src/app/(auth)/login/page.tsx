import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthToast } from '@/components/auth/auth-toast';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; expired?: string }>;
}) {
    const { error, expired } = await searchParams;
    const feedback =
        error ??
        (expired === '1' ? 'Sua sessão expirou. Entre novamente para continuar.' : undefined);
    return (
        <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f7fb] px-4 py-10">
            <AuthToast message={feedback} tone={error ? 'error' : 'info'} />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(109,93,244,.12),transparent_28rem),radial-gradient(circle_at_90%_92%,rgba(150,136,240,.1),transparent_30rem)]"
            />
            <section className="relative w-full max-w-[430px]">
                <div className="mb-6 flex justify-center">
                    <Brand href="/login" />
                </div>
                <div className="rounded-[30px] border border-white/80 bg-white/86 p-7 shadow-[0_30px_90px_rgba(56,49,105,.11)] backdrop-blur-3xl sm:p-9">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                            <Icon name="user" className="size-[18px]" />
                        </span>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-brand-strong">
                                Seu workspace
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                                Vendas, clientes e pagamentos
                            </p>
                        </div>
                    </div>
                    <h1 className="mt-7 text-[28px] font-semibold tracking-[-.05em] text-[#17182f]">
                        Bem-vindo de volta
                    </h1>
                    <p className="mt-2 text-[12px] leading-5 text-muted">
                        Entre para continuar cuidando da sua operação no Astro.
                    </p>
                    <form action="/api/auth/login" method="post" className="mt-7 space-y-4">
                        <Field label="E-mail">
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="voce@empresa.com"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Senha">
                            <input
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                placeholder="Sua senha"
                                className={inputClass}
                            />
                        </Field>
                        <label className="flex items-center gap-2.5 text-[11px] text-muted">
                            <input
                                type="checkbox"
                                name="remember"
                                className="size-4 rounded border-[#d9d7e8] accent-brand"
                            />
                            Manter conectado
                        </label>
                        <Button type="submit" variant="primary" className="mt-2 w-full">
                            Entrar no Astro
                            <Icon name="arrow-right" className="size-4" />
                        </Button>
                    </form>
                    <p className="mt-6 border-t border-[#ecebf3] pt-5 text-center text-[11px] text-muted">
                        Ainda não usa o Astro?{' '}
                        <Link
                            href="/register"
                            className="font-semibold text-brand-strong transition hover:text-brand"
                        >
                            Criar uma conta
                        </Link>
                    </p>
                </div>
            </section>
        </div>
    );
}

const inputClass =
    'h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/75 px-3.5 text-[13px] font-normal text-[#17182f] outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.14)]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-[12px] font-semibold text-[#24253c]">
            {label}
            <span className="mt-2 block">{children}</span>
        </label>
    );
}
