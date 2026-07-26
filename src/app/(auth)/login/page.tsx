import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

import { AuthFrame } from '@/components/auth/auth-frame';
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
        <AuthFrame mode="login">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                Bem-vindo de volta
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Entre na sua conta</h2>
            <p className="mt-2 text-[13px] leading-5 text-muted">
                Use seus dados para acessar o painel da sua organização.
            </p>
            {feedback && (
                <div
                    role="alert"
                    className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7] p-3 text-[13px] text-danger"
                >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-danger/10 font-bold">
                        !
                    </span>
                    <p className="pt-0.5">{feedback}</p>
                </div>
            )}
            <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
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
                <label className="flex items-center gap-2.5 text-[13px] text-muted">
                    <input
                        type="checkbox"
                        name="remember"
                        className="size-4 rounded border-[#d9d7e8] accent-brand"
                    />
                    Manter conectado
                </label>
                <Button
                    type="submit"
                    className="glass-interactive flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] transition hover:bg-brand-strong"
                >
                    Entrar no Astro
                    <Icon name="arrow-right" className="size-4" />
                </Button>
            </form>
        </AuthFrame>
    );
}

const inputClass =
    'h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/70 px-3.5 text-[13px] font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.16)]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-[13px] font-semibold">
            {label}
            <span className="mt-2 block">{children}</span>
        </label>
    );
}
