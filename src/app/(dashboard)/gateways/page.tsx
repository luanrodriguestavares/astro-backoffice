import { ConnectedGatewayCard } from "@/components/gateways/connected-gateway-card";
import { GatewayConnectCard, type GatewayDefinition } from "@/components/gateways/gateway-connect-card";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/resource-table";
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
  const active = connections.filter((connection) => connection.status === "active");
  const healthy = connections.filter((connection) => connection.lastSuccessAt && !connection.failureReason);
  return <><PageHeader eyebrow="Pagamentos" title="Gateways" description="Conecte suas contas para receber pagamentos diretamente nos provedores." /><section className="mb-4 grid gap-3 sm:grid-cols-3"><SummaryCard label="Conexões" value={String(connections.length)} detail="Gateways configurados" icon="plug" /><SummaryCard label="Conexões ativas" value={String(active.length)} detail="Disponíveis para processar" icon="check" /><SummaryCard label="Testes bem-sucedidos" value={String(healthy.length)} detail="Conexões validadas" icon="bolt" /></section><div className="glass-panel mb-4 rounded-[22px] p-4 sm:flex sm:items-center sm:justify-between sm:p-5"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong"><Icon name="plug" className="size-4" /></span><div><p className="text-[13px] font-semibold text-[#373064]">O Astro não movimenta o seu dinheiro</p><p className="mt-1 text-[12px] leading-5 text-[#666083]">Os pagamentos são processados e recebidos diretamente na conta do gateway conectado.</p></div></div></div>{connections.length > 0 && <section className="mb-7"><SectionTitle title="Conexões configuradas" detail={`${connections.length} ${connections.length === 1 ? "gateway conectado" : "gateways conectados"}`} /><div className="grid gap-4 lg:grid-cols-2">{connections.map((connection) => <ConnectedGatewayCard key={connection.id} connection={connection} />)}</div></section>}<section><SectionTitle title="Adicionar conexão" detail="Escolha um provedor homologado" /><div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">{gateways.map((gateway) => <GatewayConnectCard key={gateway.provider} gateway={gateway} />)}</div></section></>;
}

function SectionTitle({ title, detail }: { title: string; detail: string }) { return <div className="mb-3"><h2 className="text-sm font-semibold tracking-[-0.02em]">{title}</h2><p className="mt-1 text-[12px] text-muted">{detail}</p></div>; }
