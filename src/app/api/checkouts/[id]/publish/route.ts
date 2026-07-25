import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";
import type { CheckoutPublication } from "@/lib/api/types";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publication = await apiFetch<CheckoutPublication>(`/api/v1/checkouts/${encodeURIComponent(id)}/publish`, { method: "POST", headers: { "idempotency-key": randomUUID() } });
    return NextResponse.json({ data: publication });
  } catch (error) {
    if (error instanceof AstroApiError)
      return NextResponse.json(
        { code: error.problem.code, detail: error.problem.detail },
        { status: error.problem.status },
      );
    return NextResponse.json({ detail: "Não foi possível publicar o checkout." }, { status: 500 });
  }
}
