import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#202235] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-24 top-24 size-80 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -bottom-36 right-0 size-96 rounded-full bg-[#4a9b87]/20 blur-3xl" />
        <div className="relative"><Brand /></div>
        <div className="relative my-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#aaa6ef]">Sua operação em um só lugar</p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-[-0.045em] xl:text-5xl">Venda mais.<br />Opere com clareza.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#c2c4d1]">Crie checkouts, conecte gateways e acompanhe toda a jornada dos seus clientes.</p>
          <ul className="mt-9 space-y-4 text-sm text-[#e0e1e8]"><Benefit text="Pagamentos e assinaturas unificados" /><Benefit text="Controle completo de produtos e checkouts" /><Benefit text="Métricas para decidir com segurança" /></ul>
        </div>
        <p className="relative text-xs text-[#818496]">© 2026 Astro. Infraestrutura para negócios digitais.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#fbfbfd] px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Bem-vindo de volta</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Entre na sua conta</h2>
          <p className="mt-2 text-sm text-muted">Use seus dados para acessar o painel.</p>
          {error && <div role="alert" className="mt-6 rounded-xl border border-[#f2c9d1] bg-[#fff2f4] px-4 py-3 text-sm text-danger">{error}</div>}
          <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-semibold">E-mail</span><input name="email" type="email" required autoComplete="email" placeholder="voce@empresa.com" className="h-12 w-full rounded-xl border bg-white px-3.5 text-sm shadow-sm placeholder:text-[#a9abb8] focus:border-brand focus:ring-2 focus:ring-brand/15" /></label>
            <label className="block"><span className="mb-2 flex items-center justify-between text-sm font-semibold">Senha<Link href="#" className="text-xs font-semibold text-brand-strong hover:underline">Esqueci minha senha</Link></span><input name="password" type="password" required autoComplete="current-password" placeholder="Sua senha" className="h-12 w-full rounded-xl border bg-white px-3.5 text-sm shadow-sm placeholder:text-[#a9abb8] focus:border-brand focus:ring-2 focus:ring-brand/15" /></label>
            <label className="flex items-center gap-2.5 text-sm text-muted"><input type="checkbox" name="remember" className="size-4 rounded border accent-brand" />Manter conectado</label>
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong">Entrar no Astro<Icon name="arrow-right" className="size-4" /></button>
          </form>
          <p className="mt-8 text-center text-sm text-muted">Ainda não tem uma conta? <Link href="/register" className="font-semibold text-brand-strong hover:underline">Começar agora</Link></p>
        </div>
      </section>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return <li className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-[#6f63dc]"><Icon name="check" className="size-3.5" /></span>{text}</li>;
}
