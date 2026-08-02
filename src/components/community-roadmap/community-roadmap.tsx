'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { useEscapeClose } from '@/hooks/use-escape-close';
import type {
    RoadmapDashboard,
    RoadmapIdea,
    RoadmapModerationIdea,
    RoadmapStage,
    RoadmapSubmission,
} from '@/lib/api/types';

const stages: Array<{
    id: RoadmapStage;
    title: string;
    description: string;
    accent: string;
}> = [
    {
        id: 'backlog',
        title: 'Backlog',
        description: 'Boas ideias esperando seu momento.',
        accent: 'bg-[#9a91b6]',
    },
    {
        id: 'planned',
        title: 'Planejado',
        description: 'Já entrou nos nossos próximos passos.',
        accent: 'bg-[#8f7af5]',
    },
    {
        id: 'in_progress',
        title: 'Em desenvolvimento',
        description: 'Mãos à obra: estamos construindo.',
        accent: 'bg-[#5d63d8]',
    },
    {
        id: 'completed',
        title: 'Entregue',
        description: 'Saiu do quadro e chegou ao seu Astro.',
        accent: 'bg-[#2d9a73]',
    },
];

type EditorTarget =
    { kind: 'queue'; idea: RoadmapModerationIdea } | { kind: 'published'; idea: RoadmapIdea };

export function CommunityRoadmap({
    roadmap,
    adminMode = false,
}: {
    roadmap: RoadmapDashboard;
    adminMode?: boolean;
}) {
    const router = useRouter();
    const [board, setBoard] = useState(roadmap.board);
    const [suggestionOpen, setSuggestionOpen] = useState(false);
    const [editor, setEditor] = useState<EditorTarget | null>(null);
    const [submissionEditor, setSubmissionEditor] = useState<RoadmapSubmission | null>(null);
    const [activeTab, setActiveTab] = useState<'roadmap' | 'mine' | 'moderation'>(
        adminMode && roadmap.moderationQueue.length > 0 ? 'moderation' : 'roadmap',
    );
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropStage, setDropStage] = useState<RoadmapStage | null>(null);
    const [pending, setPending] = useState(false);
    const [movingId, setMovingId] = useState<string | null>(null);
    const [likingIds, setLikingIds] = useState<Set<string>>(() => new Set());
    const [message, setMessage] = useState<{
        tone: 'success' | 'error';
        text: string;
    } | null>(null);
    const canManageBoard = adminMode && roadmap.canModerate;

    useEffect(() => {
        if (!message) return;
        const timeout = window.setTimeout(() => setMessage(null), 4_500);
        return () => window.clearTimeout(timeout);
    }, [message]);

    useEscapeClose(suggestionOpen || Boolean(editor) || Boolean(submissionEditor), () => {
        if (!pending) {
            setSuggestionOpen(false);
            setEditor(null);
            setSubmissionEditor(null);
        }
    });

    const grouped = useMemo(
        () =>
            Object.fromEntries(
                stages.map((stage) => [
                    stage.id,
                    board
                        .filter((idea) => idea.stage === stage.id)
                        .sort((a, b) => b.likesCount - a.likesCount || a.position - b.position),
                ]),
            ) as Record<RoadmapStage, RoadmapIdea[]>,
        [board],
    );

    async function moveIdea(id: string, stage: RoadmapStage) {
        if (!canManageBoard) return;
        const idea = board.find((candidate) => candidate.id === id);
        if (!idea || idea.stage === stage || movingId) return;

        const previous = board;
        setMovingId(id);
        setBoard((current) =>
            current.map((candidate) => (candidate.id === id ? { ...candidate, stage } : candidate)),
        );
        try {
            const response = await fetch(`/api/community-roadmap/${encodeURIComponent(id)}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage, version: idea.version }),
            });
            const payload = (await response.json()) as {
                data?: RoadmapIdea;
                detail?: string;
            };
            if (!response.ok || !payload.data)
                throw new Error(payload.detail ?? 'Não foi possível mover a sugestão.');
            setBoard((current) =>
                current.map((candidate) => (candidate.id === id ? payload.data! : candidate)),
            );
            router.refresh();
        } catch (error) {
            setBoard(previous);
            setMessage({
                tone: 'error',
                text: error instanceof Error ? error.message : 'Não foi possível mover a sugestão.',
            });
        } finally {
            setMovingId(null);
            setDraggingId(null);
            setDropStage(null);
        }
    }

    async function toggleLike(id: string) {
        if (likingIds.has(id)) return;
        const idea = board.find((candidate) => candidate.id === id);
        if (!idea) return;

        const previous = board;
        const likedByMe = !idea.likedByMe;
        setLikingIds((current) => new Set(current).add(id));
        setBoard((current) =>
            current.map((candidate) =>
                candidate.id === id
                    ? {
                          ...candidate,
                          likedByMe,
                          likesCount: Math.max(0, candidate.likesCount + (likedByMe ? 1 : -1)),
                      }
                    : candidate,
            ),
        );

        try {
            const response = await fetch(`/api/community-roadmap/${encodeURIComponent(id)}/like`, {
                method: 'POST',
            });
            const payload = (await response.json()) as {
                data?: { id: string; likesCount: number; likedByMe: boolean };
                detail?: string;
            };
            if (!response.ok || !payload.data)
                throw new Error(payload.detail ?? 'Não foi possível registrar sua curtida.');
            setBoard((current) =>
                current.map((candidate) =>
                    candidate.id === id
                        ? {
                              ...candidate,
                              likesCount: payload.data!.likesCount,
                              likedByMe: payload.data!.likedByMe,
                          }
                        : candidate,
                ),
            );
        } catch (error) {
            setBoard(previous);
            setMessage({
                tone: 'error',
                text:
                    error instanceof Error
                        ? error.message
                        : 'Não foi possível registrar sua curtida.',
            });
        } finally {
            setLikingIds((current) => {
                const next = new Set(current);
                next.delete(id);
                return next;
            });
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-xl border border-border bg-surface-muted/70 p-1">
                    {adminMode && (
                        <Button
                            type="button"
                            onClick={() => setActiveTab('moderation')}
                            className={`h-9 rounded-lg px-3.5 text-[11px] font-semibold transition ${
                                activeTab === 'moderation'
                                    ? 'bg-surface text-foreground shadow-sm'
                                    : 'text-muted hover:text-foreground'
                            }`}
                        >
                            Ideias para aprovar
                            <span
                                className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] ${
                                    roadmap.moderationQueue.length > 0
                                        ? 'bg-warning/12 text-warning'
                                        : 'text-muted'
                                }`}
                            >
                                {roadmap.moderationQueue.length}
                            </span>
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={() => setActiveTab('roadmap')}
                        className={`h-9 rounded-lg px-3.5 text-[11px] font-semibold transition ${
                            activeTab === 'roadmap'
                                ? 'bg-surface text-foreground shadow-sm'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {adminMode ? 'Quadro público' : 'Roadmap'}
                        <span className="ml-2 text-[9px] text-muted">{board.length}</span>
                    </Button>
                    {!adminMode && (
                        <Button
                            type="button"
                            onClick={() => setActiveTab('mine')}
                            className={`h-9 rounded-lg px-3.5 text-[11px] font-semibold transition ${
                                activeTab === 'mine'
                                    ? 'bg-surface text-foreground shadow-sm'
                                    : 'text-muted hover:text-foreground'
                            }`}
                        >
                            Minhas sugestões
                            <span className="ml-2 text-[9px] text-muted">
                                {roadmap.mySubmissions.length}
                            </span>
                        </Button>
                    )}
                </div>
                <Button
                    variant="primary"
                    className="shrink-0"
                    onClick={() => {
                        setSuggestionOpen(true);
                    }}
                >
                    <Icon name="plus" className="size-4" />
                    {adminMode ? 'Criar ideia do Astro' : 'Compartilhar uma ideia'}
                </Button>
            </div>

            {activeTab === 'roadmap' ? (
                <section>
                    <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-4">
                        {stages.map((stage) => (
                            <section
                                key={stage.id}
                                onDragOver={(event) => {
                                    if (!canManageBoard) return;
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                    setDropStage(stage.id);
                                }}
                                onDragLeave={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget as Node))
                                        setDropStage(null);
                                }}
                                onDrop={(event) => {
                                    if (!canManageBoard) return;
                                    event.preventDefault();
                                    const id =
                                        event.dataTransfer.getData('text/roadmap-idea') ||
                                        draggingId;
                                    if (id) void moveIdea(id, stage.id);
                                }}
                                className={`flex h-[clamp(520px,calc(100vh-230px),720px)] min-w-0 flex-col overflow-hidden rounded-[24px] border p-3 transition ${
                                    dropStage === stage.id
                                        ? 'border-brand/45 bg-brand-soft/50 shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--brand)_8%,transparent)]'
                                        : 'border-border bg-surface-muted/45'
                                }`}
                            >
                                <header className="shrink-0 px-1 pb-3 pt-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className={`size-2 rounded-full ${stage.accent}`}
                                            />
                                            <h2 className="text-[13px] font-semibold">
                                                {stage.title}
                                            </h2>
                                        </div>
                                        <span className="grid min-w-6 place-items-center rounded-full bg-surface px-2 py-1 text-[10px] font-semibold text-muted">
                                            {grouped[stage.id].length}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-[11px] leading-4 text-muted">
                                        {stage.description}
                                    </p>
                                </header>

                                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 [scrollbar-color:color-mix(in_srgb,var(--brand)_18%,transparent)_transparent] [scrollbar-width:thin]">
                                    {grouped[stage.id].map((idea) => (
                                        <RoadmapCard
                                            key={idea.id}
                                            idea={idea}
                                            canModerate={canManageBoard}
                                            moving={movingId === idea.id}
                                            liking={likingIds.has(idea.id)}
                                            dragging={draggingId === idea.id}
                                            onDragStart={(event) => {
                                                setDraggingId(idea.id);
                                                event.dataTransfer.effectAllowed = 'move';
                                                event.dataTransfer.setData(
                                                    'text/roadmap-idea',
                                                    idea.id,
                                                );
                                            }}
                                            onDragEnd={() => {
                                                setDraggingId(null);
                                                setDropStage(null);
                                            }}
                                            onEdit={() => setEditor({ kind: 'published', idea })}
                                            onLike={() => void toggleLike(idea.id)}
                                        />
                                    ))}
                                    {grouped[stage.id].length === 0 && (
                                        <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-border bg-surface/35 px-5 text-center text-[11px] leading-4 text-muted">
                                            {canManageBoard && draggingId
                                                ? `Solte aqui para mover para ${stage.title.toLowerCase()}.`
                                                : 'Nenhuma ideia nesta etapa ainda.'}
                                        </div>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                </section>
            ) : activeTab === 'mine' ? (
                <MySuggestions ideas={roadmap.mySubmissions} onEdit={setSubmissionEditor} />
            ) : (
                <ModerationQueue
                    ideas={roadmap.moderationQueue}
                    onReview={(idea) => setEditor({ kind: 'queue', idea })}
                />
            )}

            {message &&
                createPortal(
                    <RoadmapToast message={message} onClose={() => setMessage(null)} />,
                    document.body,
                )}

            {suggestionOpen &&
                createPortal(
                    <SuggestionModal
                        pending={pending}
                        adminCreate={adminMode}
                        onClose={() => setSuggestionOpen(false)}
                        onSubmit={async (form) => {
                            setPending(true);
                            setMessage(null);
                            try {
                                const response = await fetch(
                                    adminMode
                                        ? '/api/community-roadmap/admin'
                                        : '/api/community-roadmap',
                                    {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(form),
                                    },
                                );
                                const payload = (await response.json()) as {
                                    data?: RoadmapIdea;
                                    detail?: string;
                                };
                                if (!response.ok)
                                    throw new Error(
                                        payload.detail ?? 'Não foi possível enviar sua sugestão.',
                                    );
                                setSuggestionOpen(false);
                                if (adminMode && payload.data)
                                    setBoard((current) => [...current, payload.data!]);
                                setMessage({
                                    tone: 'success',
                                    text: adminMode
                                        ? 'Ideia publicada no Backlog do roadmap.'
                                        : 'Sugestão enviada. A equipe do Astro vai analisá-la antes da publicação.',
                                });
                                router.refresh();
                            } catch (error) {
                                setMessage({
                                    tone: 'error',
                                    text:
                                        error instanceof Error
                                            ? error.message
                                            : 'Não foi possível enviar sua sugestão.',
                                });
                            } finally {
                                setPending(false);
                            }
                        }}
                    />,
                    document.body,
                )}

            {submissionEditor &&
                createPortal(
                    <SuggestionModal
                        pending={pending}
                        editing
                        initial={submissionEditor}
                        onClose={() => setSubmissionEditor(null)}
                        onSubmit={async (form) => {
                            setPending(true);
                            try {
                                const response = await fetch(
                                    `/api/community-roadmap/${encodeURIComponent(submissionEditor.id)}`,
                                    {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            ...form,
                                            version: submissionEditor.version,
                                        }),
                                    },
                                );
                                const payload = (await response.json()) as { detail?: string };
                                if (!response.ok)
                                    throw new Error(
                                        payload.detail ?? 'Não foi possível editar sua sugestão.',
                                    );
                                setSubmissionEditor(null);
                                setMessage({
                                    tone: 'success',
                                    text: 'Sua sugestão foi atualizada.',
                                });
                                router.refresh();
                            } catch (error) {
                                setMessage({
                                    tone: 'error',
                                    text:
                                        error instanceof Error
                                            ? error.message
                                            : 'Não foi possível editar sua sugestão.',
                                });
                            } finally {
                                setPending(false);
                            }
                        }}
                    />,
                    document.body,
                )}

            {editor &&
                createPortal(
                    <ModerationModal
                        target={editor}
                        pending={pending}
                        forceBacklog={adminMode && editor.kind === 'queue'}
                        onClose={() => setEditor(null)}
                        onSubmit={async (input) => {
                            setPending(true);
                            setMessage(null);
                            try {
                                const response = await fetch(
                                    `/api/community-roadmap/${encodeURIComponent(editor.idea.id)}/moderate`,
                                    {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            ...input,
                                            version: editor.idea.version,
                                        }),
                                    },
                                );
                                const payload = (await response.json()) as {
                                    data?: RoadmapIdea;
                                    detail?: string;
                                };
                                if (!response.ok || !payload.data)
                                    throw new Error(
                                        payload.detail ?? 'Não foi possível salvar a moderação.',
                                    );
                                setBoard((current) => {
                                    if (input.moderationStatus === 'rejected')
                                        return current.filter((idea) => idea.id !== editor.idea.id);
                                    const exists = current.some(
                                        (idea) => idea.id === editor.idea.id,
                                    );
                                    return exists
                                        ? current.map((idea) =>
                                              idea.id === editor.idea.id ? payload.data! : idea,
                                          )
                                        : [...current, payload.data!];
                                });
                                setEditor(null);
                                setMessage({
                                    tone: 'success',
                                    text:
                                        input.moderationStatus === 'approved'
                                            ? 'Sugestão publicada no roadmap.'
                                            : 'Sugestão marcada como não aprovada.',
                                });
                                router.refresh();
                            } catch (error) {
                                setMessage({
                                    tone: 'error',
                                    text:
                                        error instanceof Error
                                            ? error.message
                                            : 'Não foi possível salvar a moderação.',
                                });
                            } finally {
                                setPending(false);
                            }
                        }}
                    />,
                    document.body,
                )}
        </div>
    );
}

function ModerationQueue({
    ideas,
    onReview,
}: {
    ideas: RoadmapModerationIdea[];
    onReview: (idea: RoadmapModerationIdea) => void;
}) {
    return (
        <section id="moderacao" className="glass-panel overflow-hidden rounded-[26px]">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-strong">
                        Curadoria da comunidade
                    </p>
                    <h2 className="mt-1.5 text-[17px] font-semibold tracking-[-0.025em]">
                        Ideias aguardando sua decisão
                    </h2>
                    <p className="mt-1 text-[11px] leading-5 text-muted">
                        Revise, ajuste o texto e aprove. Toda ideia aprovada entra primeiro no
                        Backlog.
                    </p>
                </div>
                <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                        ideas.length > 0
                            ? 'bg-warning/12 text-warning'
                            : 'bg-success/10 text-success'
                    }`}
                >
                    {ideas.length > 0 ? `${ideas.length} pendentes` : 'Fila em dia'}
                </span>
            </div>
            {ideas.length === 0 ? (
                <div className="grid min-h-[330px] place-items-center px-6 text-center">
                    <div className="max-w-sm">
                        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-success/10 text-success">
                            <Icon name="check" className="size-5" />
                        </span>
                        <h3 className="mt-4 text-[14px] font-semibold">
                            Nenhuma ideia esperando análise
                        </h3>
                        <p className="mt-1.5 text-[11px] leading-5 text-muted">
                            Quando um cliente enviar uma sugestão, ela aparecerá aqui antes de
                            chegar ao quadro público.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2 2xl:grid-cols-3">
                    {ideas.map((idea) => (
                        <article
                            key={idea.id}
                            className="group flex min-h-52 flex-col rounded-[20px] border border-border bg-surface/72 p-4 transition hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-[0_14px_35px_rgba(55,45,110,.07)]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="rounded-full bg-warning/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.06em] text-warning">
                                    Aguardando análise
                                </span>
                                <time className="text-[9px] text-muted">
                                    {new Intl.DateTimeFormat('pt-BR', {
                                        dateStyle: 'short',
                                    }).format(new Date(idea.createdAt))}
                                </time>
                            </div>
                            <h3 className="mt-3 line-clamp-2 text-[13px] font-semibold leading-5">
                                {idea.submittedTitle}
                            </h3>
                            <p className="mt-1.5 line-clamp-3 text-[11px] leading-5 text-muted">
                                {idea.submittedDescription}
                            </p>
                            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                                <div className="min-w-0">
                                    <p className="truncate text-[10px] font-semibold">
                                        {idea.submitterName}
                                    </p>
                                    <p className="mt-0.5 truncate text-[9px] text-muted">
                                        {idea.organizationName}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="shrink-0"
                                    onClick={() => onReview(idea)}
                                >
                                    Revisar
                                    <Icon name="arrow-right" className="size-3" />
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function RoadmapCard({
    idea,
    canModerate,
    moving,
    liking,
    dragging,
    onDragStart,
    onDragEnd,
    onEdit,
    onLike,
}: {
    idea: RoadmapIdea;
    canModerate: boolean;
    moving: boolean;
    liking: boolean;
    dragging: boolean;
    onDragStart: React.DragEventHandler<HTMLElement>;
    onDragEnd: React.DragEventHandler<HTMLElement>;
    onEdit: () => void;
    onLike: () => void;
}) {
    return (
        <article
            draggable={canModerate && !moving}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`group rounded-[18px] border border-border bg-surface p-4 shadow-[0_8px_22px_rgba(45,40,85,.04)] transition ${
                canModerate ? 'cursor-grab active:cursor-grabbing' : ''
            } ${dragging ? 'scale-[.98] opacity-45' : 'hover:-translate-y-0.5 hover:border-brand/18'} ${
                moving ? 'animate-pulse opacity-60' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-[13px] font-semibold leading-5 tracking-[-0.01em]">
                    {idea.title}
                </h3>
                {canModerate && (
                    <Button
                        type="button"
                        aria-label={`Editar ${idea.title}`}
                        onClick={onEdit}
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-brand-soft hover:text-brand-strong group-hover:opacity-100 focus:opacity-100"
                    >
                        <Icon name="edit" className="size-3.5" />
                    </Button>
                )}
            </div>
            <p className="mt-2 line-clamp-4 text-[11px] leading-[1.65] text-muted">
                {idea.description}
            </p>
            <div className="mt-3 flex min-h-8 items-center justify-between gap-3 border-t border-border/70 pt-2.5">
                {idea.adminEdited ? (
                    <p className="text-[9px] font-medium text-muted/75">
                        Lapidada com carinho pela equipe Astro
                    </p>
                ) : (
                    <span />
                )}
                <Button
                    type="button"
                    aria-label={
                        idea.likedByMe ? `Remover apoio de ${idea.title}` : `Apoiar ${idea.title}`
                    }
                    aria-pressed={idea.likedByMe}
                    disabled={liking}
                    onClick={onLike}
                    className={`relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[10px] font-semibold transition ${
                        idea.likedByMe
                            ? 'roadmap-like-active bg-[#fff0f2] text-[#e1435a]'
                            : 'bg-surface-muted/70 text-muted hover:bg-[#fff3f4] hover:text-[#d9485f]'
                    } disabled:cursor-wait`}
                >
                    <Icon
                        name="heart"
                        filled={idea.likedByMe}
                        className={`size-3.5 ${idea.likedByMe ? 'roadmap-heart-liked' : ''}`}
                    />
                    <span>{idea.likesCount}</span>
                </Button>
            </div>
        </article>
    );
}

function RoadmapToast({
    message,
    onClose,
}: {
    message: { tone: 'success' | 'error'; text: string };
    onClose: () => void;
}) {
    const success = message.tone === 'success';
    return (
        <div
            role={success ? 'status' : 'alert'}
            aria-live={success ? 'polite' : 'assertive'}
            className="roadmap-toast fixed right-4 top-4 z-[160] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-[0_22px_60px_rgba(31,27,60,.2)] backdrop-blur-xl sm:right-6 sm:top-6"
        >
            <div className="flex items-start gap-3.5 p-4 pr-3">
                <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                        success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}
                >
                    <Icon name={success ? 'check' : 'close'} className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[12px] font-semibold">
                        {success ? 'Tudo certo' : 'Não foi possível concluir'}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">{message.text}</p>
                </div>
                <Button
                    type="button"
                    aria-label="Fechar aviso"
                    onClick={onClose}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name="close" className="size-3.5" />
                </Button>
            </div>
            <span
                className={`roadmap-toast-progress block h-0.5 origin-left ${
                    success ? 'bg-success' : 'bg-danger'
                }`}
            />
        </div>
    );
}

function MySuggestions({
    ideas,
    onEdit,
}: {
    ideas: RoadmapSubmission[];
    onEdit: (idea: RoadmapSubmission) => void;
}) {
    if (ideas.length === 0) {
        return (
            <section className="grid min-h-[420px] place-items-center rounded-[26px] border border-dashed border-border bg-surface-muted/35 p-8 text-center">
                <div className="max-w-sm">
                    <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                        <Icon name="edit" className="size-5" />
                    </span>
                    <h2 className="mt-4 text-[15px] font-semibold">
                        Você ainda não enviou sugestões
                    </h2>
                    <p className="mt-1.5 text-[12px] leading-5 text-muted">
                        Quando você compartilhar uma ideia, o andamento da análise aparecerá aqui.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="overflow-hidden rounded-[24px] border border-border bg-surface/55">
            <div className="border-b border-border px-5 py-4">
                <h2 className="text-[14px] font-semibold">Minhas sugestões</h2>
                <p className="mt-1 text-[11px] text-muted">
                    Sugestões em análise ainda podem ser editadas.
                </p>
            </div>
            <div className="divide-y divide-border">
                {ideas.map((idea) => {
                    const editable = idea.moderationStatus === 'pending';
                    return (
                        <div
                            key={idea.id}
                            className="flex flex-col gap-4 px-5 py-4 transition hover:bg-surface-muted/30 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[13px] font-semibold">{idea.title}</p>
                                    <SubmissionStatus status={idea.moderationStatus} />
                                </div>
                                <p className="mt-1.5 line-clamp-2 max-w-3xl text-[11px] leading-5 text-muted">
                                    {idea.description}
                                </p>
                            </div>
                            {editable && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => onEdit(idea)}
                                    className="h-9 shrink-0 self-start px-3 sm:self-center"
                                >
                                    <Icon name="edit" className="size-3.5" />
                                    Editar
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function SubmissionStatus({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
    const content = {
        pending: {
            label: 'Em análise',
            className: 'bg-brand-soft text-brand-strong',
        },
        approved: {
            label: 'Publicado',
            className: 'bg-success/10 text-success',
        },
        rejected: {
            label: 'Não aprovado',
            className: 'bg-surface-muted text-muted',
        },
    }[status];
    return (
        <span
            className={`shrink-0 self-start rounded-full px-3 py-1.5 text-[10px] font-semibold sm:self-center ${content.className}`}
        >
            {content.label}
        </span>
    );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/25 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            {children}
        </div>
    );
}

function ModalHeader({
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
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">{title}</h2>
                <p className="mt-1.5 max-w-lg text-[12px] leading-5 text-muted">{description}</p>
            </div>
            <Button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface/70 text-muted transition hover:bg-surface hover:text-foreground"
            >
                <Icon name="close" className="size-4" />
            </Button>
        </div>
    );
}

function SuggestionModal({
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
    initial?: Pick<RoadmapSubmission, 'title' | 'description'>;
    onClose: () => void;
    onSubmit: (value: { title: string; description: string }) => Promise<void>;
}) {
    return (
        <ModalShell onClose={onClose}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    void onSubmit({
                        title: String(data.get('title') ?? '').trim(),
                        description: String(data.get('description') ?? '').trim(),
                    });
                }}
                className="theme-modal modal-surface glass-panel my-6 w-full max-w-xl rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"
            >
                <ModalHeader
                    eyebrow={
                        editing
                            ? 'Sugestão em análise'
                            : adminCreate
                              ? 'Publicação oficial'
                              : 'Sua voz no produto'
                    }
                    title={
                        editing
                            ? 'Editar sugestão'
                            : adminCreate
                              ? 'Criar ideia do Astro'
                              : 'Sugerir uma melhoria'
                    }
                    description={
                        editing
                            ? 'Você pode ajustar o texto enquanto a equipe ainda não concluiu a análise.'
                            : adminCreate
                              ? 'A ideia será publicada imediatamente na primeira coluna do quadro, em Backlog.'
                              : 'Tem algo que deixaria seu dia mais simples? Conte para a gente. Sua ideia pode ser a próxima melhoria do Astro.'
                    }
                    onClose={onClose}
                />
                <div className="mt-7 space-y-4">
                    <label className="block text-[12px] font-semibold">
                        Título
                        <input
                            name="title"
                            required
                            minLength={5}
                            maxLength={160}
                            autoFocus
                            defaultValue={initial?.title}
                            placeholder="Dê um nome claro para a sua ideia"
                            className="mt-2 h-12 w-full rounded-2xl border border-border bg-[var(--control-bg)] px-4 font-normal outline-none transition placeholder:text-muted/60 focus:border-brand/35 focus:ring-3 focus:ring-brand/8"
                        />
                    </label>
                    <label className="block text-[12px] font-semibold">
                        Descrição
                        <textarea
                            name="description"
                            required
                            minLength={20}
                            maxLength={3000}
                            defaultValue={initial?.description}
                            placeholder="Que problema ela resolve e como faria diferença no seu dia?"
                            className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-border bg-[var(--control-bg)] p-4 font-normal leading-6 outline-none transition placeholder:text-muted/60 focus:border-brand/35 focus:ring-3 focus:ring-brand/8"
                        />
                    </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={pending}>
                        {pending
                            ? 'Salvando...'
                            : editing
                              ? 'Salvar alterações'
                              : adminCreate
                                ? 'Publicar no Backlog'
                                : 'Colocar minha ideia no radar'}
                    </Button>
                </div>
            </form>
        </ModalShell>
    );
}

function ModerationModal({
    target,
    pending,
    forceBacklog = false,
    onClose,
    onSubmit,
}: {
    target: EditorTarget;
    pending: boolean;
    forceBacklog?: boolean;
    onClose: () => void;
    onSubmit: (value: {
        title: string;
        description: string;
        stage: RoadmapStage;
        moderationStatus: 'approved' | 'rejected';
    }) => Promise<void>;
}) {
    const [title, setTitle] = useState(target.idea.title);
    const [description, setDescription] = useState(target.idea.description);
    const [stage, setStage] = useState<RoadmapStage>(target.idea.stage);

    function values(moderationStatus: 'approved' | 'rejected') {
        return {
            title: title.trim(),
            description: description.trim(),
            stage: forceBacklog ? ('backlog' as const) : stage,
            moderationStatus,
        };
    }

    return (
        <ModalShell onClose={onClose}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void onSubmit(values('approved'));
                }}
                className="theme-modal modal-surface glass-panel my-6 w-full max-w-2xl rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"
            >
                <ModalHeader
                    eyebrow={target.kind === 'queue' ? 'Moderação' : 'Roadmap público'}
                    title={
                        target.kind === 'queue' ? 'Revisar sugestão' : 'Editar sugestão publicada'
                    }
                    description={
                        target.kind === 'queue'
                            ? `${target.idea.submitterName} · ${target.idea.organizationName}`
                            : 'A alteração ficará visível para toda a comunidade.'
                    }
                    onClose={onClose}
                />

                {target.kind === 'queue' && (
                    <div className="mt-6 rounded-2xl border border-border bg-surface-muted/55 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                            Texto original do cliente
                        </p>
                        <p className="mt-2 text-[12px] font-semibold">
                            {target.idea.submittedTitle}
                        </p>
                        <p className="mt-1.5 text-[11px] leading-5 text-muted">
                            {target.idea.submittedDescription}
                        </p>
                    </div>
                )}

                <div className="mt-5 space-y-4">
                    <label className="block text-[12px] font-semibold">
                        Título público
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            required
                            minLength={5}
                            maxLength={160}
                            className="mt-2 h-12 w-full rounded-2xl border border-border bg-[var(--control-bg)] px-4 font-normal outline-none transition focus:border-brand/35 focus:ring-3 focus:ring-brand/8"
                        />
                    </label>
                    <label className="block text-[12px] font-semibold">
                        Descrição pública
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            required
                            minLength={20}
                            maxLength={3000}
                            className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-border bg-[var(--control-bg)] p-4 font-normal leading-6 outline-none transition focus:border-brand/35 focus:ring-3 focus:ring-brand/8"
                        />
                    </label>
                    {forceBacklog ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-brand/12 bg-brand-soft/45 p-3.5">
                            <span className="size-2 rounded-full bg-[#9a91b6]" />
                            <div>
                                <p className="text-[11px] font-semibold">
                                    Destino após aprovação: Backlog
                                </p>
                                <p className="mt-0.5 text-[9px] text-muted">
                                    Depois você poderá mover a ideia pelo quadro.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <label className="block text-[12px] font-semibold">
                            Etapa
                            <div className="mt-2">
                                <CustomSelect
                                    name="stage"
                                    value={stage}
                                    onValueChange={(value) => setStage(value as RoadmapStage)}
                                    options={stages.map((item) => ({
                                        value: item.id,
                                        label: item.title,
                                    }))}
                                />
                            </div>
                        </label>
                    )}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    {target.kind === 'queue' ? (
                        <Button
                            type="button"
                            variant="danger"
                            disabled={
                                pending || title.trim().length < 5 || description.trim().length < 20
                            }
                            onClick={() => void onSubmit(values('rejected'))}
                        >
                            Não aprovar
                        </Button>
                    ) : (
                        <span />
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={pending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                pending || title.trim().length < 5 || description.trim().length < 20
                            }
                        >
                            {pending
                                ? 'Salvando...'
                                : target.kind === 'queue'
                                  ? 'Aprovar e publicar'
                                  : 'Salvar alterações'}
                        </Button>
                    </div>
                </div>
            </form>
        </ModalShell>
    );
}
