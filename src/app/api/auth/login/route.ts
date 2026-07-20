import { NextResponse } from "next/server";

import { astroApiUrl } from "@/lib/api/config";
import type { ApiEnvelope, ProblemDetails, SessionData } from "@/lib/api/types";
import { authenticatedRedirect } from "@/lib/auth/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (email.length === 0 || password.length === 0) return loginError(request, "Informe e-mail e senha.");

  try {
    const response = await fetch(`${astroApiUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const payload = (await response.json()) as ApiEnvelope<SessionData> | ProblemDetails;
    if (!response.ok) return loginError(request, "Não foi possível entrar. Confira seus dados.");

    return authenticatedRedirect(request, (payload as ApiEnvelope<SessionData>).data);
  } catch {
    return loginError(request, "A API do Astro está indisponível no momento.");
  }
}

function loginError(request: Request, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}
