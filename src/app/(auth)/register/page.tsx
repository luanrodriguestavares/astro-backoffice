import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Criar conta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.82fr_1.18fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#202235] p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col xl:p-12">
        <div className="absolute -left-24 top-24 size-80 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -bottom-36 right-0 size-96 rounded-full bg-[#4a9b87]/20 blur-3xl" />
        <div className="relative"><Brand /></div>
        <div className="relative my-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#aaa6ef]">Comece hoje</p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-[-0.045em] xl:text-5xl">Seu checkout.<br />Sua operação.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#c2c4d1]">Configure seu negócio e publique a primeira experiência de compra com segurança.</p>
          <div className="mt-9 space-y-5"><OnboardingStep number="1" text="Crie sua conta e organização" active /><OnboardingStep number="2" text="Conecte seu gateway preferido" /><OnboardingStep number="3" text="Cadastre e publique seu produto" /></div>
        </div>
        <p className="relative text-xs text-[#818496]">Sem cartão de crédito. Configure no seu ritmo.</p>
      </section>

      <section className="flex min-h-screen justify-center bg-[#fbfbfd] px-5 py-8 sm:px-10 lg:py-12">
        <div className="w-full max-w-[650px]">
          <div className="mb-8 flex items-center justify-between lg:justify-end"><div className="lg:hidden"><Brand /></div><p className="text-sm text-muted">Já possui uma conta? <Link href="/login" className="font-semibold text-brand-strong hover:underline">Entrar</Link></p></div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Conta gratuita</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Crie sua conta no Astro</h2>
          <p className="mt-2 text-sm text-muted">Leva poucos minutos para preparar sua organização.</p>
          {error && <div role="alert" className="mt-6 rounded-xl border border-[#f2c9d1] bg-[#fff2f4] px-4 py-3 text-sm text-danger">{error}</div>}
          <RegisterForm />
          <p className="mt-6 text-center text-xs text-muted">Seus dados são protegidos e nunca são compartilhados com gateways sem autorização.</p>
        </div>
      </section>
    </div>
  );
}

function OnboardingStep({ number, text, active = false }: { number: string; text: string; active?: boolean }) {
  return <div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full border text-xs font-bold ${active ? "border-[#8276ef] bg-[#8276ef] text-white" : "border-[#55576b] text-[#aeb0bf]"}`}>{active ? <Icon name="check" className="size-4" /> : number}</span><span className={active ? "font-semibold text-white" : "text-sm text-[#aeb0bf]"}>{text}</span></div>;
}
