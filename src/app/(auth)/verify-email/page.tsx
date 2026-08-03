import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthToast } from '@/components/auth/auth-toast';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Verificar e-mail' };

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{
        token?: string;
        email?: string;
        error?: string;
        message?: string;
    }>;
}) {
    const { token = '', email = '', error, message } = await searchParams;
    return (
        <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f7fb] px-4 py-10">
            <AuthToast message={error ?? message} tone={error ? 'error' : 'info'} />
            <section className="relative w-full max-w-[430px]">
                <div className="mb-6 flex justify-center">
                    <Brand href="/login" />
                </div>
                <div className="rounded-[30px] border border-white/80 bg-white/86 p-7 shadow-[0_30px_90px_rgba(56,49,105,.11)] backdrop-blur-3xl sm:p-9">
                    <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                        <Icon name="check" className="size-[18px]" />
                    </span>
                    <h1 className="mt-6 text-[26px] font-semibold tracking-[-.05em]">
                        Verifique seu e-mail
                    </h1>
                    {token ? (
                        <>
                            <p className="mt-2 text-[12px] leading-5 text-muted">
                                Confirme abaixo para validar seu endereço de e-mail e concluir a
                                ativação da conta.
                            </p>
                            <form
                                action="/api/auth/email-verification/confirm"
                                method="post"
                                className="mt-7"
                            >
                                <input type="hidden" name="token" value={token} />
                                <Button type="submit" variant="primary" className="w-full">
                                    Confirmar meu e-mail
                                </Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <p className="mt-2 text-[12px] leading-5 text-muted">
                                Enviamos um link de uso único para{' '}
                                <strong className="text-foreground">
                                    {email || 'o endereço informado'}
                                </strong>
                                . Ele expira em 24 horas.
                            </p>
                            <form
                                action="/api/auth/email-verification/request"
                                method="post"
                                className="mt-7 space-y-3"
                            >
                                <label className="block text-[12px] font-semibold">
                                    E-mail
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        defaultValue={email}
                                        autoComplete="email"
                                        className="mt-2 h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/75 px-3.5 text-[13px] outline-none focus:border-brand/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.14)]"
                                    />
                                </label>
                                <Button type="submit" variant="secondary" className="w-full">
                                    Reenviar e-mail de confirmação
                                </Button>
                            </form>
                        </>
                    )}
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
