import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";
import type { GatewayConnection } from "@/lib/api/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = await request.json() as { name?: string; publicConfiguration?: Record<string, unknown>; credentials?: Record<string, unknown> };
    let connection = await apiFetch<GatewayConnection>(`/api/v1/gateway-connections/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "idempotency-key": randomUUID() }, body: JSON.stringify({ name: input.name, publicConfiguration: input.publicConfiguration }) });
    if (input.credentials && Object.keys(input.credentials).length > 0) connection = await apiFetch<GatewayConnection>(`/api/v1/gateway-connections/${encodeURIComponent(id)}/rotate-credentials`, { method: "POST", headers: { "idempotency-key": randomUUID() }, body: JSON.stringify({ credentials: input.credentials }) });
    return NextResponse.json({ data: connection });
  } catch (error) {
    if (error instanceof AstroApiError) return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status });
    return NextResponse.json({ detail: "Não foi possível atualizar o gateway." }, { status: 500 });
  }
}

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
