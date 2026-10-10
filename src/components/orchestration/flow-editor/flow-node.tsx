'use client';

import {
    Handle,
    NodeResizer,
    Position,
    useConnection,
    type Node,
    type NodeProps,
} from '@xyflow/react';
import { memo, useState } from 'react';

import { providerPresentation } from '@/components/gateways/connected-gateway-card';
import { GatewayMark } from '@/components/gateways/gateway-mark';
import { Icon } from '@/components/ui/icon';
import type { FlowNode as FlowNodeModel } from '@/lib/api/types';
import {
    blockOf,
    conditionSentence,
    hasInput,
    nodeOutputs,
    type NodeOutput,
} from '@/lib/orchestration/flow';

import { useFlowEditor, type GatewayStats } from './flow-context';

export type FlowCanvasNode = Node<{ flow: FlowNodeModel }, 'flow'>;

/** Card de nó no estilo n8n: entrada à esquerda, uma alça por saída à direita. */
export const FlowNodeCard = memo(function FlowNodeCard({
    data,
    selected,
}: NodeProps<FlowCanvasNode>) {
    const node = data.flow;
    if (node.type === 'note') return <NoteCard node={node} selected={selected} />;
    if (node.type === 'section') return <SectionCard node={node} selected={selected} />;
    return <Card node={node} />;
});

function Card({ node }: { node: Exclude<FlowNodeModel, { type: 'note' | 'section' }> }) {
    const editor = useFlowEditor();
    const block = blockOf(node);
    const issues = editor.issues.get(node.id) ?? [];
    const outputs = nodeOutputs(node);
    const kind =
        node.type === 'trigger' || node.type === 'event_trigger'
            ? 'trigger'
            : block.category === 'action'
              ? 'action'
              : block.category === 'logic'
                ? 'logic'
                : node.type === 'success'
                  ? 'success'
                  : node.type === 'failed'
                    ? 'danger'
                    : 'default';
    const simulation = editor.simulation;
    const skipReason = simulation?.attempts.find(
        (attempt) => attempt.nodeId === node.id && attempt.skipped,
    )?.skipped;
    const skipped = skipReason !== undefined;
    // Sem caminho percorrido (ex.: evento sem gatilho), não apaga o quadro.
    const simState =
        simulation === null || simulation.path.length === 0
            ? undefined
            : simulation.path.includes(node.id)
              ? skipped
                  ? 'skip'
                  : 'on'
              : 'off';
    const compact = node.type === 'success' || node.type === 'failed' || node.type === 'trigger';
    const actionTarget =
        node.type === 'send_webhook' || node.type === 'send_email'
            ? actionSummary(node, editor.webhooks)
            : undefined;
    const connection =
        node.type === 'gateway' && node.config.gatewayConnectionId
            ? editor.connections.get(node.config.gatewayConnectionId)
            : undefined;
    const fallback = editor.fallbackNodes.has(node.id);

    return (
        <div
            className="flow-card relative"
            data-dim={useDimmed(node) ? 'true' : undefined}
            data-kind={kind}
            data-compact={compact}
            data-sim={simState}
        >
            {fallback && (node.type === 'gateway' || node.type === 'cheapest') && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-[#6366f1] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    Reserva
                </span>
            )}
            {issues.length > 0 && <IssueBadge issues={issues} />}
            {simState === 'skip' && (
                <span className="flow-skip-badge" title="Na simulação, este gateway foi pulado">
                    <Icon name="alert" className="size-3" />
                    Pulado · {skipReason}
                </span>
            )}
            {hasInput(node.type) && <InputHandle node={node} />}

            <div className="flex items-start gap-3 px-4 pb-4 pt-4">
                {connection ? (
                    <GatewayLogo provider={connection.provider} />
                ) : (
                    <span
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${block.tone}`}
                    >
                        <Icon name={block.icon} className="size-[18px]" />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold leading-5 tracking-[-0.01em]">
                        {nodeTitle(node, editor.connections)}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted">{node.id}</p>
                    {!compact && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">
                            {nodeDescription(node, editor)}
                        </p>
                    )}
                </div>
            </div>

            {actionTarget && (
                <p className="mx-4 mb-4 truncate rounded-lg bg-surface-muted px-2.5 py-1.5 text-[11px] font-medium">
                    {actionTarget}
                </p>
            )}
            {node.type === 'condition' && node.config.conditions.length > 0 && (
                <ConditionPreview node={node} />
            )}
            {node.type === 'gateway' && connection && (
                <Metrics
                    stats={editor.stats.get(connection.id)}
                    unstable={connection.status === 'degraded'}
                />
            )}
            {node.type === 'cheapest' && node.config.gatewayConnectionIds.length > 0 && (
                <div className="flex flex-wrap gap-1 px-4 pb-4">
                    {node.config.gatewayConnectionIds.map((id) => (
                        <span
                            key={id}
                            className="flow-pill rounded-full px-2 py-0.5 text-[10px] font-medium"
                        >
                            {editor.connections.get(id)?.name ?? 'Removido'}
                        </span>
                    ))}
                </div>
            )}

            {outputs.length > 0 && (
                <div
                    className={
                        outputs.length === 1 && outputs[0]?.label === ''
                            ? ''
                            : 'space-y-1.5 border-t border-border/70 px-4 pb-4 pt-3'
                    }
                >
                    {outputs.map((output) => (
                        <OutputRow
                            key={output.id}
                            node={node}
                            output={output}
                            single={outputs.length === 1 && output.label === ''}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function OutputRow({
    node,
    output,
    single,
}: {
    node: FlowNodeModel;
    output: NodeOutput;
    single: boolean;
}) {
    const editor = useFlowEditor();
    const linked = editor.linkedOutputs.has(`${node.id}:${output.id}`);
    const add = !linked && (
        <button
            type="button"
            aria-label={`Adicionar bloco na saída ${output.label || 'principal'}`}
            title="Adicionar bloco nesta saída"
            onClick={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                editor.openPicker({
                    screen: { x: rect.right + 8, y: rect.top },
                    from: { nodeId: node.id, handle: output.id },
                    besideSource: true,
                });
            }}
            className="flow-add-output nodrag absolute right-[-56px] top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-lg transition"
        >
            <Icon name="plus" className="size-3" />
        </button>
    );
    const hint = `Arraste para ligar${output.label ? ` a saída "${output.label}"` : ''} a outro bloco`;
    if (single)
        return (
            <div className="absolute inset-y-0 right-0 w-0">
                <div className="relative top-1/2">
                    <Handle
                        type="source"
                        id={output.id}
                        position={Position.Right}
                        data-tone={output.tone}
                        className="flow-output-dot"
                        title={hint}
                        aria-label="Saída"
                    />
                    {add}
                </div>
            </div>
        );
    // A pílula inteira é a alça: dá para puxar a linha pelo rótulo, não só pelo ponto.
    return (
        <div className="relative flex h-8 items-center justify-end">
            <Handle
                type="source"
                id={output.id}
                position={Position.Right}
                data-tone={output.tone}
                className="flow-output-handle"
                title={hint}
                aria-label={output.label}
            >
                <span
                    className="flow-pill pointer-events-none max-w-[170px] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    data-tone={output.tone}
                >
                    {output.label}
                </span>
                <span className="flow-output-port pointer-events-none" data-tone={output.tone} />
            </Handle>
            {add}
        </div>
    );
}

/** Ligação em andamento: `origem|saída` quando parte de uma saída, senão vazio. */
function useDragSource() {
    return useConnection((connection) =>
        connection.inProgress && connection.fromHandle?.type === 'source'
            ? `${connection.fromNode?.id ?? ''}|${connection.fromHandle.id ?? 'main'}`
            : '',
    );
}

/** Enquanto uma linha é puxada, blocos que não podem recebê-la ficam esmaecidos. */
function useDimmed(node: FlowNodeModel) {
    const editor = useFlowEditor();
    const drag = useDragSource();
    if (!drag) return false;
    const [source = '', handle = 'main'] = drag.split('|');
    if (source === node.id) return false;
    return !editor.canConnect(source, handle, node.id);
}

/**
 * Entrada à esquerda. Durante uma ligação, se este bloco aceita a linha, a entrada cobre o
 * card todo: basta soltar em qualquer parte dele.
 */
function InputHandle({ node }: { node: FlowNodeModel }) {
    const editor = useFlowEditor();
    const drag = useDragSource();
    const [source = '', handle = 'main'] = drag.split('|');
    const drop = drag !== '' && source !== node.id && editor.canConnect(source, handle, node.id);
    return (
        <Handle
            type="target"
            position={Position.Left}
            className="flow-input-handle"
            data-drop={drop ? 'true' : undefined}
            title="Entrada: solte aqui uma linha vinda de outro bloco"
            aria-label="Entrada"
        >
            {drop && (
                <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] font-semibold">
                    Solte para ligar aqui
                </span>
            )}
        </Handle>
    );
}

function ConditionPreview({ node }: { node: Extract<FlowNodeModel, { type: 'condition' }> }) {
    const { names } = useFlowEditor();
    const shown = node.config.conditions.slice(0, 3);
    return (
        <ul className="space-y-1.5 px-4 pb-4">
            {shown.map((condition, index) => (
                <li
                    key={condition.id}
                    className="flex items-center gap-1.5 text-[10.5px] leading-4"
                >
                    {index > 0 && (
                        <span className="rounded bg-surface-muted px-1 font-semibold uppercase text-muted">
                            {node.config.combinator === 'and' ? 'e' : 'ou'}
                        </span>
                    )}
                    <span className="truncate">{conditionSentence(condition, names)}</span>
                </li>
            ))}
            {node.config.conditions.length > shown.length && (
                <li className="text-[10.5px] text-muted">
                    + {node.config.conditions.length - shown.length} condições
                </li>
            )}
        </ul>
    );
}

function Metrics({ stats, unstable }: { stats: GatewayStats | undefined; unstable: boolean }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4 text-[10.5px] font-medium tabular-nums">
            <span
                className="flow-pill inline-flex items-center gap-1 rounded-lg px-2 py-1"
                data-tone="success"
            >
                <Icon name="check-circle" className="size-3" />
                {stats?.approvalRate == null
                    ? 'sem vendas'
                    : `${percent(stats.approvalRate)} aprovação`}
            </span>
            {stats?.avgLatencyMs != null && (
                <span className="flow-pill inline-flex items-center gap-1 rounded-lg px-2 py-1">
                    <Icon name="bolt" className="size-3" />
                    {latency(stats.avgLatencyMs)}
                </span>
            )}
            {unstable && (
                <span
                    className="flow-pill inline-flex items-center gap-1 rounded-lg px-2 py-1"
                    data-tone="warning"
                >
                    Instável
                </span>
            )}
        </div>
    );
}

function IssueBadge({ issues }: { issues: { severity: string; message: string }[] }) {
    const error = issues.some((issue) => issue.severity === 'error');
    return (
        <span
            title={issues.map((issue) => issue.message).join('\n')}
            className={`absolute -right-2 -top-2 z-10 grid size-5 place-items-center rounded-full text-white shadow-sm ${error ? 'bg-[#e0485f]' : 'bg-[#d97706]'}`}
        >
            <Icon name="alert" className="size-3" />
        </span>
    );
}

function GatewayLogo({ provider }: { provider: Parameters<typeof providerPresentation>[0] }) {
    const presentation = providerPresentation(provider);
    return (
        <GatewayMark
            initials={presentation.initials}
            color={presentation.color}
            logo={presentation.logo}
            logoFill={presentation.logoFill}
        />
    );
}

/**
 * Moldura de organização. Só a barra de título é arrastável (e leva junto os blocos de
 * dentro); o corpo deixa o clique passar para o quadro, para selecionar em área por dentro.
 */
function SectionCard({
    node,
    selected,
}: {
    node: Extract<FlowNodeModel, { type: 'section' }>;
    selected: boolean;
}) {
    const editor = useFlowEditor();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(node.config.title);
    const dropping = editor.dropSection === node.id;
    const count = editor.sectionCounts.get(node.id) ?? 0;
    const commit = () => {
        setEditing(false);
        const title = draft.trim().slice(0, 80);
        editor.updateNode(node.id, (current) =>
            current.type === 'section'
                ? { ...current, config: { ...current.config, title } }
                : current,
        );
    };
    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={240}
                minHeight={160}
                lineClassName="flow-section-resize-line"
                handleClassName="flow-section-resize-handle"
                onResizeEnd={(_, size) =>
                    editor.resizeSection(node.id, {
                        x: size.x,
                        y: size.y,
                        width: size.width,
                        height: size.height,
                    })
                }
            />
            <div
                className="flow-section h-full w-full"
                data-color={node.config.color}
                data-selected={selected ? 'true' : undefined}
                data-drop={dropping ? 'true' : undefined}
            >
                {dropping && (
                    <span className="flow-section-drop-hint">
                        Soltar em “{node.config.title || 'Seção sem título'}”
                    </span>
                )}
                <div
                    className="flow-section-handle nodrag"
                    onPointerDown={(event) => {
                        if ((event.target as HTMLElement).closest('input')) return;
                        editor.beginSectionMove(node.id, event);
                    }}
                    title="Arraste para mover a seção e os blocos de dentro. Duplo clique renomeia."
                    onDoubleClick={(event) => {
                        event.stopPropagation();
                        setDraft(node.config.title);
                        setEditing(true);
                    }}
                >
                    <Icon name="layout" className="size-3.5 shrink-0 opacity-70" />
                    {editing ? (
                        <input
                            autoFocus
                            value={draft}
                            maxLength={80}
                            aria-label="Título da seção"
                            onChange={(event) => setDraft(event.target.value)}
                            onBlur={commit}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') commit();
                                if (event.key === 'Escape') setEditing(false);
                            }}
                            className="flow-section-title-input nodrag"
                        />
                    ) : (
                        <span className="truncate">{node.config.title || 'Seção sem título'}</span>
                    )}
                    <span className="flow-section-count">{count}</span>
                </div>
            </div>
        </>
    );
}

function NoteCard({
    node,
    selected,
}: {
    node: Extract<FlowNodeModel, { type: 'note' }>;
    selected: boolean;
}) {
    const editor = useFlowEditor();
    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={180}
                minHeight={90}
                lineClassName="!border-[#eab308]/60"
                handleClassName="!size-2.5 !rounded-sm !border-[#eab308] !bg-white"
                onResizeEnd={(_, size) =>
                    editor.updateNode(node.id, (current) =>
                        current.type === 'note'
                            ? {
                                  ...current,
                                  config: {
                                      ...current.config,
                                      width: Math.round(size.width),
                                      height: Math.round(size.height),
                                  },
                              }
                            : current,
                    )
                }
            />
            <div className="flow-note h-full w-full overflow-hidden p-3.5 text-[12px] leading-5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70">
                    {node.name || 'Nota'}
                </p>
                <p className="whitespace-pre-wrap">
                    {node.config.text || 'Clique duas vezes para escrever.'}
                </p>
            </div>
        </>
    );
}

export function nodeTitle(node: FlowNodeModel, connections: Map<string, { name: string }>) {
    if (node.name) return node.name;
    if (node.type === 'gateway' && node.config.gatewayConnectionId)
        return connections.get(node.config.gatewayConnectionId)?.name ?? 'Gateway removido';
    return blockOf(node).title;
}

/** Para onde a ação manda: aparece em destaque no card. */
function actionSummary(
    node: Extract<FlowNodeModel, { type: 'send_webhook' | 'send_email' }>,
    webhooks: Map<string, { name?: string; url: string }>,
) {
    if (node.type === 'send_webhook') {
        if (!node.config.webhookEndpointId) return 'Escolha o endpoint';
        const endpoint = webhooks.get(node.config.webhookEndpointId);
        return endpoint ? `→ ${endpoint.name ?? endpoint.url}` : 'Endpoint removido';
    }
    const to =
        node.config.recipients === 'customer'
            ? 'cliente'
            : node.config.recipients === 'team'
              ? 'equipe'
              : node.config.emails.join(', ') || 'sem destinatário';
    return `Para ${to}${node.config.subject ? ` · ${node.config.subject}` : ''}`;
}

function nodeDescription(
    node: FlowNodeModel,
    editor: { connections: Map<string, { name: string; environment: string }> },
) {
    switch (node.type) {
        case 'condition':
            return node.config.combinator === 'and'
                ? 'Todas as condições precisam valer'
                : 'Basta uma das condições valer';
        case 'switch':
            return `${String(node.config.cases.length)} caminhos · vale o primeiro que combinar`;
        case 'split':
            return `${String(node.config.percentage)}% para A, ${String(100 - node.config.percentage)}% para B`;
        case 'gateway': {
            const connection = node.config.gatewayConnectionId
                ? editor.connections.get(node.config.gatewayConnectionId)
                : undefined;
            if (!node.config.gatewayConnectionId) return 'Escolha o gateway';
            if (!connection) return 'Este gateway foi removido';
            return `Cobra a venda · ${connection.environment === 'production' ? 'Produção' : 'Sandbox'}`;
        }
        case 'event_trigger':
            return `${blockOf(node).description}. Dispara as ações ligadas.`;
        case 'cheapest':
            return node.config.gatewayConnectionIds.length < 2
                ? 'Escolha pelo menos dois gateways'
                : 'Menor taxa entre os que aprovam bem';
        default:
            return blockOf(node).description;
    }
}

function percent(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(
        value,
    );
}

function latency(ms: number) {
    return ms >= 1000
        ? `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}s`
        : `${String(Math.round(ms))}ms`;
}
