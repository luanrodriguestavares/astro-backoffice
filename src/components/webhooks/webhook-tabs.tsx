import { ResourceStatus, ResourceTable } from '@/components/ui/resource-table';

export type WebhookEndpointRow = {
    id: string;
    name?: string;
    url: string;
    status: string;
    subscribedEvents?: string[];
};

export function WebhookEndpointTable({ endpoints }: { endpoints: WebhookEndpointRow[] }) {
    return (
        <ResourceTable
            title="Endpoints"
            description="Destinos configurados para receber eventos da plataforma."
            rows={endpoints}
            empty="Nenhum endpoint de webhook configurado."
            columns={[
                { label: 'Nome', value: (row) => row.name },
                { label: 'Endpoint', value: (row) => row.url },
                {
                    label: 'Eventos',
                    value: (row) => row.subscribedEvents?.map(eventLabel).join(', '),
                },
                {
                    label: 'Status',
                    value: (row) => row.status,
                    render: (row: WebhookEndpointRow) => <ResourceStatus value={row.status} />,
                },
            ]}
        />
    );
}

function eventLabel(value: string) {
    const labels: Record<string, string> = {
        'payment.approved': 'Pagamento aprovado',
        'payment.failed': 'Pagamento falhou',
        'payment.canceled': 'Pagamento cancelado',
        'payment.refunded': 'Pagamento reembolsado',
        'subscription.created': 'Assinatura criada',
        'subscription.activated': 'Assinatura ativada',
        'subscription.renewed': 'Assinatura renovada',
        'subscription.canceled': 'Assinatura cancelada',
        'invoice.paid': 'Fatura paga',
        'invoice.payment_failed': 'Pagamento da fatura falhou',
    };
    return labels[value] ?? value;
}
