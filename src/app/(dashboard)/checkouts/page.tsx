import {
    CheckoutManager,
    type CheckoutCatalogOption,
} from '@/components/checkout-builder/checkout-manager';
import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Checkout, Price, Product } from '@/lib/api/types';
import { checkoutTemplates, type CheckoutTemplateId } from '@/lib/checkout/templates';
import { CheckoutAreaNav } from '@/components/checkout-builder/checkout-area-nav';

export default async function CheckoutsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; focus?: string; template?: string; ia?: string }>;
}) {
    const { q = '', focus, template, ia } = await searchParams;
    const initialTemplate = checkoutTemplates.some((item) => item.id === template)
        ? (template as CheckoutTemplateId)
        : undefined;
    const permissions = await currentPermissions();
    // O catálogo só serve para o modal "Criar checkout": não segura a lista. Ele segue
    // como promessa para o cliente e resolve em paralelo enquanto os cards já aparecem.
    const catalog = loadCatalog();
    const checkouts = await apiFetch<Checkout[]>('/api/v1/checkouts');
    const published = checkouts.filter((checkout) => checkout.status === 'published').length;
    const drafts = checkouts.filter((checkout) => checkout.status === 'draft').length;

    return (
        <div className="astro-themed-page checkouts-page">
            <PageHeader
                eyebrow="Conversão"
                title="Checkouts"
                description="Crie páginas de venda com componentes visuais e pagamento protegido pelo Astro."
            />
            <CheckoutAreaNav
                active="checkouts"
                canReadAnalytics={permissions.has('analytics.read')}
            />
            <section data-tour="page-summary" className="mb-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Checkouts criados"
                    value={String(checkouts.length)}
                    detail="Experiências de venda"
                    icon="layout"
                />
                <SummaryCard
                    label="Publicados"
                    value={String(published)}
                    detail="Disponíveis para seus clientes"
                    icon="check"
                />
                <SummaryCard
                    label="Em rascunho"
                    value={String(drafts)}
                    detail="Aguardando publicação"
                    icon="edit"
                />
            </section>
            <div data-tour="page-primary">
                <CheckoutManager
                    key={`${q}:${focus ?? ''}`}
                    checkouts={checkouts}
                    catalog={catalog}
                    canWrite={permissions.has('products.write')}
                    initialQuery={q}
                    initialTemplate={initialTemplate}
                    initialAi={ia === '1'}
                    focusId={focus}
                />
            </div>
        </div>
    );
}

async function loadCatalog(): Promise<CheckoutCatalogOption[]> {
    try {
        const products = await apiFetch<Product[]>('/api/v1/products?limit=100');
        const active = products.filter((product) => product.status === 'active');
        const entries = await Promise.all(
            active.map(async (product) => ({
                product,
                prices: await apiFetch<Price[]>(`/api/v1/products/${product.id}/prices`),
            })),
        );
        return entries.flatMap(({ product, prices }) =>
            prices
                .filter((price) => price.status === 'active')
                .map((price) => ({
                    productId: product.id,
                    priceId: price.id,
                    productName: product.name,
                    priceName: price.name,
                    amountMinor: price.amountMinor,
                    currency: price.currency,
                    pricingType: price.pricingType,
                    recurringInterval: price.recurringInterval,
                    recurringIntervalCount: price.recurringIntervalCount,
                    active: true,
                })),
        );
    } catch {
        return [];
    }
}
