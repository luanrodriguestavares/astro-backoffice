import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiFetch, AstroApiError } from "@/lib/api/server";
export async function POST(request: Request) { try { const data = await apiFetch("/api/v1/shipping-profiles", { method: "POST", headers: { "idempotency-key": randomUUID() }, body: JSON.stringify(await request.json()) }); return NextResponse.json({ data }); } catch (error) { if (error instanceof AstroApiError) return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status }); return NextResponse.json({ detail: "Não foi possível criar o perfil de frete." }, { status: 500 }); } }
