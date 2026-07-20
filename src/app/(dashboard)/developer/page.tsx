import { ApiKeyCreateAction } from "@/components/resources/create-actions";
import { PageHeader } from "@/components/ui/page-header";
import { ResourceTable, date } from "@/components/ui/resource-table";
import { apiFetch } from "@/lib/api/server";
type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; rateLimitPerMinute: number; status: string; lastUsedAt: string | null };
export default async function DeveloperPage() { const keys = await apiFetch<ApiKey[]>("/api/v1/developer/api-keys"); return <><PageHeader eyebrow="Integrações" title="API e desenvolvedores" description="Gerencie chaves, escopos e limites de acesso à API." actions={<ApiKeyCreateAction />} /><ResourceTable rows={keys} empty="Nenhuma chave de API criada." columns={[{ label: "Nome", value: (row) => row.name }, { label: "Prefixo", value: (row) => row.prefix, mono: true }, { label: "Escopos", value: (row) => row.scopes.join(", ") }, { label: "Limite/min", value: (row) => row.rateLimitPerMinute }, { label: "Status", value: (row) => row.status }, { label: "Último uso", value: (row) => date(row.lastUsedAt) }]} /></>; }
