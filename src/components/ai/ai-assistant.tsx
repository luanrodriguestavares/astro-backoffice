'use client';

import './ai-assistant.css';

import { usePathname } from 'next/navigation';
import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import { Icon } from '@/components/ui/icon';
import type { CheckoutDocument, FlowGraph } from '@/lib/api/types';

import { AI_CLOSE_EVENT } from './ai-chat';
import { ASTER_NAME, AsterAvatar } from './aster';
import { CheckoutAiChat, type CheckoutAiPrice } from './checkout-ai-chat';
import { FlowAiChat } from './flow-ai-chat';

/**
 * Assistente de IA flutuante dos editores que conseguem aplicar o resultado. O botão só aparece
 * quando o builder do checkout ou o editor do fluxo de pagamento se registra como "alvo"; o
 * editor de fluxo, quando montado, tem prioridade sobre o checkout.
 */

export type AiTarget =
    | {
          kind: 'payment_flow';
          label: string;
          apply(graph: FlowGraph): void;
      }
    | {
          kind: 'checkout';
          label: string;
          productName: string;
          prices: CheckoutAiPrice[];
          apply(document: CheckoutDocument, generationId: string): void;
          applyPaymentFlow?(graph: FlowGraph): void;
      };

interface AssistantContext {
    register(target: AiTarget): () => void;
}

const Context = createContext<AssistantContext | null>(null);

/** Registra a tela atual como alvo do assistente enquanto ela estiver montada. */
export function useAiTarget(target: AiTarget | null) {
    const context = useContext(Context);
    const latest = useRef(target);
    useLayoutEffect(() => {
        latest.current = target;
    });
    const kind = target?.kind;
    const label = target?.label;
    const signature = target?.kind === 'checkout' ? target.prices.map((price) => price.priceId).join(',') : '';
    useEffect(() => {
        if (!context || !kind || !latest.current) return;
        const current = latest.current;
        // O alvo registrado sempre chama a versão mais nova das funções da tela.
        const proxy: AiTarget =
            current.kind === 'payment_flow'
                ? {
                      ...current,
                      apply: (graph: FlowGraph) => {
                          const latestTarget = latest.current;
                          if (latestTarget?.kind === 'payment_flow') latestTarget.apply(graph);
                      },
                  }
                  : {
                      ...current,
                      apply: (document: CheckoutDocument, id: string) => {
                          const latestTarget = latest.current;
                          if (latestTarget?.kind === 'checkout') latestTarget.apply(document, id);
                      },
                      applyPaymentFlow: (graph: FlowGraph) => {
                          const latestTarget = latest.current;
                          if (latestTarget?.kind === 'checkout')
                              latestTarget.applyPaymentFlow?.(graph);
                      },
                  };
        return context.register(proxy);
    }, [context, kind, label, signature]);
}

/** Versão em componente, para telas grandes onde um hook a mais atrapalha o React Compiler. */
export function AiTargetRegistration({ target }: { target: AiTarget | null }) {
    useAiTarget(target);
    return null;
}

export function AiAssistantProvider({ children }: { children: ReactNode }) {
    const [targets, setTargets] = useState<AiTarget[]>([]);
    const [open, setOpen] = useState(false);
    const value = useMemo<AssistantContext>(
        () => ({
            register(target) {
                setTargets((current) => [...current, target]);
                return () => {
                    setTargets((current) => current.filter((item) => item !== target));
                };
            },
        }),
        [],
    );
    // O editor de orquestração só monta quando está na frente (página própria ou overlay do
    // workspace), então ele vence. Escolher só pela ordem de registro falhava: o checkout do
    // workspace se registra de novo quando o nome/preços mudam (ou depois do overlay, pela ordem
    // dos efeitos) e a conversa de design aparecia por cima da orquestração.
    const target = targets.findLast((item) => item.kind === 'payment_flow') ?? targets.at(-1);
    // Fecha só quando nenhuma tela com assistente está ativa; re-registrar não fecha a janela.
    const hasTarget = target !== undefined;
    const [hadTarget, setHadTarget] = useState(hasTarget);
    if (hadTarget !== hasTarget) {
        setHadTarget(hasTarget);
        if (!hasTarget) setOpen(false);
    }

    return (
        <Context.Provider value={value}>
            {children}
            {target && (
                <>
                    <AssistantWindow open={open} target={target} onClose={() => setOpen(false)} />
                    {!open && (
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            aria-label={`Abrir ${ASTER_NAME}, o assistente de IA`}
                            className="ai-fab group fixed bottom-6 right-6 z-[150] focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            <span className="ai-fab-pill inline-flex h-11 items-center gap-2 rounded-full pl-2.5 pr-[18px] text-[13.5px] font-semibold tracking-[-0.015em]">
                                <AsterAvatar size={28} />
                                <span>Criar com o {ASTER_NAME}</span>
                            </span>
                        </button>
                    )}
                </>
            )}
        </Context.Provider>
    );
}

function AssistantWindow({
    open,
    target,
    onClose,
}: {
    open: boolean;
    target: AiTarget;
    onClose(): void;
}) {
    const [expanded, setExpanded] = useState(false);
    // Uma conversa por tela e por tipo: voltar à mesma página traz a conversa de volta.
    const pathname = usePathname();

    // Cartões do chat pedem para fechar a janela (ex.: "Ver no fluxo").
    useEffect(() => {
        window.addEventListener(AI_CLOSE_EVENT, onClose);
        return () => window.removeEventListener(AI_CLOSE_EVENT, onClose);
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [open, onClose]);

    // Mantém a conversa montada ao fechar ou navegar; só some da tela.
    return (
        <section
            role="dialog"
            aria-label="Assistente de IA"
            aria-hidden={!open}
            data-expanded={expanded || undefined}
            className={`ai-window fixed bottom-6 right-6 z-[160] flex flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_24px_70px_rgba(16,18,20,0.24)] transition-[opacity,transform,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                expanded
                    ? 'h-[min(860px,calc(100dvh-3rem))] w-[min(760px,calc(100vw-3rem))]'
                    : 'h-[min(640px,calc(100dvh-3rem))] w-[min(420px,calc(100vw-3rem))]'
            } ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        >
            <header className="relative flex shrink-0 items-center gap-3 px-5 pb-3 pt-4">
                <AsterAvatar size={50} className="-my-1 -ml-1" />
                <div className="min-w-0 flex-1" title={target.label}>
                    <p className="text-[19px] font-semibold leading-6 tracking-[-0.03em]">
                        {ASTER_NAME}
                    </p>
                    <p className="text-[12.5px] leading-4 text-muted">Assistente do Astro</p>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    aria-label={expanded ? 'Reduzir janela' : 'Ampliar janela'}
                    className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name={expanded ? 'shrink' : 'expand'} className="size-[17px]" />
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar assistente"
                    className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name="close" className="size-[18px]" />
                </button>
            </header>
            <div className="min-h-0 flex-1">
                {target?.kind === 'payment_flow' ? (
                    <FlowAiChat
                        key="flow"
                        compact
                        storageKey={`payment_flow:${pathname}`}
                        onApply={(graph) => target.apply(graph)} />
                ) : target?.kind === 'checkout' ? (
                    <CheckoutAiChat
                        key={`checkout-${target.prices.map((price) => price.priceId).join(',')}`}
                        compact
                        storageKey={`checkout:${pathname}`}
                        productName={target.productName}
                        prices={target.prices}
                        creating={false}
                        actionLabel="Aplicar no editor"
                        confirmText="Substituir a página do checkout por esta? Páginas do funil e pagamento são mantidas."
                        onCreate={(document, id) => target.apply(document, id)}
                        {...(target.applyPaymentFlow
                            ? { onApplyPaymentFlow: target.applyPaymentFlow }
                            : {})}
                    />
                ) : null}
            </div>
        </section>
    );
}
