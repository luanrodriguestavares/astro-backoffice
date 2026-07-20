import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await apiFetch(`/api/v1/checkouts/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "idempotency-key": randomUUID() } });
    return NextResponse.json({ data: { accepted: true } });
  } catch (error) {
    if (error instanceof AstroApiError) return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status });
    return NextResponse.json({ detail: "Não foi possível excluir o checkout." }, { status: 500 });
  }
}
