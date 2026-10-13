import { LogFilterDialog } from '@/components/developer-logs/log-filter-dialog';
import { ApiRequestList, PaymentEventList } from '@/components/developer-logs/log-list-views';
import { LogTabs, type LogView } from '@/components/developer-logs/log-tabs';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import { filterQuery } from '@/lib/developer-logs/format';
import type { ApiRequestLog, TimelineEvent } from '@/lib/developer-logs/types';

type Search = Record<string, string | undefined>;

export default async function DeveloperLogsPage({
    searchParams,
}: {
    searchParams: Promise<Search>;
}) {
    const params = await searchParams;
    if (params.view === 'webhooks') redirect('/webhooks?view=sent');
    if (params.view === 'gateway') redirect('/webhooks?view=received');
    const view: LogView = params.view === 'requests' ? 'requests' : 'events';

    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Desenvolvedores"
                title="Logs e eventos"
                description="Entenda cada venda como uma operação completa ou investigue chamadas feitas à API."
            />
            <LogTabs active={view} />
            <LogFilterDialog view={view} params={params} />
            <LogResults view={view} params={params} />
        </div>
    );
}

async function LogResults({ view, params }: { view: LogView; params: Search }) {
    if (view === 'events') {
        const query = filterQuery(
            params,
            ['paymentId', 'correlationId', 'requestId', 'category', 'outcome', 'from', 'to'],
            { limit: '100' },
        );
        const rows = await apiFetch<TimelineEvent[]>(`/api/v1/developer/logs/events?${query}`);
        return <PaymentEventList rows={rows} />;
    }

    const query = filterQuery(
        params,
        ['method', 'status', 'route', 'requestId', 'correlationId', 'actorType', 'from', 'to'],
        { limit: '100' },
    );
    const rows = await apiFetch<ApiRequestLog[]>(`/api/v1/developer/logs/requests?${query}`);
    return <ApiRequestList rows={rows} />;
}
import { redirect } from 'next/navigation';
