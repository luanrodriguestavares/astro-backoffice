"use client";

import { Button } from "@/components/ui/button";

import "@puckeditor/core/puck.css";

import { Puck } from "@puckeditor/core";
import Link from "next/link";
import { useRef, useState } from "react";

import { checkoutBuilderConfig, type BuilderData } from "@/components/checkout-builder/config";
import { Icon } from "@/components/ui/icon";
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

  return (
    <div className="astro-checkout-editor min-h-screen overflow-hidden bg-[#f7f7fa]">
      <header className="flex h-14 items-center gap-3 border-b border-[#e9e9ef] bg-white px-3 sm:px-5">
        <Link
          href="/checkouts"
          aria-label="Voltar para checkouts"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Icon name="arrow-right" className="size-3.5 rotate-180" />
        </Link>
        <span className="h-5 w-px bg-[#e6e6ec]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{checkout.name}</p>
          <p className="truncate text-[10px] text-muted">/{checkout.slug}</p>
        </div>
        {message && <span className="ml-auto hidden truncate text-xs text-muted lg:block">{message}</span>}
        <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold lg:ml-0 ${state === "error" ? "bg-[#fff2f4] text-danger" : state === "published" ? "bg-[#e8f7f1] text-success" : "bg-surface-muted text-muted"}`}>
          {statusLabel(state)}
        </span>
      </header>
      <Puck
        config={checkoutBuilderConfig}
        data={initialData}
        height="calc(100dvh - 56px)"
        headerTitle="Checkout"
        headerPath={`/${checkout.slug}`}
        viewports={[{ width: 390, height: "auto", label: "Celular", icon: "Smartphone" }, { width: 768, height: "auto", label: "Tablet", icon: "Tablet" }, { width: 1440, height: "auto", label: "Desktop", icon: "Monitor" }]}
        iframe={{ enabled: true, syncHostStyles: false }}
        onChange={(data) => { current.current = data as BuilderData; setState("changed"); setMessage(undefined); }}
        onPublish={publish}
        renderHeaderActions={() => <Button type="button" variant="secondary" className="h-8 px-3 text-xs" disabled={state === "saving"} onClick={() => void save()}>Salvar rascunho</Button>}
      />
    </div>
  );
}

function statusLabel(state: "saved" | "changed" | "saving" | "published" | "error") { return { saved: "Salvo", changed: "Alterações não salvas", saving: "Salvando...", published: "Publicado", error: "Erro" }[state]; }
