import { cookies } from "next/headers";

import { astroApiUrl } from "@/lib/api/config";
import type { ApiEnvelope, ProblemDetails, SessionData } from "@/lib/api/types";

export class AstroApiError extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.detail);
    this.name = "AstroApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const request = (accessToken?: string) => fetch(`${astroApiUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      ...(accessToken === undefined ? {} : { authorization: `Bearer ${accessToken}` }),
      ...init.headers,
    },
  });

  let response = await request(cookieStore.get("astro_access")?.value);
  if (response.status === 401) {
    const refreshToken = cookieStore.get("astro_refresh")?.value;
    if (refreshToken !== undefined) {
      const refreshed = await refreshSession(refreshToken);
      if (refreshed !== undefined) {
        persistSession(cookieStore, refreshed);
        response = await request(refreshed.accessToken);
      }
    }
  }

  const payload = (await response.json()) as ApiEnvelope<T> | ProblemDetails;
  if (!response.ok) throw new AstroApiError(payload as ProblemDetails);
  return (payload as ApiEnvelope<T>).data;
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${astroApiUrl()}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return undefined;
  const payload = (await response.json()) as ApiEnvelope<SessionData>;
  return payload.data;
}

function persistSession(cookieStore: Awaited<ReturnType<typeof cookies>>, session: SessionData) {
  const secure = process.env.NODE_ENV === "production";
  try {
    cookieStore.set("astro_access", session.accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure,
      path: "/",
      maxAge: session.expiresIn,
    });
    cookieStore.set("astro_refresh", session.refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  } catch {
    // Server Components cannot mutate cookies; the proxy persists them on navigation.
  }
}
