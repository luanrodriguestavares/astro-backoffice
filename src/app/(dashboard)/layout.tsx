import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { apiFetch, AstroApiError } from "@/lib/api/server";
import type { CurrentUser, Organization } from "@/lib/api/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, organization } = await dashboardContext();
  return <DashboardShell user={user} organization={organization}>{children}</DashboardShell>;
}

async function dashboardContext() {
  try {
    const [user, organization] = await Promise.all([
      apiFetch<CurrentUser>("/api/v1/auth/me"),
      apiFetch<Organization>("/api/v1/organizations/current"),
    ]);
    return { user, organization };
  } catch (error) {
    if (error instanceof AstroApiError && error.problem.status === 401)
      redirect("/api/auth/session-expired?next=/dashboard");
    throw error;
  }
}
