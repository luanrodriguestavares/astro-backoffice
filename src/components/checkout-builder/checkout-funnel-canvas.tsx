'use client';

import '@xyflow/react/dist/style.css';
import '@/components/orchestration/flow-editor/flow-editor.css';

import {
    Background,
    BackgroundVariant,
    Handle,
    MarkerType,
    MiniMap,
    Position,
    ReactFlow,
    SelectionMode,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type EdgeChange,
    type FinalConnectionState,
    type Node,
    type NodeChange,
    type NodeProps,
    type ReactFlowInstance,
} from '@xyflow/react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ContextMenu, type MenuEntry } from '@/components/orchestration/flow-editor/context-menu';
import { IssueBadge } from '@/components/orchestration/flow-editor/flow-node';
import {
    CanvasToolbar,
    IssuesButton,
    ZoomControls,
} from '@/components/orchestration/flow-editor/flow-editor';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon, type IconName } from '@/components/ui/icon';
import { CHECKOUT_PAGE_ID, pageKindLabels } from '@astro/checkout-renderer/funnel';
import { FlowEdge, type FlowCanvasEdge } from '@/components/orchestration/flow-editor/flow-edge';
import { toneColor } from '@/lib/orchestration/flow';
import { type RouteStep } from '@/lib/orchestration/strategy';
import { RouteDiagram } from '@/components/checkout-builder/payment-route';

import type { BuilderFunnelPage, BuilderFunnelPosition } from './config';
import {
    FUNNEL_PAGE_DRAG_TYPE,
    FunnelPagePicker,
    type FunnelPageTemplateId,
} from './funnel-page-library';

type FunnelNodeData = {
    page: BuilderFunnelPage;
    index: number;
    start: boolean;
    issue?: string;
    /** O checkout entrega a venda ao nó Pagamento em vez de ir direto aos resultados. */
    paymentLinked?: boolean;
    /** Formas com rota no funil (Pix e boleto só quando habilitados no checkout). */
    routes: FunnelRoutes;
    /** "+" da saída: abre o seletor para criar a próxima página já ligada. */
    onQuickAdd?(screen: { x: number; y: number }): void;
};

/** Onde entra uma página nova: depois de outra (ou da Entrada) e/ou num ponto do canvas. */
export interface FunnelPagePlacement {
    after?: string;
    position?: BuilderFunnelPosition;
}

/** Como o checkout cobra, mostrado no nó entre o checkout e os resultados. */
export interface FunnelPaymentSummary {
    /** `own`: fluxo próprio do checkout; `preset`: segue o padrão. */
    source: 'own' | 'preset';
    lines: { label: string; value: string }[];
    /** Gateways na ordem em que a venda os encontra, para os chips do nó. */
    route: RouteStep[];
    errors: number;
    /** Abre a área Pagamento, onde o pagamento é configurado. */
    onOpen(): void;
}

export const PAYMENT_NODE_ID = '__payment';
/** De onde o visitante chega (o link do checkout); a ligação dele aponta a página de entrada. */
export const ENTRY_NODE_ID = '__entry';

type PagedNode = Node<FunnelNodeData, 'checkout-page'>;
type PaymentNode = Node<{ payment: FunnelPaymentSummary; routes: FunnelRoutes }, 'payment'>;
type FunnelRoutes = { pix: boolean; boleto: boolean };
type EntryNode = Node<{ onQuickAdd?(screen: { x: number; y: number }): void }, 'entry'>;
type FunnelNode = PagedNode | PaymentNode | EntryNode;
type FunnelEdge = FlowCanvasEdge;

export function CheckoutFunnelCanvas({
    pages,
    startPageId,
    positions,
    onEdit,
    onRemove,
    onRename,
    onStart,
    onSetTriggerTarget,
    onPosition,
    onAdd,
    actionsSlot,
    fullscreen,
    onToggleFullscreen,
    payment,
    libraryOpen,
    onToggleLibrary,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
}: {
    pages: BuilderFunnelPage[];
    startPageId: string;
    positions: Record<string, BuilderFunnelPosition>;
    onEdit(pageId: string): void;
    onRemove(pageId: string): void;
    onRename(pageId: string, name: string): void;
    onStart(pageId: string): void;
    onSetTriggerTarget(pageId: string, triggerId: string, target: string | null): void;
    onPosition(pageId: string, position: BuilderFunnelPosition): void;
    onAdd(template: FunnelPageTemplateId, placement: FunnelPagePlacement): void;
    /** Header do quadro: recebe problemas, Organizar e Nova página, como no orquestrador. */
    actionsSlot?: HTMLElement | null;
    fullscreen?: boolean;
    onToggleFullscreen?(): void;
    /** Com resumo, o canvas mostra o nó Pagamento ligado ao fluxo de nós. */
    payment?: FunnelPaymentSummary;
    libraryOpen: boolean;
    onToggleLibrary(): void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo(): void;
    onRedo(): void;
}) {
    const withPayment = payment !== undefined;
    const [picker, setPicker] = useState<{
        screen: { x: number; y: number };
        after?: string;
        position?: BuilderFunnelPosition;
    } | null>(null);
    const createNodes = useCallback(
        (current: FunnelNode[] = []) => {
            const currentById = new Map(current.map((node) => [node.id, node]));
            const contentCount = pages.filter((page) => page.kind === 'content').length;
            const issues = funnelDiagnostics(pages, startPageId).issues;
            const routes = {
                pix: pages.some((page) => page.kind === 'pix'),
                boleto: pages.some((page) => page.kind === 'boleto'),
            };
            const pageNodes = pages.map((page, index): FunnelNode => {
                const existing = currentById.get(page.id);
                return {
                    ...(existing?.type === 'checkout-page' ? existing : {}),
                    id: page.id,
                    type: 'checkout-page' as const,
                    position:
                        positions[page.id] ??
                        existing?.position ??
                        defaultPosition(page, index, contentCount, withPayment),
                    data: {
                        page,
                        index,
                        start: startPageId === page.id,
                        issue: issues.get(page.id),
                        paymentLinked: withPayment,
                        routes,
                        onQuickAdd:
                            page.kind === 'content'
                                ? (screen) => setPicker({ screen, after: page.id })
                                : undefined,
                    },
                };
            });
            const entry: FunnelNode = {
                ...(currentById.get(ENTRY_NODE_ID)?.type === 'entry'
                    ? currentById.get(ENTRY_NODE_ID)
                    : {}),
                id: ENTRY_NODE_ID,
                type: 'entry',
                position:
                    positions[ENTRY_NODE_ID] ??
                    currentById.get(ENTRY_NODE_ID)?.position ??
                    entryPosition(),
                data: { onQuickAdd: (screen) => setPicker({ screen, after: ENTRY_NODE_ID }) },
            } as EntryNode;
            if (!payment) return [entry, ...pageNodes];
            const existing = currentById.get(PAYMENT_NODE_ID);
            return [
                entry,
                ...pageNodes,
                {
                    ...(existing?.type === 'payment' ? existing : {}),
                    id: PAYMENT_NODE_ID,
                    type: 'payment' as const,
                    position:
                        positions[PAYMENT_NODE_ID] ??
                        existing?.position ??
                        paymentPosition(contentCount),
                    data: { payment, routes },
                },
            ];
        },
        [pages, positions, startPageId, payment, withPayment],
    );
    const createEdges = useCallback(
        () => edgesOf(pages, startPageId, withPayment),
        [pages, startPageId, withPayment],
    );
    const [nodes, setNodes] = useState<FunnelNode[]>(() => createNodes());
    const [edges, setEdges] = useState<FunnelEdge[]>(() => createEdges());
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
    const [pendingTarget, setPendingTarget] = useState<string | null>(null);
    const [flow, setFlow] = useState<ReactFlowInstance<FunnelNode, FunnelEdge> | null>(null);
    const [menu, setMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null);
    const [inspectedId, setInspectedId] = useState<string | null>(null);

    // Páginas, gatilhos e problemas mudam fora do canvas (inspetor, construtor, desfazer).
    const [synced, setSynced] = useState({ createNodes, createEdges });
    if (synced.createNodes !== createNodes || synced.createEdges !== createEdges) {
        setSynced({ createNodes, createEdges });
        setNodes((current) => createNodes(current));
        setEdges((current) => [
            ...createEdges(),
            ...current.filter((edge) => edge.id.startsWith('pending:')),
        ]);
    }
    // O resumo do pagamento muda enquanto o fluxo de nós é editado em outra aba.
    const renderedNodes = useMemo(
        () =>
            payment
                ? nodes.map((node) =>
                      node.type === 'payment' ? { ...node, data: { ...node.data, payment } } : node,
                  )
                : nodes,
        [nodes, payment],
    );

    const onNodesChange = useCallback(
        (changes: NodeChange<FunnelNode>[]) =>
            setNodes((current) => applyNodeChanges(changes, current)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange<FunnelEdge>[]) =>
            setEdges((current) => applyEdgeChanges(changes, current)),
        [],
    );
    const contentIds = useMemo(
        () => new Set(pages.filter((page) => page.kind === 'content').map((page) => page.id)),
        [pages],
    );
    const diagnostics = useMemo(() => funnelDiagnostics(pages, startPageId), [pages, startPageId]);
    const validConnection = useCallback(
        (connection: Connection | FunnelEdge) =>
            isValidFunnelConnection(pages, startPageId, connection, contentIds),
        [contentIds, pages, startPageId],
    );
    const connect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;
            if (!validConnection(connection)) return;
            // Ligar a Entrada a uma página faz dela a primeira tela do funil.
            if (connection.source === ENTRY_NODE_ID) {
                onStart(connection.target);
                return;
            }
            setSelectedSource(connection.source);
            setSelectedTriggerId(null);
            setPendingTarget(connection.target);
            setEdges((current) => [
                ...current.filter((edge) => edge.id !== `pending:${connection.source}`),
                pendingEdge(connection.source, connection.target),
            ]);
        },
        [onStart, validConnection],
    );
    const selectedPage = pages.find((page) => page.id === selectedSource);
    const selectedTrigger = selectedPage?.triggers?.find(
        (trigger) => trigger.id === selectedTriggerId,
    );
    const selectedTargetId = pendingTarget ?? selectedTrigger?.target;
    const selectedTarget = selectedTargetId
        ? pages.find((page) => page.id === selectedTargetId)
        : undefined;
    const inspected = pages.find((page) => page.id === inspectedId);
    const linkOpen = selectedPage?.kind === 'content' && Boolean(pendingTarget || selectedTrigger);

    const arrange = () => {
        const arranged = arrangedPositions(pages, withPayment);
        setNodes((current) =>
            current.map((node) => ({ ...node, position: arranged[node.id] ?? node.position })),
        );
        for (const [pageId, position] of Object.entries(arranged)) onPosition(pageId, position);
        window.setTimeout(() => void flow?.fitView({ padding: 0.2, duration: 300 }), 0);
    };

    const pick = (template: FunnelPageTemplateId) => {
        if (!picker) return;
        const from = nodes.find((node) => node.id === picker.after);
        onAdd(template, {
            after: picker.after,
            position:
                picker.position ??
                (from ? { x: from.position.x + columnGap, y: from.position.y } : undefined),
        });
        setPicker(null);
    };

    const onConnectEnd = (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
        if (state.isValid || state.toNode || !state.fromNode) return;
        if (state.fromHandle?.type !== 'source') return;
        const from = pages.find((page) => page.id === state.fromNode?.id);
        if (state.fromNode.id !== ENTRY_NODE_ID && from?.kind !== 'content') return;
        const point = 'changedTouches' in event ? event.changedTouches[0] : event;
        if (!point) return;
        setPicker({
            screen: { x: point.clientX, y: point.clientY },
            after: state.fromNode.id,
            position: flow?.screenToFlowPosition({ x: point.clientX, y: point.clientY - 40 }),
        });
    };

    // Atalhos do orquestrador: desfazer, refazer e abrir a página selecionada.
    useEffect(() => {
        function keydown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
            const mod = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();
            if (event.shiftKey && !mod && key === 'f') {
                event.preventDefault();
                onToggleFullscreen?.();
                window.setTimeout(() => void flow?.fitView({ padding: 0.2, duration: 300 }), 120);
            } else if (mod && key === 'z') {
                event.preventDefault();
                if (event.shiftKey) {
                    if (canRedo) onRedo();
                } else if (canUndo) onUndo();
            } else if (mod && key === 'y') {
                event.preventDefault();
                if (canRedo) onRedo();
            } else if (key === 'enter' && inspectedId) {
                event.preventDefault();
                onEdit(inspectedId);
            } else if (key === 'escape') {
                setInspectedId(null);
            }
        }

        window.addEventListener('keydown', keydown);
        return () => window.removeEventListener('keydown', keydown);
    }, [canRedo, canUndo, flow, inspectedId, onEdit, onRedo, onToggleFullscreen, onUndo]);

    const menuEntries = (nodeId?: string): MenuEntry[] => {
        const position = menu ? flow?.screenToFlowPosition({ x: menu.x, y: menu.y }) : undefined;
        if (nodeId === undefined)
            return [
                {
                    label: 'Adicionar página aqui',
                    icon: 'plus',
                    onSelect: () => menu && setPicker({ screen: menu, position }),
                },
                'separator',
                { label: 'Organizar fluxo', icon: 'route', onSelect: arrange },
                {
                    label: 'Ajustar à tela',
                    icon: 'maximize',
                    onSelect: () => void flow?.fitView({ padding: 0.2, duration: 300 }),
                },
                ...(onToggleFullscreen
                    ? [
                          {
                              label: fullscreen ? 'Sair da tela cheia' : 'Tela cheia',
                              icon: fullscreen ? 'shrink' : 'expand',
                              shortcut: 'Shift+F',
                              onSelect: onToggleFullscreen,
                          } satisfies MenuEntry,
                      ]
                    : []),
            ];
        if (nodeId === ENTRY_NODE_ID)
            return [
                {
                    label: 'Adicionar primeira página',
                    icon: 'plus',
                    onSelect: () => menu && setPicker({ screen: menu, after: ENTRY_NODE_ID }),
                },
            ];
        if (nodeId === PAYMENT_NODE_ID)
            return payment
                ? [
                      {
                          label: 'Abrir pagamento',
                          icon: 'bolt',
                          shortcut: 'Enter',
                          onSelect: payment.onOpen,
                      },
                  ]
                : [];
        const page = pages.find((item) => item.id === nodeId);
        if (!page) return [];
        const open: MenuEntry = {
            label: page.kind === 'checkout' ? 'Editar checkout' : 'Abrir no construtor',
            icon: 'edit',
            shortcut: 'Enter',
            onSelect: () => onEdit(page.id),
        };
        if (page.kind !== 'content') return [open];
        return [
            open,
            {
                label: 'Adicionar página depois',
                icon: 'plus',
                onSelect: () => menu && setPicker({ screen: menu, after: page.id }),
            },
            {
                label: 'Definir como primeira página',
                icon: 'link',
                disabled: startPageId === page.id,
                onSelect: () => onStart(page.id),
            },
            'separator',
            {
                label: 'Excluir página',
                icon: 'trash',
                danger: true,
                onSelect: () => onRemove(page.id),
            },
        ];
    };

    return (
        <div className="ce-free-funnel">
            <ReactFlow<FunnelNode, FunnelEdge>
                className="flow-canvas"
                nodes={renderedNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={connect}
                onConnectEnd={onConnectEnd}
                onInit={setFlow}
                onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes(FUNNEL_PAGE_DRAG_TYPE)) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(event) => {
                    const template = event.dataTransfer.getData(FUNNEL_PAGE_DRAG_TYPE);
                    if (!template || !flow) return;
                    event.preventDefault();
                    const point = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
                    onAdd(template as FunnelPageTemplateId, {
                        position: { x: point.x - 118, y: point.y - 40 },
                    });
                }}
                onNodeClick={(_, node) => {
                    setInspectedId(node.type === 'checkout-page' ? node.id : null);
                    // O pagamento se configura na área Pagamento, não no funil.
                    if (node.type === 'payment') payment?.onOpen();
                    setSelectedSource(null);
                    setSelectedTriggerId(null);
                }}
                onNodeDoubleClick={(_, node) => {
                    if (node.type === 'checkout-page') onEdit(node.id);
                }}
                onNodeContextMenu={(event, node) => {
                    event.preventDefault();
                    setMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
                }}
                onPaneContextMenu={(event) => {
                    event.preventDefault();
                    setMenu({ x: event.clientX, y: event.clientY });
                }}
                onPaneClick={() => setInspectedId(null)}
                onEdgeClick={(_, edge) => {
                    if (edge.data?.locked) return;
                    setInspectedId(null);
                    setSelectedSource(edge.source);
                    setSelectedTriggerId(
                        edge.data?.triggerId ?? edge.data?.triggerIds?.[0] ?? null,
                    );
                    setPendingTarget(edge.id.startsWith('pending:') ? edge.target : null);
                }}
                onEdgesDelete={(deleted) => {
                    const removedTriggers = new Map<string, Set<string>>();
                    for (const edge of deleted) {
                        if (edge.data?.locked) continue;
                        const triggerIds =
                            edge.data?.triggerIds ??
                            (edge.data?.triggerId ? [edge.data.triggerId] : []);
                        for (const triggerId of triggerIds) {
                            onSetTriggerTarget(edge.source, triggerId, null);
                            const sourceTriggers = removedTriggers.get(edge.source) ?? new Set();
                            sourceTriggers.add(triggerId);
                            removedTriggers.set(edge.source, sourceTriggers);
                        }
                        if (edge.id.startsWith('pending:')) setPendingTarget(null);
                        if (selectedSource === edge.source) setSelectedSource(null);
                    }
                    if (removedTriggers.size) {
                        const nextPages = pages.map((page) => ({
                            ...page,
                            triggers: page.triggers?.map((trigger) =>
                                removedTriggers.get(page.id)?.has(trigger.id)
                                    ? { ...trigger, active: false, target: null }
                                    : trigger,
                            ),
                        }));
                        const nextIssues = funnelDiagnostics(nextPages, startPageId).issues;
                        setEdges(edgesOf(nextPages, startPageId, withPayment));
                        setNodes((current) => withPages(current, nextPages, nextIssues));
                    }
                }}
                onNodeDragStop={(_, node) => onPosition(node.id, node.position)}
                isValidConnection={validConnection}
                fitView
                fitViewOptions={{ padding: 0.2, minZoom: 0.75, maxZoom: 1 }}
                minZoom={0.2}
                maxZoom={1.75}
                deleteKeyCode={['Backspace', 'Delete']}
                selectionOnDrag
                selectionMode={SelectionMode.Partial}
                panOnDrag={[1]}
                panActivationKeyCode="Space"
                panOnScroll
                zoomOnScroll={false}
                zoomActivationKeyCode={['Meta', 'Control']}
                elevateNodesOnSelect={false}
                snapToGrid
                snapGrid={[10, 10]}
                connectionRadius={28}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={22}
                    size={1.4}
                    color="var(--flow-dot)"
                />
                <MiniMap
                    pannable
                    zoomable
                    ariaLabel="Mapa do fluxo"
                    style={{ width: 168, height: 112 }}
                    className="!hidden md:!block"
                    nodeBorderRadius={8}
                    nodeColor={(node) =>
                        node.type === 'payment' || node.type === 'entry'
                            ? '#a3e635'
                            : (node.data as FunnelNodeData | undefined)?.page.kind === 'content'
                              ? '#9dde2a'
                              : '#1d2421'
                    }
                />
                <CanvasToolbar
                    paletteOpen={libraryOpen}
                    paletteLabel="páginas"
                    onTogglePalette={onToggleLibrary}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={onUndo}
                    onRedo={onRedo}
                />
                <ZoomControls fullscreen={fullscreen} onToggleFullscreen={onToggleFullscreen} />
            </ReactFlow>
            {selectedPage?.kind === 'content' && linkOpen && (
                <aside className="ce-flow-link-inspector">
                    <header>
                        <div>
                            <small>Ligação selecionada</small>
                            <strong>
                                {selectedPage.name} → {selectedTarget?.name ?? 'Checkout'}
                            </strong>
                        </div>
                        <button
                            type="button"
                            aria-label="Fechar configuração da ligação"
                            onClick={() => {
                                setSelectedSource(null);
                                setSelectedTriggerId(null);
                                setPendingTarget(null);
                                setEdges((current) =>
                                    current.filter((edge) => !edge.id.startsWith('pending:')),
                                );
                            }}
                        >
                            <Icon name="close" className="size-4" />
                        </button>
                    </header>
                    <div className="ce-flow-link-inspector-body">
                        <span className="ce-flow-link-inspector-label">
                            Como o comprador avança?
                        </span>
                        {(selectedPage.triggers ?? []).length ? (
                            <div className="ce-flow-trigger-list">
                                {(selectedPage.triggers ?? []).map((trigger) => (
                                    <label key={trigger.id}>
                                        <input
                                            type="radio"
                                            name={`trigger:${selectedPage.id}`}
                                            checked={trigger.id === selectedTriggerId}
                                            disabled={!pendingTarget}
                                            onChange={() => {
                                                if (!pendingTarget) return;
                                                onSetTriggerTarget(
                                                    selectedPage.id,
                                                    trigger.id,
                                                    pendingTarget,
                                                );
                                                const nextPages = pages.map((page) =>
                                                    page.id === selectedPage.id
                                                        ? {
                                                              ...page,
                                                              triggers: page.triggers?.map(
                                                                  (item) =>
                                                                      item.id === trigger.id
                                                                          ? {
                                                                                ...item,
                                                                                active: true,
                                                                                target: pendingTarget,
                                                                            }
                                                                          : item,
                                                              ),
                                                          }
                                                        : page,
                                                );
                                                setEdges(
                                                    edgesOf(nextPages, startPageId, withPayment),
                                                );
                                                const nextIssues = funnelDiagnostics(
                                                    nextPages,
                                                    startPageId,
                                                ).issues;
                                                setNodes((current) =>
                                                    withPages(current, nextPages, nextIssues),
                                                );
                                                setSelectedTriggerId(trigger.id);
                                                setPendingTarget(null);
                                            }}
                                        />
                                        <span className="ce-flow-trigger-content">
                                            <Icon
                                                name={
                                                    trigger.kind === 'video-end'
                                                        ? 'clock'
                                                        : trigger.kind === 'video-cta'
                                                          ? 'play'
                                                          : 'pointer'
                                                }
                                                className="size-4"
                                            />
                                            <b title={trigger.label}>{trigger.label}</b>
                                            {trigger.active && trigger.target && (
                                                <small
                                                    title={
                                                        pages.find(
                                                            (page) => page.id === trigger.target,
                                                        )?.name ?? trigger.target
                                                    }
                                                >
                                                    →{' '}
                                                    {pages.find(
                                                        (page) => page.id === trigger.target,
                                                    )?.name ?? trigger.target}
                                                </small>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="ce-flow-trigger-empty">
                                <span>
                                    Esta página ainda não tem um botão ou vídeo para avançar.
                                </span>
                                <button type="button" onClick={() => onEdit(selectedPage.id)}>
                                    Editar página
                                </button>
                            </div>
                        )}
                        <p>
                            {pendingTarget
                                ? 'Escolha qual ação desta página cria a nova rota.'
                                : 'Arraste outra ligação para criar uma ramificação com outro gatilho.'}
                        </p>
                    </div>
                </aside>
            )}
            {inspected && !linkOpen && (
                <FunnelPageInspector
                    key={inspected.id}
                    page={inspected}
                    pages={pages}
                    startPageId={startPageId}
                    onClose={() => setInspectedId(null)}
                    onEdit={() => onEdit(inspected.id)}
                    onRemove={() => {
                        setInspectedId(null);
                        onRemove(inspected.id);
                    }}
                    onRename={(name) => onRename(inspected.id, name)}
                    onStart={() => onStart(inspected.id)}
                    onSetTriggerTarget={(triggerId, target) =>
                        onSetTriggerTarget(inspected.id, triggerId, target)
                    }
                />
            )}
            {actionsSlot &&
                createPortal(
                    <>
                        <IssuesButton
                            errors={[]}
                            warnings={diagnostics.messages.map((problem) => ({
                                nodeId: problem.pageId,
                                severity: 'warning' as const,
                                message: problem.message,
                            }))}
                            onFocus={(pageId) => {
                                setInspectedId(pageId);
                                void flow?.fitView({
                                    nodes: [{ id: pageId }],
                                    duration: 300,
                                    maxZoom: 1,
                                });
                            }}
                        />
                        <Button type="button" variant="ghost" onClick={arrange}>
                            <Icon name="route" className="size-3.5" />
                            Organizar
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9"
                            onClick={() => onAdd('blank', {})}
                        >
                            <Icon name="plus" className="size-3.5" />
                            Nova página
                        </Button>
                    </>,
                    actionsSlot,
                )}
            {picker && (
                <FunnelPagePicker
                    screen={picker.screen}
                    onPick={pick}
                    onClose={() => setPicker(null)}
                />
            )}
            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    entries={menuEntries(menu.nodeId)}
                    onClose={() => setMenu(null)}
                />
            )}
        </div>
    );
}

/*
 * Os cards do funil usam o mesmo desenho dos blocos do orquestrador (flow-node.tsx):
 * cabeçalho com ícone, título e descrição; entrada única à esquerda; saídas com rótulo
 * em pílulas na borda direita; aviso no canto. Muda o conteúdo, não o sistema visual.
 */
const FunnelPageNode = memo(function FunnelPageNode({ data }: NodeProps<PagedNode>) {
    const { page } = data;
    const content = page.kind === 'content';
    const checkout = page.kind === 'checkout';
    const outputs: FunnelOutput[] = checkout
        ? data.paymentLinked
            ? [{ id: 'pay', label: 'Pagar', tone: 'success' }]
            : routeOutputs(data.routes)
        : page.kind === 'pix'
          ? [{ id: 'paid', label: 'Pix pago', tone: 'success' }]
          : page.kind === 'boleto'
            ? [{ id: 'paid', label: 'Boleto pago', tone: 'success' }]
            : [];
    return (
        <div
            className="flow-card relative"
            data-kind={
                content
                    ? 'trigger'
                    : checkout
                      ? 'action'
                      : page.kind === 'failure'
                        ? 'danger'
                        : 'success'
            }
        >
            {data.issue && <IssueBadge issues={[{ severity: 'warning', message: data.issue }]} />}
            <FunnelInput connectable={content || checkout} />
            <FunnelCardHead
                icon={content ? 'layout' : checkout ? 'cart' : resultIcon(page.kind)}
                tone={
                    content
                        ? 'flow-tone-trigger'
                        : checkout
                          ? 'flow-tone-action'
                          : page.kind === 'failure'
                            ? 'flow-tone-danger'
                            : 'flow-tone-success'
                }
                title={page.name}
                subtitle={content ? `Página ${String(data.index + 1)}` : pageKindLabels[page.kind]}
                description={
                    content
                        ? 'Página de conteúdo do funil'
                        : checkout
                          ? 'Coleta os dados e inicia o pagamento'
                          : 'Exibida automaticamente ao final desta rota'
                }
            />
            {data.start && (
                <div className="flex flex-wrap gap-1 px-4 pb-4">
                    <span className="flow-pill rounded-full px-2 py-0.5 text-[10px] font-medium">
                        Primeira página
                    </span>
                </div>
            )}
            {content && (
                <div className="absolute inset-y-0 right-0 w-0">
                    <div className="relative top-1/2">
                        <Handle
                            type="source"
                            id="next"
                            position={Position.Right}
                            data-tone="success"
                            className="flow-output-dot"
                            title="Arraste para ligar a outra página, ou solte no vazio para criar uma"
                            aria-label="Saída"
                        />
                        <QuickAddButton
                            label={`Adicionar página depois de ${page.name}`}
                            onQuickAdd={data.onQuickAdd}
                        />
                    </div>
                </div>
            )}
            {outputs.length > 0 && <FunnelOutputs outputs={outputs} />}
        </div>
    );
});

/**
 * O pagamento no funil: recebe a venda do checkout, decide o gateway (modo simples no painel,
 * nós no editor avançado) e entrega às páginas de resultado.
 */
const FunnelPaymentNode = memo(function FunnelPaymentNode({ data }: NodeProps<PaymentNode>) {
    const { payment } = data;
    return (
        <div className="flow-card relative" data-kind="action">
            {payment.errors > 0 && (
                <IssueBadge
                    issues={[
                        {
                            severity: 'error',
                            message: `${String(payment.errors)} ${payment.errors === 1 ? 'problema' : 'problemas'} no fluxo de pagamento`,
                        },
                    ]}
                />
            )}
            <FunnelInput connectable={false} />
            <FunnelCardHead
                icon="bolt"
                tone="flow-tone-gateway"
                title="Pagamento"
                subtitle={
                    payment.source === 'own' ? 'Configurado neste checkout' : 'Usando o padrão'
                }
            />
            <div className="ce-payment-node-body">
                <div className="ce-payment-node-strategy">
                    <span
                        className="ce-payment-badge"
                        data-tone={
                            payment.errors > 0 || payment.route.length === 0 ? 'pending' : 'ready'
                        }
                    >
                        <Icon
                            name={
                                payment.errors > 0 || payment.route.length === 0
                                    ? 'alert'
                                    : 'check-circle'
                            }
                            className="size-3"
                        />
                        {payment.errors > 0
                            ? 'A corrigir'
                            : payment.route.length === 0
                              ? 'Sem gateway'
                              : 'Pronto'}
                    </span>
                    <b>{payment.lines[0]?.value}</b>
                </div>
                <RouteDiagram steps={payment.route} compact />
                <span className="ce-payment-node-cta">
                    <Icon name="settings" className="size-3.5" />
                    Abrir pagamento
                </span>
            </div>
            <FunnelOutputs outputs={routeOutputs(data.routes)} />
        </div>
    );
});

/** O link do checkout: a ligação dele aponta a página por onde o visitante começa. */
const FunnelEntryNode = memo(function FunnelEntryNode({ data }: NodeProps<EntryNode>) {
    return (
        <div className="flow-card relative" data-kind="trigger" data-compact="true">
            <FunnelCardHead
                icon="link"
                tone="flow-tone-trigger"
                title="Entrada"
                subtitle="Link do checkout"
            />
            <div className="absolute inset-y-0 right-0 w-0">
                <div className="relative top-1/2">
                    <Handle
                        type="source"
                        id="start"
                        position={Position.Right}
                        data-tone="success"
                        className="flow-output-dot"
                        title="Arraste para a primeira página"
                        aria-label="Saída"
                    />
                    <QuickAddButton
                        label="Adicionar primeira página"
                        onQuickAdd={data.onQuickAdd}
                    />
                </div>
            </div>
        </div>
    );
});

const nodeTypes = {
    'checkout-page': FunnelPageNode,
    payment: FunnelPaymentNode,
    entry: FunnelEntryNode,
};

type FunnelTone = 'success' | 'danger' | 'brand' | 'warning';
type FunnelOutput = { id: string; label: string; tone: FunnelTone };

/** Saídas do pagamento, só com as formas que têm rota (as desligadas no checkout somem). */
function routeOutputs(routes: FunnelRoutes) {
    return paymentOutputs.filter(
        (output) =>
            (output.id !== 'pix' || routes.pix) && (output.id !== 'boleto' || routes.boleto),
    );
}

/** Saídas do pagamento (e do checkout, quando o funil não mostra o nó Pagamento). */
const paymentOutputs: FunnelOutput[] = [
    { id: 'pix', label: 'Pix gerado', tone: 'brand' },
    { id: 'boleto', label: 'Boleto gerado', tone: 'warning' },
    { id: 'success', label: 'Aprovado', tone: 'success' },
    { id: 'failure', label: 'Recusado', tone: 'danger' },
];

function FunnelCardHead({
    icon,
    tone,
    title,
    subtitle,
    description,
}: {
    icon: IconName;
    tone: string;
    title: string;
    subtitle: string;
    description?: string;
}) {
    return (
        <div className="flex items-start gap-3 px-4 pb-4 pt-4">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon name={icon} className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
                <p
                    className="truncate text-[13px] font-semibold leading-5 tracking-[-0.01em]"
                    title={title}
                >
                    {title}
                </p>
                <p className="truncate text-[10px] text-muted">{subtitle}</p>
                {description && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

/** Entrada única à esquerda, como nos blocos do orquestrador. */
function FunnelInput({ connectable }: { connectable: boolean }) {
    return (
        <Handle
            type="target"
            id="in"
            position={Position.Left}
            isConnectable={connectable}
            className="flow-input-handle"
            title="Entrada"
            aria-label="Entrada"
        />
    );
}

/** Saídas fixas (o caminho do pagamento): pílula com rótulo e ponto na borda do card. */
function FunnelOutputs({ outputs }: { outputs: FunnelOutput[] }) {
    return (
        <div className="space-y-1.5 border-t border-border/70 px-4 pb-4 pt-3">
            {outputs.map((output) => (
                <div key={output.id} className="relative flex h-8 items-center justify-end">
                    <Handle
                        type="source"
                        id={output.id}
                        position={Position.Right}
                        isConnectable={false}
                        data-tone={output.tone}
                        className="flow-output-handle !cursor-default"
                        aria-label={output.label}
                    >
                        <span
                            className="flow-pill pointer-events-none max-w-[170px] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            data-tone={output.tone}
                        >
                            {output.label}
                        </span>
                        <span
                            className="flow-output-port pointer-events-none"
                            data-tone={output.tone}
                        />
                    </Handle>
                </div>
            ))}
        </div>
    );
}

/** O "+" ao lado da saída, como no orquestrador: cria a próxima página já ligada. */
function QuickAddButton({
    label,
    onQuickAdd,
}: {
    label: string;
    onQuickAdd?(screen: { x: number; y: number }): void;
}) {
    if (!onQuickAdd) return null;
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                onQuickAdd({ x: rect.right + 8, y: rect.top });
            }}
            className="flow-add-output nodrag absolute right-[-48px] top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-lg transition"
        >
            <Icon name="plus" className="size-3" />
        </button>
    );
}

/** Painel lateral da página selecionada: nome, entrada e para onde cada gatilho leva. */
function FunnelPageInspector({
    page,
    pages,
    startPageId,
    onClose,
    onEdit,
    onRemove,
    onRename,
    onStart,
    onSetTriggerTarget,
}: {
    page: BuilderFunnelPage;
    pages: BuilderFunnelPage[];
    startPageId: string;
    onClose(): void;
    onEdit(): void;
    onRemove(): void;
    onRename(name: string): void;
    onStart(): void;
    onSetTriggerTarget(triggerId: string, target: string | null): void;
}) {
    const content = page.kind === 'content';
    const start = startPageId === page.id;
    // Destinos possíveis: outra página de conteúdo (sem voltar a esta) ou o checkout.
    const targets = pages.filter(
        (item) =>
            (item.kind === 'content' &&
                item.id !== page.id &&
                item.id !== startPageId &&
                !reaches(pages, item.id, page.id)) ||
            item.id === CHECKOUT_PAGE_ID,
    );
    return (
        <aside className="ce-flow-link-inspector" aria-label={`Configurar ${page.name}`}>
            <header>
                <div>
                    <small>{content ? 'Página de conteúdo' : pageKindLabels[page.kind]}</small>
                    <strong title={page.name}>{page.name}</strong>
                </div>
                <button type="button" aria-label="Fechar" onClick={onClose}>
                    <Icon name="close" className="size-4" />
                </button>
            </header>
            <div className="ce-flow-link-inspector-body">
                {content ? (
                    <>
                        <label className="grid gap-1.5">
                            <span className="ce-flow-link-inspector-label">Nome</span>
                            <input
                                className="h-9 rounded-lg border border-border bg-transparent px-2.5 text-[12.5px] outline-none focus:border-foreground/30"
                                defaultValue={page.name}
                                onChange={(event) => onRename(event.currentTarget.value)}
                            />
                        </label>
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted/60 px-3 py-2 text-[12px]">
                            <span>
                                {start ? 'É a primeira página do funil' : 'Não é a primeira página'}
                            </span>
                            {!start && (
                                <button
                                    type="button"
                                    className="font-semibold underline"
                                    onClick={onStart}
                                >
                                    Tornar primeira
                                </button>
                            )}
                        </div>
                        <span className="ce-flow-link-inspector-label">
                            Para onde cada ação leva
                        </span>
                        {(page.triggers ?? []).length ? (
                            <div className="grid gap-2.5">
                                {(page.triggers ?? []).map((trigger) => (
                                    <div key={trigger.id} className="grid gap-1">
                                        <span
                                            className="truncate text-[11.5px] font-semibold"
                                            title={trigger.label}
                                        >
                                            {trigger.label}
                                        </span>
                                        <CustomSelect
                                            name={`target_${trigger.id}`}
                                            value={
                                                trigger.active && trigger.target
                                                    ? trigger.target
                                                    : ''
                                            }
                                            placeholder="Não avança"
                                            options={[
                                                { value: '', label: 'Não avança' },
                                                ...targets.map((item) => ({
                                                    value: item.id,
                                                    label: item.name,
                                                    ...(item.id === CHECKOUT_PAGE_ID
                                                        ? { badge: 'Checkout' }
                                                        : {}),
                                                })),
                                            ]}
                                            onValueChange={(value) =>
                                                onSetTriggerTarget(trigger.id, value || null)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Esta página ainda não tem um botão ou vídeo para avançar.</p>
                        )}
                    </>
                ) : (
                    <p>
                        {page.kind === 'checkout'
                            ? 'Coleta os dados e entrega a venda ao pagamento.'
                            : 'Exibida automaticamente ao final desta rota.'}
                    </p>
                )}
                <div className="grid gap-2 pt-1">
                    <button type="button" className="ce-button justify-center" onClick={onEdit}>
                        <Icon name="edit" className="size-3.5" />
                        <span>
                            {page.kind === 'checkout' ? 'Editar checkout' : 'Abrir no construtor'}
                        </span>
                    </button>
                    {content && (
                        <button
                            type="button"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#f2cbd0] px-3 text-[12px] font-semibold text-danger hover:bg-[#fff0f2]"
                            onClick={onRemove}
                        >
                            <Icon name="trash" className="size-3.5" />
                            Excluir página
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}

/** Se de `from` dá para chegar em `to` seguindo os gatilhos (evita ligações em ciclo). */
function reaches(pages: BuilderFunnelPage[], from: string, to: string) {
    const byId = new Map(pages.map((page) => [page.id, page]));
    const pending = [from];
    const seen = new Set<string>();
    while (pending.length) {
        const current = pending.shift();
        if (!current || seen.has(current)) continue;
        if (current === to) return true;
        seen.add(current);
        const page = byId.get(current);
        if (page?.kind === 'content') pending.push(...pageTargets(page));
    }
    return false;
}

/** Aplica páginas e problemas novos aos cards de página, sem tocar no nó Pagamento. */
function withPages(
    nodes: FunnelNode[],
    pages: BuilderFunnelPage[],
    issues: Map<string, string>,
): FunnelNode[] {
    return nodes.map((node) =>
        node.type === 'payment' || node.type === 'entry'
            ? node
            : {
                  ...node,
                  data: {
                      ...node.data,
                      page: pages.find((page) => page.id === node.id) ?? node.data.page,
                      issue: issues.get(node.id),
                  },
              },
    );
}

// Mesmo ritmo visual do orquestrador: card compacto e folga para o rótulo da ligação.
const columnGap = 380;
const mainRow = 360;

function entryPosition() {
    return { x: -360, y: mainRow + 100 };
}

function paymentPosition(contentCount: number) {
    return { x: (contentCount + 1) * columnGap, y: mainRow };
}
const edgeTypes = { flow: FlowEdge };

function defaultPosition(
    page: BuilderFunnelPage,
    index: number,
    contentCount: number,
    withPayment: boolean,
) {
    return arrangedPositionsFromCount(page, index, contentCount, withPayment);
}

function edgesOf(
    pages: BuilderFunnelPage[],
    startPageId: string,
    withPayment = false,
): FunnelEdge[] {
    const edges: FunnelEdge[] = [];
    const diagnostics = funnelDiagnostics(pages, startPageId);
    for (const page of pages) {
        if (page.kind !== 'content') continue;
        const activeTriggers = (page.triggers ?? []).filter(
            (trigger) => trigger.active && trigger.target,
        );
        const triggersByTarget = new Map<string, typeof activeTriggers>();
        for (const trigger of activeTriggers) {
            const target = trigger.target!;
            triggersByTarget.set(target, [...(triggersByTarget.get(target) ?? []), trigger]);
        }
        for (const [target, triggers] of triggersByTarget) {
            const labels = triggers.map((trigger) => triggerLabel(trigger.kind));
            const tone = diagnostics.issues.has(page.id) ? 'warning' : 'success';
            edges.push({
                id: `trigger:${page.id}:${target}`,
                source: page.id,
                target,
                sourceHandle: 'next',
                targetHandle: 'in',
                type: 'flow',
                data: {
                    label: triggers.length === 1 ? labels[0]! : '',
                    labels: triggers.length > 1 ? labels : undefined,
                    labelTitle: labels.join(' · '),
                    tone,
                    triggerId: triggers.length === 1 ? triggers[0]!.id : undefined,
                    triggerIds: triggers.map((trigger) => trigger.id),
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 16,
                    height: 16,
                    color: toneColor(tone),
                },
            });
        }
    }
    // O rótulo destas ligações já está na pílula da saída, como no orquestrador.
    const fixed = (source: string, target: string, tone: FunnelTone, sourceHandle: string) =>
        edges.push({
            id: `fixed:${source}:${target}`,
            source,
            target,
            sourceHandle,
            targetHandle: 'in',
            type: 'flow',
            deletable: false,
            selectable: false,
            data: { locked: true, label: '', tone },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: toneColor(tone),
            },
        });
    edges.push({
        id: `entry:${startPageId}`,
        source: ENTRY_NODE_ID,
        target: startPageId,
        sourceHandle: 'start',
        targetHandle: 'in',
        type: 'flow',
        deletable: false,
        data: { locked: true, label: 'Link do checkout', tone: 'success' },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: toneColor('success'),
        },
    });
    // Com o nó Pagamento, o checkout entrega a venda a ele e é ele quem leva aos resultados.
    const outcome = withPayment ? PAYMENT_NODE_ID : CHECKOUT_PAGE_ID;
    if (withPayment) fixed(CHECKOUT_PAGE_ID, PAYMENT_NODE_ID, 'success', 'pay');
    if (pages.some((page) => page.id === 'pix')) fixed(outcome, 'pix', 'brand', 'pix');
    if (pages.some((page) => page.id === 'boleto')) fixed(outcome, 'boleto', 'warning', 'boleto');
    fixed(outcome, 'success', 'success', 'success');
    fixed(outcome, 'failure', 'danger', 'failure');
    if (pages.some((page) => page.id === 'pix')) fixed('pix', 'success', 'success', 'paid');
    if (pages.some((page) => page.id === 'boleto')) fixed('boleto', 'success', 'success', 'paid');
    return edges;
}

function pendingEdge(source: string, target: string): FunnelEdge {
    return {
        id: `pending:${source}`,
        source,
        target,
        sourceHandle: 'next',
        targetHandle: 'in',
        type: 'flow',
        data: { label: 'Escolha o gatilho', tone: 'warning' },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: toneColor('warning'),
        },
    };
}

function funnelDiagnostics(pages: BuilderFunnelPage[], startPageId: string) {
    const byId = new Map(pages.map((page) => [page.id, page]));
    const content = pages.filter((page) => page.kind === 'content');
    const incoming = new Map<string, string[]>();
    for (const page of content) {
        for (const target of pageTargets(page))
            incoming.set(target, [...(incoming.get(target) ?? []), page.id]);
    }

    const reachable = new Set<string>();
    const queue = [startPageId];
    while (queue.length) {
        const current = queue.shift();
        if (!current || reachable.has(current)) continue;
        reachable.add(current);
        const page = byId.get(current);
        if (page?.kind === 'content') queue.push(...pageTargets(page));
    }

    const issues = new Map<string, string>();
    const messages: { pageId: string; message: string }[] = [];
    for (const page of content) {
        if (reachable.has(page.id)) continue;
        issues.set(page.id, 'Sem caminho de entrada');
        messages.push({
            pageId: page.id,
            message: `${page.name} não pode ser alcançada pela entrada do funil.`,
        });
    }
    for (const page of content) {
        if (!reachable.has(page.id) || pageTargets(page).length) continue;
        issues.set(page.id, 'Sem saída configurada');
        messages.push({
            pageId: page.id,
            message: `${page.name} não possui um gatilho ligado à próxima etapa.`,
        });
    }
    const startIncoming = incoming.get(startPageId) ?? [];
    if (startIncoming.length) {
        issues.set(startPageId, 'Entrada recebe conexão');
        messages.push({
            pageId: startPageId,
            message: 'A página de entrada não pode receber uma ligação de outra página.',
        });
    }
    return { issues, messages };
}

function isValidFunnelConnection(
    pages: BuilderFunnelPage[],
    startPageId: string,
    connection: Connection | FunnelEdge,
    contentIds: Set<string>,
) {
    const { source, target } = connection;
    // A Entrada pode apontar para qualquer página de conteúdo ou direto para o checkout.
    if (source === ENTRY_NODE_ID)
        return (
            target !== undefined &&
            target !== null &&
            target !== startPageId &&
            (target === CHECKOUT_PAGE_ID || contentIds.has(target))
        );
    if (!source || !target || !contentIds.has(source) || source === target) return false;
    if (target !== CHECKOUT_PAGE_ID && !contentIds.has(target)) return false;
    if (target === startPageId) return false;

    const sourcePage = pages.find((page) => page.id === source);
    if (!sourcePage?.triggers?.some((trigger) => !trigger.active)) return false;
    if (pageTargets(sourcePage).includes(target)) return false;

    const byId = new Map(pages.map((page) => [page.id, page]));
    const pending = [target];
    const visited = new Set<string>();
    while (pending.length) {
        const current = pending.shift();
        if (!current || visited.has(current)) continue;
        if (current === source) return false;
        visited.add(current);
        const page = byId.get(current);
        if (page?.kind === 'content') pending.push(...pageTargets(page));
    }
    return true;
}

function pageTargets(page: BuilderFunnelPage) {
    return [
        ...new Set(
            (page.triggers ?? []).flatMap((trigger) =>
                trigger.active && trigger.target ? [trigger.target] : [],
            ),
        ),
    ];
}

function triggerLabel(kind: NonNullable<BuilderFunnelPage['triggers']>[number]['kind']) {
    if (kind === 'video-end') return 'Ao terminar o vídeo';
    if (kind === 'video-cta') return 'Botão do vídeo';
    return 'Clique no botão';
}

function resultIcon(kind: BuilderFunnelPage['kind']) {
    if (kind === 'success') return 'check-circle' as const;
    if (kind === 'failure') return 'x-circle' as const;
    return 'clock' as const;
}

function arrangedPositions(pages: BuilderFunnelPage[], withPayment = false) {
    const contentCount = pages.filter((page) => page.kind === 'content').length;
    return Object.fromEntries([
        ...pages.map((page, index) => [
            page.id,
            arrangedPositionsFromCount(page, index, contentCount, withPayment),
        ]),
        ...(withPayment ? [[PAYMENT_NODE_ID, paymentPosition(contentCount)]] : []),
        [ENTRY_NODE_ID, entryPosition()],
    ]) as Record<string, BuilderFunnelPosition>;
}

function arrangedPositionsFromCount(
    page: BuilderFunnelPage,
    index: number,
    contentCount: number,
    withPayment = false,
) {
    if (page.kind === 'content') return { x: index * columnGap, y: mainRow };
    if (page.kind === 'checkout') return { x: contentCount * columnGap, y: mainRow };
    // O nó Pagamento ocupa a coluna logo depois do checkout; os resultados vêm depois dele.
    const branchX = (contentCount + (withPayment ? 2 : 1)) * columnGap;
    if (page.kind === 'pix') return { x: branchX, y: -220 };
    if (page.kind === 'boleto') return { x: branchX, y: 100 };
    if (page.kind === 'failure') return { x: branchX, y: 620 };
    return { x: (contentCount + (withPayment ? 3 : 2)) * columnGap, y: mainRow };
}
