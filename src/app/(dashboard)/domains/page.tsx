import { CustomDomainManager } from '@/components/settings/custom-domain-manager';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Checkout, CustomDomain } from '@/lib/api/types';

export default async function DomainsPage() {
    const [domains, checkouts, permissions] = await Promise.all([
        apiFetch<CustomDomain[]>('/api/v1/custom-domains'),
        apiFetch<Checkout[]>('/api/v1/checkouts'),
        currentPermissions(),
    ]);
    return (
        <>
            <PageHeader
                eyebrow="White-label"
                title="Domínios do checkout"
                description="Publique seu checkout em um endereço como checkout.empresa.com."
            />
            <CustomDomainManager
                initialDomains={domains}
                checkouts={checkouts}
                canManage={permissions.has('checkouts.publish')}
            />
        </>
    );
}
