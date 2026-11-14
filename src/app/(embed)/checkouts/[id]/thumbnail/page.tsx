import { CheckoutPreview } from '@/components/checkout-builder/checkout-preview';
import { apiFetch } from '@/lib/api/server';
import type { Checkout, CheckoutDraft } from '@/lib/api/types';

/**
 * Miniatura dos cards da lista de checkouts. Fica fora do grupo (dashboard) de propósito:
 * cada card é um iframe, e herdar o layout do painel (shell, sidebar, assistente e as
 * chamadas de organização/billing) multiplicava esse custo por checkout. Estática:
 * sem animações nem cronômetro.
 */
export default async function CheckoutThumbnailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const path = `/api/v1/checkouts/${encodeURIComponent(id)}`;
    const result = await Promise.all([
        apiFetch<Checkout>(path),
        apiFetch<CheckoutDraft>(`${path}/draft`),
    ]).catch(() => undefined);
    // Sem dados (sessão expirada, checkout removido): o card mantém o placeholder.
    if (!result) return null;
    const [checkout, draft] = result;
    return <CheckoutPreview checkout={checkout} draft={draft} embedded staticMode />;
}
