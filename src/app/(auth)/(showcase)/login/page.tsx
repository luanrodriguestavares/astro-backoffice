import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';

import { AuthDivider, GoogleButton } from '@/components/auth/auth-frame';
import { AuthToast } from '@/components/auth/auth-toast';
import { PasswordInput } from '@/components/auth/password-input';
import { Icon, type IconName } from '@/components/ui/icon';
import { LOGIN_EMAIL_COOKIE } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; expired?: string; message?: string; invite?: string }>;
}) {
    const { error, expired, message, invite } = await searchParams;
    const rememberedEmail = (await cookies()).get(LOGIN_EMAIL_COOKIE)?.value;
    const inviteQuery = invite ? `?invite=${encodeURIComponent(invite)}` : '';
    const feedback =
        error ??
        message ??
        (expired === '1' ? 'Sua sessão expirou. Entre novamente para continuar.' : undefined);
    return (
        <>
            <AuthToast message={feedback} tone={error ? 'error' : 'info'} />
            <h1 className="auth-display text-[30px] leading-tight tracking-[-.04em] text-[#141414] sm:text-[32px]">
                Bem-vindo de volta
            </h1>
            <p className="mt-1.5 text-[14px] leading-5 text-[#6a6e73]">
                Entre para continuar cuidando da sua operação no Astro.
            </p>
            <form action={`/api/auth/login${inviteQuery}`} method="post" className="mt-7 space-y-4">
                {invite && <input type="hidden" name="invitationToken" value={invite} />}
                <Field label="E-mail" icon="mail">
                    <input
                        name="email"
                        type="email"
                        required
                        autoComplete="username"
                        defaultValue={rememberedEmail}
                        placeholder="voce@empresa.com"
                        className={inputClass}
                    />
                </Field>
                <Field label="Senha" icon="lock">
                    <PasswordInput
                        name="password"
                        required
                        autoComplete="current-password"
                        autoFocus={rememberedEmail !== undefined}
                        placeholder="Sua senha"
                        className={inputClass}
                    />
                </Field>
                <div className="flex items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#4a4e52]">
                        <input
                            type="checkbox"
                            name="remember"
                            defaultChecked={rememberedEmail !== undefined}
                            className="auth-radio"
                        />
                        Manter conectado
                    </label>
                    <Link href="/forgot-password" className="auth-link text-[13px] !font-medium">
                        Esqueci minha senha
                    </Link>
                </div>
                <button type="submit" className="auth-cta !mt-6">
                    Entrar no Astro
                    <Icon name="arrow-right" className="size-[18px]" />
                </button>
            </form>
            <AuthDivider />
            <GoogleButton />
            <p
                style={{ animationDelay: '220ms' }}
                className="auth-swap mt-6 text-center text-[13px] text-[#6a6e73]"
            >
                Ainda não usa o Astro?{' '}
                <Link href={`/register${inviteQuery}`} className="auth-link">
                    Criar uma conta
                </Link>
            </p>
        </>
    );
}

const inputClass =
    'h-12 w-full rounded-full border border-[#e6e8eb] bg-white/75 pl-11 pr-4 text-[13.5px] font-normal text-[#111111] outline-none transition duration-200 placeholder:text-[#a9adb1] hover:border-[#d9dde1] focus:border-[#5ef09e] focus:bg-white focus:shadow-[0_0_0_4px_rgb(46_227_127_/_14%)]';

function Field({
    label,
    icon,
    children,
}: {
    label: string;
    icon: IconName;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-[13px] font-medium text-[#2b2e31]">
            {label}
            <span className="relative mt-2 block">
                {children}
                <Icon
                    name={icon}
                    className="pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-[#8a8f94]"
                />
            </span>
        </label>
    );
}
