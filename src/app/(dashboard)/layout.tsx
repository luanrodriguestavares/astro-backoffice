import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import { currentOrganization, currentUser } from '@/lib/auth/permissions';
import type { Organization } from '@/lib/api/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, organization, organizations } = await dashboardContext();
    return (
        <DashboardShell user={user} organization={organization} organizations={organizations}>
            {children}
        </DashboardShell>
    );
}

async function dashboardContext() {
    try {
        const [user, organization, organizations] = await Promise.all([
            currentUser(),
            currentOrganization(),
            apiFetch<Organization[]>('/api/v1/organizations'),
        ]);
        return { user, organization, organizations };
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 401)
            redirect('/api/auth/session-expired?next=/dashboard');
        throw error;
    }
}
