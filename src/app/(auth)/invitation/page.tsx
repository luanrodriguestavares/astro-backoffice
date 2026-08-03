import type { Metadata } from 'next';
import Link from 'next/link';

import { Brand } from '@/components/brand';
import { Icon } from '@/components/ui/icon';
import { getInvitationPreview } from '@/lib/auth/invitation';

export const metadata: Metadata = { title: 'Convite para workspace' };

export default async function InvitationPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token = '' } = await searchParams;
    const invitation = await getInvitationPreview(token);
    const query = `?invite=${encodeURIComponent(token)}`;

    return (
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f7fb] px-4 py-10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(109,93,244,.12),transparent_28rem),radial-gradient(circle_at_90%_92%,rgba(150,136,240,.1),transparent_30rem)]" />
            <section className="relative w-full max-w-[470px]">
                <div className="mb-6 flex justify-center"><Brand href="/" /></div>
                <div className="rounded-[30px] border border-white/80 bg-white/86 p-7 text-center shadow-[0_30px_90px_rgba(56,49,105,.11)] backdrop-blur-3xl sm:p-9">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                        <Icon name={invitation ? 'users' : 'clock'} className="size-5" />
                    </span>
                    {invitation ? (
                        <>
                            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[.18em] text-brand-strong">Uma equipe espera por você</p>
                            <h1 className="mt-2 text-[27px] font-semibold tracking-[-.05em] text-[#17182f]">Entre em {invitation.organizationName}</h1>
                            <p className="mx-auto mt-3 max-w-[350px] text-[12px] leading-5 text-muted">O convite foi enviado para {invitation.email}. Você terá o perfil {invitation.role} nesta workspace.</p>
                            <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                <Link href={`/login${query}`} className="inline-flex h-11 items-center justify-center rounded-full border border-brand/20 bg-white px-5 text-[12px] font-semibold text-brand-strong transition hover:bg-brand-soft">Já tenho conta</Link>
                                <Link href={`/register${query}`} className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-[12px] font-semibold text-white shadow-sm transition hover:brightness-105">Criar minha conta</Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="mt-5 text-[25px] font-semibold tracking-[-.04em] text-[#17182f]">Este convite não está disponível</h1>
                            <p className="mt-3 text-[12px] leading-5 text-muted">Ele pode ter expirado, já ter sido usado ou ter sido cancelado. Peça um novo convite ao administrador da workspace.</p>
                            <Link href="/login" className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-[12px] font-semibold text-white">Ir para o login</Link>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
