import { cookies } from "next/headers";

import { astroApiUrl } from "@/lib/api/config";
import type { ApiEnvelope, ProblemDetails } from "@/lib/api/types";

export class AstroApiError extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.detail);
    this.name = "AstroApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("astro_access")?.value;
  const response = await fetch(`${astroApiUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      ...(accessToken === undefined ? {} : { authorization: `Bearer ${accessToken}` }),
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiEnvelope<T> | ProblemDetails;
  if (!response.ok) throw new AstroApiError(payload as ProblemDetails);
  return (payload as ApiEnvelope<T>).data;
}
