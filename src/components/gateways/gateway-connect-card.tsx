"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import type { GatewayConnection } from "@/lib/api/types";

export type GatewayDefinition = {
  provider: GatewayConnection["provider"];
  name: string;
  description: string;
  initials: string;
  color: string;
  methods: string[];
};

export function GatewayConnectCard({ gateway }: { gateway: GatewayDefinition }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<GatewayConnection>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/gateways", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload(gateway.provider, form)),
    });
    const body = (await response.json()) as { data?: GatewayConnection; detail?: string };
    setLoading(false);
    if (!response.ok || body.data === undefined) return setError(body.detail ?? "Falha ao conectar.");
    setCreated(body.data);
    router.refresh();
  }

  return (
    <article className="flex min-h-64 flex-col rounded-2xl border bg-surface p-5 shadow-panel">
      <div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-xl text-sm font-bold text-white ${gateway.color}`}>{gateway.initials}</span><span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-muted">Não conectado</span></div>
      <h2 className="mt-5 text-lg font-bold">{gateway.name}</h2><p className="mt-1.5 text-sm leading-6 text-muted">{gateway.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{gateway.methods.map((method) => <span key={method} className="rounded-lg border bg-[#fafafd] px-2 py-1 text-[11px] font-medium text-muted">{method}</span>)}</div>
      {open && <form onSubmit={submit} className="mt-5 space-y-3 border-t pt-4"><GatewayFields provider={gateway.provider} />{error && <p className="rounded-lg bg-[#fff2f4] p-2.5 text-xs text-danger">{error}</p>}<div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold">Cancelar</button><button disabled={loading} className="flex-1 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{loading ? "Validando..." : "Conectar"}</button></div></form>}
      {!open && <button type="button" onClick={() => setOpen(true)} className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:border-brand hover:bg-brand-soft hover:text-brand-strong">Conectar {gateway.name}<Icon name="arrow-right" className="size-4" /></button>}
      {created && <div className="fixed inset-0 z-50 grid place-items-center bg-[#111322]/55 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><span className="grid size-11 place-items-center rounded-full bg-[#e8f7f1] text-success"><Icon name="check" /></span><h3 className="mt-4 text-xl font-bold">Gateway conectado</h3><p className="mt-2 text-sm text-muted">Copie agora os dados do webhook. O token não será exibido novamente.</p><Secret label="Endpoint" value={created.webhookUrl ?? ""} />{created.webhookSecret && <Secret label="Segredo" value={created.webhookSecret} />}<button type="button" onClick={() => { setCreated(undefined); setOpen(false); }} className="mt-5 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">Concluir</button></div></div>}
    </article>
  );
}

function GatewayFields({ provider }: { provider: GatewayConnection["provider"] }) {
  return <><label className="block text-xs font-semibold">Nome<input name="name" required defaultValue={providerName(provider)} className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal" /></label><label className="block text-xs font-semibold">Ambiente<select name="environment" className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal"><option value="sandbox">Sandbox</option><option value="production">Produção</option></select></label>{provider === "stripe" && <><Field name="secretKey" label="Secret key" secret /><Field name="webhookSecret" label="Webhook secret" secret /><Field name="publishableKey" label="Publishable key" /><Field name="subscriptionProductId" label="Product ID para assinaturas" /></>}{provider === "mercado_pago" && <><Field name="accessToken" label="Access token" secret /><Field name="webhookSecret" label="Webhook secret" secret /><Field name="notificationUrl" label="Notification URL" /><Field name="subscriptionBackUrl" label="URL de retorno da assinatura" /></>}{provider === "abacate_pay" && <><Field name="apiKey" label="API key" secret /><Field name="webhookSecret" label="Webhook secret" secret /></>}{provider === "mock" && <><Field name="apiKey" label="API key" defaultValue="development" /><label className="block text-xs font-semibold">Cenário<select name="scenario" className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal"><option value="approve">Aprovar</option><option value="pending">Pendente</option><option value="decline">Recusar</option><option value="timeout">Timeout</option></select></label></>}</>;
}

function Field({ name, label, secret = false, defaultValue }: { name: string; label: string; secret?: boolean; defaultValue?: string }) { return <label className="block text-xs font-semibold">{label}<input name={name} type={secret ? "password" : "text"} required defaultValue={defaultValue} className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal" /></label>; }
function Secret({ label, value }: { label: string; value: string }) { return <div className="mt-4"><p className="text-xs font-semibold">{label}</p><code className="mt-1.5 block overflow-x-auto rounded-lg bg-[#f4f4f8] p-3 text-xs">{value}</code></div>; }
function providerName(provider: string) { return provider === "mercado_pago" ? "Mercado Pago" : provider === "abacate_pay" ? "AbacatePay" : provider[0]?.toUpperCase() + provider.slice(1); }

function payload(provider: GatewayConnection["provider"], form: FormData) {
  const value = (name: string) => String(form.get(name) ?? "").trim();
  const credentials: Record<string, unknown> = {};
  const publicConfiguration: Record<string, unknown> = {};
  if (provider === "stripe") { credentials.secretKey = value("secretKey"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.publishableKey = value("publishableKey"); publicConfiguration.subscriptionProductId = value("subscriptionProductId"); }
  if (provider === "mercado_pago") { credentials.accessToken = value("accessToken"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.notificationUrl = value("notificationUrl"); publicConfiguration.subscriptionBackUrl = value("subscriptionBackUrl"); }
  if (provider === "abacate_pay") { credentials.apiKey = value("apiKey"); credentials.webhookSecret = value("webhookSecret"); publicConfiguration.paymentExpirationSeconds = 3600; }
  if (provider === "mock") { credentials.apiKey = value("apiKey"); credentials.scenario = value("scenario"); }
  return { provider, name: value("name"), environment: value("environment"), credentials, publicConfiguration };
}
