'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    type DragEvent,
    type ComponentProps,
    type FormEvent,
    type HTMLAttributes,
    type MouseEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { FileUploadAction } from '@/components/resources/create-actions';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { useEscapeClose } from '@/hooks/use-escape-close';
import type { MediaFile, MediaFolder, StorageUsage } from '@/lib/api/types';

type FileCategory = 'all' | 'image' | 'document';

type SortMode = 'newest' | 'oldest' | 'name' | 'size';

type FolderDialog =
    { mode: 'create'; parentId: string | null } | { mode: 'rename'; folder: MediaFolder };

type ContextTarget = { kind: 'file'; item: MediaFile } | { kind: 'folder'; item: MediaFolder };

type ContextMenu = ContextTarget & { x: number; y: number };

type DragPayload = { kind: 'file'; id: string } | { kind: 'folder'; id: string };

const dragMime = 'application/x-astro-media';

export function FileLibrary({
    files,
    folders,
    storage,
}: {
    files: MediaFile[];
    folders: MediaFolder[];
    storage: StorageUsage;
}) {
    const router = useRouter();
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<FileCategory>('all');
    const [sort, setSort] = useState<SortMode>('newest');
    const [preview, setPreview] = useState<MediaFile>();
    const [renameFile, setRenameFile] = useState<MediaFile>();
    const [deleteFile, setDeleteFile] = useState<MediaFile>();
    const [folderDialog, setFolderDialog] = useState<FolderDialog>();
    const [deleteFolder, setDeleteFolder] = useState<MediaFolder>();
    const [contextMenu, setContextMenu] = useState<ContextMenu>();
    const [dropTarget, setDropTarget] = useState<string | 'root'>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        const close = () => setContextMenu(undefined);
        window.addEventListener('click', close);
        window.addEventListener('blur', close);
        window.addEventListener('scroll', close, true);
        return () => {
            window.removeEventListener('click', close);
            window.removeEventListener('blur', close);
            window.removeEventListener('scroll', close, true);
        };
    }, []);

    const normalizedQuery = normalize(query);
    const currentFolder = folders.find((folder) => folder.id === currentFolderId);
    const breadcrumb = useMemo(
        () => folderBreadcrumb(folders, currentFolderId),
        [folders, currentFolderId],
    );
    const visibleFolders = useMemo(
        () =>
            folders
                .filter(
                    (folder) =>
                        folder.parentId === currentFolderId &&
                        (!normalizedQuery || normalize(folder.name).includes(normalizedQuery)),
                )
                .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
        [currentFolderId, folders, normalizedQuery],
    );
    const visibleFiles = useMemo(() => {
        return files
            .filter((file) => {
                const matchesLocation = normalizedQuery ? true : file.folderId === currentFolderId;
                const matchesQuery =
                    !normalizedQuery ||
                    normalize(
                        `${file.originalName} ${file.contentType} ${file.usages.map((usage) => usage.name).join(' ')}`,
                    ).includes(normalizedQuery);
                return (
                    matchesLocation &&
                    matchesQuery &&
                    (category === 'all' || fileCategory(file) === category)
                );
            })
            .sort((left, right) => {
                if (sort === 'name')
                    return left.originalName.localeCompare(right.originalName, 'pt-BR');
                if (sort === 'size') return right.sizeBytes - left.sizeBytes;
                const direction = sort === 'oldest' ? 1 : -1;
                return (
                    direction *
                    (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
                );
            });
    }, [category, currentFolderId, files, normalizedQuery, sort]);

    async function renameFileSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!renameFile) return;
        await mutate(
            `/api/files/${renameFile.id}`,
            'PATCH',
            {
                originalName: String(new FormData(event.currentTarget).get('name') ?? '').trim(),
            },
            () => setRenameFile(undefined),
        );
    }

    async function saveFolder(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!folderDialog) return;
        const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
        const endpoint =
            folderDialog.mode === 'create'
                ? '/api/files/folders'
                : `/api/files/folders/${folderDialog.folder.id}`;
        const payload =
            folderDialog.mode === 'create' ? { name, parentId: folderDialog.parentId } : { name };
        await mutate(endpoint, folderDialog.mode === 'create' ? 'POST' : 'PATCH', payload, () =>
            setFolderDialog(undefined),
        );
    }

    async function removeFile() {
        if (!deleteFile || deleteFile.usages.length) return;
        await mutate(`/api/files/${deleteFile.id}`, 'DELETE', undefined, () =>
            setDeleteFile(undefined),
        );
    }

    async function removeFolder() {
        if (!deleteFolder) return;
        await mutate(`/api/files/folders/${deleteFolder.id}`, 'DELETE', undefined, () => {
            if (currentFolderId === deleteFolder.id) setCurrentFolderId(null);
            setDeleteFolder(undefined);
        });
    }

    async function moveItem(payload: DragPayload, folderId: string | null) {
        if (payload.kind === 'folder' && payload.id === folderId) return;
        const endpoint =
            payload.kind === 'file'
                ? `/api/files/${payload.id}`
                : `/api/files/folders/${payload.id}`;
        setDropTarget(undefined);
        await mutate(endpoint, 'PATCH', {
            [payload.kind === 'file' ? 'folderId' : 'parentId']: folderId,
        });
    }

    async function mutate(
        endpoint: string,
        method: 'POST' | 'PATCH' | 'DELETE',
        payload?: Record<string, unknown>,
        success?: () => void,
    ) {
        setLoading(true);
        setError(undefined);
        const response = await fetch(endpoint, {
            method,
            ...(payload
                ? {
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify(payload),
                  }
                : {}),
        });
        const body = (await response.json()) as { detail?: string };
        setLoading(false);
        if (!response.ok) {
            setError(body.detail ?? 'Não foi possível concluir a operação.');
            return;
        }
        success?.();
        router.refresh();
    }

    function openContextMenu(event: MouseEvent, target: ContextTarget) {
        event.preventDefault();
        event.stopPropagation();
        const menuWidth = 210;
        const menuHeight = target.kind === 'folder' ? 190 : 210;
        setContextMenu({
            ...target,
            x: Math.min(event.clientX, window.innerWidth - menuWidth - 12),
            y: Math.min(event.clientY, window.innerHeight - menuHeight - 12),
        });
    }

    function closeDialogs() {
        if (loading) return;
        setPreview(undefined);
        setRenameFile(undefined);
        setDeleteFile(undefined);
        setFolderDialog(undefined);
        setDeleteFolder(undefined);
        setError(undefined);
    }

    function drop(event: DragEvent, folderId: string | null) {
        event.preventDefault();
        const payload = readDragPayload(event);
        if (payload) void moveItem(payload, folderId);
    }

    const storagePercent =
        storage.limitBytes > 0 ? Math.min(100, (storage.usedBytes / storage.limitBytes) * 100) : 0;

    return (
        <>
            <section className="glass-panel rounded-[24px] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                    <label className="relative min-w-0 flex-1">
                        <span className="sr-only">Buscar arquivos</span>
                        <Icon
                            name="search"
                            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                        />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar em toda a biblioteca..."
                            className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-4 text-[13px] outline-none transition placeholder:text-muted focus:border-brand/55 focus:shadow-[0_0_0_3px_rgba(109,93,244,.12)]"
                        />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2 xl:w-[390px]">
                        <CustomSelect
                            name="fileCategory"
                            value={category}
                            onValueChange={(value) => setCategory(value as FileCategory)}
                            options={[
                                { value: 'all', label: 'Todos os tipos' },
                                { value: 'image', label: 'Imagens' },
                                { value: 'document', label: 'Documentos' },
                            ]}
                        />
                        <CustomSelect
                            name="fileSort"
                            value={sort}
                            onValueChange={(value) => setSort(value as SortMode)}
                            options={[
                                { value: 'newest', label: 'Mais recentes' },
                                { value: 'oldest', label: 'Mais antigos' },
                                { value: 'name', label: 'Nome A–Z' },
                                { value: 'size', label: 'Maior tamanho' },
                            ]}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                setFolderDialog({
                                    mode: 'create',
                                    parentId: currentFolderId,
                                })
                            }
                        >
                            <Icon name="plus" className="size-3.5" />
                            Nova pasta
                        </Button>
                        <FileUploadAction folderId={currentFolderId} />
                    </div>
                </div>

                <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                        <div className="flex items-center justify-between gap-4 text-[11px]">
                            <span className="font-semibold">Armazenamento</span>
                            <span className="text-muted">
                                {formatBytes(storage.usedBytes)} de{' '}
                                {formatBytes(storage.limitBytes)}
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                            <div
                                className="h-full rounded-full bg-brand transition-[width]"
                                style={{ width: `${storagePercent}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-[11px] text-muted sm:max-w-64 sm:text-right">
                        Até 5 MB por arquivo · 100 pastas · imagens e documentos
                    </p>
                </div>
            </section>

            {error && (
                <p
                    role="alert"
                    className="mt-4 rounded-2xl border border-danger/20 bg-danger/5 p-3 text-[12px] text-danger"
                >
                    {error}
                </p>
            )}

            <div className="mt-5 grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
                <aside className="glass-panel h-fit rounded-[22px] p-3">
                    <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                        Pastas
                    </div>
                    <FolderTree
                        folders={folders}
                        currentId={currentFolderId}
                        dropTarget={dropTarget}
                        onSelect={setCurrentFolderId}
                        onContextMenu={openContextMenu}
                        onDragStart={startFolderDrag}
                        onDragEnter={setDropTarget}
                        onDragLeave={() => setDropTarget(undefined)}
                        onDrop={drop}
                    />
                </aside>

                <main className="min-w-0">
                    <nav
                        onDragOver={(event) => event.preventDefault()}
                        onDragEnter={() => setDropTarget('root')}
                        onDragLeave={() => setDropTarget(undefined)}
                        onDrop={(event) => drop(event, null)}
                        className={`flex min-h-11 flex-wrap items-center gap-1 rounded-xl border px-3 py-2 transition ${
                            dropTarget === 'root'
                                ? 'border-brand bg-brand-soft/60'
                                : 'border-border bg-[var(--control-bg)]'
                        }`}
                        aria-label="Navegação de pastas"
                    >
                        <button
                            type="button"
                            onClick={() => setCurrentFolderId(null)}
                            className="rounded-lg px-2 py-1 text-[12px] font-semibold text-muted transition hover:bg-brand-soft hover:text-brand-strong"
                        >
                            Biblioteca
                        </button>
                        {breadcrumb.map((folder) => (
                            <span key={folder.id} className="contents">
                                <span className="text-muted/55">/</span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    className="rounded-lg px-2 py-1 text-[12px] font-semibold transition hover:bg-brand-soft hover:text-brand-strong"
                                >
                                    {folder.name}
                                </button>
                            </span>
                        ))}
                    </nav>

                    <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-[15px] font-semibold">
                                {normalizedQuery
                                    ? 'Resultados da busca'
                                    : (currentFolder?.name ?? 'Todos os arquivos')}
                            </h2>
                            <p className="mt-1 text-[12px] text-muted">
                                {visibleFolders.length}{' '}
                                {visibleFolders.length === 1 ? 'pasta' : 'pastas'} ·{' '}
                                {visibleFiles.length}{' '}
                                {visibleFiles.length === 1 ? 'arquivo' : 'arquivos'}
                            </p>
                        </div>
                    </div>

                    {visibleFolders.length > 0 && !normalizedQuery && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleFolders.map((folder) => (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    itemCount={
                                        files.filter((file) => file.folderId === folder.id).length +
                                        folders.filter((child) => child.parentId === folder.id)
                                            .length
                                    }
                                    activeDrop={dropTarget === folder.id}
                                    onOpen={() => setCurrentFolderId(folder.id)}
                                    onContextMenu={(event) =>
                                        openContextMenu(event, { kind: 'folder', item: folder })
                                    }
                                    onDragStart={startFolderDrag}
                                    onDragEnter={() => setDropTarget(folder.id)}
                                    onDragLeave={() => setDropTarget(undefined)}
                                    onDrop={(event) => drop(event, folder.id)}
                                />
                            ))}
                        </div>
                    )}

                    {visibleFiles.length > 0 ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleFiles.map((file) => (
                                <FileCard
                                    key={file.id}
                                    file={file}
                                    folderName={
                                        normalizedQuery
                                            ? folders.find((folder) => folder.id === file.folderId)
                                                  ?.name
                                            : undefined
                                    }
                                    onPreview={() => setPreview(file)}
                                    onContextMenu={(event) =>
                                        openContextMenu(event, { kind: 'file', item: file })
                                    }
                                />
                            ))}
                        </div>
                    ) : visibleFolders.length === 0 ? (
                        <EmptyFolder hasSearch={Boolean(normalizedQuery)} />
                    ) : null}
                </main>
            </div>

            {contextMenu &&
                createPortal(
                    <ContextMenuView
                        menu={contextMenu}
                        onAction={(action) => {
                            const target = contextMenu;
                            setContextMenu(undefined);
                            if (target.kind === 'file') {
                                if (action === 'open') setPreview(target.item);
                                if (action === 'rename') setRenameFile(target.item);
                                if (action === 'delete') setDeleteFile(target.item);
                                if (action === 'download')
                                    window.location.assign(`${contentUrl(target.item)}?download=1`);
                            } else {
                                if (action === 'open') setCurrentFolderId(target.item.id);
                                if (action === 'rename')
                                    setFolderDialog({ mode: 'rename', folder: target.item });
                                if (action === 'new-folder') {
                                    setCurrentFolderId(target.item.id);
                                    setFolderDialog({
                                        mode: 'create',
                                        parentId: target.item.id,
                                    });
                                }
                                if (action === 'delete') setDeleteFolder(target.item);
                            }
                        }}
                    />,
                    document.body,
                )}
            {preview &&
                createPortal(
                    <PreviewDialog file={preview} onClose={closeDialogs} />,
                    document.body,
                )}
            {renameFile &&
                createPortal(
                    <NameDialog
                        eyebrow="Organização"
                        title="Renomear arquivo"
                        description="O conteúdo e os vínculos existentes serão preservados."
                        defaultValue={renameFile.originalName}
                        loading={loading}
                        error={error}
                        submitLabel="Salvar nome"
                        onSubmit={renameFileSubmit}
                        onClose={closeDialogs}
                    />,
                    document.body,
                )}
            {folderDialog &&
                createPortal(
                    <NameDialog
                        eyebrow="Pastas"
                        title={folderDialog.mode === 'create' ? 'Nova pasta' : 'Renomear pasta'}
                        description="Use nomes curtos para manter a biblioteca fácil de navegar."
                        defaultValue={
                            folderDialog.mode === 'rename' ? folderDialog.folder.name : ''
                        }
                        loading={loading}
                        error={error}
                        submitLabel={folderDialog.mode === 'create' ? 'Criar pasta' : 'Salvar nome'}
                        onSubmit={saveFolder}
                        onClose={closeDialogs}
                    />,
                    document.body,
                )}
            {deleteFile &&
                createPortal(
                    <DeleteFileDialog
                        file={deleteFile}
                        loading={loading}
                        error={error}
                        onConfirm={removeFile}
                        onClose={closeDialogs}
                    />,
                    document.body,
                )}
            {deleteFolder &&
                createPortal(
                    <DeleteFolderDialog
                        folder={deleteFolder}
                        loading={loading}
                        error={error}
                        onConfirm={removeFolder}
                        onClose={closeDialogs}
                    />,
                    document.body,
                )}
        </>
    );
}

function FolderTree({
    folders,
    currentId,
    dropTarget,
    onSelect,
    onContextMenu,
    onDragStart,
    onDragEnter,
    onDragLeave,
    onDrop,
}: {
    folders: MediaFolder[];
    currentId: string | null;
    dropTarget?: string | 'root';
    onSelect: (id: string | null) => void;
    onContextMenu: (event: MouseEvent, target: ContextTarget) => void;
    onDragStart: (event: DragEvent, folder: MediaFolder) => void;
    onDragEnter: (id: string | 'root') => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent, folderId: string | null) => void;
}) {
    return (
        <div className="space-y-0.5">
            <TreeRow
                label="Biblioteca"
                active={currentId === null}
                highlighted={dropTarget === 'root'}
                depth={0}
                onClick={() => onSelect(null)}
                onDragEnter={() => onDragEnter('root')}
                onDragLeave={onDragLeave}
                onDrop={(event) => onDrop(event, null)}
            />
            {folders
                .filter((folder) => folder.parentId === null)
                .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
                .map((folder) => (
                    <FolderTreeBranch
                        key={folder.id}
                        folder={folder}
                        folders={folders}
                        depth={1}
                        currentId={currentId}
                        dropTarget={dropTarget}
                        onSelect={onSelect}
                        onContextMenu={onContextMenu}
                        onDragStart={onDragStart}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    />
                ))}
        </div>
    );
}

function FolderTreeBranch({
    folder,
    folders,
    depth,
    currentId,
    dropTarget,
    onSelect,
    onContextMenu,
    onDragStart,
    onDragEnter,
    onDragLeave,
    onDrop,
}: {
    folder: MediaFolder;
    folders: MediaFolder[];
    depth: number;
    currentId: string | null;
    dropTarget?: string | 'root';
    onSelect: (id: string | null) => void;
    onContextMenu: (event: MouseEvent, target: ContextTarget) => void;
    onDragStart: (event: DragEvent, folder: MediaFolder) => void;
    onDragEnter: (id: string) => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent, folderId: string | null) => void;
}) {
    const children = folders
        .filter((candidate) => candidate.parentId === folder.id)
        .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
    return (
        <>
            <TreeRow
                label={folder.name}
                active={currentId === folder.id}
                highlighted={dropTarget === folder.id}
                depth={depth}
                draggable
                onClick={() => onSelect(folder.id)}
                onContextMenu={(event) => onContextMenu(event, { kind: 'folder', item: folder })}
                onDragStart={(event) => onDragStart(event, folder)}
                onDragEnter={() => onDragEnter(folder.id)}
                onDragLeave={onDragLeave}
                onDrop={(event) => onDrop(event, folder.id)}
            />
            {children.map((child) => (
                <FolderTreeBranch
                    key={child.id}
                    folder={child}
                    folders={folders}
                    depth={depth + 1}
                    currentId={currentId}
                    dropTarget={dropTarget}
                    onSelect={onSelect}
                    onContextMenu={onContextMenu}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                />
            ))}
        </>
    );
}

function TreeRow({
    label,
    active,
    highlighted,
    depth,
    ...events
}: {
    label: string;
    active: boolean;
    highlighted: boolean;
    depth: number;
} & HTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            {...events}
            onDragOver={(event) => event.preventDefault()}
            className={`flex h-9 w-full items-center gap-2 rounded-lg pr-2 text-left text-[12px] font-medium transition ${
                active
                    ? 'bg-brand-soft text-brand-strong'
                    : highlighted
                      ? 'bg-brand-soft/65 text-brand-strong'
                      : 'text-muted hover:bg-surface-muted hover:text-foreground'
            }`}
            style={{ paddingLeft: 8 + Math.min(depth, 8) * 12 }}
        >
            <Icon name="folder" className="size-3.5 shrink-0" />
            <span className="truncate">{label}</span>
        </button>
    );
}

function FolderCard({
    folder,
    itemCount,
    activeDrop,
    onOpen,
    onContextMenu,
    onDragStart,
    onDragEnter,
    onDragLeave,
    onDrop,
}: {
    folder: MediaFolder;
    itemCount: number;
    activeDrop: boolean;
    onOpen: () => void;
    onContextMenu: (event: MouseEvent) => void;
    onDragStart: (event: DragEvent, folder: MediaFolder) => void;
    onDragEnter: () => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent) => void;
}) {
    return (
        <button
            type="button"
            draggable
            onClick={onOpen}
            onContextMenu={onContextMenu}
            onDragStart={(event) => onDragStart(event, folder)}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`flex items-center gap-3 rounded-[18px] border p-3 text-left transition hover:-translate-y-0.5 ${
                activeDrop
                    ? 'border-brand bg-brand-soft/60'
                    : 'border-border bg-[var(--control-bg)] hover:border-brand/25'
            }`}
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon name="folder" className="size-5" />
            </span>
            <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{folder.name}</span>
                <span className="mt-1 block text-[11px] text-muted">
                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
            </span>
        </button>
    );
}

function FileCard({
    file,
    folderName,
    onPreview,
    onContextMenu,
}: {
    file: MediaFile;
    folderName?: string;
    onPreview: () => void;
    onContextMenu: (event: MouseEvent) => void;
}) {
    const image = fileCategory(file) === 'image';
    return (
        <article
            draggable
            onDragStart={(event) => startFileDrag(event, file)}
            onContextMenu={onContextMenu}
            className="glass-panel group overflow-hidden rounded-[22px] transition duration-300 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-[0_18px_48px_rgba(72,60,135,.10)]"
        >
            <button
                type="button"
                onClick={onPreview}
                className="relative block aspect-[16/10] w-full overflow-hidden bg-surface-muted text-left"
            >
                {image ? (
                    <Image
                        src={contentUrl(file)}
                        alt={file.originalName}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.025]"
                    />
                ) : (
                    <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-16 place-items-center rounded-[20px] border border-border bg-surface text-brand shadow-sm">
                            <Icon name="file" className="size-7" />
                        </span>
                    </span>
                )}
                <span className="absolute bottom-3 left-3 rounded-full border border-white/60 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md">
                    {extension(file.originalName) || typeLabel(file)}
                </span>
            </button>
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3
                            className="truncate text-[13px] font-semibold"
                            title={file.originalName}
                        >
                            {file.originalName}
                        </h3>
                        <p className="mt-1 text-[11px] text-muted">
                            {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                        </p>
                    </div>
                    <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                            file.usages.length
                                ? 'bg-brand-soft text-brand-strong'
                                : 'bg-surface-muted text-muted'
                        }`}
                    >
                        {file.usages.length ? `Em uso · ${file.usages.length}` : 'Livre'}
                    </span>
                </div>
                {folderName && (
                    <p className="mt-2 truncate text-[11px] text-muted">Pasta: {folderName}</p>
                )}
                <p className="mt-3 text-[11px] text-muted">
                    Arraste para mover · botão direito para ações
                </p>
            </div>
        </article>
    );
}

function ContextMenuView({
    menu,
    onAction,
}: {
    menu: ContextMenu;
    onAction: (action: 'open' | 'rename' | 'delete' | 'download' | 'new-folder') => void;
}) {
    return (
        <div
            className="fixed z-[180] w-[210px] rounded-xl border border-border bg-surface p-1.5 shadow-[0_18px_55px_rgba(15,15,28,.24)]"
            style={{ left: menu.x, top: menu.y }}
            onClick={(event) => event.stopPropagation()}
        >
            <ContextAction
                icon={menu.kind === 'folder' ? 'folder' : 'image'}
                onClick={() => onAction('open')}
            >
                {menu.kind === 'folder' ? 'Abrir pasta' : 'Visualizar'}
            </ContextAction>
            {menu.kind === 'folder' && (
                <ContextAction icon="plus" onClick={() => onAction('new-folder')}>
                    Nova subpasta
                </ContextAction>
            )}
            <ContextAction icon="edit" onClick={() => onAction('rename')}>
                Renomear
            </ContextAction>
            {menu.kind === 'file' && (
                <ContextAction icon="download" onClick={() => onAction('download')}>
                    Baixar
                </ContextAction>
            )}
            <div className="my-1 border-t border-border" />
            <ContextAction icon="trash" danger onClick={() => onAction('delete')}>
                Excluir
            </ContextAction>
        </div>
    );
}

function ContextAction({
    icon,
    danger,
    children,
    onClick,
}: {
    icon: ComponentProps<typeof Icon>['name'];
    danger?: boolean;
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[12px] font-medium transition ${
                danger ? 'text-danger hover:bg-danger/8' : 'text-foreground hover:bg-surface-muted'
            }`}
        >
            <Icon name={icon} className="size-3.5" />
            {children}
        </button>
    );
}

function PreviewDialog({ file, onClose }: { file: MediaFile; onClose: () => void }) {
    useEscapeClose(true, onClose);
    const category = fileCategory(file);
    const browserPreview =
        file.contentType === 'application/pdf' || file.contentType.startsWith('text/');
    return (
        <DialogSurface onClose={onClose} wide>
            <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                        Visualização
                    </p>
                    <h2 className="mt-2 truncate text-xl font-semibold">{file.originalName}</h2>
                    <p className="mt-1 text-[12px] text-muted">
                        {typeLabel(file)} · {formatBytes(file.sizeBytes)}
                    </p>
                </div>
                <Button type="button" variant="icon" onClick={onClose} aria-label="Fechar">
                    <Icon name="close" className="size-4" />
                </Button>
            </div>
            <div className="mt-5 overflow-hidden rounded-[20px] border border-border bg-surface-muted">
                {category === 'image' ? (
                    <div className="relative min-h-[55vh]">
                        <Image
                            src={contentUrl(file)}
                            alt={file.originalName}
                            fill
                            unoptimized
                            sizes="90vw"
                            className="object-contain"
                        />
                    </div>
                ) : browserPreview ? (
                    <iframe
                        title={file.originalName}
                        src={contentUrl(file)}
                        className="h-[65vh] w-full bg-white"
                    />
                ) : (
                    <div className="grid min-h-72 place-items-center text-center">
                        <div>
                            <Icon name="file" className="mx-auto size-10 text-brand" />
                            <p className="mt-3 text-[13px] text-muted">
                                Este documento precisa ser baixado para visualização.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {file.usages.length > 0 && (
                <div className="mt-5 rounded-2xl border border-border bg-surface-muted p-4">
                    <p className="text-[12px] font-semibold">Onde este arquivo é usado</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {file.usages.map((usage) => (
                            <Link
                                key={`${usage.type}-${usage.id}`}
                                href="/products"
                                className="rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-semibold text-brand-strong"
                            >
                                Produto · {usage.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            <div className="mt-5 flex justify-end">
                <a
                    href={`${contentUrl(file)}?download=1`}
                    className="glass-interactive inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-strong"
                >
                    <Icon name="download" className="size-4" />
                    Baixar arquivo
                </a>
            </div>
        </DialogSurface>
    );
}

function NameDialog({
    eyebrow,
    title,
    description,
    defaultValue,
    loading,
    error,
    submitLabel,
    onSubmit,
    onClose,
}: {
    eyebrow: string;
    title: string;
    description: string;
    defaultValue: string;
    loading: boolean;
    error?: string;
    submitLabel: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) {
    useEscapeClose(true, onClose);
    return (
        <DialogSurface onClose={onClose}>
            <form onSubmit={onSubmit}>
                <DialogHeader
                    eyebrow={eyebrow}
                    title={title}
                    description={description}
                    onClose={onClose}
                />
                <label className="mt-6 block text-[13px] font-semibold">
                    Nome
                    <input
                        name="name"
                        defaultValue={defaultValue}
                        required
                        autoFocus
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none focus:border-brand/60 focus:shadow-[0_0_0_3px_rgba(109,93,244,.12)]"
                    />
                </label>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" disabled={loading}>
                        {loading ? 'Salvando...' : submitLabel}
                    </Button>
                </div>
            </form>
        </DialogSurface>
    );
}

function DeleteFileDialog({
    file,
    loading,
    error,
    onConfirm,
    onClose,
}: {
    file: MediaFile;
    loading: boolean;
    error?: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    useEscapeClose(true, onClose);
    const inUse = file.usages.length > 0;
    return (
        <DialogSurface onClose={onClose}>
            <DialogHeader
                eyebrow="Biblioteca"
                title={inUse ? 'Arquivo em uso' : 'Excluir arquivo?'}
                description={
                    inUse
                        ? 'Remova este arquivo dos produtos abaixo antes de excluí-lo.'
                        : 'Esta ação remove o conteúdo armazenado e não pode ser desfeita.'
                }
                onClose={onClose}
            />
            <div className="mt-5 rounded-2xl border border-border bg-surface-muted p-4">
                <p className="truncate text-[13px] font-semibold">{file.originalName}</p>
                {inUse && (
                    <ul className="mt-3 space-y-2 text-[12px] text-muted">
                        {file.usages.map((usage) => (
                            <li key={usage.id}>Produto · {usage.name}</li>
                        ))}
                    </ul>
                )}
            </div>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                    {inUse ? 'Entendi' : 'Cancelar'}
                </Button>
                {!inUse && (
                    <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Excluindo...' : 'Excluir definitivamente'}
                    </Button>
                )}
            </div>
        </DialogSurface>
    );
}

function DeleteFolderDialog({
    folder,
    loading,
    error,
    onConfirm,
    onClose,
}: {
    folder: MediaFolder;
    loading: boolean;
    error?: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    useEscapeClose(true, onClose);
    return (
        <DialogSurface onClose={onClose}>
            <DialogHeader
                eyebrow="Pastas"
                title="Excluir pasta?"
                description="A pasta precisa estar vazia. Arquivos e subpastas nunca serão excluídos automaticamente."
                onClose={onClose}
            />
            <div className="mt-5 rounded-2xl border border-border bg-surface-muted p-4 text-[13px] font-semibold">
                {folder.name}
            </div>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
                    {loading ? 'Excluindo...' : 'Excluir pasta'}
                </Button>
            </div>
        </DialogSurface>
    );
}

function EmptyFolder({ hasSearch }: { hasSearch: boolean }) {
    return (
        <section className="glass-panel mt-4 grid min-h-72 place-items-center rounded-[26px] p-8 text-center">
            <div>
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                    <Icon name={hasSearch ? 'search' : 'folder'} className="size-5" />
                </span>
                <h2 className="mt-4 font-semibold">
                    {hasSearch ? 'Nenhum arquivo encontrado' : 'Esta pasta está vazia'}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-5 text-muted">
                    {hasSearch
                        ? 'Ajuste a busca ou os filtros para encontrar o conteúdo.'
                        : 'Envie uma imagem ou documento, ou arraste itens de outra pasta.'}
                </p>
            </div>
        </section>
    );
}

function DialogSurface({
    children,
    onClose,
    wide,
}: {
    children: ReactNode;
    onClose: () => void;
    wide?: boolean;
}) {
    return (
        <div
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
            className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#11111d]/45 p-4 backdrop-blur-sm"
        >
            <section
                className={`modal-surface glass-panel my-6 w-full rounded-[26px] p-5 sm:p-6 ${
                    wide ? 'max-w-5xl' : 'max-w-lg'
                }`}
            >
                {children}
            </section>
        </div>
    );
}

function DialogHeader({
    eyebrow,
    title,
    description,
    onClose,
}: {
    eyebrow: string;
    title: string;
    description: string;
    onClose: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-5">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                    {eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{title}</h2>
                <p className="mt-1.5 text-[13px] leading-5 text-muted">{description}</p>
            </div>
            <Button type="button" variant="icon" onClick={onClose} aria-label="Fechar">
                <Icon name="close" className="size-4" />
            </Button>
        </div>
    );
}

function ErrorMessage({ children }: { children: ReactNode }) {
    return (
        <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-[12px] text-danger">
            {children}
        </p>
    );
}

function startFolderDrag(event: DragEvent, folder: MediaFolder) {
    writeDragPayload(event, { kind: 'folder', id: folder.id });
}

function startFileDrag(event: DragEvent, file: MediaFile) {
    writeDragPayload(event, { kind: 'file', id: file.id });
}

function writeDragPayload(event: DragEvent, payload: DragPayload) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(dragMime, JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', payload.id);
}

function readDragPayload(event: DragEvent): DragPayload | undefined {
    try {
        const raw = event.dataTransfer.getData(dragMime);
        if (!raw) return undefined;
        const payload = JSON.parse(raw) as Partial<DragPayload>;
        if (
            (payload.kind === 'file' || payload.kind === 'folder') &&
            typeof payload.id === 'string'
        )
            return payload as DragPayload;
    } catch {
        return undefined;
    }
    return undefined;
}

function folderBreadcrumb(folders: MediaFolder[], currentId: string | null) {
    const byId = new Map(folders.map((folder) => [folder.id, folder]));
    const path: MediaFolder[] = [];
    let current = currentId ? byId.get(currentId) : undefined;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        path.unshift(current);
        current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return path;
}

function fileCategory(file: MediaFile): Exclude<FileCategory, 'all'> {
    return file.contentType.startsWith('image/') ? 'image' : 'document';
}

function typeLabel(file: MediaFile) {
    return fileCategory(file) === 'image' ? 'Imagem' : 'Documento';
}

function contentUrl(file: Pick<MediaFile, 'id'>) {
    return `/api/files/${encodeURIComponent(file.id)}/content`;
}

function extension(name: string) {
    return name.includes('.') ? name.split('.').at(-1)?.toUpperCase() : undefined;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', {
        maximumFractionDigits: 1,
    })} MB`;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
