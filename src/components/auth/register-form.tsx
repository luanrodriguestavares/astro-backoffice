"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icon";

const inputClass =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-sm shadow-sm placeholder:text-[#a9abb8] focus:border-brand focus:ring-2 focus:ring-brand/15";

export function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [customSlug, setCustomSlug] = useState(false);

  function updateDisplayName(value: string) {
    setDisplayName(value);
    if (!customSlug) setSlug(slugify(value));
  }

  return (
    <form action="/api/auth/register" method="post" className="mt-8 space-y-7">
      <fieldset>
        <legend className="text-sm font-bold">Seus dados</legend>
        <p className="mt-1 text-xs text-muted">Você será o administrador da organização.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo"><input name="name" required minLength={2} maxLength={160} autoComplete="name" placeholder="Seu nome" className={inputClass} /></Field>
          <Field label="E-mail profissional"><input name="email" required type="email" maxLength={320} autoComplete="email" placeholder="voce@empresa.com" className={inputClass} /></Field>
          <Field label="Senha" hint="Mínimo de 12 caracteres"><input name="password" required type="password" minLength={12} maxLength={128} autoComplete="new-password" placeholder="Crie uma senha segura" className={inputClass} /></Field>
          <Field label="Confirmar senha"><input name="passwordConfirmation" required type="password" minLength={12} maxLength={128} autoComplete="new-password" placeholder="Repita sua senha" className={inputClass} /></Field>
        </div>
      </fieldset>

      <div className="border-t" />

      <fieldset>
        <legend className="text-sm font-bold">Sua organização</legend>
        <p className="mt-1 text-xs text-muted">Esses dados identificam o seu negócio dentro do Astro.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome da marca"><input name="displayName" value={displayName} onChange={(event) => updateDisplayName(event.target.value)} required minLength={2} maxLength={160} placeholder="Astro Store" className={inputClass} /></Field>
          <Field label="Razão social"><input name="legalName" required minLength={2} maxLength={200} autoComplete="organization" placeholder="Empresa LTDA" className={inputClass} /></Field>
          <Field label="Tipo de documento"><select name="documentType" required defaultValue="CNPJ" className={inputClass}><option value="CNPJ">CNPJ</option><option value="CPF">CPF</option><option value="OTHER">Outro</option></select></Field>
          <Field label="Número do documento"><input name="documentNumber" required minLength={5} maxLength={40} inputMode="numeric" placeholder="00.000.000/0001-00" className={inputClass} /></Field>
          <div className="sm:col-span-2"><Field label="Identificador da organização" hint="Usado em URLs e integrações"><div className="flex h-11 overflow-hidden rounded-xl border bg-white shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15"><span className="flex items-center border-r bg-[#fafafd] px-3 text-xs text-muted">astro.app/</span><input name="slug" value={slug} onChange={(event) => { setCustomSlug(true); setSlug(slugify(event.target.value)); }} required minLength={2} maxLength={80} placeholder="minha-empresa" className="min-w-0 flex-1 px-3 text-sm outline-none" /></div></Field></div>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl bg-[#f8f8fc] p-3.5 text-xs leading-5 text-muted"><input type="checkbox" name="terms" required className="mt-0.5 size-4 shrink-0 rounded border accent-brand" /><span>Li e concordo com os <a href="#" className="font-semibold text-brand-strong hover:underline">Termos de Uso</a> e a <a href="#" className="font-semibold text-brand-strong hover:underline">Política de Privacidade</a>.</span></label>
      <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong">Criar conta gratuita<Icon name="arrow-right" className="size-4" /></button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex items-center justify-between text-xs font-semibold sm:text-sm"><span>{label}</span>{hint && <span className="text-[10px] font-normal text-muted">{hint}</span>}</span>{children}</label>;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
