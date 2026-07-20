import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await apiFetch(`/api/v1/gateway-connections/${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ data: { accepted: true } });
  } catch (error) {
    if (error instanceof AstroApiError)
      return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status });
    return NextResponse.json({ detail: "Não foi possível desabilitar o gateway." }, { status: 500 });
  }
}
