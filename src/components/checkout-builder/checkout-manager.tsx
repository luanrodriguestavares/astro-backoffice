"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Icon, type IconName } from "@/components/ui/icon";
import { blankCheckoutDocument } from "@/lib/checkout/document";
import type { Checkout } from "@/lib/api/types";
import { useEscapeClose } from "@/hooks/use-escape-close";

export type CheckoutCatalogOption = {
  productId: string;
  priceId: string;
  productName: string;
  priceName: string;
  amountMinor: number;
  currency: string;
  pricingType: string;
  active: boolean;
};

const templates: { id: string; name: string; description: string; icon: IconName; available: boolean }[] = [
  { id: "blank", name: "Em branco", description: "Comece com uma tela vazia e adicione somente os blocos necessários.", icon: "plus", available: true },
  { id: "product-launch", name: "Lançamento", description: "Estrutura para apresentar uma oferta e gerar conversão.", icon: "bolt", available: false },
  { id: "digital-product", name: "Produto digital", description: "Página completa para cursos, ebooks e comunidades.", icon: "box", available: false },
  { id: "subscription", name: "Assinatura", description: "Experiência focada em planos e cobrança recorrente.", icon: "repeat", available: false },
];

export function CheckoutManager({ checkouts, catalog }: { checkouts: Checkout[]; catalog: CheckoutCatalogOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"template" | "details">("template");
  const [template, setTemplate] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<Checkout>();
  const [deleting, setDeleting] = useState(false);
  const [missingProductAlert, setMissingProductAlert] = useState(false);

  function openCreate() {
    if (catalog.length === 0) {
      setMissingProductAlert(true);
      return;
    }
    setStep("template");
    setTemplate(undefined);
    setError(undefined);
    setOpen(true);
  }

  useEscapeClose(open || Boolean(deleteTarget) || missingProductAlert, () => {
    if (missingProductAlert) setMissingProductAlert(false);
    else if (deleteTarget && !deleting) setDeleteTarget(undefined);
    else closeCreate();
  });

  function closeCreate() {
    if (loading) return;
    setOpen(false);
    setError(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const selected = catalog.find((item) => item.priceId === form.get("priceId"));
    if (!selected) {
      setLoading(false);
      setError("Selecione um produto e preço.");
      return;
    }
    const name = String(form.get("name") ?? "").trim();
    const response = await fetch("/api/checkouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        slug: slugify(String(form.get("slug") || name)),
        checkoutType: "single_product",
        defaultCurrency: selected.currency,
        products: [{ productId: selected.productId, priceId: selected.priceId, isDefault: true, minimumQuantity: 1, maximumQuantity: 1 }],
        document: blankCheckoutDocument,
      }),
    });
    const body = (await response.json()) as { data?: Checkout; detail?: string };
    setLoading(false);
    if (!response.ok || !body.data) {
      setError(body.detail ?? "Não foi possível criar o checkout.");
      return;
    }
    router.push(`/checkouts/${body.data.id}/builder`);
  }

  async function removeCheckout() {
    if (!deleteTarget) return;
    setDeleting(true);
    const response = await fetch(`/api/checkouts/${deleteTarget.id}`, { method: "DELETE" });
    const body = response.ok ? undefined : (await response.json()) as { detail?: string };
    setDeleting(false);
    if (!response.ok) {
      setError(body?.detail ?? "Não foi possível excluir o checkout.");
      setDeleteTarget(undefined);
      return;
    }
    setDeleteTarget(undefined);
    router.refresh();
  }

  return (
    <>
      <div className="glass-panel mb-4 flex items-center justify-between gap-4 rounded-[22px] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold tracking-[-0.02em]">Experiências de checkout</h2>
          <p className="mt-1 text-[12px] text-muted">Crie e edite suas páginas de conversão</p>
        </div>
        <button type="button" onClick={openCreate} className="glass-interactive inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(98,75,255,.2)]">
          <Icon name="plus" className="size-3.5" /> Criar checkout
        </button>
      </div>

      {checkouts.length === 0 ? (
        <section className="glass-panel rounded-[28px] px-5 py-14 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft/75 text-brand"><Icon name="layout" className="size-4" /></span>
          <h2 className="mt-3 text-sm font-semibold">Nenhum checkout criado</h2>
          <p className="mt-1 text-[13px] text-muted">Escolha como começar e monte sua primeira experiência.</p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {checkouts.map((checkout) => <CheckoutCard key={checkout.id} checkout={checkout} onDelete={() => setDeleteTarget(checkout)} />)}
        </section>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm">
          <div className="modal-surface glass-panel my-6 w-full max-w-3xl overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">Novo checkout · {step === "template" ? "Etapa 1 de 2" : "Etapa 2 de 2"}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{step === "template" ? "Como você quer começar?" : "Configure seu checkout"}</h2>
                <p className="mt-1.5 text-[13px] leading-5 text-muted">{step === "template" ? "Escolha um ponto de partida. Você poderá personalizar tudo no editor." : "Defina a oferta e os dados básicos antes de abrir o editor."}</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={closeCreate} className="grid size-9 place-items-center rounded-full border border-white/80 bg-white/45 text-muted transition hover:bg-white/75 hover:text-foreground"><Icon name="close" className="size-4" /></button>
            </div>

            {step === "template" ? (
              <>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {templates.map((item) => (
                    <button key={item.id} type="button" disabled={!item.available} onClick={() => setTemplate(item.id)} className={`relative min-h-36 rounded-[20px] border p-5 text-left transition ${template === item.id ? "border-brand/40 bg-brand-soft/70 shadow-[0_0_0_3px_rgba(109,93,244,.08)]" : "border-white/85 bg-white/48 hover:bg-white/75"} disabled:cursor-not-allowed disabled:opacity-55`}>
                      <span className={`grid size-10 place-items-center rounded-xl ${template === item.id ? "bg-brand text-white" : "bg-white/75 text-brand"}`}><Icon name={item.icon} className="size-4" /></span>
                      <p className="mt-4 text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-[12px] leading-5 text-muted">{item.description}</p>
                      {!item.available && <span className="absolute right-4 top-4 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Em breve</span>}
                    </button>
                  ))}
                </div>
                <div className="mt-7 flex justify-end gap-2">
                  <button type="button" onClick={closeCreate} className="h-11 rounded-xl border border-white/85 bg-white/42 px-5 text-[13px] font-semibold text-muted">Cancelar</button>
                  <button type="button" disabled={!template} onClick={() => setStep("details")} className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] disabled:cursor-not-allowed disabled:opacity-50">Continuar</button>
                </div>
              </>
            ) : (
              <form onSubmit={submit}>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <Field name="name" label="Nome do checkout" placeholder="Ex.: Checkout principal" required />
                  <Field name="slug" label="Slug (opcional)" placeholder="checkout-principal" />
                  <label className="text-[13px] font-semibold sm:col-span-2">Produto e preço<select name="priceId" required className="mt-2 h-11 w-full rounded-xl border border-white/80 bg-white/48 px-3.5 font-normal outline-none focus:border-brand/25 focus:bg-white/70"><option value="">Selecione</option>{catalog.map((item) => <option key={item.priceId} value={item.priceId}>{item.productName} · {item.priceName} · {money(item.amountMinor, item.currency)}{item.pricingType === "recurring" ? "/recorrente" : ""}</option>)}</select></label>
                </div>
                {error && <p role="alert" className="mt-5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7]/75 p-3 text-[13px] text-danger">{error}</p>}
                <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" disabled={loading} onClick={() => setStep("template")} className="h-11 rounded-xl border border-white/85 bg-white/42 px-5 text-[13px] font-semibold text-muted">Voltar</button>
                  <button disabled={loading} className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] disabled:opacity-55">{loading ? "Criando..." : "Criar e abrir editor"}</button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}

      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[110] grid place-items-center bg-[#17172c]/18 p-4 backdrop-blur-sm">
          <div className="modal-surface glass-panel w-full max-w-md rounded-[26px] p-6 shadow-[0_30px_90px_rgba(37,31,76,.2)]" role="alertdialog" aria-modal="true" aria-labelledby="delete-checkout-title">
            <span className="grid size-11 place-items-center rounded-full bg-[#fff0f2] text-danger"><Icon name="trash" className="size-4.5" /></span>
            <h2 id="delete-checkout-title" className="mt-4 text-xl font-semibold tracking-[-0.03em]">Excluir checkout?</h2>
            <p className="mt-2 text-[13px] leading-5 text-muted">O checkout <strong className="text-foreground">{deleteTarget.name}</strong> será excluído permanentemente. Esta ação não pode ser desfeita.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={deleting} onClick={() => setDeleteTarget(undefined)} className="h-11 rounded-xl border border-[#d9d7e8] bg-white/70 px-5 text-[13px] font-semibold text-muted transition hover:bg-white disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={deleting} onClick={removeCheckout} className="h-11 rounded-xl bg-danger px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(203,63,86,.2)] disabled:opacity-55">{deleting ? "Excluindo..." : "Excluir checkout"}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {missingProductAlert && createPortal(
        <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-[#17172c]/18 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" className="modal-surface glass-panel my-6 w-full max-w-md rounded-[26px] p-6 shadow-[0_30px_90px_rgba(37,31,76,.2)]">
            <span className="grid size-11 place-items-center rounded-full bg-[#fff8ee] text-warning"><Icon name="box" className="size-4.5" /></span>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">Produto necessário</h2>
            <p className="mt-2 text-[13px] leading-5 text-muted">Cadastre um produto com preço ativo antes de criar um checkout.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setMissingProductAlert(false)} className="h-11 rounded-xl border border-[#d9d7e8] bg-white/70 px-5 text-[13px] font-semibold text-muted">Fechar</button>
              <Link href="/products" className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white">Cadastrar produto</Link>
            </div>
          </section>
        </div>, document.body,
      )}
    </>
  );
}

function CheckoutCard({ checkout, onDelete }: { checkout: Checkout; onDelete: () => void }) {
  return <article className="glass-panel group rounded-[24px] p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(66,57,128,.1)]"><div className="flex justify-between gap-4"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${checkout.status === "published" ? "border-emerald-100 bg-[#e8f7f1] text-success" : "border-white/80 bg-white/50 text-muted"}`}>{checkout.status === "published" ? "Publicado" : "Rascunho"}</span><div className="flex items-center gap-1.5"><span className="text-[12px] text-muted">v{checkout.version}</span><button type="button" onClick={onDelete} aria-label={`Excluir ${checkout.name}`} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-[#fff0f2] hover:text-danger"><Icon name="trash" className="size-3.5" /></button></div></div><span className="mt-5 grid size-10 place-items-center rounded-[13px] border border-white/80 bg-gradient-to-br from-white/75 to-[#ece9ff]/65 text-brand"><Icon name="layout" className="size-4" /></span><h2 className="mt-4 text-lg font-semibold tracking-[-0.03em]">{checkout.name}</h2><p className="mt-1 text-[13px] text-muted">/{checkout.slug}</p><Link href={`/checkouts/${checkout.id}/builder`} className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/45 px-4 py-2.5 text-[13px] font-semibold transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong">Abrir editor <Icon name="arrow-right" className="size-4" /></Link></article>;
}

function Field({ label, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="text-[13px] font-semibold">{label}<input {...input} className="mt-2 h-11 w-full rounded-xl border border-white/80 bg-white/48 px-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/25 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.07)]" /></label>;
}

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function money(value: number, currency: string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value / 100); }
