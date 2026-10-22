import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthDivider, GoogleButton } from '@/components/auth/auth-frame';
import { AuthToast } from '@/components/auth/auth-toast';
import { RegisterForm } from '@/components/auth/register-form';
import { getInvitationPreview } from '@/lib/auth/invitation';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; invite?: string }>;
}) {
    const { error, invite } = await searchParams;
    const invitation = invite ? await getInvitationPreview(invite) : undefined;
    if (invite && invitation === undefined)
        redirect(`/invitation?token=${encodeURIComponent(invite)}`);
    const inviteQuery = invite ? `?invite=${encodeURIComponent(invite)}` : '';
    return (
        <>
            <AuthToast message={error} />
            <header className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[9.5px] font-semibold uppercase tracking-[.2em] text-[#3a3e42] shadow-[inset_0_0_0_1px_rgb(16_18_20_/_6%)]">
                    <span className="size-1.5 rounded-full bg-[#91cf24]" />
                    Comece no Astro
                </span>
                <h1 className="auth-display mt-3 text-[26px] font-extrabold leading-tight tracking-[-.025em] text-[#0b0d0e] sm:text-[28px]">
                    {invitation ? `Entre em ${invitation.organizationName}` : 'Crie sua conta'}
                </h1>
                <p className="mt-1 text-[13.5px] text-[#6a6e73]">
                    {invitation
                        ? 'Sua conta não precisa de uma organização própria.'
                        : 'Três passos para preparar sua operação.'}
                </p>
            </header>
            <RegisterForm
                invitation={invitation ? { ...invitation, token: invite! } : undefined}
                social={
                    invitation === undefined && (
                        <>
                            <AuthDivider />
                            <GoogleButton />
                        </>
                    )
                }
            />
            <p
                style={{ animationDelay: '220ms' }}
                className="auth-swap mt-5 text-center text-[13px] text-[#6a6e73]"
            >
                Já tem uma conta?{' '}
                <Link href={`/login${inviteQuery}`} className="auth-link">
                    Entrar
                </Link>
            </p>
        </>
    );
}
