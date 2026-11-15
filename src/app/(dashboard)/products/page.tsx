import { ProductManager } from '@/components/products/product-manager';
import { PageHeader } from '@/components/ui/page-header';
import { pricesByProduct } from '@/lib/api/batched';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { MediaFile, Product } from '@/lib/api/types';
import { mediaLibraryEnabled } from '@/lib/features/release';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; focus?: string }>;
}) {
    const { q = '', focus } = await searchParams;
    // Tudo numa leva só: permissões, produtos, preços (uma chamada) e arquivos.
    const productsRequest = apiFetch<Product[]>('/api/v1/products?limit=100');
    const [permissions, productList, prices, files] = await Promise.all([
        currentPermissions(),
        productsRequest,
        pricesByProduct(productsRequest),
        mediaLibraryEnabled
            ? apiFetch<MediaFile[]>('/api/v1/files')
            : Promise.resolve([] as MediaFile[]),
    ]);
    const products = productList.toSorted(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
    return (
        <div className="astro-themed-page products-page" data-tour="products-page">
            <PageHeader
                eyebrow="Catálogo"
                title="Produtos"
                description="Organize seu catálogo, preços e modelos de cobrança em um só lugar."
            />
            <ProductManager
                key={`${q}:${focus ?? ''}`}
                products={products}
                prices={Object.fromEntries(prices)}
                files={files}
                canWrite={permissions.has('products.write')}
                initialQuery={q}
                focusId={focus}
            />
        </div>
    );
}
