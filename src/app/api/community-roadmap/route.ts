import { NextResponse } from "next/server";

import { apiFetch, AstroApiError } from "@/lib/api/server";
import type { RoadmapSubmission } from "@/lib/api/types";

export async function POST(request: Request) {
  try {
    const idea = await apiFetch<RoadmapSubmission>(
      "/api/v1/community-roadmap/ideas",
      {
        method: "POST",
        body: JSON.stringify(await request.json()),
      },
    );
    return NextResponse.json({ data: idea });
  } catch (error) {
    if (error instanceof AstroApiError) {
      const detail =
        error.problem.code === "COMMUNITY_IDEA_PENDING_LIMIT"
          ? "Você pode ter no máximo cinco sugestões aguardando análise."
          : error.problem.detail;
      return NextResponse.json({ detail }, { status: error.problem.status });
    }
    return NextResponse.json(
      { detail: "Não foi possível enviar sua sugestão." },
      { status: 500 },
    );
  }
}
