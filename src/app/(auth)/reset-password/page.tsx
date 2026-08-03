import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthToast } from '@/components/auth/auth-toast';
import { PasswordInput } from '@/components/auth/password-input';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Redefinir senha' };

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string; error?: string; message?: string }>;
}) {
    const { token = '', error, message } = await searchParams;
    return (
        <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f7fb] px-4 py-10">
            <AuthToast message={error ?? message} tone={error ? 'error' : 'info'} />
            <section className="relative w-full max-w-[430px]">
                <div className="mb-6 flex justify-center">
                    <Brand href="/login" />
                </div>
                <div className="rounded-[30px] border border-white/80 bg-white/86 p-7 shadow-[0_30px_90px_rgba(56,49,105,.11)] backdrop-blur-3xl sm:p-9">
                    <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                        <Icon name="settings" className="size-[18px]" />
                    </span>
                    <h1 className="mt-6 text-[26px] font-semibold tracking-[-.05em]">
                        Crie uma nova senha
                    </h1>
                    <p className="mt-2 text-[12px] leading-5 text-muted">
                        Use pelo menos 12 caracteres e evite reutilizar senhas de outros serviços.
                    </p>
                    {token ? (
                        <form
                            action="/api/auth/password-reset/confirm"
                            method="post"
                            className="mt-7 space-y-4"
                        >
                            <input type="hidden" name="token" value={token} />
                            <Field label="Nova senha">
                                <PasswordInput
                                    name="password"
                                    required
                                    minLength={12}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Confirmar nova senha">
                                <PasswordInput
                                    name="passwordConfirmation"
                                    required
                                    minLength={12}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    className={inputClass}
                                />
                            </Field>
                            <Button type="submit" variant="primary" className="w-full">
                                Salvar nova senha
                            </Button>
                        </form>
                    ) : (
                        <div className="mt-6 rounded-xl border border-warning/25 bg-warning/8 p-4 text-[12px] text-muted">
                            Este link não contém um token de recuperação válido.
                        </div>
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

const inputClass =
    'h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/75 px-3.5 text-[13px] outline-none focus:border-brand/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.14)]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-[12px] font-semibold">
            {label}
            <span className="mt-2 block">{children}</span>
        </label>
    );
}
