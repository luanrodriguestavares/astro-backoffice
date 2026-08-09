import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import { currentOrganization, currentUser } from '@/lib/auth/permissions';
import type { Organization, PlatformBillingSummary } from '@/lib/api/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, organization, organizations, billing } = await dashboardContext();
    const billingAccess = {
        active: hasBillingAccess(billing),
        features: billing.usage
            .filter((entitlement) => entitlement.enabled)
            .map((entitlement) => entitlement.feature),
    };
    return (
        <DashboardShell
            user={user}
            organization={organization}
            organizations={organizations}
            billingAccess={billingAccess}
        >
            {children}
        </DashboardShell>
    );
}

async function dashboardContext() {
    try {
        const [user, organization, organizations, billing] = await Promise.all([
            currentUser(),
            currentOrganization(),
            apiFetch<Organization[]>('/api/v1/organizations'),
            apiFetch<PlatformBillingSummary>('/api/v1/platform/billing'),
        ]);
        return { user, organization, organizations, billing };
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 401)
            redirect('/api/auth/session-expired?next=/dashboard');
        throw error;
    }
}

function hasBillingAccess(billing: PlatformBillingSummary) {
    const { subscription } = billing;
    if (subscription.status === 'active' || subscription.status === 'trialing') return true;
    return (
        subscription.status === 'past_due' &&
        subscription.gracePeriodEndsAt !== null &&
        new Date(subscription.gracePeriodEndsAt).getTime() > Date.now()
    );
}
