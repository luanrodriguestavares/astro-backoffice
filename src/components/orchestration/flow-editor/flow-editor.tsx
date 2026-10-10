'use client';

import '@xyflow/react/dist/style.css';
import './flow-editor.css';

import {
    Background,
    BackgroundVariant,
    MarkerType,
    SelectionMode,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    useViewport,
    type Connection,
    type Edge,
    type FinalConnectionState,
} from '@xyflow/react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { ShellActions } from '@/components/layout/shell-actions';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import type {
    Checkout,
    FlowGraph,
    FlowIssue,
    FlowNode,
    FlowNodeType,
    FlowEvent,
    FlowSimulation,
    GatewayConnection,
    GatewayFlow,
    GatewayInsights,
    Product,
    WebhookEndpointSummary,
} from '@/lib/api/types';
import {
    autoLayout,
    createNode,
    hasInput,
    newId,
    nodeColor,
    nodeOutputs,
    type BlockCategory,
    outputLabel,
    outputTone,
    toneColor,
} from '@/lib/orchestration/flow';

import { BlockPalette, blockDragType } from './block-palette';
import { BlockPicker } from './block-picker';
import { ContextMenu, type MenuEntry } from './context-menu';
import { FlowEditorContext, type FlowEditorContextValue, type PickerRequest } from './flow-context';
import { FlowEdge, type FlowCanvasEdge } from './flow-edge';
import { FlowNodeCard, nodeTitle, type FlowCanvasNode } from './flow-node';
import { NodeInspector } from './node-inspector';
import { SimulationPanel, type SimulationInput } from './simulation-panel';
import { TemplateGallery } from './template-gallery';

const nodeTypes = { flow: FlowNodeCard };
const edgeTypes = { flow: FlowEdge };

type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';

interface Props {
    flow: GatewayFlow;
    connections: GatewayConnection[];
    insights: GatewayInsights | null;
    checkouts: Checkout[];
    products: Product[];
    webhooks: WebhookEndpointSummary[];
}

export function FlowEditor(props: Props) {
    return (
        <ReactFlowProvider>
            <Editor {...props} />
        </ReactFlowProvider>
    );
}

function Editor({ flow, connections, insights, checkouts, products, webhooks }: Props) {
    const reactFlow = useReactFlow<FlowCanvasNode, FlowCanvasEdge>();
    const canvas = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowCanvasNode>(
        toCanvasNodes(adoptLegacyMembership(flow.draft.nodes)),
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowCanvasEdge>(
        toCanvasEdges(flow.draft),
    );
    const [name, setName] = useState(flow.name);
    const [meta, setMeta] = useState(() => pickMeta(flow));
    const [issues, setIssues] = useState<FlowIssue[]>(flow.issues);
    const [saveState, setSaveState] = useState<SaveState>('saved');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [panel, setPanel] = useState<'inspector' | 'simulation' | null>(null);
    const [simulation, setSimulation] = useState<FlowSimulation | null>(null);
    const [simulating, setSimulating] = useState(false);
    const [picker, setPicker] = useState<PickerRequest | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [menu, setMenu] = useState<
        (MenuState & { title: string | undefined; entries: MenuEntry[] }) | null
    >(null);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [spaceHeld, setSpaceHeld] = useState(false);
    /** Seção destacada enquanto blocos são arrastados sobre ela. */
    const [dropSection, setDropSection] = useState<string | null>(null);
    /** Blocos dentro de cada seção arrastada, com a posição em que estavam no início. */
    const sectionDrag = useRef(
        new Map<
            string,
            { start: { x: number; y: number }; children: Map<string, { x: number; y: number }> }
        >(),
    );
    const [fullscreen, setFullscreen] = useState(false);
    const [inspectorTab, setInspectorTab] = useState<{ tab: 'config' | 'settings'; at: number }>({
        tab: 'config',
        at: 0,
    });
    const clipboard = useRef<FlowGraph | null>(null);
    const [hasClipboard, setHasClipboard] = useState(false);

    const graph = useMemo(() => fromCanvas(nodes, edges), [nodes, edges]);
    const key = useMemo(
        () => JSON.stringify({ name, nodes: graph.nodes, edges: graph.edges }),
        [name, graph],
    );

    // --- Histórico (desfazer/refazer) --------------------------------------------------
    const history = useRef({ past: [] as string[], future: [] as string[], current: key });
    const [historyFlags, setHistoryFlags] = useState({ canUndo: false, canRedo: false });
    const syncHistory = useCallback(
        () =>
            setHistoryFlags({
                canUndo: history.current.past.length > 0,
                canRedo: history.current.future.length > 0,
            }),
        [],
    );
    useEffect(() => {
        const timer = setTimeout(() => {
            const state = history.current;
            if (key === state.current) return;
            state.past = [...state.past.slice(-59), state.current];
            state.future = [];
            state.current = key;
            syncHistory();
        }, 300);
        return () => clearTimeout(timer);
    }, [key, syncHistory]);

    const restore = useCallback(
        (serialized: string) => {
            const parsed = JSON.parse(serialized) as { name: string } & FlowGraph;
            setName(parsed.name);
            setNodes(toCanvasNodes(parsed.nodes));
            setEdges(toCanvasEdges(parsed));
            setSelectedId(null);
            syncHistory();
        },
        [setEdges, setNodes, syncHistory],
    );
    const undo = useCallback(() => {
        const state = history.current;
        const previous = state.past.pop();
        if (previous === undefined) return;
        state.future.push(state.current);
        state.current = previous;
        restore(previous);
    }, [restore]);
    const redo = useCallback(() => {
        const state = history.current;
        const next = state.future.pop();
        if (next === undefined) return;
        state.past.push(state.current);
        state.current = next;
        restore(next);
    }, [restore]);

    // --- Rascunho automático -----------------------------------------------------------
    const savedKey = useRef(key);
    const saving = useRef(false);
    const latest = useRef({ key, name, graph, version: meta.version });
    useEffect(() => {
        latest.current = { key, name, graph, version: meta.version };
    }, [graph, key, meta.version, name]);

    const saveDraft = useCallback(async () => {
        if (saving.current) return;
        const snapshot = latest.current;
        if (snapshot.key === savedKey.current) return;
        saving.current = true;
        setSaveState('saving');
        const response = await fetch('/api/gateway-flow/draft', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: snapshot.name.trim().length >= 2 ? snapshot.name.trim() : undefined,
                graph: { ...snapshot.graph, viewport: reactFlow.getViewport() },
                expectedVersion: snapshot.version,
            }),
        }).catch(() => null);
        saving.current = false;
        const body = response
            ? ((await response.json().catch(() => ({}))) as { data?: GatewayFlow; detail?: string })
            : {};
        if (response?.status === 409) {
            setSaveState('conflict');
            showToast({ tone: 'error', description: body.detail ?? 'O fluxo mudou em outra aba.' });
            return;
        }
        if (!response?.ok || !body.data) {
            setSaveState('error');
            return;
        }
        savedKey.current = snapshot.key;
        setMeta(pickMeta(body.data));
        setIssues(body.data.issues);
        setSaveState(latest.current.key === snapshot.key ? 'saved' : 'dirty');
    }, [reactFlow]);

    useEffect(() => {
        if (key === savedKey.current || saveState === 'conflict') return;
        setSaveState((state) => (state === 'saving' ? state : 'dirty'));
        const timer = setTimeout(() => void saveDraft(), 1200);
        return () => clearTimeout(timer);
    }, [key, saveDraft, saveState]);

    useEffect(() => {
        function warn(event: BeforeUnloadEvent) {
            if (latest.current.key !== savedKey.current) event.preventDefault();
        }
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, []);

    // --- Edição ------------------------------------------------------------------------
    const updateNode = useCallback(
        (id: string, update: (node: FlowNode) => FlowNode) =>
            setNodes((current) =>
                current.map((item) => {
                    if (item.id !== id) return item;
                    const next = update(item.data.flow);
                    return { ...item, ...sizeOf(next), data: { flow: next } };
                }),
            ),
        [setNodes],
    );

    const addNode = useCallback(
        (
            type: FlowNodeType,
            position: { x: number; y: number },
            from?: PickerRequest['from'],
            event?: FlowEvent,
        ) => {
            const created = createNode(type, position, event);
            // Criado dentro de uma seção: entra nela.
            const holder =
                type === 'section'
                    ? undefined
                    : sectionAt(
                          { x: position.x + 118, y: position.y + 60 },
                          reactFlow.getNodes(),
                          new Set(),
                      );
            const node: FlowNode = holder ? { ...created, sectionId: holder.id } : created;
            setNodes((current) => [
                ...current.map((item) => ({ ...item, selected: false })),
                { ...toCanvasNode(node), selected: true },
            ]);
            if (from)
                setEdges((current) => [
                    ...current.filter(
                        (edge) =>
                            !(edge.source === from.nodeId && edge.sourceHandle === from.handle),
                    ),
                    canvasEdge({
                        id: newId('e'),
                        source: from.nodeId,
                        sourceHandle: from.handle,
                        target: node.id,
                    }),
                ]);
            setSelectedId(node.id);
            setPanel('inspector');
        },
        [reactFlow, setEdges, setNodes],
    );

    const viewportCenter = useCallback(() => {
        const rect = canvas.current?.getBoundingClientRect();
        const position = reactFlow.screenToFlowPosition({
            x: (rect?.left ?? 0) + (rect?.width ?? 800) / 2,
            y: (rect?.top ?? 0) + (rect?.height ?? 600) / 2,
        });
        return { x: position.x - 118 + jitter(), y: position.y - 50 + jitter() };
    }, [reactFlow]);

    const isValidConnection = useCallback(
        (connection: Connection | Edge) => {
            const { source, target, sourceHandle } = connection;
            if (source === target) return false;
            const targetNode = nodes.find((node) => node.id === target)?.data.flow;
            if (!targetNode || !hasInput(targetNode.type)) return false;
            if (sourceHandle === 'success' && targetNode.type !== 'success') return false;
            return !reaches(edges, target, source);
        },
        [edges, nodes],
    );

    const onConnect = useCallback(
        (connection: Connection) =>
            setEdges((current) => [
                ...current.filter(
                    (edge) =>
                        !(
                            edge.source === connection.source &&
                            edge.sourceHandle === (connection.sourceHandle ?? 'main')
                        ),
                ),
                canvasEdge({
                    id: newId('e'),
                    source: connection.source,
                    sourceHandle: connection.sourceHandle ?? 'main',
                    target: connection.target,
                }),
            ]),
        [setEdges],
    );

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
            if (state.isValid || !state.fromNode || state.fromHandle?.type !== 'source') return;
            if (state.toNode) return;
            const point = 'changedTouches' in event ? event.changedTouches[0] : event;
            if (!point) return;
            setPicker({
                screen: { x: point.clientX, y: point.clientY },
                from: { nodeId: state.fromNode.id, handle: state.fromHandle.id ?? 'main' },
            });
        },
        [],
    );

    const duplicate = useCallback(
        (id: string) => {
            const source = nodes.find((node) => node.id === id)?.data.flow;
            if (!source || source.type === 'trigger') return;
            const copy = {
                ...structuredClone(source),
                id: newId(source.type),
                position: { x: source.position.x + 40, y: source.position.y + 40 },
            } as FlowNode;
            setNodes((current) => [
                ...current.map((item) => ({ ...item, selected: false })),
                { ...toCanvasNode(copy), selected: true },
            ]);
            setSelectedId(copy.id);
        },
        [nodes, setNodes],
    );

    /** Troca a ligação A → B por A → novo → B, ligando a primeira saída do novo bloco. */
    function insertIntoEdge(edgeId: string, type: FlowNodeType) {
        const edge = edges.find((item) => item.id === edgeId);
        const source = edge ? reactFlow.getNode(edge.source) : undefined;
        const target = edge ? reactFlow.getNode(edge.target) : undefined;
        if (!edge || !source || !target) return;
        // Abre espaço: quem está do destino para a direita anda uma coluna, e o novo bloco
        // ocupa o lugar do destino.
        const gap = (source.measured?.width ?? 236) + 100;
        const node = createNode(type, { ...target.position });
        const output = nodeOutputs(node)[0]?.id;
        const keepsTarget =
            output !== undefined && (output !== 'success' || target.data.flow.type === 'success');
        setNodes((current) => [
            ...current.map((item) => {
                const shifted =
                    item.position.x >= target.position.x - 1
                        ? { x: item.position.x + gap, y: item.position.y }
                        : item.position;
                return {
                    ...item,
                    selected: false,
                    position: shifted,
                    data: { flow: { ...item.data.flow, position: shifted } },
                };
            }),
            { ...toCanvasNode(node), selected: true },
        ]);
        setEdges((current) => [
            ...current.filter((item) => item.id !== edgeId),
            canvasEdge({
                id: newId('e'),
                source: edge.source,
                sourceHandle: edge.sourceHandle ?? 'main',
                target: node.id,
            }),
            ...(keepsTarget
                ? [
                      canvasEdge({
                          id: newId('e'),
                          source: node.id,
                          sourceHandle: output,
                          target: edge.target,
                      }),
                  ]
                : []),
        ]);
        setSelectedId(node.id);
        setPanel('inspector');
    }

    /**
     * Onde o bloco novo vai entrar: depois de um pagamento (ou de um gatilho de evento) só
     * cabem lógica e ações; na escolha do gateway, ações não rodam.
     */
    function pickerExclusions(request: PickerRequest): BlockCategory[] {
        const edge = request.splitEdge
            ? edges.find((item) => item.id === request.splitEdge)
            : undefined;
        const origin = request.from?.nodeId ?? edge?.source;
        if (!origin) return [];
        return areaOf(origin, nodes, edges) === 'automation' ? ['gateway', 'outcome'] : ['action'];
    }

    function pickBlock(type: FlowNodeType, event?: FlowEvent) {
        if (!picker) return;
        const source =
            picker.besideSource && picker.from ? reactFlow.getNode(picker.from.nodeId) : undefined;
        const cursor = reactFlow.screenToFlowPosition(picker.screen);
        if (picker.splitEdge) {
            insertIntoEdge(picker.splitEdge, type);
            setPicker(null);
            return;
        }
        const wanted = source
            ? { x: source.position.x + (source.measured?.width ?? 236) + 100, y: cursor.y - 40 }
            : { x: cursor.x + 24, y: cursor.y - 40 };
        addNode(type, freeSpot(wanted, reactFlow.getNodes()), picker.from, event);
        setPicker(null);
    }

    /** Copia os blocos indicados (ou os selecionados) com as ligações entre eles. */
    const copySelection = useCallback(
        (only?: string[]) => {
            const chosen = nodes.filter(
                (node) =>
                    (only ? only.includes(node.id) : node.selected) &&
                    node.data.flow.type !== 'trigger',
            );
            if (chosen.length === 0) return false;
            const ids = new Set(chosen.map((node) => node.id));
            setHasClipboard(true);
            clipboard.current = fromCanvas(
                chosen,
                edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
            );
            showToast({
                tone: 'info',
                description: `${String(chosen.length)} bloco${chosen.length > 1 ? 's copiados' : ' copiado'}.`,
            });
            return true;
        },
        [edges, nodes],
    );

    /** Cola com ids novos; `at` é o canto superior esquerdo desejado (padrão: centro da tela). */
    const paste = useCallback(
        (at?: { x: number; y: number }) => {
            const copied = clipboard.current;
            if (!copied || copied.nodes.length === 0) return;
            const left = Math.min(...copied.nodes.map((node) => node.position.x));
            const top = Math.min(...copied.nodes.map((node) => node.position.y));
            const origin = at ?? viewportCenter();
            const ids = new Map(copied.nodes.map((node) => [node.id, newId(node.type)]));
            const pasted = copied.nodes.map(
                (node) =>
                    ({
                        ...structuredClone(node),
                        id: ids.get(node.id) ?? newId(node.type),
                        // Só mantém a seção se ela também foi copiada.
                        sectionId:
                            node.sectionId === undefined ? undefined : ids.get(node.sectionId),
                        position: {
                            x: origin.x + node.position.x - left,
                            y: origin.y + node.position.y - top,
                        },
                    }) as FlowNode,
            );
            setNodes((current) => [
                ...current.map((item) => ({ ...item, selected: false })),
                ...pasted.map((node) => ({ ...toCanvasNode(node), selected: true })),
            ]);
            setEdges((current) => [
                ...current,
                ...copied.edges.map((edge) =>
                    canvasEdge({
                        id: newId('e'),
                        source: ids.get(edge.source) ?? edge.source,
                        sourceHandle: edge.sourceHandle,
                        target: ids.get(edge.target) ?? edge.target,
                    }),
                ),
            ]);
        },
        [setEdges, setNodes, viewportCenter],
    );

    const selectAll = useCallback(
        () => setNodes((current) => current.map((item) => ({ ...item, selected: true }))),
        [setNodes],
    );

    const deleteSelection = useCallback(() => {
        const chosen = reactFlow
            .getNodes()
            .filter((node) => node.selected && node.data.flow.type !== 'trigger');
        void reactFlow.deleteElements({ nodes: chosen.map(({ id }) => ({ id })) });
    }, [reactFlow]);

    const disconnect = useCallback(
        (id: string) =>
            setEdges((current) =>
                current.filter((edge) => edge.source !== id && edge.target !== id),
            ),
        [setEdges],
    );

    const editor = useRef<HTMLDivElement>(null);
    const fullscreenRef = useRef(false);
    const toggleFullscreen = useCallback(() => {
        const next = !fullscreenRef.current;
        fullscreenRef.current = next;
        // Tela cheia do navegador na página toda: listas e avisos abertos no body continuam visíveis.
        try {
            if (next && !document.fullscreenElement)
                void document.documentElement.requestFullscreen().catch(() => undefined);
            if (!next && document.fullscreenElement)
                void document.exitFullscreen().catch(() => undefined);
        } catch {
            // Sem a API, o editor ainda ocupa a janela inteira.
        }
        setFullscreen(next);
        window.setTimeout(() => void reactFlow.fitView({ padding: 0.2, duration: 300 }), 120);
    }, [reactFlow]);

    useEffect(() => {
        function sync() {
            if (document.fullscreenElement) return;
            fullscreenRef.current = false;
            setFullscreen(false);
        }
        document.addEventListener('fullscreenchange', sync);
        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    const focusNode = useCallback(
        (id: string) => {
            const node = reactFlow.getNode(id);
            if (!node) return;
            void reactFlow.setCenter(node.position.x + 118, node.position.y + 60, {
                zoom: Math.max(reactFlow.getZoom(), 0.9),
                duration: 400,
            });
            setNodes((current) => current.map((item) => ({ ...item, selected: item.id === id })));
            setSelectedId(id);
            setPanel('inspector');
        },
        [reactFlow, setNodes],
    );

    // Atalhos no estilo n8n; ignorados enquanto o foco está num campo.
    useEffect(() => {
        function handle(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (event.key === 'Escape') {
                setPicker(null);
                setMenu(null);
                setPanel((current) => (current === 'inspector' ? null : current));
                // Como no Figma: Esc limpa a seleção.
                setNodes((current) =>
                    current.some((item) => item.selected)
                        ? current.map((item) =>
                              item.selected ? { ...item, selected: false } : item,
                          )
                        : current,
                );
                return;
            }
            const mod = event.metaKey || event.ctrlKey;
            if (event.shiftKey && !mod && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                toggleFullscreen();
                return;
            }
            if (!mod) return;
            const keyName = event.key.toLowerCase();
            if (keyName === 'c') {
                if (copySelection()) event.preventDefault();
            } else if (keyName === 'v') {
                event.preventDefault();
                paste();
            } else if (keyName === 'a') {
                event.preventDefault();
                selectAll();
            } else if (keyName === 's') {
                event.preventDefault();
                void saveDraft();
            } else if (keyName === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            } else if ((keyName === 'z' && event.shiftKey) || keyName === 'y') {
                event.preventDefault();
                redo();
            } else if (keyName === 'd' && selectedId) {
                event.preventDefault();
                duplicate(selectedId);
            }
        }
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [
        copySelection,
        duplicate,
        paste,
        redo,
        saveDraft,
        selectAll,
        selectedId,
        setNodes,
        toggleFullscreen,
        undo,
    ]);

    /*
     * Espaço segurado move o quadro (como no Figma) sempre que o mouse está sobre ele, mesmo
     * com o foco num botão: o foco sai do botão, senão soltar o Espaço "clicaria" nele no meio
     * do gesto. Em campos de texto o Espaço continua sendo só um espaço.
     */
    const pointerOverCanvas = useRef(false);
    useEffect(() => {
        const typing = (target: EventTarget | null) =>
            (target as HTMLElement | null)?.closest(
                'input, textarea, select, [contenteditable="true"]',
            ) != null;
        function down(event: KeyboardEvent) {
            if (event.code !== 'Space' || typing(event.target)) return;
            const element = event.target as HTMLElement | null;
            const inCanvas = element === document.body || element?.closest('.flow-canvas') != null;
            if (!pointerOverCanvas.current && !inCanvas) return;
            event.preventDefault();
            if (
                document.activeElement instanceof HTMLElement &&
                document.activeElement !== document.body
            )
                document.activeElement.blur();
            setSpaceHeld(true);
        }
        function up(event: KeyboardEvent) {
            if (event.code === 'Space') setSpaceHeld(false);
        }
        const release = () => setSpaceHeld(false);
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', release);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('blur', release);
        };
    }, []);

    /*
     * Seções, como frames do Figma: cada bloco guarda a seção onde foi colocado (sectionId).
     * Soltar um bloco dentro de uma seção o coloca nela; soltar fora o tira. Mover a seção
     * leva só os seus blocos, sem "adotar" o que estiver no caminho.
     */

    /**
     * Arraste de grupo: se a seleção inclui seções, elas e seus blocos acompanham o bloco
     * agarrado (o React Flow não arrasta seções por conta própria).
     */
    function startDrag(grabbed: FlowCanvasNode, dragged: FlowCanvasNode[]) {
        sectionDrag.current.clear();
        if (dragged.length < 2) return;
        const moving = new Set(dragged.map((node) => node.id));
        const all = reactFlow.getNodes();
        for (const section of all) {
            if (!section.selected || section.data.flow.type !== 'section') continue;
            const children = new Map<string, { x: number; y: number }>();
            for (const id of [section.id, ...descendantsOf(section.id, all)]) {
                const node = all.find((item) => item.id === id);
                if (node && !moving.has(id)) children.set(id, { ...node.position });
            }
            sectionDrag.current.set(section.id, { start: { ...grabbed.position }, children });
        }
    }

    function onDrag(grabbed: FlowCanvasNode, dragged: FlowCanvasNode[]) {
        if (sectionDrag.current.size === 0) {
            // Blocos soltos: destaca a seção onde vão cair.
            const draggedIds = new Set(dragged.map((node) => node.id));
            const target = sectionAt(centerOf(boxOf(grabbed)), reactFlow.getNodes(), draggedIds);
            setDropSection((current) =>
                current === (target?.id ?? null) ? current : (target?.id ?? null),
            );
            return;
        }
        const moves = new Map<string, { x: number; y: number }>();
        for (const drag of sectionDrag.current.values()) {
            const dx = grabbed.position.x - drag.start.x;
            const dy = grabbed.position.y - drag.start.y;
            for (const [id, start] of drag.children)
                moves.set(id, { x: start.x + dx, y: start.y + dy });
        }
        setNodes((current) =>
            current.map((item) => {
                const position = moves.get(item.id);
                return position ? { ...item, position } : item;
            }),
        );
    }

    /** Ao soltar: os blocos passam a pertencer à seção destacada (ou a nenhuma). */
    function endDrag(dragged: FlowCanvasNode[]) {
        const grouped = sectionDrag.current.size > 0;
        sectionDrag.current.clear();
        const target = dropSection;
        setDropSection(null);
        if (grouped) return;
        const ids = new Set(
            dragged.filter((node) => node.data.flow.type !== 'section').map((node) => node.id),
        );
        setNodes((current) =>
            current.map((item) =>
                ids.has(item.id) ? withSection(item, target ?? undefined) : item,
            ),
        );
        if (target) growSection(target, dragged.map(boxOf));
    }

    /**
     * Arraste da seção pela barra de título: move a moldura e os seus blocos, na grade e na
     * escala do zoom. Ao soltar, ela entra na seção maior que a contém (ou sai dela).
     */
    function beginSectionMove(id: string, event: React.PointerEvent) {
        if (event.button !== 0 || spaceHeld) return;
        const all = reactFlow.getNodes();
        const section = all.find((node) => node.id === id);
        if (!section) return;
        event.stopPropagation();
        const family = new Set([id, ...descendantsOf(id, all)]);
        const starts = new Map(
            all
                .filter((node) => family.has(node.id))
                .map((node) => [node.id, { ...node.position }]),
        );
        const origin = { x: event.clientX, y: event.clientY };
        const zoom = reactFlow.getZoom();
        setNodes((current) =>
            current.map((item) =>
                item.selected === (item.id === id) ? item : { ...item, selected: item.id === id },
            ),
        );
        const snap = (value: number) => Math.round(value / 10) * 10;
        let moved = false;
        function move(pointer: PointerEvent) {
            const dx = snap((pointer.clientX - origin.x) / zoom);
            const dy = snap((pointer.clientY - origin.y) / zoom);
            moved = moved || dx !== 0 || dy !== 0;
            setNodes((current) =>
                current.map((item) => {
                    const start = starts.get(item.id);
                    return start
                        ? { ...item, position: { x: start.x + dx, y: start.y + dy } }
                        : item;
                }),
            );
        }
        function stop() {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
            document.body.classList.remove('flow-moving-section');
            if (!moved) return;
            setNodes((current) => {
                const self = current.find((node) => node.id === id);
                if (!self) return current;
                const parent = current
                    .filter(
                        (node) =>
                            node.data.flow.type === 'section' &&
                            !family.has(node.id) &&
                            contains(boxOf(node), boxOf(self)),
                    )
                    .sort((left, right) => area(boxOf(left)) - area(boxOf(right)))[0];
                return current.map((item) =>
                    item.id === id ? withSection(item, parent?.id) : item,
                );
            });
        }
        document.body.classList.add('flow-moving-section');
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
    }

    /**
     * Fim do redimensionamento: o que ficou com o centro dentro da moldura entra na seção;
     * o que era dela e ficou de fora sai (volta para a seção de fora, se houver).
     */
    function resizeSection(id: string, box: Box) {
        setNodes((current) => {
            const self = current.find((node) => node.id === id);
            if (self?.data.flow.type !== 'section') return current;
            const frame = {
                x: Math.round(box.x),
                y: Math.round(box.y),
                width: Math.round(box.width),
                height: Math.round(box.height),
            };
            const parent = self.data.flow.sectionId;
            const ancestors = ancestorsOf(id, current);
            return current.map((item) => {
                if (item.id === id) {
                    const position = { x: frame.x, y: frame.y };
                    const flow = {
                        ...item.data.flow,
                        position,
                        config: {
                            ...item.data.flow.config,
                            width: frame.width,
                            height: frame.height,
                        },
                    } as FlowNode;
                    return {
                        ...item,
                        position,
                        width: frame.width,
                        height: frame.height,
                        data: { flow },
                    };
                }
                const inside =
                    item.data.flow.type === 'section'
                        ? contains(frame, boxOf(item))
                        : pointIn(centerOf(boxOf(item)), frame);
                const current = item.data.flow.sectionId;
                if (inside && (current === undefined || current === id || ancestors.has(current)))
                    return withSection(item, id);
                if (!inside && current === id) return withSection(item, parent);
                return item;
            });
        });
    }

    /** Redimensiona a seção para a caixa dada, sem mudar quem está nela. */
    function setSectionBox(id: string, box: Box) {
        const frame = {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
        };
        setNodes((current) =>
            current.map((item) => {
                if (item.id !== id || item.data.flow.type !== 'section') return item;
                const position = { x: frame.x, y: frame.y };
                const flow = {
                    ...item.data.flow,
                    position,
                    config: { ...item.data.flow.config, width: frame.width, height: frame.height },
                };
                return {
                    ...item,
                    position,
                    width: frame.width,
                    height: frame.height,
                    data: { flow },
                };
            }),
        );
    }

    /** Só cresce: garante que as caixas caibam inteiras, com folga. */
    function growSection(id: string, boxes: Box[]) {
        const section = reactFlow.getNode(id);
        if (!section) return;
        const frame = boxOf(section);
        const pad = 32;
        const left = Math.min(frame.x, ...boxes.map((box) => box.x - pad));
        const top = Math.min(frame.y, ...boxes.map((box) => box.y - sectionHeader));
        const right = Math.max(
            frame.x + frame.width,
            ...boxes.map((box) => box.x + box.width + pad),
        );
        const bottom = Math.max(
            frame.y + frame.height,
            ...boxes.map((box) => box.y + box.height + pad),
        );
        if (
            left === frame.x &&
            top === frame.y &&
            right === frame.x + frame.width &&
            bottom === frame.y + frame.height
        )
            return;
        setSectionBox(id, { x: left, y: top, width: right - left, height: bottom - top });
    }

    /** Encolhe ou cresce para envolver exatamente os blocos da seção. */
    function fitSectionToContent(id: string) {
        const members = sectionMembers(id);
        if (members.length === 0) return;
        const boxes = members.map(boxOf);
        const pad = 40;
        const left = Math.min(...boxes.map((box) => box.x)) - pad;
        const top = Math.min(...boxes.map((box) => box.y)) - sectionHeader;
        const right = Math.max(...boxes.map((box) => box.x + box.width)) + pad;
        const bottom = Math.max(...boxes.map((box) => box.y + box.height)) + pad;
        setSectionBox(id, { x: left, y: top, width: right - left, height: bottom - top });
    }

    /** Tira o bloco da seção e o coloca logo à direita dela. */
    function takeOutOfSection(id: string) {
        const all = reactFlow.getNodes();
        const node = all.find((item) => item.id === id);
        const section = all.find((item) => item.id === node?.data.flow.sectionId);
        if (!node || !section) return;
        const frame = boxOf(section);
        const position = freeSpot(
            { x: Math.round(frame.x + frame.width + 60), y: Math.round(node.position.y) },
            all.filter((item) => item.id !== id && item.data.flow.type !== 'section'),
        );
        setNodes((current) =>
            current.map((item) =>
                item.id === id
                    ? withSection({ ...item, position }, section.data.flow.sectionId)
                    : item,
            ),
        );
    }

    /** Blocos colocados diretamente na seção. */
    function sectionMembers(sectionId: string) {
        return reactFlow.getNodes().filter((node) => node.data.flow.sectionId === sectionId);
    }

    /** Cria uma seção em volta dos blocos selecionados (como "Frame selection" no Figma). */
    function wrapSelection() {
        const chosen = reactFlow.getNodes().filter((node) => node.selected);
        if (chosen.length === 0) return;
        const boxes = chosen.map(boxOf);
        const left = Math.min(...boxes.map((box) => box.x)) - 40;
        const top = Math.min(...boxes.map((box) => box.y)) - sectionHeader;
        const right = Math.max(...boxes.map((box) => box.x + box.width)) + 40;
        const bottom = Math.max(...boxes.map((box) => box.y + box.height)) + 40;
        const section = createNode('section', { x: Math.round(left), y: Math.round(top) });
        if (section.type !== 'section') return;
        // A seção nova fica onde os blocos estavam (se todos estavam na mesma seção).
        const parents = new Set(chosen.map((node) => node.data.flow.sectionId));
        const parent = parents.size === 1 ? [...parents][0] : undefined;
        const created: FlowNode = {
            ...section,
            ...(parent ? { sectionId: parent } : {}),
            config: {
                ...section.config,
                width: Math.round(right - left),
                height: Math.round(bottom - top),
            },
        };
        const ids = new Set(chosen.map((node) => node.id));
        setNodes((current) => [
            ...current.map((item) =>
                ids.has(item.id)
                    ? { ...withSection(item, created.id), selected: false }
                    : { ...item, selected: false },
            ),
            { ...toCanvasNode(created), selected: true },
        ]);
        setSelectedId(created.id);
        setInspectorTab((state) => ({ tab: 'config', at: state.at + 1 }));
        setPanel('inspector');
    }

    // --- Publicar, pausar, simular -----------------------------------------------------
    async function publish() {
        setPublishing(true);
        const response = await fetch('/api/gateway-flow/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: name.trim().length >= 2 ? name.trim() : undefined,
                graph: { ...graph, viewport: reactFlow.getViewport() },
                expectedVersion: meta.version,
            }),
        }).catch(() => null);
        setPublishing(false);
        const body = response
            ? ((await response.json().catch(() => ({}))) as {
                  data?: GatewayFlow;
                  detail?: string;
                  meta?: { issues?: FlowIssue[] };
              })
            : {};
        if (!response?.ok || !body.data) {
            if (body.meta?.issues) setIssues(body.meta.issues);
            if (response?.status === 409) setSaveState('conflict');
            const firstError = body.meta?.issues?.find((issue) => issue.nodeId);
            if (firstError?.nodeId) focusNode(firstError.nodeId);
            showToast({
                tone: 'error',
                title: 'Não foi possível publicar',
                description: body.detail ?? 'Tente novamente em instantes.',
            });
            return;
        }
        savedKey.current = key;
        setSaveState('saved');
        setMeta(pickMeta(body.data));
        setIssues(body.data.issues);
        showToast({
            tone: 'success',
            title: 'Fluxo publicado',
            description: 'As próximas vendas já seguem este fluxo.',
        });
    }

    async function setStatus(status: 'active' | 'inactive') {
        const response = await fetch('/api/gateway-flow', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status }),
        }).catch(() => null);
        const body = response
            ? ((await response.json().catch(() => ({}))) as { data?: GatewayFlow; detail?: string })
            : {};
        if (!response?.ok || !body.data) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível alterar o fluxo.',
            });
            return;
        }
        setMeta(pickMeta(body.data));
        showToast({
            tone: 'success',
            description:
                status === 'active'
                    ? 'Fluxo ativado. As vendas voltam a seguir o fluxo.'
                    : 'Fluxo pausado. As vendas usam o gateway de cada checkout.',
        });
    }

    async function simulate(input: SimulationInput) {
        setSimulating(true);
        const response = await fetch('/api/gateway-flow/simulate', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                graph,
                ...(input.event ? { event: input.event } : {}),
                context: { ...input, event: undefined },
            }),
        }).catch(() => null);
        setSimulating(false);
        const body = response
            ? ((await response.json().catch(() => ({}))) as {
                  data?: FlowSimulation;
                  detail?: string;
              })
            : {};
        if (!response?.ok || !body.data) {
            showToast({ tone: 'error', description: body.detail ?? 'Não foi possível simular.' });
            return;
        }
        setSimulation(body.data);
    }

    function applyTemplate(template: FlowGraph) {
        if (
            graph.nodes.length > 4 &&
            !window.confirm(
                'Substituir o rascunho atual por este modelo? Dá para desfazer com Ctrl+Z.',
            )
        )
            return;
        setNodes(toCanvasNodes(template.nodes));
        setEdges(toCanvasEdges(template));
        setSelectedId(null);
        setSimulation(null);
        window.setTimeout(() => void reactFlow.fitView({ padding: 0.2, duration: 400 }), 50);
    }

    /** Adiciona um grafo abaixo do que já existe, com ids novos para não colidir. */
    function appendGraph(addition: FlowGraph) {
        const bottom = Math.max(
            0,
            ...reactFlow.getNodes().map((node) => node.position.y + (node.measured?.height ?? 120)),
        );
        const top = Math.min(...addition.nodes.map((node) => node.position.y));
        const left = Math.min(...addition.nodes.map((node) => node.position.x));
        const ids = new Map(addition.nodes.map((node) => [node.id, newId(node.id)]));
        const added = addition.nodes.map(
            (node) =>
                ({
                    ...node,
                    id: ids.get(node.id) ?? newId(node.type),
                    position: {
                        x: node.position.x - left,
                        y: node.position.y - top + bottom + 160,
                    },
                }) as FlowNode,
        );
        setNodes((current) => [
            ...current.map((item) => ({ ...item, selected: false })),
            ...added.map((node) => ({ ...toCanvasNode(node), selected: true })),
        ]);
        setEdges((current) => [
            ...current,
            ...addition.edges.map((edge) =>
                canvasEdge({
                    id: newId('e'),
                    source: ids.get(edge.source) ?? edge.source,
                    sourceHandle: edge.sourceHandle,
                    target: ids.get(edge.target) ?? edge.target,
                }),
            ),
        ]);
        window.setTimeout(() => void reactFlow.fitView({ padding: 0.2, duration: 400 }), 50);
    }

    function arrange() {
        const arranged = autoLayout(graph);
        setNodes((current) =>
            current.map((item) => {
                const node = arranged.nodes.find((candidate) => candidate.id === item.id);
                return node ? { ...item, position: node.position, data: { flow: node } } : item;
            }),
        );
        window.setTimeout(() => void reactFlow.fitView({ padding: 0.2, duration: 400 }), 50);
    }

    // --- Derivados para renderizar -----------------------------------------------------
    const flowById = useMemo(
        () => new Map(nodes.map((node) => [node.id, node.data.flow])),
        [nodes],
    );
    const simEdges = useMemo(() => new Set(simulation?.edges ?? []), [simulation]);
    const renderedEdges = useMemo(
        () =>
            edges.map((edge) => {
                const source = flowById.get(edge.source);
                const handle = edge.sourceHandle ?? 'main';
                const tone = outputTone(source, handle);
                return {
                    ...edge,
                    type: 'flow' as const,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 16,
                        height: 16,
                        color: toneColor(tone),
                    },
                    data: {
                        // Saídas de gateway já têm a cor e o tracejado; o rótulo fica no card.
                        label: isGateway(source) ? '' : outputLabel(source, handle),
                        tone,
                        sim: simulation?.path.length
                            ? simEdges.has(edge.id)
                                ? ('on' as const)
                                : ('off' as const)
                            : undefined,
                    },
                };
            }),
        [edges, flowById, simEdges, simulation],
    );

    // Referência estável para o contexto: os cards não precisam renderizar de novo a cada
    // render do editor só porque a função foi recriada.
    const sectionMoveRef = useRef(beginSectionMove);
    useEffect(() => {
        sectionMoveRef.current = beginSectionMove;
    });
    const startSectionMove = useCallback(
        (id: string, event: React.PointerEvent) => sectionMoveRef.current(id, event),
        [],
    );
    const resizeRef = useRef(resizeSection);
    useEffect(() => {
        resizeRef.current = resizeSection;
    });
    const finishSectionResize = useCallback(
        (id: string, box: Box) => resizeRef.current(id, box),
        [],
    );

    // Quantos blocos cada seção tem (só os colocados diretamente nela).
    const sectionCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const node of nodes) {
            const section = node.data.flow.sectionId;
            if (section !== undefined) counts.set(section, (counts.get(section) ?? 0) + 1);
        }
        return counts;
    }, [nodes]);

    const context = useMemo<FlowEditorContextValue>(() => {
        const issueMap = new Map<string, FlowIssue[]>();
        for (const issue of issues)
            if (issue.nodeId)
                issueMap.set(issue.nodeId, [...(issueMap.get(issue.nodeId) ?? []), issue]);
        return {
            connections: new Map(connections.map((connection) => [connection.id, connection])),
            webhooks: new Map(webhooks.map((endpoint) => [endpoint.id, endpoint])),
            stats: new Map(
                (insights?.gateways ?? []).map((item) => [item.gatewayConnectionId, item]),
            ),
            names: {
                checkouts: new Map(checkouts.map((checkout) => [checkout.id, checkout.name])),
                products: new Map(products.map((product) => [product.id, product.name])),
            },
            issues: issueMap,
            linkedOutputs: new Set(
                edges.map((edge) => `${edge.source}:${edge.sourceHandle ?? 'main'}`),
            ),
            simulation,
            fallbackNodes: new Set(
                edges.filter((edge) => edge.sourceHandle === 'failure').map((edge) => edge.target),
            ),
            openPicker: setPicker,
            beginSectionMove: startSectionMove,
            resizeSection: finishSectionResize,
            dropSection,
            sectionCounts,
            canConnect: (source, handle, target) =>
                isValidConnection({ source, sourceHandle: handle, target, targetHandle: null }),
            updateNode,
        };
    }, [
        checkouts,
        connections,
        edges,
        insights,
        isValidConnection,
        issues,
        products,
        simulation,
        updateNode,
        webhooks,
        dropSection,
        sectionCounts,
        startSectionMove,
        finishSectionResize,
    ]);

    const selected = selectedId ? flowById.get(selectedId) : undefined;
    const usableGateways = connections.filter((connection) => connection.status !== 'disabled');
    const availableEvents = useMemo(
        () => [
            ...new Set(
                graph.nodes.flatMap((node) =>
                    node.type === 'event_trigger' ? [node.config.event] : [],
                ),
            ),
        ],
        [graph],
    );

    // Ambiente padrão da simulação: o dos gateways usados no fluxo (ou, sem nenhum, o da
    // conta). Simular em outro ambiente pularia todos eles.
    const simulationEnvironment = useMemo<'sandbox' | 'production'>(() => {
        const byId = new Map(connections.map((connection) => [connection.id, connection]));
        const used = graph.nodes.flatMap((node) =>
            node.type === 'gateway' && node.config.gatewayConnectionId
                ? [node.config.gatewayConnectionId]
                : node.type === 'cheapest'
                  ? node.config.gatewayConnectionIds
                  : [],
        );
        const environments = (used.length > 0 ? used.map((id) => byId.get(id)) : connections)
            .filter((connection) => connection !== undefined && connection.status !== 'disabled')
            .map((connection) => connection?.environment);
        return environments.length > 0 && environments.every((value) => value === 'sandbox')
            ? 'sandbox'
            : 'production';
    }, [connections, graph]);
    const templateReferences = useMemo(
        () => ({
            primaryGateway: usableGateways[0]?.id ?? null,
            backupGateway: usableGateways[1]?.id ?? null,
            webhookEndpoint: webhooks.find((endpoint) => endpoint.status === 'active')?.id ?? null,
        }),
        [usableGateways, webhooks],
    );
    const hasTrigger = graph.nodes.some((node) => node.type === 'trigger');
    const errors = issues.filter((issue) => issue.severity === 'error');
    const warnings = issues.filter((issue) => issue.severity === 'warning');
    const changed = meta.published === null || structure(meta.published) !== structure(graph);
    const panelOpen = panel === 'simulation' || (panel === 'inspector' && selected !== undefined);

    function openInspector(id: string, tab: 'config' | 'settings' = 'config') {
        setNodes((current) => current.map((item) => ({ ...item, selected: item.id === id })));
        setSelectedId(id);
        setInspectorTab((current) => ({ tab, at: current.at + 1 }));
        setPanel('inspector');
    }

    /** Monta as opções na hora do clique (evento), não durante o render. */
    function openMenu(state: MenuState) {
        setMenu({
            ...state,
            title: menuTitle(state, flowById, context.connections),
            entries: menuEntries(state),
        });
    }

    function menuEntries(state: MenuState): MenuEntry[] {
        const common: MenuEntry[] = [
            {
                label: 'Desfazer',
                icon: 'undo',
                shortcut: 'Ctrl Z',
                disabled: !historyFlags.canUndo,
                onSelect: undo,
            },
            {
                label: 'Refazer',
                icon: 'redo',
                shortcut: 'Ctrl ⇧ Z',
                disabled: !historyFlags.canRedo,
                onSelect: redo,
            },
        ];
        const screen = { x: state.x, y: state.y };
        if (state.kind === 'node') {
            const node = flowById.get(state.id);
            if (!node) return common;
            const free = nodeOutputs(node).find(
                (output) => !context.linkedOutputs.has(`${node.id}:${output.id}`),
            );
            const isTrigger = node.type === 'trigger';
            if (node.type === 'section') {
                const members = sectionMembers(node.id);
                return [
                    {
                        label: 'Renomear',
                        icon: 'edit',
                        shortcut: 'Duplo clique no título',
                        onSelect: () => openInspector(node.id),
                    },
                    {
                        label: 'Ajustar ao conteúdo',
                        icon: 'maximize',
                        disabled: members.length === 0,
                        onSelect: () => fitSectionToContent(node.id),
                    },
                    {
                        label: `Selecionar blocos da seção (${String(members.length)})`,
                        icon: 'layers',
                        disabled: members.length === 0,
                        onSelect: () => {
                            const ids = new Set(members.map((member) => member.id));
                            setNodes((current) =>
                                current.map((item) => ({ ...item, selected: ids.has(item.id) })),
                            );
                        },
                    },
                    'separator',
                    {
                        label: 'Desfazer seção (manter blocos)',
                        icon: 'unlink',
                        onSelect: () => void reactFlow.deleteElements({ nodes: [{ id: node.id }] }),
                    },
                    {
                        label: 'Excluir seção e blocos',
                        icon: 'trash',
                        danger: true,
                        disabled: members.some((member) => member.data.flow.type === 'trigger'),
                        onSelect: () =>
                            void reactFlow.deleteElements({
                                nodes: [node.id, ...members.map((member) => member.id)].map(
                                    (id) => ({
                                        id,
                                    }),
                                ),
                            }),
                    },
                ];
            }
            const container = node.sectionId ? reactFlow.getNode(node.sectionId) : undefined;
            return [
                {
                    label: 'Configurar',
                    icon: 'settings',
                    shortcut: 'Duplo clique',
                    onSelect: () => openInspector(node.id),
                },
                {
                    label: 'Renomear',
                    icon: 'edit',
                    onSelect: () => openInspector(node.id, 'settings'),
                },
                ...(container && container.data.flow.type === 'section'
                    ? [
                          {
                              label: `Tirar da seção “${container.data.flow.config.title || 'sem título'}”`,
                              icon: 'unlink' as const,
                              onSelect: () => takeOutOfSection(node.id),
                          },
                      ]
                    : []),
                ...(free
                    ? [
                          {
                              label: free.label
                                  ? `Adicionar bloco em "${free.label}"`
                                  : 'Adicionar bloco depois',
                              icon: 'plus' as const,
                              onSelect: () =>
                                  setPicker({
                                      screen,
                                      from: { nodeId: node.id, handle: free.id },
                                      besideSource: true,
                                  }),
                          },
                      ]
                    : []),
                'separator',
                {
                    label: 'Duplicar',
                    icon: 'copy',
                    shortcut: 'Ctrl D',
                    disabled: isTrigger,
                    onSelect: () => duplicate(node.id),
                },
                {
                    label: 'Copiar',
                    icon: 'clipboard',
                    shortcut: 'Ctrl C',
                    disabled: isTrigger,
                    onSelect: () => void copySelection([node.id]),
                },
                {
                    label: 'Remover ligações',
                    icon: 'unlink',
                    disabled: !edges.some(
                        (edge) => edge.source === node.id || edge.target === node.id,
                    ),
                    onSelect: () => disconnect(node.id),
                },
                'separator',
                {
                    label: isTrigger ? 'O gatilho não pode ser excluído' : 'Excluir bloco',
                    icon: 'trash',
                    shortcut: isTrigger ? undefined : 'Del',
                    danger: !isTrigger,
                    disabled: isTrigger,
                    onSelect: () => void reactFlow.deleteElements({ nodes: [{ id: node.id }] }),
                },
            ];
        }
        if (state.kind === 'edge')
            return [
                {
                    label: 'Inserir bloco no meio',
                    icon: 'plus',
                    onSelect: () => setPicker({ screen, splitEdge: state.id }),
                },
                {
                    label: 'Excluir ligação',
                    icon: 'trash',
                    shortcut: 'Del',
                    danger: true,
                    onSelect: () => void reactFlow.deleteElements({ edges: [{ id: state.id }] }),
                },
            ];
        if (state.kind === 'selection') {
            const count = nodes.filter((node) => node.selected).length;
            return [
                {
                    label: `Copiar ${String(count)} blocos`,
                    icon: 'clipboard',
                    shortcut: 'Ctrl C',
                    onSelect: () => void copySelection(),
                },
                {
                    label: `Duplicar ${String(count)} blocos`,
                    icon: 'copy',
                    onSelect: () => {
                        if (copySelection()) paste();
                    },
                },
                {
                    label: 'Criar seção com a seleção',
                    icon: 'layout',
                    onSelect: wrapSelection,
                },
                'separator',
                {
                    label: `Excluir ${String(count)} blocos`,
                    icon: 'trash',
                    shortcut: 'Del',
                    danger: true,
                    onSelect: deleteSelection,
                },
            ];
        }
        const flowPosition = reactFlow.screenToFlowPosition(screen);
        return [
            { label: 'Adicionar bloco aqui', icon: 'plus', onSelect: () => setPicker({ screen }) },
            { label: 'Ver modelos', icon: 'layers', onSelect: () => setGalleryOpen(true) },
            {
                label: 'Adicionar nota aqui',
                icon: 'note',
                onSelect: () => addNode('note', flowPosition),
            },
            {
                label: 'Adicionar seção aqui',
                icon: 'layout',
                onSelect: () => addNode('section', flowPosition),
            },
            {
                label: 'Colar',
                icon: 'clipboard',
                shortcut: 'Ctrl V',
                disabled: !hasClipboard,
                onSelect: () => paste(flowPosition),
            },
            'separator',
            { label: 'Selecionar tudo', icon: 'layers', shortcut: 'Ctrl A', onSelect: selectAll },
            { label: 'Organizar automaticamente', icon: 'layout', onSelect: arrange },
            {
                label: 'Ajustar à tela',
                icon: 'maximize',
                onSelect: () => void reactFlow.fitView({ padding: 0.2, duration: 300 }),
            },
            {
                label: fullscreen ? 'Sair da tela cheia' : 'Tela cheia',
                icon: fullscreen ? 'shrink' : 'expand',
                shortcut: '⇧ F',
                onSelect: toggleFullscreen,
            },
            'separator',
            ...common,
        ];
    }

    return (
        <FlowEditorContext.Provider value={context}>
            {withPortal(
                fullscreen,
                <div ref={editor} className={fullscreen ? 'flow-fullscreen' : undefined}>
                    <div
                        className={`${fullscreen ? 'mb-3' : 'mb-4'} flex flex-col justify-between gap-4 sm:flex-row sm:items-center`}
                    >
                        <div className="min-w-0">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                                Orquestração
                            </p>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <label className="group relative flex items-center">
                                    <span className="sr-only">Nome do fluxo</span>
                                    <input
                                        value={name}
                                        maxLength={160}
                                        onChange={(event) => setName(event.target.value)}
                                        className="flow-title-input w-[min(60vw,22ch)] outline-none"
                                    />
                                    <Icon
                                        name="edit"
                                        className="size-3.5 text-muted opacity-0 transition group-hover:opacity-100"
                                    />
                                </label>
                                <StatusChip meta={meta} changed={changed} />
                                <SaveIndicator state={saveState} updatedAt={meta.updatedAt} />
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <ShellActions />
                            <IssuesButton errors={errors} warnings={warnings} onFocus={focusNode} />
                            <Button
                                type="button"
                                variant="secondary"
                                aria-pressed={panel === 'simulation'}
                                onClick={() => {
                                    if (panel === 'simulation') {
                                        setPanel(null);
                                        setSimulation(null);
                                    } else setPanel('simulation');
                                }}
                            >
                                <Icon name="play" className="size-3.5" />
                                Simular
                            </Button>
                            <button
                                type="button"
                                disabled={publishing || saveState === 'conflict'}
                                onClick={() => void publish()}
                                className="flow-highlight-button inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold transition"
                            >
                                {publishing ? 'Publicando…' : 'Publicar fluxo'}
                                <Icon name="arrow-right" className="size-3.5" />
                            </button>
                            <FlowMenu
                                status={meta.status}
                                published={meta.published !== null}
                                onArrange={arrange}
                                onStatus={(status) => void setStatus(status)}
                                onRevert={() => {
                                    if (!meta.published) return;
                                    if (
                                        !window.confirm(
                                            'Descartar o rascunho e voltar para a versão publicada?',
                                        )
                                    )
                                        return;
                                    applyTemplate(meta.published);
                                }}
                            />
                        </div>
                    </div>

                    <div
                        className={`glass-panel relative flex overflow-hidden rounded-[24px] ${fullscreen ? 'min-h-0 flex-1' : 'h-[calc(100dvh-210px)] min-h-[600px]'}`}
                    >
                        {paletteOpen && (
                            <div className="absolute inset-y-0 left-0 z-20 w-[248px] shrink-0 lg:static">
                                <BlockPalette
                                    hasTrigger={hasTrigger}
                                    templatesOpen={galleryOpen}
                                    onAdd={(type, event) => {
                                        setGalleryOpen(false);
                                        addNode(type, viewportCenter(), undefined, event);
                                    }}
                                    onOpenTemplates={() => setGalleryOpen(true)}
                                    onCloseTemplates={() => setGalleryOpen(false)}
                                />
                            </div>
                        )}

                        <div
                            ref={canvas}
                            data-space={spaceHeld ? 'true' : undefined}
                            onPointerEnter={() => {
                                pointerOverCanvas.current = true;
                            }}
                            onPointerLeave={() => {
                                pointerOverCanvas.current = false;
                            }}
                            onPointerDownCapture={(event) => {
                                // Agarrar um bloco não selecionado seleciona só ele: assim o
                                // arraste não leva junto uma seção (ou outro bloco) selecionada.
                                if (event.button !== 0 || spaceHeld) return;
                                if (event.shiftKey || event.metaKey || event.ctrlKey) return;
                                const target = event.target as HTMLElement;
                                // Vazio dentro de uma seção selecionada: arrastar move a seção.
                                if (target.classList.contains('react-flow__pane')) {
                                    const point = reactFlow.screenToFlowPosition({
                                        x: event.clientX,
                                        y: event.clientY,
                                    });
                                    const section = sectionAt(
                                        point,
                                        reactFlow.getNodes().filter((node) => node.selected),
                                        new Set(),
                                    );
                                    if (section) beginSectionMove(section.id, event);
                                    return;
                                }
                                if (target.closest('.react-flow__handle, .nodrag, button')) return;
                                const id = target
                                    .closest('.react-flow__node')
                                    ?.getAttribute('data-id');
                                if (!id || reactFlow.getNode(id)?.selected) return;
                                setNodes((current) =>
                                    current.map((item) =>
                                        item.selected === (item.id === id)
                                            ? item
                                            : { ...item, selected: item.id === id },
                                    ),
                                );
                            }}
                            className="flow-canvas relative min-w-0 flex-1"
                            onDragOver={(event) => {
                                if (event.dataTransfer.types.includes(blockDragType)) {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                }
                            }}
                            onDrop={(event) => {
                                const [type, flowEvent] = event.dataTransfer
                                    .getData(blockDragType)
                                    .split(':') as [FlowNodeType, FlowEvent | undefined];
                                if (!type) return;
                                event.preventDefault();
                                const position = reactFlow.screenToFlowPosition({
                                    x: event.clientX,
                                    y: event.clientY,
                                });
                                addNode(
                                    type,
                                    { x: position.x - 118, y: position.y - 40 },
                                    undefined,
                                    flowEvent,
                                );
                            }}
                        >
                            <ReactFlow<FlowCanvasNode, FlowCanvasEdge>
                                nodes={nodes}
                                edges={renderedEdges}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onConnectEnd={onConnectEnd}
                                isValidConnection={isValidConnection}
                                onNodeClick={(_, node) => {
                                    setSelectedId(node.id);
                                    if (panel !== 'simulation') setPanel('inspector');
                                }}
                                onNodeDoubleClick={(_, node) => {
                                    setSelectedId(node.id);
                                    setPanel('inspector');
                                }}
                                onNodeContextMenu={(event, node) => {
                                    event.preventDefault();
                                    const multiple =
                                        nodes.filter((item) => item.selected).length > 1;
                                    openMenu(
                                        multiple && node.selected
                                            ? {
                                                  kind: 'selection',
                                                  x: event.clientX,
                                                  y: event.clientY,
                                              }
                                            : {
                                                  kind: 'node',
                                                  id: node.id,
                                                  x: event.clientX,
                                                  y: event.clientY,
                                              },
                                    );
                                }}
                                onEdgeContextMenu={(event, edge) => {
                                    event.preventDefault();
                                    openMenu({
                                        kind: 'edge',
                                        id: edge.id,
                                        x: event.clientX,
                                        y: event.clientY,
                                    });
                                }}
                                onSelectionContextMenu={(event) => {
                                    event.preventDefault();
                                    openMenu({
                                        kind: 'selection',
                                        x: event.clientX,
                                        y: event.clientY,
                                    });
                                }}
                                onPaneContextMenu={(event) => {
                                    event.preventDefault();
                                    openMenu({ kind: 'pane', x: event.clientX, y: event.clientY });
                                }}
                                onPaneClick={(event) => {
                                    setPicker(null);
                                    // Clique no vazio de uma seção a seleciona (como no Figma).
                                    const section = sectionAt(
                                        reactFlow.screenToFlowPosition({
                                            x: event.clientX,
                                            y: event.clientY,
                                        }),
                                        reactFlow.getNodes(),
                                        new Set(),
                                    );
                                    if (section) {
                                        setNodes((current) =>
                                            current.map((item) =>
                                                item.selected === (item.id === section.id)
                                                    ? item
                                                    : { ...item, selected: item.id === section.id },
                                            ),
                                        );
                                        if (panel === 'inspector') setSelectedId(section.id);
                                        return;
                                    }
                                    if (panel === 'inspector') {
                                        setPanel(null);
                                        setSelectedId(null);
                                    }
                                }}
                                onNodesDelete={(deleted) => {
                                    const gone = new Set(deleted.map((node) => node.id));
                                    setNodes((current) =>
                                        current.map((item) => {
                                            const section = item.data.flow.sectionId;
                                            if (section === undefined || !gone.has(section))
                                                return item;
                                            const parent = deleted.find(
                                                (node) => node.id === section,
                                            )?.data.flow.sectionId;
                                            return withSection(
                                                item,
                                                parent && !gone.has(parent) ? parent : undefined,
                                            );
                                        }),
                                    );
                                    if (deleted.some((node) => node.id === selectedId)) {
                                        setSelectedId(null);
                                        if (panel === 'inspector') setPanel(null);
                                    }
                                }}
                                deleteKeyCode={['Backspace', 'Delete']}
                                multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
                                // Como no Figma: arrastar no vazio seleciona em área (basta
                                // encostar no bloco); Espaço + arrastar ou botão do meio movem
                                // o quadro; rolagem desloca e Ctrl/⌘ + rolagem dá zoom.
                                selectionOnDrag
                                selectionMode={SelectionMode.Partial}
                                panOnDrag={[1]}
                                panActivationKeyCode="Space"
                                panOnScroll
                                zoomOnScroll={false}
                                zoomActivationKeyCode={['Meta', 'Control']}
                                elevateNodesOnSelect={false}
                                onNodeDragStart={(_, grabbed, dragged) =>
                                    startDrag(grabbed, dragged)
                                }
                                onNodeDrag={(_, grabbed, dragged) => onDrag(grabbed, dragged)}
                                onNodeDragStop={(_, __, dragged) => endDrag(dragged)}
                                fitView
                                fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                                minZoom={0.2}
                                maxZoom={1.75}
                                snapToGrid
                                snapGrid={[10, 10]}
                                proOptions={{ hideAttribution: true }}
                                connectionRadius={28}
                            >
                                <Background
                                    variant={BackgroundVariant.Dots}
                                    gap={22}
                                    size={1.4}
                                    color="var(--flow-dot)"
                                />
                                {!panelOpen && (
                                    <MiniMap
                                        pannable
                                        zoomable
                                        ariaLabel="Mapa do fluxo"
                                        style={{ width: 168, height: 112 }}
                                        className="!hidden md:!block"
                                        nodeBorderRadius={8}
                                        nodeColor={(node) =>
                                            nodeColor((node.data as { flow: FlowNode }).flow.type)
                                        }
                                    />
                                )}
                                <CanvasToolbar
                                    paletteOpen={paletteOpen}
                                    onTogglePalette={() => setPaletteOpen((value) => !value)}
                                    canUndo={historyFlags.canUndo}
                                    canRedo={historyFlags.canRedo}
                                    onUndo={undo}
                                    onRedo={redo}
                                />
                                <ZoomControls
                                    fullscreen={fullscreen}
                                    onToggleFullscreen={toggleFullscreen}
                                />
                                <ConnectionLegend />
                                {simulation && simulation.path.length > 0 && (
                                    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#101214] px-4 py-2 text-[12px] font-semibold text-white shadow-lg">
                                        Caminho simulado em destaque
                                    </div>
                                )}
                            </ReactFlow>
                            {graph.nodes.length <= 1 && <EmptyHint />}
                        </div>

                        {galleryOpen && (
                            <div
                                className={`absolute inset-y-0 right-0 z-40 ${paletteOpen ? 'left-0 lg:left-[248px]' : 'left-0'}`}
                            >
                                <TemplateGallery
                                    references={templateReferences}
                                    onUse={(template, built) => {
                                        if (template.kind === 'automation') appendGraph(built);
                                        else applyTemplate(built);
                                        setGalleryOpen(false);
                                    }}
                                    onClose={() => setGalleryOpen(false)}
                                />
                            </div>
                        )}

                        {panelOpen && (
                            <div className="absolute inset-y-0 right-0 z-30 w-[min(380px,100%)] shrink-0 shadow-[-12px_0_32px_rgba(16,18,20,0.08)] lg:static lg:shadow-none">
                                {panel === 'simulation' ? (
                                    <SimulationPanel
                                        defaultEnvironment={simulationEnvironment}
                                        checkouts={checkouts}
                                        products={products}
                                        result={simulation}
                                        running={simulating}
                                        availableEvents={availableEvents}
                                        onAddTrigger={(event) => {
                                            addNode(
                                                'event_trigger',
                                                freeSpot(viewportCenter(), reactFlow.getNodes()),
                                                undefined,
                                                event,
                                            );
                                            setSimulation(null);
                                            showToast({
                                                tone: 'success',
                                                description:
                                                    'Gatilho adicionado. Ligue a saída dele às ações e simule de novo.',
                                            });
                                        }}
                                        onRun={(input) => void simulate(input)}
                                        onClose={() => {
                                            setPanel(null);
                                            setSimulation(null);
                                        }}
                                    />
                                ) : (
                                    selected && (
                                        <NodeInspector
                                            webhooks={webhooks}
                                            key={`${selected.id}-${String(inspectorTab.at)}`}
                                            initialTab={inspectorTab.tab}
                                            node={selected}
                                            connections={connections}
                                            checkouts={checkouts}
                                            products={products}
                                            issues={context.issues.get(selected.id) ?? []}
                                            onChange={(next) => updateNode(selected.id, () => next)}
                                            onDelete={() =>
                                                void reactFlow.deleteElements({
                                                    nodes: [{ id: selected.id }],
                                                })
                                            }
                                            onDuplicate={() => duplicate(selected.id)}
                                            onClose={() => {
                                                setPanel(null);
                                                setSelectedId(null);
                                            }}
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {picker && (
                        <BlockPicker
                            screen={picker.screen}
                            allowTrigger={!picker.from && !picker.splitEdge}
                            allowRoutingTrigger={!hasTrigger}
                            excludeCategories={pickerExclusions(picker)}
                            onPick={pickBlock}
                            onClose={() => setPicker(null)}
                        />
                    )}
                    {menu && (
                        <ContextMenu
                            x={menu.x}
                            y={menu.y}
                            title={menu.title}
                            entries={menu.entries}
                            onClose={() => setMenu(null)}
                        />
                    )}
                </div>,
            )}
        </FlowEditorContext.Provider>
    );
}

// --- Partes da interface -------------------------------------------------------------

function StatusChip({ meta, changed }: { meta: ReturnType<typeof pickMeta>; changed: boolean }) {
    const [label, tone] =
        meta.published === null
            ? ['Nunca publicado', 'bg-surface-muted text-muted']
            : meta.status === 'inactive'
              ? ['Pausado', 'bg-surface-muted text-muted']
              : changed
                ? ['Alterações não publicadas', 'bg-[#fff5e9] text-[#9a5b0b]']
                : [`Publicado · v${String(meta.publishedVersion)}`, 'bg-[#e8f7ee] text-[#1f7a43]'];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}
        >
            <span className="size-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}

function SaveIndicator({ state, updatedAt }: { state: SaveState; updatedAt: string | null }) {
    const text =
        state === 'saving'
            ? 'Salvando…'
            : state === 'dirty'
              ? 'Alterações pendentes'
              : state === 'error'
                ? 'Erro ao salvar o rascunho'
                : state === 'conflict'
                  ? 'Alterado em outra aba: recarregue'
                  : updatedAt
                    ? `Rascunho salvo ${relativeTime(updatedAt)}`
                    : 'Rascunho ainda não salvo';
    return (
        <span
            className={`text-[12px] ${state === 'error' || state === 'conflict' ? 'font-semibold text-danger' : 'text-muted'}`}
        >
            {text}
        </span>
    );
}

function IssuesButton({
    errors,
    warnings,
    onFocus,
}: {
    errors: FlowIssue[];
    warnings: FlowIssue[];
    onFocus(nodeId: string): void;
}) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }
        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, [open]);
    const all = [...errors, ...warnings];
    if (all.length === 0)
        return (
            <span className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-[12px] font-semibold text-success">
                <Icon name="check-circle" className="size-4" /> Sem problemas
            </span>
        );
    return (
        <div ref={root} className="relative">
            <Button
                type="button"
                variant="secondary"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={errors.length ? '!text-danger' : '!text-warning'}
            >
                <Icon name="alert" className="size-3.5" />
                {errors.length > 0
                    ? `${String(errors.length)} erro${errors.length > 1 ? 's' : ''}`
                    : ''}
                {errors.length > 0 && warnings.length > 0 ? ' · ' : ''}
                {warnings.length > 0
                    ? `${String(warnings.length)} aviso${warnings.length > 1 ? 's' : ''}`
                    : ''}
            </Button>
            {open && (
                <div className="glass-popover absolute right-0 top-12 z-50 w-80 rounded-2xl p-2 shadow-[0_18px_48px_rgba(16,18,20,0.16)]">
                    <ul className="max-h-80 space-y-1 overflow-y-auto">
                        {all.map((issue, index) => (
                            <li key={`${issue.nodeId ?? 'flow'}-${String(index)}`}>
                                <button
                                    type="button"
                                    disabled={!issue.nodeId}
                                    onClick={() => {
                                        if (issue.nodeId) onFocus(issue.nodeId);
                                        setOpen(false);
                                    }}
                                    className="flex w-full gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] leading-4 transition enabled:hover:bg-surface-muted"
                                >
                                    <Icon
                                        name="alert"
                                        className={`mt-0.5 size-3.5 shrink-0 ${issue.severity === 'error' ? 'text-danger' : 'text-warning'}`}
                                    />
                                    <span>
                                        {issue.message}
                                        {issue.nodeId && (
                                            <span className="mt-0.5 block font-mono text-[10.5px] text-muted">
                                                {issue.nodeId}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {errors.length > 0 && (
                        <p className="border-t border-border px-2.5 pb-1 pt-2 text-[11px] text-muted">
                            Erros impedem a publicação. Avisos não.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function FlowMenu({
    status,
    published,
    onArrange,
    onStatus,
    onRevert,
}: {
    status: 'active' | 'inactive';
    published: boolean;
    onArrange(): void;
    onStatus(status: 'active' | 'inactive'): void;
    onRevert(): void;
}) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }
        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, [open]);
    const items: { label: string; icon: IconName; onSelect(): void; hidden?: boolean }[] = [
        { label: 'Organizar automaticamente', icon: 'layout', onSelect: onArrange },
        {
            label: status === 'active' ? 'Pausar fluxo' : 'Ativar fluxo',
            icon: status === 'active' ? 'clock' : 'play',
            onSelect: () => onStatus(status === 'active' ? 'inactive' : 'active'),
            hidden: !published,
        },
        {
            label: 'Voltar à versão publicada',
            icon: 'undo',
            onSelect: onRevert,
            hidden: !published,
        },
    ];
    return (
        <div ref={root} className="relative">
            <Button
                type="button"
                variant="icon"
                aria-label="Mais ações do fluxo"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="!size-11 !rounded-xl"
            >
                <Icon name="dots" className="size-4" />
            </Button>
            {open && (
                <div
                    role="menu"
                    className="glass-popover absolute right-0 top-12 z-50 w-60 rounded-xl p-1.5 shadow-[0_12px_32px_rgba(16,18,20,0.14)]"
                >
                    {items
                        .filter((item) => !item.hidden)
                        .map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    item.onSelect();
                                }}
                                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] transition hover:bg-surface-muted"
                            >
                                <Icon name={item.icon} className="size-3.5 text-muted" />
                                {item.label}
                            </button>
                        ))}
                    <Link
                        href="/orchestration/performance"
                        role="menuitem"
                        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] transition hover:bg-surface-muted"
                    >
                        <Icon name="pulse" className="size-3.5 text-muted" />
                        Ver desempenho
                    </Link>
                </div>
            )}
        </div>
    );
}

function CanvasToolbar({
    paletteOpen,
    onTogglePalette,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
}: {
    paletteOpen: boolean;
    onTogglePalette(): void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo(): void;
    onRedo(): void;
}) {
    return (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm">
            <ToolButton
                label={paletteOpen ? 'Esconder blocos' : 'Mostrar blocos'}
                icon="layout"
                active={paletteOpen}
                onClick={onTogglePalette}
            />
            <span className="mx-0.5 h-5 w-px bg-border" />
            <ToolButton
                label="Desfazer (Ctrl+Z)"
                icon="undo"
                disabled={!canUndo}
                onClick={onUndo}
            />
            <ToolButton
                label="Refazer (Ctrl+Shift+Z)"
                icon="redo"
                disabled={!canRedo}
                onClick={onRedo}
            />
        </div>
    );
}

function ZoomControls({
    fullscreen,
    onToggleFullscreen,
}: {
    fullscreen: boolean;
    onToggleFullscreen(): void;
}) {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { zoom } = useViewport();
    return (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm">
            <ToolButton
                label="Diminuir zoom"
                icon="minus"
                onClick={() => void zoomOut({ duration: 150 })}
            />
            <span className="w-11 text-center text-[12px] font-semibold tabular-nums">
                {Math.round(zoom * 100)}%
            </span>
            <ToolButton
                label="Aumentar zoom"
                icon="plus"
                onClick={() => void zoomIn({ duration: 150 })}
            />
            <span className="mx-0.5 h-5 w-px bg-border" />
            <ToolButton
                label="Ajustar à tela"
                icon="maximize"
                onClick={() => void fitView({ padding: 0.2, duration: 300 })}
            />
            <ToolButton
                label={fullscreen ? 'Sair da tela cheia (Shift+F)' : 'Tela cheia (Shift+F)'}
                icon={fullscreen ? 'shrink' : 'expand'}
                active={fullscreen}
                onClick={onToggleFullscreen}
            />
        </div>
    );
}

function ToolButton({
    label,
    icon,
    onClick,
    disabled,
    active,
}: {
    label: string;
    icon: IconName;
    onClick(): void;
    disabled?: boolean;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            aria-pressed={active}
            onClick={onClick}
            className={`grid size-8 place-items-center rounded-lg transition hover:bg-surface-muted disabled:opacity-30 ${active ? 'text-foreground' : 'text-muted'}`}
        >
            <Icon name={icon} className="size-4" />
        </button>
    );
}

/**
 * Em tela cheia o editor vai para o body: o painel do shell cria um contexto de empilhamento
 * que deixaria a barra lateral por cima.
 */
function withPortal(active: boolean, content: React.ReactElement) {
    return active ? createPortal(content, document.body) : content;
}

type MenuState = { x: number; y: number } & (
    | { kind: 'node'; id: string }
    | { kind: 'edge'; id: string }
    | { kind: 'pane' }
    | { kind: 'selection' }
);

function menuTitle(
    state: MenuState,
    flows: Map<string, FlowNode>,
    connections: Map<string, { name: string }>,
) {
    if (state.kind === 'node') {
        const node = flows.get(state.id);
        return node ? nodeTitle(node, connections) : undefined;
    }
    if (state.kind === 'edge') return 'Ligação';
    if (state.kind === 'selection') return 'Seleção';
    return 'Quadro';
}

/** Ensina o gesto de ligar: sai pela direita, entra pela esquerda. Pode ser escondida. */
function ConnectionLegend() {
    const stored = useSyncExternalStore(
        subscribeLegend,
        () => readLegend(),
        () => true,
    );
    const [dismissed, setDismissed] = useState(false);
    const hidden = stored || dismissed;
    if (hidden) return null;
    return (
        <div className="absolute bottom-3 left-3 z-10 flex max-w-[min(520px,calc(100%-24px))] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-[11.5px] leading-4 text-muted shadow-sm">
            <span>
                Arraste de uma <b className="text-foreground">saída</b>{' '}
                <span className="flow-legend-port" /> até outro bloco para ligar. Arraste no vazio
                para <b className="text-foreground">selecionar vários</b>;{' '}
                <b className="text-foreground">Espaço + arrastar</b> move o quadro. Botão direito
                abre mais opções.
            </span>
            <button
                type="button"
                aria-label="Esconder dica"
                onClick={() => {
                    setDismissed(true);
                    try {
                        window.localStorage.setItem('astro-flow-legend', 'hidden');
                    } catch {
                        // Só esconde nesta visita.
                    }
                }}
                className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-surface-muted hover:text-foreground"
            >
                <Icon name="close" className="size-3" />
            </button>
        </div>
    );
}

function subscribeLegend() {
    return () => undefined;
}

function readLegend() {
    try {
        return window.localStorage.getItem('astro-flow-legend') === 'hidden';
    } catch {
        return false;
    }
}

function EmptyHint() {
    return (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="max-w-xs rounded-2xl bg-surface/90 px-5 py-4 text-center text-[13px] leading-5 text-muted shadow-sm">
                Arraste blocos da esquerda ou use o <b>+</b> na saída do gatilho para montar o
                fluxo. Comece por um modelo na aba <b>Modelos</b>.
            </p>
        </div>
    );
}

// --- Conversões ----------------------------------------------------------------------

function toCanvasNode(node: FlowNode): FlowCanvasNode {
    return {
        id: node.id,
        type: 'flow',
        position: node.position,
        data: { flow: node },
        deletable: node.type !== 'trigger',
        ...sizeOf(node),
        ...(node.type === 'note' ? { zIndex: -1 } : {}),
        // Seções ficam atrás de tudo.
        // O arraste da seção é nosso (pela barra de título): o React Flow nunca a leva junto
        // ao arrastar um bloco.
        ...(node.type === 'section' ? { zIndex: -2, draggable: false } : {}),
    };
}

function sizeOf(node: FlowNode) {
    if (node.type === 'note')
        return { width: node.config.width ?? 220, height: node.config.height ?? 120 };
    if (node.type === 'section') return { width: node.config.width, height: node.config.height };
    return {};
}

type Box = { x: number; y: number; width: number; height: number };

/** Folga no topo da seção (o nome fica do lado de fora, acima da borda). */
const sectionHeader = 48;

function boxOf(node: FlowCanvasNode): Box {
    return {
        x: node.position.x,
        y: node.position.y,
        width: node.measured?.width ?? node.width ?? 236,
        height: node.measured?.height ?? node.height ?? 120,
    };
}

function centerOf(box: Box) {
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Seção mais interna sob o ponto (seções podem ficar uma dentro da outra). */
function sectionAt(point: { x: number; y: number }, nodes: FlowCanvasNode[], skip: Set<string>) {
    return nodes
        .filter((node) => node.data.flow.type === 'section' && !skip.has(node.id))
        .filter((node) => {
            const frame = boxOf(node);
            return (
                point.x >= frame.x &&
                point.x <= frame.x + frame.width &&
                point.y >= frame.y &&
                point.y <= frame.y + frame.height
            );
        })
        .sort(
            (left, right) =>
                boxOf(left).width * boxOf(left).height - boxOf(right).width * boxOf(right).height,
        )[0];
}

function area(box: Box) {
    return box.width * box.height;
}

function pointIn(point: { x: number; y: number }, frame: Box) {
    return (
        point.x >= frame.x &&
        point.x <= frame.x + frame.width &&
        point.y >= frame.y &&
        point.y <= frame.y + frame.height
    );
}

/** Troca a seção do bloco (undefined tira de qualquer seção). */
function withSection(node: FlowCanvasNode, sectionId: string | undefined): FlowCanvasNode {
    if (node.data.flow.sectionId === sectionId) return node;
    const flow = { ...node.data.flow, sectionId };
    if (sectionId === undefined) delete flow.sectionId;
    return { ...node, data: { flow } };
}

/** Tudo o que está dentro da seção, inclusive dentro de seções internas. */
function descendantsOf(id: string, nodes: FlowCanvasNode[]) {
    const found = new Set<string>();
    const queue = [id];
    for (let current = queue.shift(); current !== undefined; current = queue.shift())
        for (const node of nodes)
            if (node.data.flow.sectionId === current && !found.has(node.id)) {
                found.add(node.id);
                queue.push(node.id);
            }
    return found;
}

function ancestorsOf(id: string, nodes: FlowCanvasNode[]) {
    const found = new Set<string>();
    let current = nodes.find((node) => node.id === id)?.data.flow.sectionId;
    while (current !== undefined && !found.has(current)) {
        found.add(current);
        const parent: string | undefined = nodes.find((node) => node.id === current)?.data.flow
            .sectionId;
        current = parent;
    }
    return found;
}

/**
 * Rascunhos de antes do pertencimento explícito: adota pela posição (centro do bloco dentro
 * da seção) uma única vez, ao abrir.
 */
function adoptLegacyMembership(nodes: FlowNode[]): FlowNode[] {
    const sections = nodes.filter((node) => node.type === 'section');
    if (sections.length === 0 || nodes.some((node) => node.sectionId !== undefined)) return nodes;
    return nodes.map((node) => {
        if (node.type === 'section') return node;
        const center = { x: node.position.x + 118, y: node.position.y + 60 };
        const holder = sections
            .filter((section) =>
                pointIn(center, {
                    ...section.position,
                    width: section.config.width,
                    height: section.config.height,
                }),
            )
            .sort(
                (left, right) =>
                    left.config.width * left.config.height -
                    right.config.width * right.config.height,
            )[0];
        return holder ? { ...node, sectionId: holder.id } : node;
    });
}

function contains(outer: Box, inner: Box) {
    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height
    );
}

function toCanvasNodes(nodes: FlowNode[]) {
    return nodes.map(toCanvasNode);
}

function canvasEdge(edge: {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
}): FlowCanvasEdge {
    return { ...edge, type: 'flow', data: { label: '', tone: 'neutral' } };
}

function toCanvasEdges(graph: FlowGraph) {
    return graph.edges.map(canvasEdge);
}

function fromCanvas(nodes: FlowCanvasNode[], edges: FlowCanvasEdge[]): FlowGraph {
    return {
        nodes: nodes.map((node) => ({
            ...node.data.flow,
            position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            sourceHandle: edge.sourceHandle ?? 'main',
            target: edge.target,
        })),
    };
}

/** Estrutura sem posições: mover blocos não conta como alteração a publicar. */
function structure(graph: FlowGraph) {
    return stableStringify({
        nodes: graph.nodes
            .map((node) => ({ ...node, position: undefined }))
            .sort((left, right) => left.id.localeCompare(right.id)),
        edges: graph.edges
            .map((edge) => `${edge.source}:${edge.sourceHandle}>${edge.target}`)
            .sort(),
    });
}

/** JSON com chaves ordenadas: a API devolve os nós na ordem do schema, o editor não. */
function stableStringify(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (value !== null && typeof value === 'object')
        return `{${Object.entries(value as Record<string, unknown>)
            .filter(([, item]) => item !== undefined)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
            .join(',')}}`;
    return JSON.stringify(value);
}

/**
 * O bloco está na escolha do gateway (a partir de "Venda iniciada") ou numa automação (depois
 * de um pagamento ou de um gatilho de evento)? Sobe pelas ligações até achar a origem.
 */
function areaOf(id: string, nodes: FlowCanvasNode[], edges: FlowCanvasEdge[]) {
    const types = new Map(nodes.map((node) => [node.id, node.data.flow.type]));
    const seen = new Set<string>();
    const queue = [id];
    for (let current = queue.shift(); current !== undefined; current = queue.shift()) {
        if (seen.has(current)) continue;
        seen.add(current);
        const type = types.get(current);
        if (type === 'success' || type === 'failed' || type === 'event_trigger')
            return 'automation';
        if (type === 'trigger') return 'routing';
        for (const edge of edges) if (edge.target === current) queue.push(edge.source);
    }
    return 'routing';
}

/** Existe caminho de `from` até `to`? Usado para impedir ciclos ao ligar. */
function reaches(edges: FlowCanvasEdge[], from: string, to: string) {
    const seen = new Set<string>();
    const stack = [from];
    for (let id = stack.pop(); id !== undefined; id = stack.pop()) {
        if (id === to) return true;
        if (seen.has(id)) continue;
        seen.add(id);
        for (const edge of edges) if (edge.source === id) stack.push(edge.target);
    }
    return false;
}

function pickMeta(flow: GatewayFlow) {
    return {
        status: flow.status,
        published: flow.published,
        publishedAt: flow.publishedAt,
        publishedVersion: flow.publishedVersion,
        version: flow.version,
        updatedAt: flow.updatedAt,
    };
}

function isGateway(node: FlowNode | undefined) {
    return (
        node?.type === 'gateway' || node?.type === 'cheapest' || node?.type === 'checkout_default'
    );
}

/** Desce a posição até não sobrepor nenhum card existente. */
function freeSpot(position: { x: number; y: number }, nodes: FlowCanvasNode[]) {
    const width = 236;
    const height = 150;
    const overlaps = (y: number) =>
        nodes.some((node) => {
            const nodeWidth = node.measured?.width ?? width;
            const nodeHeight = node.measured?.height ?? height;
            return (
                position.x < node.position.x + nodeWidth + 24 &&
                position.x + width + 24 > node.position.x &&
                y < node.position.y + nodeHeight + 24 &&
                y + height + 24 > node.position.y
            );
        });
    let y = position.y;
    for (let attempt = 0; attempt < 40 && overlaps(y); attempt += 1) y += 40;
    return { x: position.x, y };
}

function jitter() {
    return Math.round((Math.random() - 0.5) * 40);
}

function relativeTime(value: string) {
    const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 45) return 'agora';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `há ${String(minutes)} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `há ${String(hours)} h`;
    return new Date(value).toLocaleDateString('pt-BR');
}
