import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthToast } from '@/components/auth/auth-toast';
import { Brand } from '@/components/brand';
import { RegisterForm } from '@/components/auth/register-form';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#f7f7fb] px-4 py-5 lg:grid lg:h-screen lg:place-items-center lg:overflow-hidden lg:py-4">
            <AuthToast message={error} />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(109,93,244,.12),transparent_28rem),radial-gradient(circle_at_90%_92%,rgba(150,136,240,.1),transparent_30rem)]"
            />
            <section className="relative mx-auto w-full max-w-[920px]">
                <div className="mb-3 flex items-center justify-between px-1 lg:mb-4">
                    <Brand href="/register" />
                    <p className="text-[11px] text-muted">
                        Já tem uma conta?{' '}
                        <Link
                            href="/login"
                            className="font-semibold text-brand-strong hover:text-brand"
                        >
                            Entrar
                        </Link>
                    </p>
                </div>
                <div className="rounded-[28px] border border-white/80 bg-white/86 p-5 shadow-[0_30px_90px_rgba(56,49,105,.11)] backdrop-blur-3xl sm:p-6 lg:p-7">
                    <header className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                            <Icon name="bolt" className="size-[18px]" />
                        </span>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-brand-strong">
                                Comece no Astro
                            </p>
                            <div className="flex flex-wrap items-baseline gap-x-3">
                                <h1 className="text-[23px] font-semibold tracking-[-.045em] text-[#17182f]">
                                    Crie sua conta
                                </h1>
                                <p className="text-[11px] text-muted">
                                    Prepare seu workspace em poucos minutos.
                                </p>
                            </div>
                        </div>
                    </header>
                    <RegisterForm />
                </div>
            </section>
        </div>
    );
}
