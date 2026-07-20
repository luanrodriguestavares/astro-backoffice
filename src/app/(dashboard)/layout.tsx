import { DashboardShell } from "@/components/layout/dashboard-shell";
import { apiFetch } from "@/lib/api/server";
import type { CurrentUser, Organization } from "@/lib/api/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, organization] = await Promise.all([
    apiFetch<CurrentUser>("/api/v1/auth/me"),
    apiFetch<Organization>("/api/v1/organizations/current"),
  ]);
  return <DashboardShell user={user} organization={organization}>{children}</DashboardShell>;
}
