import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { Price, Product } from '@/lib/api/types';

/**
 * Busca sem esperar as permissões: a chamada sai na mesma leva do usuário e da organização, e um
 * 403 (sem permissão) vira o valor padrão. Antes as páginas esperavam `currentPermissions()` e só
 * então buscavam os dados, o que somava uma ida e volta inteira até a API em cada tela.
 */
export async function apiFetchIfAllowed<T>(path: string, fallback: T): Promise<T> {
    try {
        return await apiFetch<T>(path);
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 403) return fallback;
        throw error;
    }
}

/**
 * Preços agrupados por produto. Sai junto com a lista de produtos (recebe a promessa dela) e usa
 * `GET /api/v1/prices`, uma chamada só, em vez de uma por produto. Uma API anterior ao endpoint
 * responde 404: aí volta para a busca antiga, produto a produto.
 */
export async function pricesByProduct(products: Promise<Product[]>) {
    const [list, all] = await Promise.all([
        products,
        apiFetch<Price[]>('/api/v1/prices').catch((error: unknown) => {
            if (error instanceof AstroApiError && error.problem.status === 404) return undefined;
            if (error instanceof AstroApiError && error.problem.status === 403) return [];
            throw error;
        }),
    ]);
    if (all === undefined) {
        const entries = await Promise.all(
            list.map(
                async (product) =>
                    [
                        product.id,
                        await apiFetch<Price[]>(
                            `/api/v1/products/${encodeURIComponent(product.id)}/prices`,
                        ),
                    ] as const,
            ),
        );
        return new Map(entries);
    }
    const grouped = new Map<string, Price[]>(list.map((product) => [product.id, []]));
    for (const price of all) {
        if (price.productId !== undefined) grouped.get(price.productId)?.push(price);
    }
    return grouped;
}
