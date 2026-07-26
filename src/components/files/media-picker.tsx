'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useEscapeClose } from '@/hooks/use-escape-close';
import type { MediaFile } from '@/lib/api/types';

export function MediaPicker({
    open,
    files,
    value,
    onSelect,
    onClose,
}: {
    open: boolean;
    files: MediaFile[];
    value?: string | null;
    onSelect: (id: string) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState('');
    useEscapeClose(open, onClose);
    const images = useMemo(() => {
        const term = normalize(query);
        return files.filter(
            (file) =>
                file.contentType.startsWith('image/') &&
                (!term || normalize(file.originalName).includes(term)),
        );
    }, [files, query]);

    if (!open) return null;
    return createPortal(
        <div
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
            className="fixed inset-0 z-[140] grid place-items-center overflow-y-auto bg-[#11111d]/45 p-4 backdrop-blur-sm"
        >
            <section className="modal-surface glass-panel my-6 flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded-[28px] p-5 sm:p-6">
                <div className="flex shrink-0 items-start justify-between gap-5">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                            Biblioteca de mídia
                        </p>
                        <h2 className="mt-2 text-xl font-semibold">Escolher imagem</h2>
                        <p className="mt-1.5 text-[13px] text-muted">
                            Reutilize uma imagem que já foi enviada para o Astro.
                        </p>
                    </div>
                    <Button type="button" variant="icon" onClick={onClose} aria-label="Fechar">
                        <Icon name="close" className="size-4" />
                    </Button>
                </div>

                <label className="relative mt-5 block shrink-0">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar imagem..."
                        autoFocus
                        className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-10 pr-4 text-[13px] outline-none focus:border-brand/55 focus:shadow-[0_0_0_3px_rgba(109,93,244,.12)]"
                    />
                </label>

                <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                    {images.length ? (
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {images.map((file) => {
                                const selected = value === file.id;
                                return (
                                    <button
                                        key={file.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(file.id);
                                            onClose();
                                        }}
                                        className={`overflow-hidden rounded-[18px] border text-left transition hover:-translate-y-0.5 ${
                                            selected
                                                ? 'border-brand ring-2 ring-brand/15'
                                                : 'border-border hover:border-brand/30'
                                        }`}
                                    >
                                        <span className="relative block aspect-[4/3] bg-surface-muted">
                                            <Image
                                                src={`/api/files/${encodeURIComponent(file.id)}/content`}
                                                alt={file.originalName}
                                                fill
                                                unoptimized
                                                sizes="25vw"
                                                className="object-cover"
                                            />
                                            {selected && (
                                                <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-brand text-white shadow-lg">
                                                    <Icon name="check" className="size-3.5" />
                                                </span>
                                            )}
                                        </span>
                                        <span className="block truncate bg-surface px-3 py-2.5 text-[11px] font-semibold">
                                            {file.originalName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid min-h-64 place-items-center text-center">
                            <div>
                                <Icon name="image" className="mx-auto size-8 text-brand" />
                                <p className="mt-3 text-[13px] font-semibold">
                                    Nenhuma imagem encontrada
                                </p>
                                <p className="mt-1 text-[12px] text-muted">
                                    Envie uma nova imagem no formulário do produto.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>,
        document.body,
    );
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
