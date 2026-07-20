"use client";

import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/custom-select";
import { Icon } from "@/components/ui/icon";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function CouponCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [discountType, setDiscountType] = useState("percentage");
  function close() { if (!loading) { setOpen(false); setError(undefined); } }
  useEscapeClose(open, close);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(undefined); const form = new FormData(event.currentTarget); const shownValue = Number(String(form.get("discountValue") ?? "0").replace(",", ".")); const response = await fetch("/api/coupons", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), code: form.get("code"), discountType, discountValue: Math.round(shownValue * 100), ...(discountType === "fixed" ? { currency: "BRL" } : {}), status: "active", metadata: {} }) }); const body = await response.json() as { detail?: string }; setLoading(false); if (!response.ok) return setError(body.detail ?? "Não foi possível cadastrar o cupom."); setOpen(false); setDiscountType("percentage"); router.refresh(); }
  return <><button type="button" onClick={() => setOpen(true)} className="glass-interactive inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)]"><Icon name="plus" className="size-3.5" />Criar cupom</button>{open && createPortal(<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm"><form onSubmit={submit} className="modal-surface glass-panel my-6 w-full max-w-2xl rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">Promoções</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Novo cupom</h2><p className="mt-1.5 text-[13px] leading-5 text-muted">Crie um código de desconto para utilizar nos checkouts.</p></div><button type="button" aria-label="Fechar" disabled={loading} onClick={close} className="grid size-9 place-items-center rounded-full border border-white/80 bg-white/45 text-muted"><Icon name="close" className="size-4" /></button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field name="name" label="Nome" placeholder="Ex.: Campanha de lançamento" required /><Field name="code" label="Código" placeholder="LANCAMENTO10" required className="uppercase" /><label className="text-[13px] font-semibold">Tipo de desconto<div className="mt-2"><CustomSelect name="discountType" value={discountType} onValueChange={setDiscountType} options={[{ value: "percentage", label: "Percentual" }, { value: "fixed", label: "Valor fixo" }]} /></div></label><Field name="discountValue" label={discountType === "percentage" ? "Desconto (%)" : "Desconto (R$)"} type="number" min="0.01" max={discountType === "percentage" ? "100" : undefined} step="0.01" placeholder={discountType === "percentage" ? "10" : "25,00"} required /></div>{error && <p role="alert" className="mt-5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7] p-3 text-[13px] text-danger">{error}</p>}<div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={loading} onClick={close} className="h-11 rounded-xl border border-[#d9d7e8] bg-white/70 px-5 text-[13px] font-semibold text-muted">Cancelar</button><button disabled={loading} className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] disabled:opacity-50">{loading ? "Criando..." : "Criar cupom"}</button></div></form></div>, document.body)}</>;
}

function Field({ label, className, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="text-[13px] font-semibold">{label}<input {...input} className={`mt-2 h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/70 px-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.16)] ${className ?? ""}`} /></label>; }
