import { ProductManager } from "@/components/products/product-manager";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api/server";
import type { Price, Product } from "@/lib/api/types";

export default async function ProductsPage() {
  const products = await apiFetch<Product[]>("/api/v1/products?limit=100");
  const entries = await Promise.all(
    products.map(
      async (product) =>
        [
          product.id,
          await apiFetch<Price[]>(`/api/v1/products/${product.id}/prices`),
        ] as const,
    ),
  );
  return (
    <div className="astro-themed-page products-page">
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Organize seu catálogo, preços e modelos de cobrança em um só lugar."
      />
      <ProductManager
        products={products}
        prices={Object.fromEntries(entries)}
      />
    </div>
  );
}
