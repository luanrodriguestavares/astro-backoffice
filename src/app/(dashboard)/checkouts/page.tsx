import {
    CheckoutManager,
    type CheckoutCatalogOption,
} from '@/components/checkout-builder/checkout-manager';
import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Checkout, Price, Product } from '@/lib/api/types';

export default async function CheckoutsPage() {
    const permissions = await currentPermissions();
    const [checkouts, products] = await Promise.all([
        apiFetch<Checkout[]>('/api/v1/checkouts'),
        apiFetch<Product[]>('/api/v1/products?limit=100'),
    ]);
    const priceEntries = await Promise.all(
        products.map(async (product) => ({
            product,
            prices: await apiFetch<Price[]>(`/api/v1/products/${product.id}/prices`),
        })),
    );
    const catalog: CheckoutCatalogOption[] = priceEntries.flatMap(({ product, prices }) =>
        prices
            .filter((price) => product.status === 'active' && price.status === 'active')
            .map((price) => ({
                productId: product.id,
                priceId: price.id,
                productName: product.name,
                priceName: price.name,
                amountMinor: price.amountMinor,
                currency: price.currency,
                pricingType: price.pricingType,
                active: true,
            })),
    );
    const published = checkouts.filter((checkout) => checkout.status === 'published').length;
    const drafts = checkouts.filter((checkout) => checkout.status === 'draft').length;

    return (
        <div className="astro-themed-page checkouts-page">
            <PageHeader
                eyebrow="Conversão"
                title="Checkouts"
                description="Crie páginas de venda com componentes visuais e pagamento protegido pelo Astro."
            />
            <section className="mb-4 grid gap-3 sm:grid-cols-3">
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
                    detail={`${catalog.length} ofertas disponíveis`}
                    icon="edit"
                />
            </section>
            <CheckoutManager
                checkouts={checkouts}
                catalog={catalog}
                canWrite={permissions.has('products.write')}
            />
        </div>
    );
}
