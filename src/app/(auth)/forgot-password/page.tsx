import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthToast } from '@/components/auth/auth-toast';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    return (
        <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f7fb] px-4 py-10">
            <AuthToast message={error} tone="error" />
            <section className="relative w-full max-w-[430px]">
                <div className="mb-6 flex justify-center">
                    <Brand href="/login" />
                </div>
                <div className="rounded-[30px] border border-white/80 bg-white/86 p-7 shadow-[0_30px_90px_rgba(56,49,105,.11)] backdrop-blur-3xl sm:p-9">
                    <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                        <Icon name="user" className="size-[18px]" />
                    </span>
                    <h1 className="mt-6 text-[26px] font-semibold tracking-[-.05em]">
                        Recuperar senha
                    </h1>
                    <p className="mt-2 text-[12px] leading-5 text-muted">
                        Informe seu e-mail. Se a conta existir, enviaremos um link seguro para criar
                        uma nova senha.
                    </p>
                    <form
                        action="/api/auth/password-reset/request"
                        method="post"
                        className="mt-7 space-y-4"
                    >
                        <label className="block text-[12px] font-semibold">
                            E-mail
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="voce@empresa.com"
                                className={`${inputClass} mt-2`}
                            />
                        </label>
                        <Button type="submit" variant="primary" className="w-full">
                            Enviar link de recuperação
                        </Button>
                    </form>
                    <Link
                        href="/login"
                        className="mt-6 block text-center text-[11px] font-semibold text-brand-strong"
                    >
                        Voltar para o login
                    </Link>
                </div>
            </section>
        </div>
    );
}

const inputClass =
    'h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/75 px-3.5 text-[13px] outline-none focus:border-brand/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.14)]';
