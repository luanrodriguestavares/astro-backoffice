import { notFound } from "next/navigation";

import { CheckoutPreview } from "@/components/checkout-builder/checkout-preview";
import { apiFetch, AstroApiError } from "@/lib/api/server";
import type { Checkout, CheckoutDraft } from "@/lib/api/types";

export default async function CheckoutPreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ embed?: string }> }) {
  const { id } = await params;
  const { embed } = await searchParams;
  const result = await loadPreview(id);
  return <CheckoutPreview checkout={result.checkout} draft={result.draft} embedded={embed === "1"} />;
}

async function loadPreview(id: string) {
  try {
    const [checkout, draft] = await Promise.all([
      apiFetch<Checkout>(`/api/v1/checkouts/${encodeURIComponent(id)}`),
      apiFetch<CheckoutDraft>(`/api/v1/checkouts/${encodeURIComponent(id)}/draft`),
    ]);
    return { checkout, draft };
  } catch (error) {
    if (error instanceof AstroApiError && error.problem.status === 404) notFound();
    throw error;
  }
}
