import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  const login = new URL("/login", request.url);
  login.searchParams.set("next", nextPath);
  login.searchParams.set("expired", "1");
  const response = NextResponse.redirect(login);
  response.cookies.delete("astro_access");
  response.cookies.delete("astro_refresh");
  return response;
}

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
