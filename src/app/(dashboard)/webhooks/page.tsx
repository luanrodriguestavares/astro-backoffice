import { WebhookCreateAction } from '@/components/resources/create-actions';
import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';

type WebhookEndpoint = {
    id: string;
    name?: string;
    url: string;
    status: string;
    subscribedEvents?: string[];
};

export default async function WebhooksPage() {
    const endpoints = await apiFetch<WebhookEndpoint[]>('/api/v1/developer/webhook-endpoints');
    return (
        <>
            <PageHeader
                eyebrow="Integrações"
                title="Webhooks"
                description="Configure endpoints que recebem eventos da plataforma."
                actions={<WebhookCreateAction />}
            />
            <ResourceTable
                rows={endpoints}
                empty="Nenhum endpoint de webhook configurado."
                columns={[
                    { label: 'Nome', value: (row) => row.name },
                    { label: 'Endpoint', value: (row) => row.url },
                    { label: 'Eventos', value: (row) => row.subscribedEvents?.join(', ') },
                    { label: 'Status', value: (row) => row.status },
                ]}
            />
        </>
    );
}
