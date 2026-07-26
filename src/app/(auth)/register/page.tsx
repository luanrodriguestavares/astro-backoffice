import type { Metadata } from 'next';

import { AuthFrame } from '@/components/auth/auth-frame';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    return (
        <AuthFrame mode="register">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                Conta gratuita
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
                Crie sua conta no Astro
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-muted">
                Leva poucos minutos para preparar sua organização.
            </p>
            {error && (
                <div
                    role="alert"
                    className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7] p-3 text-[13px] text-danger"
                >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-danger/10 font-bold">
                        !
                    </span>
                    <p className="pt-0.5">{error}</p>
                </div>
            )}
            <RegisterForm />
        </AuthFrame>
    );
}
