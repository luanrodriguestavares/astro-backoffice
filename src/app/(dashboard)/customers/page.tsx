import { CustomerCreate } from "@/components/customers/customer-create";
import { PageHeader } from "@/components/ui/page-header";
import { ResourceTable, SummaryCard, date } from "@/components/ui/resource-table";
import { apiFetch } from "@/lib/api/server";
import type { Customer } from "@/lib/api/types";

export default async function CustomersPage() {
  const customers = await apiFetch<Customer[]>("/api/v1/customers");
  const buyers = customers.filter((customer) => customer.firstPurchaseAt !== null);
  const returning = buyers.filter((customer) => customer.firstPurchaseAt !== customer.lastPurchaseAt);

  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Clientes" description="Consulte clientes e o histórico de compras em uma visão unificada." actions={<CustomerCreate />} />
      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Clientes cadastrados" value={String(customers.length)} detail="Base total da organização" icon="users" />
        <SummaryCard label="Clientes compradores" value={String(buyers.length)} detail="Com pelo menos uma compra" icon="cart" />
        <SummaryCard label="Clientes recorrentes" value={String(returning.length)} detail="Com histórico de recompra" icon="repeat" />
      </section>
      <ResourceTable
        title="Base de clientes"
        description="Contatos e histórico de relacionamento"
        rows={customers}
        empty="Nenhum cliente cadastrado."
        columns={[
          { label: "Cliente", value: (row) => row.name },
          { label: "E-mail", value: (row) => row.email },
          { label: "Primeira compra", value: (row) => date(row.firstPurchaseAt) },
          { label: "Última compra", value: (row) => date(row.lastPurchaseAt) },
          { label: "Cadastro", value: (row) => date(row.createdAt) },
        ]}
      />
    </>
  );
}
