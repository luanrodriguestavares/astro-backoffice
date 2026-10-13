import { LogFilterDialog } from '@/components/developer-logs/log-filter-dialog';
import { GatewayEventList, WebhookDeliveryList } from '@/components/developer-logs/log-list-views';
import { WebhookCreateAction } from '@/components/resources/create-actions';
import { PageHeader } from '@/components/ui/page-header';
import { WebhookCenterTabs, type WebhookView } from '@/components/webhooks/webhook-center-tabs';
import { WebhookEndpointTable, type WebhookEndpointRow } from '@/components/webhooks/webhook-tabs';
import { apiFetch } from '@/lib/api/server';
import { filterQuery } from '@/lib/developer-logs/format';
import type { GatewayEventLog, WebhookDeliveryLog } from '@/lib/developer-logs/types';

type Search = Record<string, string | undefined>;

export default async function WebhooksPage({ searchParams }: { searchParams: Promise<Search> }) {
    const params = await searchParams;
    const view: WebhookView =
        params.view === 'sent' || params.view === 'received' ? params.view : 'configuration';

    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Desenvolvedores"
                title="Webhooks"
                description="Configure endpoints e acompanhe tudo o que o Astro envia e recebe."
                actions={view === 'configuration' ? <WebhookCreateAction /> : undefined}
            />
            <WebhookCenterTabs active={view} />
            <WebhookContent view={view} params={params} />
        </div>
    );
}

async function WebhookContent({ view, params }: { view: WebhookView; params: Search }) {
    if (view === 'configuration') {
        const endpoints = await apiFetch<WebhookEndpointRow[]>(
            '/api/v1/developer/webhook-endpoints',
        );
        return <WebhookEndpointTable endpoints={endpoints} />;
    }

    if (view === 'sent') {
        const query = filterQuery(params, ['status', 'eventType', 'paymentId', 'from', 'to'], {
            limit: '100',
        });
        const rows = await apiFetch<WebhookDeliveryLog[]>(
            `/api/v1/developer/logs/webhook-deliveries?${query}`,
        );
        return (
            <>
                <LogFilterDialog
                    view="webhooks"
                    routeView="sent"
                    params={params}
                    pathname="/webhooks"
                />
                <WebhookDeliveryList rows={rows} />
            </>
        );
    }

    const query = filterQuery(params, ['provider', 'status', 'paymentId', 'from', 'to'], {
        limit: '100',
    });
    const rows = await apiFetch<GatewayEventLog[]>(
        `/api/v1/developer/logs/gateway-events?${query}`,
    );
    return (
        <>
            <LogFilterDialog
                view="gateway"
                routeView="received"
                params={params}
                pathname="/webhooks"
            />
            <GatewayEventList rows={rows} />
        </>
    );
}
