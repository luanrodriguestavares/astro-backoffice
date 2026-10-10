'use client';

import { createContext, useContext } from 'react';

import type {
    FlowIssue,
    FlowNode,
    FlowSimulation,
    GatewayConnection,
    GatewayInsights,
    WebhookEndpointSummary,
} from '@/lib/api/types';
import type { NameLookup } from '@/lib/orchestration/flow';

export type GatewayStats = GatewayInsights['gateways'][number];

export interface FlowEditorContextValue {
    readonly connections: Map<string, GatewayConnection>;
    readonly webhooks: Map<string, WebhookEndpointSummary>;
    readonly stats: Map<string, GatewayStats>;
    readonly names: NameLookup;
    readonly issues: Map<string, FlowIssue[]>;
    /** Saídas já ligadas, no formato `nó:saída`. */
    readonly linkedOutputs: Set<string>;
    readonly simulation: FlowSimulation | null;
    /** Nós alcançados pela saída "falhou" de um gateway: são reservas. */
    readonly fallbackNodes: Set<string>;
    /** Seção destacada enquanto blocos são arrastados sobre ela. */
    readonly dropSection: string | null;
    /** Quantidade de blocos dentro de cada seção. */
    readonly sectionCounts: Map<string, number>;
    openPicker(request: PickerRequest): void;
    /** Começa a arrastar uma seção pela barra de título (com os blocos de dentro). */
    beginSectionMove(id: string, event: React.PointerEvent): void;
    /** Fim do redimensionamento: aplica a caixa nova e atualiza quem está na seção. */
    resizeSection(id: string, box: { x: number; y: number; width: number; height: number }): void;
    /** A saída `handle` de `source` pode ser ligada à entrada de `target`? */
    canConnect(source: string, handle: string, target: string): boolean;
    updateNode(id: string, update: (node: FlowNode) => FlowNode): void;
}

export interface PickerRequest {
    /** Posição na tela onde o seletor abre. */
    readonly screen: { x: number; y: number };
    /** Saída que será ligada ao novo nó, quando houver. */
    readonly from?: { nodeId: string; handle: string };
    /** Aberto pelo "+": o novo nó vai para a direita da origem, não para o cursor. */
    readonly besideSource?: boolean;
    /** Inserir o novo nó no meio desta ligação. */
    readonly splitEdge?: string;
}

export const FlowEditorContext = createContext<FlowEditorContextValue | null>(null);

export function useFlowEditor() {
    const value = useContext(FlowEditorContext);
    if (!value) throw new Error('useFlowEditor precisa estar dentro do FlowEditor');
    return value;
}
