import { CustomerCreate } from "@/components/customers/customer-create";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api/server";
import type { Customer } from "@/lib/api/types";

export default async function CustomersPage() {
  const customers = await apiFetch<Customer[]>("/api/v1/customers");
  return <><PageHeader eyebrow="Relacionamento" title="Clientes" description="Consulte clientes e o histórico de compras em uma visão unificada." actions={<CustomerCreate />} /><section className="overflow-hidden rounded-2xl border bg-surface shadow-panel">{customers.length === 0 ? <p className="p-12 text-center text-sm text-muted">Nenhum cliente cadastrado.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-[#fafafd] text-xs text-muted"><tr><th className="px-6 py-3 font-medium">Cliente</th><th className="px-6 py-3 font-medium">E-mail</th><th className="px-6 py-3 font-medium">Primeira compra</th><th className="px-6 py-3 font-medium">Última compra</th></tr></thead><tbody className="divide-y">{customers.map((customer) => <tr key={customer.id} className="text-sm"><td className="px-6 py-4 font-semibold">{customer.name}</td><td className="px-6 py-4 text-muted">{customer.email}</td><td className="px-6 py-4 text-muted">{date(customer.firstPurchaseAt)}</td><td className="px-6 py-4 text-muted">{date(customer.lastPurchaseAt)}</td></tr>)}</tbody></table></div>}</section></>;
}
function date(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : "—"; }
