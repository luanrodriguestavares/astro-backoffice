import { FileLibrary } from '@/components/files/file-library';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { MediaFile, MediaFolder, StorageUsage } from '@/lib/api/types';

export default async function FilesPage() {
    const [files, folders, storage] = await Promise.all([
        apiFetch<MediaFile[]>('/api/v1/files'),
        apiFetch<MediaFolder[]>('/api/v1/files/folders'),
        apiFetch<StorageUsage>('/api/v1/files/storage'),
    ]);
    return (
        <div className="astro-themed-page files-page">
            <PageHeader
                eyebrow="Conteúdo"
                title="Biblioteca de mídia"
                description="Organize e reutilize imagens e documentos da sua operação."
            />
            <FileLibrary files={files} folders={folders} storage={storage} />
        </div>
    );
}
