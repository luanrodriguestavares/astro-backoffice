"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { GatewayConnection } from "@/lib/api/types";

export function ConnectedGatewayCard({ connection }: { connection: GatewayConnection }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"test" | "delete">();
  const [message, setMessage] = useState<string>();

  async function act(action: "test" | "delete") {
    if (action === "delete" && !window.confirm(`Desabilitar ${connection.name}?`)) return;
    setBusy(action);
    setMessage(undefined);
    const response = await fetch(`/api/gateways/${connection.id}${action === "test" ? "/test" : ""}`, {
      method: action === "test" ? "POST" : "DELETE",
    });
    const body = (await response.json()) as { detail?: string };
    setBusy(undefined);
    if (!response.ok) return setMessage(body.detail ?? "Não foi possível concluir a operação.");
    setMessage(action === "test" ? "Credenciais validadas com sucesso." : "Gateway desabilitado.");
    router.refresh();
  }

  return (
    <article className="glass-panel rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold">{connection.name}</p><p className="mt-1 text-[12px] text-muted">{providerName(connection.provider)} · {connection.environment === "production" ? "Produção" : "Sandbox"}</p></div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${connection.status === "active" ? "bg-[#e8f7f1] text-success" : "bg-[#fff3e5] text-warning"}`}>{connection.status === "active" ? "Ativo" : connection.status}</span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-[12px]"><div><dt className="text-muted">Credenciais</dt><dd className="mt-1 font-semibold">{connection.credentialsConfigured ? "Configuradas" : "Pendentes"}</dd></div><div><dt className="text-muted">Último teste</dt><dd className="mt-1 font-semibold">{connection.lastTestedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(connection.lastTestedAt)) : "Nunca"}</dd></div></dl>
      {message && <p className="mt-4 rounded-lg bg-surface-muted p-2.5 text-xs">{message}</p>}
      <div className="mt-5 flex gap-2"><button disabled={Boolean(busy)} onClick={() => act("test")} className="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50">{busy === "test" ? "Testando..." : "Testar conexão"}</button><button disabled={Boolean(busy)} onClick={() => act("delete")} className="rounded-xl border border-[#f2cbd0] px-3 py-2 text-xs font-semibold text-danger disabled:opacity-50">{busy === "delete" ? "Desabilitando..." : "Desabilitar"}</button></div>
    </article>
  );
}

function providerName(provider: GatewayConnection["provider"]) {
  return { mock: "Mock", stripe: "Stripe", mercado_pago: "Mercado Pago", abacate_pay: "AbacatePay" }[provider];
}
