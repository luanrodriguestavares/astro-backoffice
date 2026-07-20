import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";
import type { Price } from "@/lib/api/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = await request.json();
    const price = await apiFetch<Price>(`/api/v1/products/${encodeURIComponent(id)}/prices`, { method: "POST", headers: { "idempotency-key": randomUUID() }, body: JSON.stringify(input) });
    return NextResponse.json({ data: price });
  } catch (error) {
    if (error instanceof AstroApiError) return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status });
    return NextResponse.json({ detail: "Produto criado, mas não foi possível criar o preço." }, { status: 500 });
  }
}
