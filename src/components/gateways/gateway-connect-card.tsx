"use client";

import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/custom-select";
import { Icon } from "@/components/ui/icon";
import type { GatewayConnection } from "@/lib/api/types";
import { useEscapeClose } from "@/hooks/use-escape-close";

export type GatewayDefinition = { provider: GatewayConnection["provider"]; name: string; description: string; initials: string; color: string; methods: string[] };

export function GatewayConnectCard({ gateway }: { gateway: GatewayDefinition }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<GatewayConnection>();

  useEscapeClose(open || Boolean(created), () => {
    if (created) setCreated(undefined);
    else if (!loading) setOpen(false);
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(undefined);
    const response = await fetch("/api/gateways", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload(gateway.provider, new FormData(event.currentTarget))) });
    const body = await response.json() as { data?: GatewayConnection; detail?: string };
    setLoading(false);
    if (!response.ok || !body.data) { setError(body.detail ?? "Falha ao conectar."); return; }
    setOpen(false); setCreated(body.data); router.refresh();
  }

  return <article className="glass-panel flex min-h-64 flex-col rounded-[24px] p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(66,57,128,.1)]"><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-xl text-sm font-bold text-white ${gateway.color}`}>{gateway.initials}</span><span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-muted">Não conectado</span></div><h2 className="mt-5 text-lg font-semibold tracking-[-0.03em]">{gateway.name}</h2><p className="mt-1.5 text-[13px] leading-6 text-muted">{gateway.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{gateway.methods.map((method) => <span key={method} className="rounded-lg border bg-[#fafafd] px-2 py-1 text-[11px] font-medium text-muted">{method}</span>)}</div><button type="button" onClick={() => { setError(undefined); setOpen(true); }} className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/50 px-4 py-2.5 text-[13px] font-semibold transition hover:border-brand/35 hover:bg-brand-soft hover:text-brand-strong">Conectar {gateway.name}<Icon name="arrow-right" className="size-4" /></button>

  {open && createPortal(<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/18 p-4 backdrop-blur-sm"><form onSubmit={submit} className="modal-surface glass-panel my-6 w-full max-w-2xl rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.22)] sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">Integração de pagamentos</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Conectar {gateway.name}</h2><p className="mt-1.5 text-[13px] text-muted">Informe as credenciais fornecidas pelo gateway.</p></div><button type="button" aria-label="Fechar" disabled={loading} onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full border border-[#dedbea] bg-white text-muted hover:text-foreground"><Icon name="close" className="size-4" /></button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field name="name" label="Nome" defaultValue={providerName(gateway.provider)} /><label className="text-[13px] font-semibold">Ambiente<div className="mt-2"><CustomSelect name="environment" defaultValue="sandbox" options={[{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Produção" }]} /></div></label><GatewayFields provider={gateway.provider} /></div>{error && <p role="alert" className="mt-5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7] p-3 text-[13px] text-danger">{error}</p>}<div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={loading} onClick={() => setOpen(false)} className="h-11 rounded-xl border border-[#dedbea] bg-white px-5 text-[13px] font-semibold text-muted">Cancelar</button><button disabled={loading} className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] disabled:opacity-55">{loading ? "Validando..." : "Conectar gateway"}</button></div></form></div>, document.body)}

  {created && createPortal(<div className="fixed inset-0 z-[110] grid place-items-center bg-[#17172c]/18 p-4 backdrop-blur-sm"><section role="alertdialog" aria-modal="true" className="modal-surface glass-panel w-full max-w-lg rounded-[26px] p-6 shadow-[0_32px_100px_rgba(37,31,76,.24)]"><span className="grid size-11 place-items-center rounded-2xl bg-[#e8f7f1] text-success"><Icon name="check" /></span><h3 className="mt-5 text-xl font-semibold">Gateway conectado</h3><p className="mt-2 text-[13px] leading-5 text-muted">Copie agora os dados do webhook. O segredo não será exibido novamente.</p><Secret label="Endpoint" value={created.webhookUrl ?? ""} />{created.webhookSecret && <Secret label="Segredo" value={created.webhookSecret} />}<div className="mt-6 flex justify-end"><button type="button" onClick={() => setCreated(undefined)} className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white">Concluir</button></div></section></div>, document.body)}
  </article>;
}

function GatewayFields({ provider }: { provider: GatewayConnection["provider"] }) {
  if (provider === "stripe") return <><Field name="secretKey" label="Secret key" secret /><Field name="webhookSecret" label="Webhook secret" secret /><Field name="publishableKey" label="Publishable key" /><Field name="subscriptionProductId" label="Product ID para assinaturas" /></>;
  if (provider === "mercado_pago") return <><Field name="accessToken" label="Access token" secret /><Field name="webhookSecret" label="Webhook secret" secret /><Field name="notificationUrl" label="Notification URL" /><Field name="subscriptionBackUrl" label="URL de retorno" /></>;
  if (provider === "abacate_pay") return <><Field name="apiKey" label="API key" secret /><Field name="webhookSecret" label="Webhook secret" secret /></>;
  return <><Field name="apiKey" label="API key" defaultValue="development" /><label className="text-[13px] font-semibold">Cenário<div className="mt-2"><CustomSelect name="scenario" defaultValue="approve" options={[{ value: "approve", label: "Aprovar" }, { value: "pending", label: "Pendente" }, { value: "decline", label: "Recusar" }, { value: "timeout", label: "Timeout" }]} /></div></label></>;
}

function Field({ name, label, secret = false, defaultValue }: { name: string; label: string; secret?: boolean; defaultValue?: string }) { return <label className="text-[13px] font-semibold">{label}<input name={name} type={secret ? "password" : "text"} required defaultValue={defaultValue} className="mt-2 h-11 w-full rounded-xl border border-[#d9d7e8] bg-white px-3.5 font-normal outline-none transition focus:border-brand/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.16)]" /></label>; }
function Secret({ label, value }: { label: string; value: string }) { return <div className="mt-4"><p className="text-[12px] font-semibold">{label}</p><code className="mt-2 block overflow-x-auto rounded-xl bg-[#f4f4f8] p-3 text-[12px]">{value}</code></div>; }
function providerName(provider: string) { return provider === "mercado_pago" ? "Mercado Pago" : provider === "abacate_pay" ? "AbacatePay" : provider[0]?.toUpperCase() + provider.slice(1); }
function payload(provider: GatewayConnection["provider"], form: FormData) { const value = (name: string) => String(form.get(name) ?? "").trim(); const credentials: Record<string, unknown> = {}; const publicConfiguration: Record<string, unknown> = {}; if (provider === "stripe") { credentials.secretKey = value("secretKey"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.publishableKey = value("publishableKey"); publicConfiguration.subscriptionProductId = value("subscriptionProductId"); } if (provider === "mercado_pago") { credentials.accessToken = value("accessToken"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.notificationUrl = value("notificationUrl"); publicConfiguration.subscriptionBackUrl = value("subscriptionBackUrl"); } if (provider === "abacate_pay") { credentials.apiKey = value("apiKey"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.paymentExpirationSeconds = 3600; } if (provider === "mock") { credentials.apiKey = value("apiKey"); credentials.scenario = value("scenario"); } return { provider, name: value("name"), environment: value("environment"), credentials, publicConfiguration }; }
