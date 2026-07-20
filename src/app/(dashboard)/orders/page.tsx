import { PageHeader } from "@/components/ui/page-header";
import { ResourceTable, SummaryCard, date, money } from "@/components/ui/resource-table";
import { apiFetch } from "@/lib/api/server";

type Order = { id: string; customerId: string; status: string; currency: string; totalMinor: number; paidMinor: number; placedAt: string };

export default async function OrdersPage() {
  const orders = await apiFetch<Order[]>("/api/v1/orders");
  const currency = orders[0]?.currency ?? "BRL";
  const total = orders.reduce((sum, order) => sum + order.totalMinor, 0);
  const paid = orders.reduce((sum, order) => sum + order.paidMinor, 0);
  const completed = orders.filter((order) => order.paidMinor >= order.totalMinor && order.totalMinor > 0).length;
  return <><PageHeader eyebrow="Vendas" title="Pedidos" description="Acompanhe os pedidos gerados pelos checkouts." /><section className="mb-4 grid gap-3 sm:grid-cols-3"><SummaryCard label="Volume de pedidos" value={money(total, currency)} detail={`${orders.length} pedidos gerados`} icon="cart" /><SummaryCard label="Total recebido" value={money(paid, currency)} detail="Valores confirmados" icon="card" /><SummaryCard label="Pedidos pagos" value={String(completed)} detail="Com pagamento integral" icon="check" /></section><ResourceTable title="Pedidos recentes" description="Histórico comercial dos seus checkouts" rows={orders} empty="Nenhum pedido encontrado." columns={[{ label: "Pedido", value: (row) => row.id, mono: true }, { label: "Cliente", value: (row) => row.customerId, mono: true }, { label: "Status", value: (row) => row.status }, { label: "Total", value: (row) => money(row.totalMinor, row.currency) }, { label: "Pago", value: (row) => money(row.paidMinor, row.currency) }, { label: "Data", value: (row) => date(row.placedAt) }]} /></>;
}
