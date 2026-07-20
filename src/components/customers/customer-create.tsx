"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export function CustomerCreate() {
  const router = useRouter(); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(undefined); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/customers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), phone: String(form.get("phone") ?? "").trim() || undefined, locale: "pt-BR", timezone: "America/Fortaleza", metadata: {} }) });
    const body = await response.json() as { detail?: string }; setLoading(false); if (!response.ok) return setError(body.detail ?? "Falha ao cadastrar."); setOpen(false); router.refresh();
  }
  return <><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"><Icon name="plus" className="size-4" />Adicionar cliente</button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-[#111322]/55 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><h2 className="text-xl font-bold">Novo cliente</h2><button type="button" onClick={() => setOpen(false)}><Icon name="close" /></button></div><div className="mt-6 space-y-4"><Field name="name" label="Nome" required /><Field name="email" label="E-mail" type="email" required /><Field name="phone" label="Telefone (opcional)" /></div>{error && <p className="mt-4 rounded-lg bg-[#fff2f4] p-2.5 text-xs text-danger">{error}</p>}<div className="mt-6 flex gap-2"><button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold">Cancelar</button><button disabled={loading} className="flex-1 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Salvando..." : "Cadastrar"}</button></div></form></div>}</>;
}
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { const { label, ...input } = props; return <label className="block text-xs font-semibold">{label}<input {...input} className="mt-1.5 h-11 w-full rounded-xl border px-3 font-normal" /></label>; }
