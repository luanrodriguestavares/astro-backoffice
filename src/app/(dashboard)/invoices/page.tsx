import { PageHeader } from "@/components/ui/page-header";
import { ResourceTable, date, money } from "@/components/ui/resource-table";
import { apiFetch } from "@/lib/api/server";

type Invoice = { id: string; subscriptionId: string | null; status: string; currency: string; totalMinor: number; paidMinor: number; amountDueMinor: number; dueAt: string | null };

export default async function InvoicesPage() {
  const invoices = await apiFetch<Invoice[]>("/api/v1/invoices");
  return <><PageHeader eyebrow="Financeiro" title="Faturas" description="Acompanhe cobranças recorrentes, vencimentos e pagamentos." /><ResourceTable rows={invoices} empty="Nenhuma fatura encontrada." columns={[{ label: "Fatura", value: (row) => row.id, mono: true }, { label: "Assinatura", value: (row) => row.subscriptionId, mono: true }, { label: "Status", value: (row) => row.status }, { label: "Total", value: (row) => money(row.totalMinor, row.currency) }, { label: "Pago", value: (row) => money(row.paidMinor, row.currency) }, { label: "Vencimento", value: (row) => date(row.dueAt) }]} /></>;
}
