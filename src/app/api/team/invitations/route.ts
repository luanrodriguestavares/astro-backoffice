import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiFetch, AstroApiError } from "@/lib/api/server";

export async function POST(request: Request) {
  try { const input = await request.json(); const result = await apiFetch<{ accepted: true; developmentToken?: string }>("/api/v1/organizations/current/invitations", { method: "POST", headers: { "idempotency-key": randomUUID() }, body: JSON.stringify(input) }); return NextResponse.json({ data: result }); }
  catch (error) { if (error instanceof AstroApiError) return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status }); return NextResponse.json({ detail: "Não foi possível enviar o convite." }, { status: 500 }); }
}
