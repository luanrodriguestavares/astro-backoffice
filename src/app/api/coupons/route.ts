import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const coupon = await apiFetch("/api/v1/coupons", { method: "POST", headers: { "idempotency-key": randomUUID() }, body: JSON.stringify(input) });
    return NextResponse.json({ data: coupon });
  } catch (error) {
    if (error instanceof AstroApiError) return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status });
    return NextResponse.json({ detail: "Não foi possível cadastrar o cupom." }, { status: 500 });
  }
}
