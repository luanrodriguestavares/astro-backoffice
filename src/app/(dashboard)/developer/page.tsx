import { ApiKeyManager, type ApiKeyItem } from '@/components/developer/api-key-manager';
import {
    EmbedOriginManager,
    type EmbedOriginItem,
} from '@/components/developer/embed-origin-manager';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';

export default async function DeveloperPage() {
    const [keys, origins] = await Promise.all([
        apiFetch<ApiKeyItem[]>('/api/v1/developer/api-keys'),
        apiFetch<EmbedOriginItem[]>('/api/v1/developer/embed-origins'),
    ]);
    return (
        <>
            <PageHeader
                eyebrow="Desenvolvedores"
                title="Chaves de API"
                description="Gerencie chaves, escopos e limites de acesso à API."
            />
            <div className="space-y-10">
                <ApiKeyManager keys={keys} />
                <EmbedOriginManager origins={origins} />
            </div>
        </>
    );
}
