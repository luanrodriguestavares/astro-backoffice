import { FileLibrary } from '@/components/files/file-library';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { MediaFile, MediaFolder, StorageUsage } from '@/lib/api/types';

export default async function FilesPage() {
    let result:
        | {
              permissions: Awaited<ReturnType<typeof currentPermissions>>;
              files: MediaFile[];
              folders: MediaFolder[];
              storage: StorageUsage;
          }
        | undefined;
    try {
        const [permissions, files, folders, storage] = await Promise.all([
            currentPermissions(),
            apiFetch<MediaFile[]>('/api/v1/files'),
            apiFetch<MediaFolder[]>('/api/v1/files/folders'),
            apiFetch<StorageUsage>('/api/v1/files/storage'),
        ]);
        result = { permissions, files, folders, storage };
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.code === 'PLAN_FEATURE_UNAVAILABLE')
            return <FilesPlanRequired />;
        throw error;
    }
    return (
        <div className="astro-themed-page files-page">
            <PageHeader
                eyebrow="Conteúdo"
                title="Biblioteca de mídia"
                description="Organize e reutilize imagens e documentos da sua operação."
            />
            <div data-tour="page-primary">
                <FileLibrary
                    files={result.files}
                    folders={result.folders}
                    storage={result.storage}
                    canWrite={result.permissions.has('products.write')}
                />
            </div>
        </div>
    );
}

function FilesPlanRequired() {
    return (
        <div className="astro-themed-page files-page">
            <PageHeader
                eyebrow="Conteúdo"
                title="Biblioteca de mídia"
                description="Organize e reutilize imagens e documentos da sua operação."
            />
            <section
                data-tour="page-primary"
                className="glass-panel grid min-h-[420px] place-items-center rounded-[28px] p-8 text-center"
            >
                <div className="max-w-lg">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-brand/10 bg-brand-soft text-brand-strong">
                        <Icon name="folder" className="size-6" />
                    </span>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                        Assinatura necessária
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                        Escolha um plano para usar seus arquivos
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-muted">
                        Sua organização ainda não possui um plano contratado. Após confirmar o
                        pagamento, a biblioteca e o limite de armazenamento são liberados
                        automaticamente.
                    </p>
                    <ButtonLink href="/settings?view=plan" className="mt-6">
                        Ver planos
                        <Icon name="arrow-right" className="size-4" />
                    </ButtonLink>
                </div>
            </section>
        </div>
    );
}
