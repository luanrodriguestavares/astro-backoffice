import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await apiFetch<{ success: boolean; testedAt: string }>(
      `/api/v1/gateway-connections/${encodeURIComponent(id)}/test`,
      { method: "POST" },
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AstroApiError)
      return NextResponse.json({ detail: error.problem.detail }, { status: error.problem.status });
    return NextResponse.json({ detail: "Não foi possível testar o gateway." }, { status: 500 });
  }
}
