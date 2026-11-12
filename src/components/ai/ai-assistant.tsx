'use client';

import Link from 'next/link';
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

import { SparkleIcon } from './ai-chat';
import { CheckoutAiChat, type CheckoutAiPrice } from './checkout-ai-chat';
import { FlowAiChat } from './flow-ai-chat';

/**
 * Assistente de IA flutuante: um botão em todas as telas do painel que abre um chat em janela,
 * sem bloquear a página. As telas que sabem aplicar o resultado (editor do fluxo de pagamento,
 * editor do checkout) se registram como "alvo"; a última registrada é a ativa.
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
                return () => setTargets((current) => current.filter((item) => item !== target));
            },
        }),
        [],
    );
    const target = targets.at(-1);

    return (
        <Context.Provider value={value}>
            {children}
            <AssistantWindow open={open} target={target} onClose={() => setOpen(false)} />
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Abrir assistente de IA"
                    className={`ai-fab group fixed right-6 z-[150] bottom-6 inline-flex h-11 items-center gap-2 rounded-full bg-foreground pl-3.5 pr-4 text-[13px] font-semibold text-background shadow-[0_14px_40px_rgba(16,18,20,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(16,18,20,0.34)] focus-visible:outline-2 focus-visible:outline-offset-2`}
                >
                    <SparkleIcon className="size-[18px] transition group-hover:rotate-12" />
                    Assistente
                </button>
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
    target: AiTarget | undefined;
    onClose(): void;
}) {
    const [expanded, setExpanded] = useState(false);
    // Uma conversa por tela e por tipo: voltar à mesma página traz a conversa de volta.
    const pathname = usePathname();

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
            className={`ai-window fixed bottom-6 right-6 z-[160] flex flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_24px_70px_rgba(16,18,20,0.24)] transition-[opacity,transform,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                expanded
                    ? 'h-[min(860px,calc(100dvh-3rem))] w-[min(760px,calc(100vw-3rem))]'
                    : 'h-[min(640px,calc(100dvh-3rem))] w-[min(420px,calc(100vw-3rem))]'
            } ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        >
            <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
                <span className="grid size-8 place-items-center rounded-xl bg-foreground text-background">
                    <SparkleIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold leading-4 tracking-[-0.01em]">
                        Assistente Astro
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">
                        {target ? target.label : 'Escolha o que criar'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    aria-label={expanded ? 'Reduzir janela' : 'Ampliar janela'}
                    className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name={expanded ? 'shrink' : 'expand'} className="size-4" />
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar assistente"
                    className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                    <Icon name="close" className="size-4" />
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
                    />
                ) : (
                    <Launcher onNavigate={onClose} />
                )}
            </div>
        </section>
    );
}

/** Fora dos editores: atalhos para onde a IA consegue trabalhar. */
function Launcher({ onNavigate }: { onNavigate(): void }) {
    const pathname = usePathname();
    const actions = [
        {
            href: '/checkouts?ia=1',
            title: 'Criar um checkout com IA',
            description:
                'Escolha o produto e descreva a oferta. A IA monta estrutura, cores e textos.',
            icon: 'cart' as const,
        },
        {
            href: '/checkouts',
            title: 'Ajustar o checkout ou o pagamento de um funil',
            description:
                'Abra um checkout e use o assistente no editor da página ou no fluxo de pagamento.',
            icon: 'route' as const,
        },
    ];
    return (
        <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
            <div className="flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(16,18,20,0.06)]">
                    <SparkleIcon className="size-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">
                    O que vamos criar?
                </h3>
                <p className="mt-1.5 max-w-[320px] text-[12.5px] leading-5 text-muted">
                    O assistente monta checkouts e fluxos de pagamento com os blocos e gateways da
                    sua conta. Nada vai ao ar sem você publicar.
                </p>
            </div>
            <ul className="mt-6 grid gap-2">
                {actions.map((action) => (
                    <li key={action.href}>
                        <Link
                            href={action.href}
                            onClick={() => {
                                if (pathname === action.href.split('?')[0]) onNavigate();
                            }}
                            className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-3.5 transition hover:-translate-y-px hover:border-foreground/25"
                        >
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted">
                                <Icon name={action.icon} className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-semibold">
                                    {action.title}
                                </span>
                                <span className="mt-0.5 block text-[12px] leading-5 text-muted">
                                    {action.description}
                                </span>
                            </span>
                            <Icon
                                name="arrow-right"
                                className="mt-2.5 size-3.5 text-muted transition group-hover:translate-x-0.5"
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
