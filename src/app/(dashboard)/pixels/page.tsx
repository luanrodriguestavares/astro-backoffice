import { TrackingManager } from '@/components/tracking/tracking-manager';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { Checkout, TrackingDelivery, TrackingDestination } from '@/lib/api/types';
import { currentPermissions } from '@/lib/auth/permissions';
import type { PlatformBillingSummary } from '@/lib/api/types';
import { redirect } from 'next/navigation';

export default async function PixelsPage() {
    const billing = await apiFetch<PlatformBillingSummary>('/api/v1/platform/billing');
    if (!billing.usage.some((item) => item.feature === 'marketing.pixels' && item.enabled))
        redirect('/settings?view=plan');
    const [destinations, deliveries, checkouts, permissions] = await Promise.all([
        apiFetch<TrackingDestination[]>('/api/v1/tracking/destinations'),
        apiFetch<TrackingDelivery[]>('/api/v1/tracking/deliveries'),
        apiFetch<Checkout[]>('/api/v1/checkouts'),
        currentPermissions(),
    ]);
    return (
        <>
            <PageHeader
                eyebrow="Integrações"
                title="Pixels e conversões"
                description="Meça a jornada do checkout e envie compras aprovadas pelo navegador e pelo servidor."
            />
            <TrackingManager
                initialDestinations={destinations}
                deliveries={deliveries}
                checkouts={checkouts}
                canManage={permissions.has('tracking.manage')}
            />
        </>
    );
}
