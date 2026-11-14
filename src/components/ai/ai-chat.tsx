'use client';

import './ai-assistant.css';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Icon, type IconName } from '@/components/ui/icon';

import { ASTER_NAME, AsterAvatar } from './aster';

/**
 * Chat de IA do Astro: conversa curta em que cada mensagem refina o pedido anterior. Cada envio
 * gera um resultado completo (checkout ou fluxo), mostrado como um cartão com prévia e a ação de
 * aplicar. Nada muda no produto até o lojista clicar em aplicar.
 */

export interface AiStatus {
    enabled: boolean;
    model: string;
    costs: Record<string, number>;
    credits: { limit: number | null; used: number; remaining: number | null } | null;
}

export type AiTask = 'checkout' | 'payment_flow';

export interface AiReply<Result> {
    id: string;
    /** O que a IA respondeu, como mensagem de conversa. */
    text: string;
    /** Há uma versão nova (checkout ou fluxo) para mostrar e aplicar. */
    hasResult: boolean;
    result: Result;
    remaining: number | null;
    /** Especialidade usada nesta resposta, para conversas que roteiam mais de um agente. */
    task?: AiTask;
}

/** Uma fala da conversa enviada à IA como contexto. */
export interface ConversationTurn {
    role: 'user' | 'assistant';
    text: string;
}

type Message<Result> =
    | { id: string; role: 'user'; text: string }
    | { id: string; role: 'assistant'; reply: AiReply<Result> }
    | { id: string; role: 'error'; text: string; retry: string };

export function AiChat<Result>({
    task,
    taskForRequest,
    title,
    subtitle,
    placeholder,
    suggestions,
    loadingSteps,
    generate,
    renderResult,
    maxLength,
    compact = false,
    storageKey,
}: {
    task: AiTask;
    /** Decide a especialidade a partir do pedido; ausente nos chats de propósito único. */
    taskForRequest?: (request: string) => AiTask;
    title: string;
    subtitle: string;
    placeholder: string;
    suggestions: readonly string[];
    loadingSteps: readonly string[];
    /**
     * Recebe o pedido acumulado da conversa (pedido inicial + ajustes) e a geração anterior,
     * para o ajuste partir dela.
     */
    generate(
        request: string,
        previousGenerationId: string | undefined,
        conversation: ConversationTurn[],
    ): Promise<AiReply<Result>>;
    renderResult(result: Result, reply: AiReply<Result>, latest: boolean): ReactNode;
    maxLength: number;
    /** Janela flutuante do assistente: margens menores e sugestões em uma coluna. */
    compact?: boolean;
    /** Guarda a conversa neste navegador (sobrevive a recarregar a página). */
    storageKey?: string;
}) {
    const [status, setStatus] = useState<AiStatus | null | 'error'>(null);
    const [messages, setMessages] = useState<Message<Result>[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const scroller = useRef<HTMLDivElement>(null);
    // Qual conversa salva já foi carregada; antes disso nada é gravado por cima dela.
    const [loadedKey, setLoadedKey] = useState<string | undefined>(undefined);

    // Conversa salva: carrega depois de montar (o servidor não tem acesso ao armazenamento).
    useEffect(() => {
        if (!storageKey) return;
        setMessages(readConversation<Result>(storageKey));
        setLoadedKey(storageKey);
    }, [storageKey]);

    useEffect(() => {
        if (!storageKey || loadedKey !== storageKey) return;
        writeConversation(storageKey, messages);
    }, [messages, storageKey, loadedKey]);
    const input = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        let active = true;
        void fetch('/api/ai/status')
            .then(async (response) => {
                const body = (await response.json()) as { data?: AiStatus };
                if (active) setStatus(response.ok && body.data ? body.data : 'error');
            })
            .catch(() => active && setStatus('error'));
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (!loading) return;
        setStep(0);
        const timer = window.setInterval(
            () => setStep((current) => Math.min(current + 1, loadingSteps.length - 1)),
            3200,
        );
        return () => window.clearInterval(timer);
    }, [loading, loadingSteps.length]);

    useEffect(() => {
        input.current?.focus();
    }, [status]);

    const activeTask = taskForRequest?.(draft) ?? task;
    const cost = status && status !== 'error' ? (status.costs[activeTask] ?? 0) : 0;
    const remaining =
        status && status !== 'error' ? (status.credits?.remaining ?? null) : null;
    const outOfCredits = remaining !== null && remaining < cost;
    const enabled = status !== null && status !== 'error' && status.enabled;

    /** Últimas falas da conversa (sem erros), para a IA responder com contexto. */
    function conversationTurns(): ConversationTurn[] {
        return messages
            .flatMap((message): ConversationTurn[] =>
                message.role === 'user'
                    ? [{ role: 'user', text: message.text }]
                    : message.role === 'assistant'
                      ? [{ role: 'assistant', text: replyText(message.reply) }]
                      : [],
            )
            .filter((turn) => turn.text.trim() !== '')
            .slice(-12)
            .map((turn) => ({ ...turn, text: turn.text.slice(0, 2000) }));
    }

    async function send(text: string) {
        const trimmed = text.trim();
        if (!trimmed || loading || !enabled) return;
        const request = trimmed.slice(0, maxLength);
        const requestedTask = taskForRequest?.(request) ?? task;
        const requestedCost = status.costs[requestedTask] ?? 0;
        if (remaining !== null && remaining < requestedCost) return;
        const conversation = conversationTurns();
        // O ajuste parte da última versão gerada (respostas só em texto não contam).
        const previous = [...messages]
            .reverse()
            .find(
                (message) =>
                    message.role === 'assistant' &&
                    message.reply.hasResult !== false &&
                    (taskForRequest === undefined || message.reply.task === requestedTask),
            );
        setMessages((current) => [
            ...current.filter((message) => message.role !== 'error'),
            { id: crypto.randomUUID(), role: 'user', text: trimmed },
        ]);
        setDraft('');
        setLoading(true);
        try {
            const generated = await generate(
                request,
                previous?.role === 'assistant' ? previous.reply.id : undefined,
                conversation,
            );
            const reply = { ...generated, task: generated.task ?? requestedTask };
            setMessages((current) => [
                ...current,
                { id: reply.id, role: 'assistant', reply },
            ]);
            setStatus((current) =>
                current !== null && current !== 'error' && current.credits !== null
                    ? { ...current, credits: { ...current.credits, remaining: reply.remaining } }
                    : current,
            );
        } catch (error) {
            setMessages((current) => [
                ...current.slice(0, -1),
                {
                    id: crypto.randomUUID(),
                    role: 'error',
                    text: error instanceof Error ? error.message : 'Algo deu errado.',
                    retry: trimmed,
                },
            ]);
        } finally {
            setLoading(false);
            window.requestAnimationFrame(() => input.current?.focus());
        }
    }

    // Só a última versão gerada pode ser aplicada; as anteriores ficam como histórico.
    const lastResult = [...messages]
        .reverse()
        .find((message) => message.role === 'assistant' && message.reply.hasResult !== false);

    return (
        <div className="ai-chat flex h-full min-h-0 flex-col">
            <div ref={scroller} className={`ai-scroller min-h-0 flex-1 overflow-y-auto ${compact ? 'px-5 py-5' : 'px-6 py-6'}`}>
                <div className="mx-auto flex max-w-[760px] flex-col gap-5">
                    {messages.length === 0 && (
                        <Welcome
                            title={title}
                            subtitle={subtitle}
                            status={status}
                            suggestions={suggestions}
                            disabled={!enabled || outOfCredits}
                            compact={compact}
                            onPick={(text) => void send(text)}
                        />
                    )}
                    {messages.map((message) =>
                        message.role === 'user' ? (
                            <div key={message.id} className="ai-fade-in flex justify-end">
                                <p className="ai-bubble-user max-w-[86%] whitespace-pre-wrap rounded-[20px] px-[18px] py-3 text-[13.5px] leading-[21px]">
                                    {message.text}
                                </p>
                            </div>
                        ) : message.role === 'error' ? (
                            <AssistantRow key={message.id} compact={compact}>
                                <div className="rounded-2xl border border-[#f2cbd0] bg-[#fff7f8] px-4 py-3 text-[13px] text-danger dark:bg-[rgb(120_20_40/14%)]">
                                    <p className="font-semibold">Não deu certo desta vez</p>
                                    <p className="mt-1 leading-5">{message.text}</p>
                                    <button
                                        type="button"
                                        onClick={() => void send(message.retry)}
                                        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-current/30 px-3 text-[12px] font-semibold hover:bg-current/5"
                                    >
                                        <Icon name="undo" className="size-3.5" /> Tentar de novo
                                    </button>
                                </div>
                            </AssistantRow>
                        ) : (
                            <AssistantRow key={message.id} compact={compact}>
                                <div className="grid gap-2.5">
                                    {replyText(message.reply) !== '' && (
                                        <p className="ai-bubble whitespace-pre-wrap rounded-[20px] px-[18px] py-3 text-[13.5px] leading-[21px]">
                                            {replyText(message.reply)}
                                        </p>
                                    )}
                                    {message.reply.hasResult !== false &&
                                        renderResult(
                                            message.reply.result,
                                            message.reply,
                                            message === lastResult,
                                        )}
                                </div>
                            </AssistantRow>
                        ),
                    )}
                    {loading && (
                        <AssistantRow compact={compact}>
                            <div className="ai-bubble inline-flex items-center gap-3 rounded-[20px] px-[18px] py-3">
                                <span className="ai-dots" aria-hidden>
                                    <i />
                                    <i />
                                    <i />
                                </span>
                                <span
                                    key={step}
                                    className="ai-fade-in text-[12.5px] text-muted"
                                    aria-live="polite"
                                >
                                    {loadingSteps[step]}
                                </span>
                            </div>
                        </AssistantRow>
                    )}
                </div>
            </div>

            <form
                className={`ai-footer ${compact ? 'px-4 pb-4 pt-2' : 'px-6 py-4'}`}
                onSubmit={(event) => {
                    event.preventDefault();
                    void send(draft);
                }}
            >
                <div className="mx-auto max-w-[760px]">
                    <div className="ai-composer flex items-end gap-2 rounded-[20px] border py-2 pl-[18px] pr-2 transition">
                        <textarea
                            ref={input}
                            value={draft}
                            rows={1}
                            maxLength={maxLength}
                            disabled={!enabled || loading || outOfCredits}
                            onChange={(event) => {
                                setDraft(event.target.value);
                                event.target.style.height = 'auto';
                                event.target.style.height = `${String(Math.min(event.target.scrollHeight, 160))}px`;
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    void send(draft);
                                }
                            }}
                            placeholder={
                                messages.some((message) => message.role === 'assistant')
                                    ? compact
                                        ? 'Peça um ajuste…'
                                        : 'Peça um ajuste: "deixe mais escuro", "tire o FAQ"…'
                                    : placeholder
                            }
                            aria-label="Mensagem para a IA"
                            className="ai-composer-input max-h-40 flex-1 resize-none bg-transparent py-2.5 text-[14px] leading-5 outline-none placeholder:text-muted disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={!draft.trim() || loading || !enabled || outOfCredits}
                            aria-label="Enviar"
                            className="ai-send grid size-10 shrink-0 place-items-center rounded-full transition disabled:cursor-not-allowed"
                        >
                            <Icon name="arrow-up" className="size-4" />
                        </button>
                    </div>
                    <div className="mt-2 flex min-h-6 items-center justify-between gap-3 whitespace-nowrap px-1 text-[11px] text-muted">
                        <span className="flex min-w-0 items-center gap-2">
                            {messages.length > 0 && !loading && (
                                <button
                                    type="button"
                                    onClick={() => setMessages([])}
                                    className="ai-meta-button inline-flex h-6 items-center gap-1 rounded-full px-2 font-semibold"
                                >
                                    <Icon name="plus" className="size-3" /> Nova conversa
                                </button>
                            )}
                            {!compact && (
                                <span className="truncate">Enter envia · Shift+Enter quebra linha</span>
                            )}
                        </span>
                        {(remaining !== null || cost > 0) && (
                            <span
                                className={`ai-credits inline-flex h-6 items-center gap-1 rounded-full px-2 ${outOfCredits ? 'font-semibold text-danger' : ''}`}
                                title={cost > 0 ? `${String(cost)} créditos por geração` : undefined}
                            >
                                <Icon name="coins" className="size-3" />
                                {outOfCredits
                                    ? 'Créditos esgotados'
                                    : remaining !== null
                                      ? `${String(remaining)} créditos`
                                      : `${String(cost)} por geração`}
                            </span>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

function AssistantRow({
    children,
    compact,
}: {
    children: ReactNode;
    compact: boolean;
}) {
    return (
        <div className={`ai-fade-in flex items-start ${compact ? 'gap-2.5' : 'gap-3'}`}>
            <AsterAvatar size={compact ? 30 : 34} className="-ml-1 mt-1" />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

function Welcome({
    title,
    subtitle,
    status,
    suggestions,
    disabled,
    compact,
    onPick,
}: {
    compact: boolean;
    title: string;
    subtitle: string;
    status: AiStatus | null | 'error';
    suggestions: readonly string[];
    disabled: boolean;
    onPick(text: string): void;
}) {
    return (
        <div
            className={`ai-fade-in flex flex-col ${compact ? 'items-start pt-1 text-left' : 'items-center pt-6 text-center'}`}
        >
            <AsterAvatar
                size={compact ? 104 : 112}
                className="ai-aster-float -mb-1"
            />
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                {ASTER_NAME} · assistente do Astro
            </p>
            <h3
                className={`mt-1.5 font-semibold tracking-[-0.03em] text-balance ${compact ? 'text-[19px] leading-6' : 'text-[19px]'}`}
            >
                {title}
            </h3>
            <p
                className={`mt-2 max-w-[460px] text-muted ${compact ? 'text-[13px] leading-5' : 'text-[13px] leading-5'}`}
            >
                {subtitle}
            </p>
            {status === 'error' && (
                <p className="mt-4 rounded-xl bg-surface-muted px-3 py-2 text-[12px] text-muted">
                    Não foi possível falar com a IA agora. Recarregue a página em instantes.
                </p>
            )}
            {status !== null && status !== 'error' && !status.enabled && (
                <p className="mt-4 rounded-xl bg-surface-muted px-3 py-2 text-[12px] text-muted">
                    A IA ainda não está ligada nesta conta.
                </p>
            )}
            {compact && (
                <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Comece por aqui
                </p>
            )}
            <div
                className={`w-full ${compact ? 'ai-suggestion-list mt-2 grid overflow-hidden rounded-2xl border border-border' : 'mt-6 grid gap-2 sm:grid-cols-2'}`}
            >
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion}
                        type="button"
                        disabled={disabled}
                        onClick={() => onPick(suggestion)}
                        className={`ai-suggestion group flex items-center gap-3 bg-surface text-left text-[12.5px] leading-[18px] text-foreground/85 transition hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${compact ? 'px-3.5 py-3' : 'rounded-xl border border-border px-3 py-2.5'}`}
                    >
                        <span className="ai-suggestion-icon grid size-6 shrink-0 place-items-center rounded-lg">
                            <SparkleIcon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">{suggestion}</span>
                        <Icon
                            name="arrow-right"
                            className="size-3 shrink-0 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-60"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

export function SparkleIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5z" />
            <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
        </svg>
    );
}

/** Lê a resposta das rotas de IA e transforma problema em mensagem para o chat. */
export async function aiRequest<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
        data?: T;
        detail?: string;
        code?: string;
    };
    if (response.ok && payload.data !== undefined) return payload.data;
    if (response.status === 429 && payload.code === 'PLAN_LIMIT_EXCEEDED')
        throw new Error('Os créditos de IA do mês acabaram. Eles renovam no próximo ciclo do plano.');
    if (response.status === 429)
        throw new Error('Muitos pedidos seguidos. Espere um minuto e tente de novo.');
    throw new Error(payload.detail ?? 'A IA não respondeu. Tente de novo em instantes.');
}

/** Marca a geração como aplicada (medida de aproveitamento); não bloqueia o lojista. */
export function markAiApplied(id: string) {
    // Guarda localmente também: o cartão continua "Aplicado" ao reabrir ou remontar o chat.
    try {
        window.localStorage.setItem(`${appliedPrefix}${id}`, '1');
    } catch {
        // Sem armazenamento, o estado vale até recarregar.
    }
    window.dispatchEvent(new CustomEvent(appliedEvent, { detail: id }));
    void fetch(`/api/ai/generations/${encodeURIComponent(id)}/applied`, { method: 'POST' });
}

const appliedPrefix = 'astro-ai-applied:';
/** Pedido para a janela do assistente fechar (ex.: "Ver no fluxo" depois de aplicar). */
export const AI_CLOSE_EVENT = 'astro-ai-close';
const appliedEvent = 'astro-ai-applied';

function wasApplied(id: string | undefined) {
    if (!id) return false;
    try {
        return window.localStorage.getItem(`${appliedPrefix}${id}`) === '1';
    } catch {
        return false;
    }
}

/**
 * Rodapé do cartão de resultado com a ação principal. Quando a ação substitui algo que já existe,
 * confirma ali mesmo, no cartão (sem diálogo do navegador).
 */
export function ResultActions({
    note,
    label,
    doneLabel,
    confirmText,
    confirmLabel = 'Substituir',
    disabled,
    busy = false,
    generationId,
    onConfirm,
}: {
    /** Geração que este cartão aplica: se já foi aplicada, o botão nasce como "Aplicado". */
    generationId?: string;
    note: string;
    label: string;
    doneLabel?: string;
    /** Sem texto, aplica direto. */
    confirmText?: string;
    confirmLabel?: string;
    disabled: boolean;
    busy?: boolean;
    onConfirm(): void;
}) {
    const [confirming, setConfirming] = useState(false);
    const applied = useAiApplied(generationId);
    const [confirmedHere, setDone] = useState(false);
    const done = applied || confirmedHere;
    const [discarded, setDiscarded] = useState(false);
    const primary =
        'ai-primary inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[12.5px] font-semibold transition disabled:opacity-40';

    function run() {
        setConfirming(false);
        setDone(true);
        onConfirm();
    }

    if (confirming)
        return (
            <footer className="ai-fade-in mt-4 border-t border-border bg-surface-muted/60 px-4 py-3">
                <p className="text-[12.5px] font-semibold">{confirmText}</p>
                <div className="mt-2.5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        className="inline-flex h-9 items-center rounded-xl border border-border bg-surface px-4 text-[12.5px] font-semibold text-muted transition hover:text-foreground"
                    >
                        Cancelar
                    </button>
                    <button type="button" onClick={run} className={primary} autoFocus>
                        {confirmLabel}
                    </button>
                </div>
            </footer>
        );

    if (discarded)
        return (
            <footer className="mt-4 flex items-center gap-2 border-t border-border px-4 py-3 text-[12px] text-muted">
                <Icon name="close" className="size-3.5" /> Proposta descartada · nenhuma alteração
                foi aplicada
            </footer>
        );

    return (
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-t border-border px-4 py-3">
            <span className="min-w-[180px] flex-1 text-[11.5px] leading-[17px] text-muted">
                {note}
            </span>
            <span className="flex items-center gap-2">
                {!done && (
                    <button
                        type="button"
                        disabled={disabled || busy}
                        onClick={() => setDiscarded(true)}
                        className="inline-flex h-9 items-center rounded-xl px-3 text-[12px] font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-40"
                    >
                        Descartar
                    </button>
                )}
                <button
                    type="button"
                    disabled={disabled || done || busy}
                    onClick={() => (confirmText ? setConfirming(true) : run())}
                    className={primary}
                >
                    {done ? (
                        <>
                            <Icon name="check" className="size-3.5" /> {doneLabel ?? 'Aplicado'}
                        </>
                    ) : busy ? (
                        'Aguarde…'
                    ) : (
                        <>
                            {label} <Icon name="arrow-right" className="size-3.5" />
                        </>
                    )}
                </button>
            </span>
        </footer>
    );
}

const conversationLimit = 30;

/** Lê a conversa salva; armazenamento bloqueado ou dado antigo viram conversa vazia. */
function readConversation<Result>(key: string): Message<Result>[] {
    try {
        const raw = window.localStorage.getItem(`astro-ai-chat:${key}`);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? (parsed as Message<Result>[]) : [];
    } catch {
        return [];
    }
}

/** Salva só perguntas e respostas (erros não), limitado às últimas mensagens. */
function writeConversation<Result>(key: string, messages: Message<Result>[]) {
    try {
        const kept = messages.filter((message) => message.role !== 'error').slice(-conversationLimit);
        if (kept.length === 0) window.localStorage.removeItem(`astro-ai-chat:${key}`);
        else window.localStorage.setItem(`astro-ai-chat:${key}`, JSON.stringify(kept));
    } catch {
        // Sem armazenamento (aba anônima, cota cheia): a conversa vale só até recarregar.
    }
}

/** Texto da resposta; conversas salvas antes da IA conversar usam a explicação antiga. */
function replyText<Result>(reply: AiReply<Result>) {
    if (typeof reply.text === 'string') return reply.text;
    const legacy = (reply.result as { explanation?: unknown } | null)?.explanation;
    return typeof legacy === 'string' ? legacy : '';
}

/** Se a geração já foi aplicada (neste navegador), e acompanha quando for. */
export function useAiApplied(generationId: string | undefined) {
    // Cartões de resultado só existem no cliente (a conversa vem do armazenamento local).
    const [applied, setApplied] = useState(() => wasApplied(generationId));
    useEffect(() => {
        const listener = (event: Event) => {
            if ((event as CustomEvent<string>).detail === generationId) setApplied(true);
        };
        window.addEventListener(appliedEvent, listener);
        return () => window.removeEventListener(appliedEvent, listener);
    }, [generationId]);
    return applied;
}

/** Cartão verde de "aplicado": resumo do que entrou e o atalho para ver no editor. */
export function AppliedCard({
    title,
    items,
    actionLabel,
}: {
    title: string;
    items: { icon: IconName; label: string }[];
    actionLabel: string;
}) {
    return (
        <article className="ai-applied ai-fade-in rounded-[20px] border px-5 py-4">
            <p className="flex items-center gap-2.5 text-[14.5px] font-semibold tracking-[-0.015em]">
                <span className="ai-applied-check grid size-[22px] place-items-center rounded-full">
                    <Icon name="check" className="size-3.5" />
                </span>
                {title}
            </p>
            {items.length > 0 && (
                <ul className="mt-3.5 grid gap-2.5 text-[13px]">
                    {items.map((item) => (
                        <li key={item.label} className="flex items-center gap-3">
                            <Icon name={item.icon} className="size-4 shrink-0 text-foreground/75" />
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                onClick={() => window.dispatchEvent(new Event(AI_CLOSE_EVENT))}
                className="ai-applied-action mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[14px] border text-[13px] font-semibold transition"
            >
                {actionLabel}
                <Icon name="arrow-right" className="size-3.5 -rotate-45" />
            </button>
        </article>
    );
}
