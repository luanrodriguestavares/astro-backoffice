"use client";

import "@puckeditor/core/puck.css";

import { Puck } from "@puckeditor/core";
import Link from "next/link";
import { useRef, useState } from "react";

import { checkoutBuilderConfig, type BuilderData } from "@/components/checkout-builder/config";
import { documentToPuck, puckToDocument } from "@/lib/checkout/puck-data";
import type { Checkout, CheckoutDocument, CheckoutDraft } from "@/lib/api/types";

export function CheckoutEditor({ checkout, draft }: { checkout: Checkout; draft: CheckoutDraft }) {
  const [initialData] = useState<BuilderData>(() => documentToPuck(draft.document));
  const current = useRef<BuilderData>(initialData);
  const revision = useRef(draft.revision);
  const document = useRef<CheckoutDocument>(draft.document);
  const saving = useRef(false);
  const [state, setState] = useState<"saved" | "changed" | "saving" | "published" | "error">("saved");
  const [message, setMessage] = useState<string>();

  async function save(data: BuilderData = current.current) {
    if (saving.current) return false;
    saving.current = true; setState("saving"); setMessage(undefined);
    const nextDocument = puckToDocument(data, document.current);
    const response = await fetch(`/api/checkouts/${checkout.id}/draft`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ document: nextDocument, revision: revision.current }) });
    const body = await response.json() as { data?: CheckoutDraft; detail?: string };
    saving.current = false;
    if (!response.ok || !body.data) { setState("error"); setMessage(body.detail ?? "Não foi possível salvar o rascunho."); return false; }
    revision.current = body.data.revision; document.current = body.data.document; setState("saved"); setMessage("Rascunho salvo."); return true;
  }

  async function publish(data: BuilderData) {
    current.current = data as BuilderData;
    if (!(await save(data))) return;
    setState("saving"); setMessage("Validando e publicando...");
    const response = await fetch(`/api/checkouts/${checkout.id}/publish`, { method: "POST" });
    const body = await response.json() as { detail?: string };
    if (!response.ok) { setState("error"); setMessage(body.detail ?? "Não foi possível publicar."); return; }
    setState("published"); setMessage("Checkout publicado com sucesso.");
  }

  return <div className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8">
    <div className="flex flex-wrap items-center gap-3 border-y bg-white px-4 py-3 sm:px-6"><Link href="/checkouts" className="text-sm font-semibold text-muted hover:text-foreground">← Checkouts</Link><span className="h-5 w-px bg-[#e4e4eb]" /><div><p className="text-sm font-bold">{checkout.name}</p><p className="text-[11px] text-muted">/{checkout.slug}</p></div><span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ${state === "error" ? "bg-[#fff2f4] text-danger" : state === "published" ? "bg-[#e8f7f1] text-success" : "bg-surface-muted text-muted"}`}>{statusLabel(state)}</span>{message && <span className="hidden text-xs text-muted md:inline">{message}</span>}</div>
    <Puck config={checkoutBuilderConfig} data={initialData} height="calc(100dvh - 145px)" headerTitle="Editor do checkout" headerPath={`/${checkout.slug}`} viewports={[{ width: 390, height: "auto", label: "Celular", icon: "Smartphone" }, { width: 768, height: "auto", label: "Tablet", icon: "Tablet" }, { width: 1440, height: "auto", label: "Desktop", icon: "Monitor" }]} iframe={{ enabled: true, syncHostStyles: false }} onChange={(data) => { current.current = data as BuilderData; setState("changed"); setMessage(undefined); }} onPublish={publish} renderHeaderActions={() => <button type="button" disabled={state === "saving"} onClick={() => void save()} style={{ border: "1px solid #dedee7", borderRadius: 6, background: "white", padding: "7px 12px", fontSize: 13, fontWeight: 650, cursor: "pointer" }}>Salvar rascunho</button>} />
  </div>;
}

function statusLabel(state: "saved" | "changed" | "saving" | "published" | "error") { return { saved: "Salvo", changed: "Alterações não salvas", saving: "Salvando...", published: "Publicado", error: "Erro" }[state]; }
