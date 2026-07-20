import { PageHeader } from "@/components/ui/page-header";
import { ResourceTable, date, money } from "@/components/ui/resource-table";
import { apiFetch } from "@/lib/api/server";
import type { Refund } from "@/lib/api/types";

export default async function RefundsPage() {
  const refunds = await apiFetch<Refund[]>("/api/v1/refunds");
  return <><PageHeader eyebrow="Financeiro" title="Reembolsos" description="Consulte devoluções solicitadas e concluídas." /><ResourceTable rows={refunds} empty="Nenhum reembolso encontrado." columns={[{ label: "Reembolso", value: (row) => row.id, mono: true }, { label: "Pagamento", value: (row) => row.paymentId, mono: true }, { label: "Valor", value: (row) => money(row.amountMinor, row.currency) }, { label: "Status", value: (row) => row.status }, { label: "Motivo", value: (row) => row.reason }, { label: "Data", value: (row) => date(row.createdAt) }]} /></>;
}
