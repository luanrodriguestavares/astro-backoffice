"use client";

import { Children, FormEvent, isValidElement, useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { CustomSelect } from "@/components/ui/custom-select";
import type { Organization } from "@/lib/api/types";

export function OrganizationForm({ organization }: { organization: Organization }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [failed, setFailed] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(undefined); setFailed(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings/organization", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName: form.get("displayName"), timezone: form.get("timezone"), locale: form.get("locale"), version: organization.version }) });
    const body = await response.json() as { detail?: string }; setLoading(false);
    if (!response.ok) { setFailed(true); setMessage(body.detail ?? "Não foi possível salvar as configurações."); return; }
    setMessage("Configurações salvas com sucesso."); router.refresh();
  }
  return <form onSubmit={submit} className="glass-panel rounded-[28px] p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[13px] border border-white/80 bg-brand-soft/75 text-brand"><Icon name="settings" className="size-4" /></span><div><h2 className="text-sm font-semibold tracking-[-0.02em]">Organização</h2><p className="mt-1 text-[12px] text-muted">Identificação e preferências do painel</p></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field name="displayName" label="Nome de exibição" defaultValue={organization.displayName} required /><Field name="slug" label="Identificador" defaultValue={organization.slug} disabled /><Select name="timezone" label="Fuso horário" defaultValue={organization.timezone ?? "America/Fortaleza"}><option value="America/Fortaleza">Fortaleza</option><option value="America/Sao_Paulo">São Paulo</option><option value="America/Manaus">Manaus</option><option value="UTC">UTC</option></Select><Select name="locale" label="Idioma" defaultValue={organization.locale ?? "pt-BR"}><option value="pt-BR">Português (Brasil)</option><option value="en-US">English (US)</option></Select></div>{message && <p role="status" className={`mt-5 rounded-2xl border p-3 text-[13px] ${failed ? "border-[#f7d8de] bg-[#fff5f7]/75 text-danger" : "border-[#d5f0e5] bg-[#e8f7f1]/70 text-success"}`}>{message}</p>}<div className="mt-7 flex justify-end"><button disabled={loading} className="glass-interactive h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] disabled:opacity-50">{loading ? "Salvando..." : "Salvar alterações"}</button></div></form>;
}

function Field({ label, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="text-[13px] font-semibold">{label}<input {...input} className="mt-2 h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/70 px-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.16)] disabled:bg-white/35 disabled:text-muted" /></label>; }
function Select({ label, children, ...select }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) { const options = Children.toArray(children).filter(isValidElement).map((option) => ({ value: String((option.props as { value: string }).value), label: String((option.props as { children: React.ReactNode }).children) })); return <label className="text-[13px] font-semibold">{label}<div className="mt-2"><CustomSelect name={select.name ?? ""} defaultValue={String(select.defaultValue ?? "")} options={options} /></div></label>; }
