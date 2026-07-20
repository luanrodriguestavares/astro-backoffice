import { ConnectedGatewayCard } from "@/components/gateways/connected-gateway-card";
import { GatewayConnectCard, type GatewayDefinition } from "@/components/gateways/gateway-connect-card";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api/server";
import type { GatewayConnection } from "@/lib/api/types";

const gateways: GatewayDefinition[] = [
  { provider: "stripe", name: "Stripe", description: "Cartão, Pix e assinaturas recorrentes.", initials: "S", color: "bg-[#6757e8]", methods: ["Cartão", "Pix", "Recorrência"] },
  { provider: "mercado_pago", name: "Mercado Pago", description: "Pix e assinaturas via checkout hospedado.", initials: "MP", color: "bg-[#159bd7]", methods: ["Pix", "Recorrência"] },
  { provider: "abacate_pay", name: "AbacatePay", description: "Checkout transparente para Pix e boleto.", initials: "A", color: "bg-[#53a36b]", methods: ["Pix", "Boleto"] },
  { provider: "mock", name: "Mock", description: "Simule pagamentos durante o desenvolvimento.", initials: "M", color: "bg-[#55576b]", methods: ["Testes", "Sandbox"] },
];

export default async function GatewaysPage() {
  const connections = await apiFetch<GatewayConnection[]>("/api/v1/gateway-connections");
  return <>
    <PageHeader eyebrow="Pagamentos" title="Gateways" description="Conecte suas contas para receber pagamentos diretamente nos provedores." />
    <div className="mb-5 rounded-2xl border border-[#dcd8ff] bg-brand-soft p-4 sm:flex sm:items-center sm:justify-between sm:p-5"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-strong"><Icon name="plug" className="size-5" /></span><div><p className="text-sm font-bold text-[#373064]">O Astro não movimenta o seu dinheiro</p><p className="mt-1 text-xs leading-5 text-[#666083]">Os pagamentos são processados e recebidos diretamente na conta do gateway conectado.</p></div></div></div>
    {connections.length > 0 && <section className="mb-8"><h2 className="mb-3 text-sm font-bold">Conexões configuradas</h2><div className="grid gap-4 lg:grid-cols-2">{connections.map((connection) => <ConnectedGatewayCard key={connection.id} connection={connection} />)}</div></section>}
    <section><h2 className="mb-3 text-sm font-bold">Adicionar conexão</h2><div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">{gateways.map((gateway) => <GatewayConnectCard key={gateway.provider} gateway={gateway} />)}</div></section>
  </>;
}
