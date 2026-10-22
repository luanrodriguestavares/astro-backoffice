import type { FlowEdge, FlowGraph, FlowNode, GatewayConnection } from '@/lib/api/types';
import { autoLayout, eventLabels } from '@/lib/orchestration/flow';

/**
 * Estratégias do modo simples do pagamento. Cada uma gera o fluxo de nós equivalente, e um
 * fluxo com a mesma forma é lido de volta como a estratégia (o resto é "personalizado").
 */
export type PaymentStrategy =
    | { kind: 'single'; gateway: string | null }
    | { kind: 'failover'; primary: string | null; backup: string | null }
    | { kind: 'split'; a: string | null; b: string | null; percentage: number }
    | { kind: 'cheapest'; gateways: string[] };

export type PaymentStrategyKind = PaymentStrategy['kind'];

export const strategyCopy: Record<
    PaymentStrategyKind,
    { title: string; description: string; icon: 'card' | 'repeat' | 'route' | 'coins' }
> = {
    single: {
        title: 'Um gateway',
        description: 'Toda venda é cobrada no mesmo gateway.',
        icon: 'card',
    },
    failover: {
        title: 'Principal + reserva',
        description: 'Se o principal recusar ou cair, tenta no reserva.',
        icon: 'repeat',
    },
    split: {
        title: 'Dividir vendas',
        description: 'Reparte as vendas entre dois gateways por porcentagem.',
        icon: 'route',
    },
    cheapest: {
        title: 'Menor taxa',
        description: 'Cobra no gateway mais barato para cada venda.',
        icon: 'coins',
    },
};

/** Gateways que podem receber vendas, na ordem em que foram conectados. */
export function usableGateways(connections: readonly GatewayConnection[]) {
    return connections.filter((connection) => connection.status !== 'disabled');
}

/** Estratégia inicial de cada cartão, com os gateways que a conta tiver. */
export function defaultStrategy(
    kind: PaymentStrategyKind,
    connections: readonly GatewayConnection[],
): PaymentStrategy {
    const [first, second] = usableGateways(connections).map((connection) => connection.id);
    switch (kind) {
        case 'single':
            return { kind, gateway: first ?? null };
        case 'failover':
            return { kind, primary: first ?? null, backup: second ?? null };
        case 'split':
            return { kind, a: first ?? null, b: second ?? null, percentage: 50 };
        case 'cheapest':
            return { kind, gateways: usableGateways(connections).map(({ id }) => id) };
    }
}

const at = { x: 0, y: 0 };
const routingTypes = new Set<FlowNode['type']>([
    'trigger',
    'gateway',
    'cheapest',
    'split',
    'condition',
    'switch',
]);

function gatewayNode(id: string, connection: string | null): FlowNode {
    return { id, type: 'gateway', position: at, config: { gatewayConnectionId: connection } };
}

function edge(source: string, sourceHandle: string, target: string): FlowEdge {
    return { id: `e_${source}_${sourceHandle}`, source, sourceHandle, target };
}

/**
 * Gera o fluxo da estratégia. As automações do fluxo atual (gatilhos de evento e o que vem
 * depois de aprovado/recusado) continuam: só a decisão do gateway é trocada.
 */
export function buildStrategy(strategy: PaymentStrategy, current?: FlowGraph): FlowGraph {
    const kept = (current?.nodes ?? []).filter((node) => !routingTypes.has(node.type));
    const success = kept.find((node) => node.type === 'success') ?? {
        id: 'success',
        type: 'success' as const,
        position: at,
        config: {},
    };
    const failed = kept.find((node) => node.type === 'failed') ?? {
        id: 'failed',
        type: 'failed' as const,
        position: at,
        config: {},
    };
    const keptIds = new Set(kept.map((node) => node.id));
    const routing: FlowNode[] = [{ id: 'trigger', type: 'trigger', position: at, config: {} }];
    const edges: FlowEdge[] = [];
    switch (strategy.kind) {
        case 'single':
            routing.push(gatewayNode('gateway', strategy.gateway));
            edges.push(
                edge('trigger', 'main', 'gateway'),
                edge('gateway', 'success', success.id),
                edge('gateway', 'failure', failed.id),
            );
            break;
        case 'failover':
            routing.push(
                gatewayNode('primary', strategy.primary),
                gatewayNode('backup', strategy.backup),
            );
            edges.push(
                edge('trigger', 'main', 'primary'),
                edge('primary', 'success', success.id),
                edge('primary', 'failure', 'backup'),
                edge('backup', 'success', success.id),
                edge('backup', 'failure', failed.id),
            );
            break;
        case 'split':
            routing.push(
                {
                    id: 'split',
                    type: 'split',
                    position: at,
                    config: { percentage: strategy.percentage },
                },
                gatewayNode('gateway_a', strategy.a),
                gatewayNode('gateway_b', strategy.b),
            );
            edges.push(
                edge('trigger', 'main', 'split'),
                edge('split', 'a', 'gateway_a'),
                edge('split', 'b', 'gateway_b'),
                edge('gateway_a', 'success', success.id),
                edge('gateway_a', 'failure', failed.id),
                edge('gateway_b', 'success', success.id),
                edge('gateway_b', 'failure', failed.id),
            );
            break;
        case 'cheapest':
            routing.push({
                id: 'cheapest',
                type: 'cheapest',
                position: at,
                config: { gatewayConnectionIds: strategy.gateways },
            });
            edges.push(
                edge('trigger', 'main', 'cheapest'),
                edge('cheapest', 'success', success.id),
                edge('cheapest', 'failure', failed.id),
            );
            break;
    }
    const nodes = [
        ...routing,
        ...(keptIds.has(success.id) ? [] : [success]),
        ...(keptIds.has(failed.id) ? [] : [failed]),
        ...kept,
    ];
    // Ligações entre os nós mantidos (automações) seguem como estavam.
    const keptEdges = (current?.edges ?? []).filter(
        (item) => keptIds.has(item.source) && keptIds.has(item.target),
    );
    return autoLayout({ nodes, edges: [...edges, ...keptEdges] });
}

/** Lê a estratégia de um fluxo; `null` quando ele tem outra forma (personalizado). */
export function readStrategy(graph: FlowGraph): PaymentStrategy | null {
    const routing = graph.nodes.filter((node) => routingTypes.has(node.type));
    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    const out = (id: string, handle: string) =>
        byId.get(
            graph.edges.find((item) => item.source === id && item.sourceHandle === handle)
                ?.target ?? '',
        );
    const trigger = routing.find((node) => node.type === 'trigger');
    if (!trigger || routing.filter((node) => node.type === 'trigger').length > 1) return null;
    const first = out(trigger.id, 'main');
    const ends = (node: FlowNode | undefined, failure: 'failed' | 'gateway') =>
        node !== undefined &&
        out(node.id, 'success')?.type === 'success' &&
        out(node.id, 'failure')?.type === failure;
    // Só gateways sem restrição de forma: com restrição, a forma não cabe no modo simples.
    const plain = (node: FlowNode | undefined) =>
        node?.type === 'gateway' && (node.config.methods ?? []).length === 0;
    const gatewayId = (node: FlowNode | undefined) =>
        node?.type === 'gateway' ? node.config.gatewayConnectionId : null;

    if (routing.length === 2 && plain(first) && ends(first, 'failed'))
        return { kind: 'single', gateway: gatewayId(first) };
    if (routing.length === 3 && plain(first) && ends(first, 'gateway')) {
        const backup = out(first?.id ?? '', 'failure');
        if (plain(backup) && ends(backup, 'failed'))
            return { kind: 'failover', primary: gatewayId(first), backup: gatewayId(backup) };
    }
    if (routing.length === 4 && first?.type === 'split') {
        const a = out(first.id, 'a');
        const b = out(first.id, 'b');
        if (plain(a) && plain(b) && ends(a, 'failed') && ends(b, 'failed'))
            return {
                kind: 'split',
                a: gatewayId(a),
                b: gatewayId(b),
                percentage: first.config.percentage,
            };
    }
    if (routing.length === 2 && first?.type === 'cheapest' && ends(first, 'failed'))
        return { kind: 'cheapest', gateways: first.config.gatewayConnectionIds };
    return null;
}

/** Automações do fluxo: gatilhos de evento e ações depois de aprovado/recusado. */
export function automationCount(graph: FlowGraph) {
    return graph.nodes.filter(
        (node) =>
            node.type === 'event_trigger' ||
            node.type === 'send_email' ||
            node.type === 'send_webhook',
    ).length;
}

/** A estratégia em uma frase, com os nomes dos gateways. */
export function strategySentence(
    strategy: PaymentStrategy,
    connections: readonly GatewayConnection[],
) {
    const name = (id: string | null) =>
        connections.find((connection) => connection.id === id)?.name ?? 'gateway não escolhido';
    switch (strategy.kind) {
        case 'single':
            return `Cobra toda venda no ${name(strategy.gateway)}.`;
        case 'failover':
            return `Cobra no ${name(strategy.primary)}; se recusar, tenta no ${name(strategy.backup)}.`;
        case 'split':
            return `${String(strategy.percentage)}% das vendas no ${name(strategy.a)} e ${String(100 - strategy.percentage)}% no ${name(strategy.b)}.`;
        case 'cheapest':
            return strategy.gateways.length > 0
                ? `Cobra no mais barato entre ${strategy.gateways.map(name).join(', ')}.`
                : 'Escolha os gateways para comparar as taxas.';
    }
}

/**
 * O preset como fluxo, para simular: os gateways ativos em cascata, na ordem em que foram
 * conectados. A simulação pula os que não aceitam a forma, como a API faz ao cobrar.
 */
export function presetGraph(connections: readonly GatewayConnection[]): FlowGraph {
    const ids = usableGateways(connections).map((connection) => connection.id);
    const nodes: FlowNode[] = [
        { id: 'trigger', type: 'trigger', position: at, config: {} },
        ...ids.map((id, index) => gatewayNode(`gateway_${String(index)}`, id)),
        { id: 'success', type: 'success', position: at, config: {} },
        { id: 'failed', type: 'failed', position: at, config: {} },
    ];
    const edges: FlowEdge[] = ids.length
        ? [edge('trigger', 'main', 'gateway_0')]
        : [edge('trigger', 'main', 'failed')];
    ids.forEach((_, index) => {
        const id = `gateway_${String(index)}`;
        edges.push(
            edge(id, 'success', 'success'),
            edge(id, 'failure', index + 1 < ids.length ? `gateway_${String(index + 1)}` : 'failed'),
        );
    });
    return { nodes, edges };
}

/** Um passo da rota desenhada no Pagamento: gateways em ordem, divisão ou comparação. */
export type RouteStep =
    | { kind: 'gateways'; label: string; names: string[] }
    | { kind: 'split'; branches: { percentage: number; name: string }[] }
    | { kind: 'custom'; names: string[] };

/** A rota em passos legíveis, do preset ou da estratégia do fluxo. */
export function routeSteps(
    flow: FlowGraph | undefined,
    connections: readonly GatewayConnection[],
): RouteStep[] {
    const name = (id: string | null) =>
        connections.find((connection) => connection.id === id)?.name ?? 'Escolha o gateway';
    if (!flow) {
        const names = usableGateways(connections).map((connection) => connection.name);
        return names.length === 0
            ? []
            : [
                  { kind: 'gateways', label: 'Cobra no', names: names.slice(0, 1) },
                  ...(names.length > 1
                      ? [
                            {
                                kind: 'gateways' as const,
                                label: 'Se recusar, tenta',
                                names: names.slice(1),
                            },
                        ]
                      : []),
              ];
    }
    const strategy = readStrategy(flow);
    if (!strategy) {
        const ids = flow.nodes.flatMap((node) =>
            node.type === 'gateway' && node.config.gatewayConnectionId
                ? [node.config.gatewayConnectionId]
                : node.type === 'cheapest'
                  ? node.config.gatewayConnectionIds
                  : [],
        );
        return [{ kind: 'custom', names: [...new Set(ids)].map(name) }];
    }
    switch (strategy.kind) {
        case 'single':
            return [{ kind: 'gateways', label: 'Cobra no', names: [name(strategy.gateway)] }];
        case 'failover':
            return [
                { kind: 'gateways', label: 'Cobra no', names: [name(strategy.primary)] },
                { kind: 'gateways', label: 'Se recusar, tenta', names: [name(strategy.backup)] },
            ];
        case 'split':
            return [
                {
                    kind: 'split',
                    branches: [
                        { percentage: strategy.percentage, name: name(strategy.a) },
                        { percentage: 100 - strategy.percentage, name: name(strategy.b) },
                    ],
                },
            ];
        case 'cheapest':
            return [
                {
                    kind: 'gateways',
                    label: 'O mais barato entre',
                    names: strategy.gateways.map(name),
                },
            ];
    }
}

/** Automações em linguagem de negócio: quando acontece e o que faz. */
export function automationList(graph: FlowGraph | undefined) {
    if (!graph) return [];
    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    const whenOf = (id: string): string => {
        const seen = new Set<string>();
        const queue = [id];
        for (let current = queue.shift(); current !== undefined; current = queue.shift()) {
            if (seen.has(current)) continue;
            seen.add(current);
            const node = byId.get(current);
            if (node?.type === 'success') return 'Quando o pagamento é aprovado';
            if (node?.type === 'failed') return 'Quando o pagamento é recusado';
            if (node?.type === 'event_trigger') return `Quando: ${eventLabels[node.config.event]}`;
            for (const item of graph.edges) if (item.target === current) queue.push(item.source);
        }
        return 'Sem gatilho ligado';
    };
    return graph.nodes.flatMap((node) =>
        node.type === 'send_email'
            ? [
                  {
                      id: node.id,
                      when: whenOf(node.id),
                      what:
                          node.name ??
                          `E-mail para ${node.config.recipients === 'customer' ? 'o cliente' : node.config.recipients === 'team' ? 'a equipe' : node.config.emails.join(', ')}`,
                  },
              ]
            : node.type === 'send_webhook'
              ? [{ id: node.id, when: whenOf(node.id), what: node.name ?? 'Enviar webhook' }]
              : [],
    );
}

/**
 * Troca só a rota (gatilho, lógica, gateways) por outra, como a de um modelo pronto. As
 * automações continuam: o que saía de aprovado/recusado passa a sair dos da rota nova.
 */
export function replaceRouting(current: FlowGraph | undefined, routing: FlowGraph): FlowGraph {
    if (!current) return routing;
    const success = routing.nodes.find((node) => node.type === 'success');
    const failed = routing.nodes.find((node) => node.type === 'failed');
    const outcome = new Map(
        current.nodes.flatMap((node) =>
            node.type === 'success' && success
                ? [[node.id, success.id] as const]
                : node.type === 'failed' && failed
                  ? [[node.id, failed.id] as const]
                  : [],
        ),
    );
    const kept = current.nodes.filter(
        (node) => !routingTypes.has(node.type) && node.type !== 'success' && node.type !== 'failed',
    );
    const keptIds = new Set(kept.map((node) => node.id));
    const taken = new Set(routing.nodes.map((node) => node.id));
    const keptEdges = current.edges.flatMap((item) => {
        const source = outcome.get(item.source) ?? item.source;
        return keptIds.has(item.target) && (keptIds.has(source) || taken.has(source))
            ? [{ ...item, source }]
            : [];
    });
    return autoLayout({
        nodes: [...routing.nodes, ...kept.filter((node) => !taken.has(node.id))],
        edges: [...routing.edges, ...keptEdges],
    });
}

/** Soma um grafo (uma automação pronta) ao fluxo, com ids novos para não colidir. */
export function appendGraph(current: FlowGraph | undefined, addition: FlowGraph): FlowGraph {
    const base = current ?? { nodes: [], edges: [] };
    const suffix = Math.random().toString(36).slice(2, 7);
    const id = (value: string) => `${value}_${suffix}`;
    const bottom = Math.max(0, ...base.nodes.map((node) => node.position.y + 160));
    return {
        ...base,
        nodes: [
            ...base.nodes,
            ...addition.nodes.map(
                (node) =>
                    ({
                        ...node,
                        id: id(node.id),
                        position: { x: node.position.x, y: node.position.y + bottom + 80 },
                    }) as FlowNode,
            ),
        ],
        edges: [
            ...base.edges,
            ...addition.edges.map((item) => ({
                ...item,
                id: id(item.id),
                source: id(item.source),
                target: id(item.target),
            })),
        ],
    };
}
