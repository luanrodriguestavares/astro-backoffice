import { CheckoutAreaNav } from '@/components/checkout-builder/checkout-area-nav';
import { FunnelAnalyticsHub } from '@/components/checkout-builder/funnel-analytics-hub';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Checkout } from '@/lib/api/types';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Analytics de funis' };

export default async function FunnelAnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ checkout?: string }>;
}) {
    const { checkout } = await searchParams;
    const permissions = await currentPermissions();
    if (!permissions.has('analytics.read')) redirect('/analytics');
    const checkouts = await apiFetch<Checkout[]>('/api/v1/checkouts');
    return (
        <div className="astro-themed-page checkouts-page">
            <PageHeader
                eyebrow="Conversão"
                title="Analytics de funis"
                description="Compare a jornada de cada checkout e descubra em qual página os visitantes abandonam."
            />
            <CheckoutAreaNav active="analytics" />
            <FunnelAnalyticsHub
                checkouts={checkouts.map(({ id, name, status }) => ({ id, name, status }))}
                initialCheckoutId={checkout}
            />
        </div>
    );
}
