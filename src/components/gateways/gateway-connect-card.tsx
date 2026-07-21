"use client";

import { Button } from "@/components/ui/button";

import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/custom-select";
import { GatewayMark } from "@/components/gateways/gateway-mark";
import { Icon } from "@/components/ui/icon";
import type { GatewayConnection } from "@/lib/api/types";
import { useEscapeClose } from "@/hooks/use-escape-close";

export type GatewayDefinition = { provider: GatewayConnection["provider"]; name: string; description: string; initials: string; color: string; logo?: string; logoFill?: boolean; methods: string[] };

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

  return <><Button type="button" aria-label={`Conectar ${gateway.name}`} onClick={() => { setError(undefined); setOpen(true); }} className="gateway-hover-card group flex min-h-20 w-full items-center gap-2.5 rounded-xl border border-white/80 bg-white/38 p-3 text-left hover:shadow-[0_12px_30px_rgba(66,57,128,.07)]"><GatewayMark initials={gateway.initials} color={gateway.color} logo={gateway.logo} logoFill={gateway.logoFill} /><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold">{gateway.name}</span><span className="mt-1 block truncate text-[10px] leading-4 text-muted">{gateway.description}</span></span></Button>

  {open && createPortal(<div onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setOpen(false); }} className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/18 p-4 backdrop-blur-sm"><form onSubmit={submit} className="modal-surface glass-panel my-6 w-full max-w-2xl rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.22)] sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">Integração de pagamentos</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Conectar {gateway.name}</h2><p className="mt-1.5 text-[13px] text-muted">Informe as credenciais fornecidas pelo gateway.</p></div><Button type="button" variant="icon" aria-label="Fechar" disabled={loading} onClick={() => setOpen(false)}><Icon name="close" className="size-4" /></Button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field name="name" label="Nome" defaultValue={providerName(gateway.provider)} /><label className="text-[13px] font-semibold">Ambiente<div className="mt-2"><CustomSelect name="environment" defaultValue="sandbox" options={[{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Produção" }]} /></div></label><GatewayFields provider={gateway.provider} /></div>{error && <p role="alert" className="mt-5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7] p-3 text-[13px] text-danger">{error}</p>}<div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={loading} onClick={() => setOpen(false)}>Cancelar</Button><Button variant="primary" disabled={loading}>{loading ? "Validando..." : "Conectar gateway"}</Button></div></form></div>, document.body)}

  {created && createPortal(<div onMouseDown={(event) => { if (event.target === event.currentTarget) setCreated(undefined); }} className="fixed inset-0 z-[110] grid place-items-center bg-[#17172c]/18 p-4 backdrop-blur-sm"><section role="alertdialog" aria-modal="true" className="modal-surface glass-panel w-full max-w-lg rounded-[26px] p-6 shadow-[0_32px_100px_rgba(37,31,76,.24)]"><span className="grid size-11 place-items-center rounded-2xl bg-[#e8f7f1] text-success"><Icon name="check" /></span><h3 className="mt-5 text-xl font-semibold">Gateway conectado</h3><p className="mt-2 text-[13px] leading-5 text-muted">Copie agora os dados do webhook. O segredo não será exibido novamente.</p><Secret label="Endpoint" value={created.webhookUrl ?? ""} />{created.webhookSecret && <Secret label="Segredo" value={created.webhookSecret} />}<div className="mt-6 flex justify-end"><Button type="button" variant="primary" onClick={() => setCreated(undefined)}>Concluir</Button></div></section></div>, document.body)}
  </>;
}

export function GatewayEditModal({ gateway, connection, open, close }: { gateway: GatewayDefinition; connection: GatewayConnection; open: boolean; close: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  useEscapeClose(open, () => { if (!loading) close(); });
  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(undefined);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/gateways/${connection.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(editPayload(connection.provider, form, connection.publicConfiguration)) });
    const body = await response.json() as { detail?: string };
    setLoading(false);
    if (!response.ok) return setError(body.detail ?? "Não foi possível atualizar o gateway.");
    close(); router.refresh();
  }

  return createPortal(<div onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) close(); }} className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/18 p-4 backdrop-blur-sm"><form onSubmit={submit} className="modal-surface glass-panel my-6 w-full max-w-2xl rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.22)] sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">Integração de pagamentos</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Configurar {gateway.name}</h2><p className="mt-1.5 text-[13px] text-muted">Atualize a identificação e, se necessário, substitua as credenciais.</p></div><Button type="button" variant="icon" aria-label="Fechar" disabled={loading} onClick={close}><Icon name="close" className="size-4" /></Button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field name="name" label="Nome" defaultValue={connection.name} /><label className="text-[13px] font-semibold">Ambiente<div className="mt-2"><CustomSelect name="environment" value={connection.environment} disabled options={[{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Produção" }]} /></div></label><GatewayFields provider={connection.provider} connection={connection} /></div><p className="mt-4 text-[11px] text-muted">Deixe as credenciais em branco para manter as atuais.</p>{error && <p role="alert" className="mt-5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7] p-3 text-[13px] text-danger">{error}</p>}<div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={loading} onClick={close}>Cancelar</Button><Button variant="primary" disabled={loading}>{loading ? "Salvando..." : "Salvar configuração"}</Button></div></form></div>, document.body);
}

function GatewayFields({ provider, connection }: { provider: GatewayConnection["provider"]; connection?: GatewayConnection }) {
  const optional = Boolean(connection);
  if (provider === "stripe") return <><Field name="secretKey" label="Secret key" secret required={!optional} /><Field name="webhookSecret" label="Webhook secret" secret required={!optional} /><Field name="publishableKey" label="Publishable key" defaultValue={stringConfig(connection, "publishableKey")} /><Field name="subscriptionProductId" label="Product ID para assinaturas" defaultValue={stringConfig(connection, "subscriptionProductId")} /></>;
  if (provider === "mercado_pago") return <><Field name="accessToken" label="Access token" secret required={!optional} /><Field name="webhookSecret" label="Webhook secret" secret required={!optional} /><Field name="notificationUrl" label="Notification URL" defaultValue={stringConfig(connection, "notificationUrl")} /><Field name="subscriptionBackUrl" label="URL de retorno" defaultValue={stringConfig(connection, "subscriptionBackUrl")} /></>;
  if (provider === "abacate_pay") return <><Field name="apiKey" label="API key" secret required={!optional} /><Field name="webhookSecret" label="Webhook secret" secret required={!optional} /></>;
  return <><Field name="apiKey" label="API key" defaultValue={optional ? "" : "development"} required={!optional} /><label className="text-[13px] font-semibold">Cenário<div className="mt-2"><CustomSelect name="scenario" defaultValue={stringConfig(connection, "scenario") || "approve"} options={[{ value: "approve", label: "Aprovar" }, { value: "pending", label: "Pendente" }, { value: "decline", label: "Recusar" }, { value: "timeout", label: "Timeout" }]} /></div></label></>;
}

function Field({ name, label, secret = false, defaultValue, required = true }: { name: string; label: string; secret?: boolean; defaultValue?: string; required?: boolean }) { return <label className="text-[13px] font-semibold">{label}<input name={name} type={secret ? "password" : "text"} required={required} defaultValue={defaultValue} className="mt-2 h-11 w-full rounded-xl border border-[#d9d7e8] bg-white px-3.5 font-normal outline-none transition focus:border-brand/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.16)]" /></label>; }
function Secret({ label, value }: { label: string; value: string }) { return <div className="mt-4"><p className="text-[12px] font-semibold">{label}</p><code className="mt-2 block overflow-x-auto rounded-xl bg-[#f4f4f8] p-3 text-[12px]">{value}</code></div>; }
function providerName(provider: string) { return provider === "mercado_pago" ? "Mercado Pago" : provider === "abacate_pay" ? "AbacatePay" : provider[0]?.toUpperCase() + provider.slice(1); }
function payload(provider: GatewayConnection["provider"], form: FormData) { const value = (name: string) => String(form.get(name) ?? "").trim(); const credentials: Record<string, unknown> = {}; const publicConfiguration: Record<string, unknown> = {}; if (provider === "stripe") { credentials.secretKey = value("secretKey"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.publishableKey = value("publishableKey"); publicConfiguration.subscriptionProductId = value("subscriptionProductId"); } if (provider === "mercado_pago") { credentials.accessToken = value("accessToken"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.notificationUrl = value("notificationUrl"); publicConfiguration.subscriptionBackUrl = value("subscriptionBackUrl"); } if (provider === "abacate_pay") { credentials.apiKey = value("apiKey"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.paymentExpirationSeconds = 3600; } if (provider === "mock") { credentials.apiKey = value("apiKey"); credentials.scenario = value("scenario"); } return { provider, name: value("name"), environment: value("environment"), credentials, publicConfiguration }; }
function editPayload(provider: GatewayConnection["provider"], form: FormData, currentConfiguration: Record<string, unknown>) { const next = payload(provider, form); const primaryKey = { stripe: "secretKey", mercado_pago: "accessToken", abacate_pay: "apiKey", mock: "apiKey" }[provider]; const replaceCredentials = next.credentials[primaryKey] !== ""; return { name: next.name, publicConfiguration: { ...currentConfiguration, ...next.publicConfiguration }, credentials: replaceCredentials ? Object.fromEntries(Object.entries(next.credentials).filter(([, value]) => value !== "")) : {} }; }
function stringConfig(connection: GatewayConnection | undefined, key: string) { const value = connection?.publicConfiguration[key]; return typeof value === "string" ? value : undefined; }
