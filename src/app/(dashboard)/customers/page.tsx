import { CustomerCreate } from '@/components/customers/customer-create';
import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable, SummaryCard, date } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import type { Customer } from '@/lib/api/types';

export default async function CustomersPage() {
    const [customers, orders] = await Promise.all([
        apiFetch<Customer[]>('/api/v1/customers'),
        apiFetch<
            Array<{
                customerId: string;
                paidMinor: number;
                paidAt: string | null;
                placedAt: string;
            }>
        >('/api/v1/orders'),
    ]);
    const purchaseDates = new Map<string, string[]>();
    for (const order of orders) {
        if (order.paidMinor <= 0) continue;
        const dates = purchaseDates.get(order.customerId) ?? [];
        dates.push(order.paidAt ?? order.placedAt);
        purchaseDates.set(order.customerId, dates);
    }
    const enrichedCustomers = customers.map((customer) => {
        const dates = purchaseDates.get(customer.id)?.sort() ?? [];
        return {
            ...customer,
            firstPurchaseAt: customer.firstPurchaseAt ?? dates[0] ?? null,
            lastPurchaseAt: customer.lastPurchaseAt ?? dates.at(-1) ?? null,
        };
    });
    const buyers = enrichedCustomers.filter((customer) => customer.firstPurchaseAt !== null);
    const returning = buyers.filter(
        (customer) => customer.firstPurchaseAt !== customer.lastPurchaseAt,
    );

    return (
        <>
            <PageHeader
                eyebrow="Relacionamento"
                title="Clientes"
                description="Consulte clientes e o histórico de compras em uma visão unificada."
                actions={<CustomerCreate />}
            />
            <section className="mb-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Clientes cadastrados"
                    value={String(customers.length)}
                    detail="Base total da organização"
                    icon="users"
                />
                <SummaryCard
                    label="Clientes compradores"
                    value={String(buyers.length)}
                    detail="Com pelo menos uma compra"
                    icon="cart"
                />
                <SummaryCard
                    label="Clientes recorrentes"
                    value={String(returning.length)}
                    detail="Com histórico de recompra"
                    icon="repeat"
                />
            </section>
            <ResourceTable
                title="Base de clientes"
                description="Contatos e histórico de relacionamento"
                rows={enrichedCustomers}
                empty="Nenhum cliente cadastrado."
                columns={[
                    { label: 'Cliente', value: (row) => row.name },
                    { label: 'E-mail', value: (row) => row.email },
                    { label: 'Primeira compra', value: (row) => dateTime(row.firstPurchaseAt) },
                    { label: 'Última compra', value: (row) => dateTime(row.lastPurchaseAt) },
                    { label: 'Cadastro', value: (row) => date(row.createdAt) },
                ]}
            />
        </>
    );
}

function dateTime(value: string | null) {
    return value
        ? new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
          }).format(new Date(value))
        : '—';
}
