import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";
import type { CheckoutDraft } from "@/lib/api/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const draft = await apiFetch<CheckoutDraft>(`/api/v1/checkouts/${encodeURIComponent(id)}/draft`, { method: "PUT", headers: { "idempotency-key": randomUUID() }, body: JSON.stringify(await request.json()) });
    return NextResponse.json({ data: draft });
  } catch (error) {
    if (error instanceof AstroApiError) return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status });
    return NextResponse.json({ detail: "Não foi possível salvar o rascunho." }, { status: 500 });
  }
}
