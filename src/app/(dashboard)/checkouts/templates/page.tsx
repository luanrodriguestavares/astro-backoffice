import { CheckoutAreaNav } from '@/components/checkout-builder/checkout-area-nav';
import { FunnelTemplateMarketplace } from '@/components/checkout-builder/funnel-template-marketplace';
import { PageHeader } from '@/components/ui/page-header';
import { currentPermissions } from '@/lib/auth/permissions';

export const metadata = { title: 'Templates de funil' };

export default async function CheckoutTemplatesPage() {
    const permissions = await currentPermissions();
    return (
        <div className="astro-themed-page checkouts-page">
            <PageHeader
                eyebrow="Conversão"
                title="Templates de funil"
                description="Estruturas prontas de páginas, checkout e navegação para você adaptar à sua oferta."
            />
            <CheckoutAreaNav
                active="templates"
                canReadAnalytics={permissions.has('analytics.read')}
            />
            <FunnelTemplateMarketplace canWrite={permissions.has('products.write')} />
        </div>
    );
}
