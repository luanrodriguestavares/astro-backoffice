'use client';

import './suggestion-modal.css';

import { useState } from 'react';

import { SparkleIcon } from '@/components/ai/ai-chat';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { RoadmapCategory, RoadmapSubmission } from '@/lib/api/types';

/** Tipos de sugestão, na ordem dos chips do modal. */
export const roadmapCategories: ReadonlyArray<{
    id: RoadmapCategory;
    label: string;
    placeholder: string;
}> = [
    {
        id: 'improvement',
        label: 'Melhoria',
        placeholder: 'Explique o contexto e a melhoria que você gostaria de ver',
    },
    {
        id: 'problem',
        label: 'Problema',
        placeholder: 'Conte o que aconteceu, onde e o que você esperava que acontecesse',
    },
    {
        id: 'feature',
        label: 'Nova feature',
        placeholder: 'Descreva a funcionalidade e como ela faria diferença no seu dia',
    },
];

export function categoryLabel(category: RoadmapCategory | undefined) {
    return roadmapCategories.find((item) => item.id === (category ?? 'improvement'))!.label;
}

export function CategoryIcon({
    category,
    className = '',
}: {
    category: RoadmapCategory | undefined;
    className?: string;
}) {
    if (category === 'problem') return <Icon name="alert" className={className} />;
    if (category === 'feature') return <Icon name="box" className={className} />;
    // Melhoria: tendência de alta (não existe no conjunto de ícones).
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <path d="m3 17 6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
        </svg>
    );
}

export interface SuggestionValue {
    title: string;
    description: string;
    category: RoadmapCategory;
}

/**
 * "Compartilhe uma ideia com o Astro": o lojista escolhe o tipo (melhoria, problema ou nova
 * feature), dá um título e descreve. Também serve para editar uma sugestão em análise e, no
 * painel da plataforma, para publicar uma ideia oficial direto no Backlog.
 */
export function SuggestionModal({
    pending,
    editing = false,
    adminCreate = false,
    initial,
    onClose,
    onSubmit,
}: {
    pending: boolean;
    editing?: boolean;
    adminCreate?: boolean;
    initial?: Pick<RoadmapSubmission, 'title' | 'description' | 'category'>;
    onClose: () => void;
    onSubmit: (value: SuggestionValue) => Promise<void>;
}) {
    const [category, setCategory] = useState<RoadmapCategory>(initial?.category ?? 'improvement');
    const placeholder = roadmapCategories.find((item) => item.id === category)!.placeholder;

    const eyebrow = editing
        ? 'Sugestão em análise'
        : adminCreate
          ? 'Publicação oficial'
          : 'Sua voz no produto';
    const description = editing
        ? 'Você pode ajustar o texto enquanto a equipe ainda não concluiu a análise.'
        : adminCreate
          ? 'A ideia será publicada imediatamente na primeira coluna do quadro, em Backlog.'
          : 'Use este espaço para sugerir melhorias, relatar problemas ou pedir novas funcionalidades. Tudo isso ajuda a evoluir o Astro com base no que realmente importa para você.';

    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#111111]/25 p-4 ui-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    void onSubmit({
                        title: String(data.get('title') ?? '').trim(),
                        description: String(data.get('description') ?? '').trim(),
                        category,
                    });
                }}
                className="idea-modal theme-modal my-6 max-h-[calc(100dvh-2rem)] w-full max-w-[600px] overflow-y-auto overscroll-contain rounded-[28px] p-6 sm:p-8"
            >
                <Button
                    type="button"
                    aria-label="Fechar"
                    onClick={onClose}
                    className="idea-modal-close absolute right-5 top-5 grid size-10 place-items-center rounded-full border transition"
                >
                    <Icon name="close" className="size-4" />
                </Button>

                <div className="flex items-center gap-5 pr-12">
                    <span className="idea-modal-mark grid size-[60px] shrink-0 place-items-center rounded-[18px]">
                        <SparkleIcon className="size-7" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                            {eyebrow}
                        </p>
                        <h2 className="mt-1.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[30px]">
                            {editing ? (
                                'Editar sugestão'
                            ) : adminCreate ? (
                                'Criar ideia do Astro'
                            ) : (
                                <>
                                    Compartilhe uma ideia com o{' '}
                                    <span className="idea-modal-accent">Astro</span>
                                </>
                            )}
                        </h2>
                    </div>
                </div>
                <p className="mt-5 text-[13.5px] leading-[1.6] text-muted">{description}</p>

                <fieldset className="mt-6">
                    <legend className="sr-only">Tipo da sugestão</legend>
                    <div className="grid grid-cols-3 gap-2.5">
                        {roadmapCategories.map((item) => (
                            <label
                                key={item.id}
                                className="idea-modal-chip flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-2 text-[13px] font-semibold transition"
                                data-active={category === item.id}
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    value={item.id}
                                    checked={category === item.id}
                                    onChange={() => setCategory(item.id)}
                                    className="sr-only"
                                />
                                <CategoryIcon category={item.id} className="size-[18px] shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="mt-6 space-y-5">
                    <label className="block text-[13px] font-semibold">
                        Título
                        <input
                            name="title"
                            required
                            minLength={5}
                            maxLength={160}
                            autoFocus
                            defaultValue={initial?.title}
                            placeholder="Resuma sua sugestão em uma frase"
                            className="ui-control idea-modal-field mt-2 h-12 w-full rounded-2xl px-4 font-normal"
                        />
                    </label>
                    <label className="block text-[13px] font-semibold">
                        Descrição
                        <textarea
                            name="description"
                            required
                            minLength={20}
                            maxLength={3000}
                            defaultValue={initial?.description}
                            placeholder={placeholder}
                            className="ui-control idea-modal-field mt-2 min-h-28 w-full resize-y rounded-2xl px-4 py-3.5 font-normal leading-6"
                        />
                    </label>
                </div>
                <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        className="idea-modal-accent size-4 shrink-0"
                        aria-hidden
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 11v5M12 8h.01" />
                    </svg>
                    Quanto mais contexto você der, melhor conseguimos avaliar a ideia.
                </p>

                <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={pending}
                        className="h-12 rounded-full px-6"
                    >
                        Cancelar
                    </Button>
                    {/* `bg-brand` só tira o botão da regra global que acinzenta botões de modal no
                        tema escuro; a cor vem de .idea-modal-submit. */}
                    <Button
                        type="submit"
                        disabled={pending}
                        className="idea-modal-submit bg-brand inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-7 text-[13.5px] font-semibold transition disabled:opacity-50"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-[18px]"
                            aria-hidden
                        >
                            <path d="M21 3 10 14" />
                            <path d="m21 3-7 18-4-7-7-4 18-7Z" />
                        </svg>
                        {pending
                            ? 'Enviando...'
                            : editing
                              ? 'Salvar alterações'
                              : adminCreate
                                ? 'Publicar no Backlog'
                                : 'Enviar sugestão'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
