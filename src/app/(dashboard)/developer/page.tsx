import { ApiKeyManager, type ApiKeyItem } from '@/components/developer/api-key-manager';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';

export default async function DeveloperPage() {
    const keys = await apiFetch<ApiKeyItem[]>('/api/v1/developer/api-keys');
    return (
        <>
            <PageHeader
                eyebrow="Integrações"
                title="API e desenvolvedores"
                description="Gerencie chaves, escopos e limites de acesso à API."
            />
            <ApiKeyManager keys={keys} />
        </>
    );
}
