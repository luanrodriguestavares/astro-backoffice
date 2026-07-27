import { NextResponse } from "next/server";

import { AstroApiError } from "@/lib/api/server";

export function roadmapActionError(error: unknown, fallback: string) {
  if (error instanceof AstroApiError) {
    const detail =
      error.problem.code === "COMMUNITY_IDEA_STALE"
        ? "Esta sugestão foi alterada. Atualize a página e tente novamente."
        : error.problem.code === "COMMUNITY_IDEA_EDITING_CLOSED"
          ? "Esta sugestão já foi analisada e não pode mais ser editada."
        : error.problem.detail;
    return NextResponse.json({ detail }, { status: error.problem.status });
  }
  return NextResponse.json({ detail: fallback }, { status: 500 });
}
