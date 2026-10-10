import type { IconName } from '@/components/ui/icon';
import type {
    FlowCondition,
    FlowConditionField,
    FlowConditionGroup,
    FlowEdge,
    FlowEvent,
    FlowGraph,
    FlowNode,
    FlowNodeType,
    RoutingPaymentMethod,
} from '@/lib/api/types';

/**
 * Catálogo e regras do editor visual. Espelha o motor da API (gateway-flow.ts): os mesmos
 * tipos de nó, as mesmas saídas e a mesma semântica. A validação definitiva é sempre a da API.
 */

export type BlockCategory = 'trigger' | 'logic' | 'gateway' | 'action' | 'outcome' | 'utility';

export interface BlockDefinition {
    /** Único na paleta: gatilhos de evento compartilham o tipo e mudam o evento. */
    readonly key: string;
    readonly type: FlowNodeType;
    readonly event?: FlowEvent;
    readonly category: BlockCategory;
    readonly title: string;
    readonly description: string;
    readonly icon: IconName;
    /** Classe do quadrado do ícone no card (flow-editor.css). */
    readonly tone: string;
    readonly keywords: string;
}

export const blocks: readonly BlockDefinition[] = [
    {
        key: 'trigger',
        type: 'trigger',
        category: 'trigger',
        title: 'Venda iniciada',
        description: 'Começa quando o comprador confirma o pagamento',
        icon: 'bolt',
        tone: 'flow-tone-trigger',
        keywords: 'gatilho inicio checkout pedido trigger roteamento gateway',
    },
    ...(
        [
            [
                'payment.approved.v1',
                'Pagamento aprovado',
                'Quando uma venda é paga',
                'check-circle',
            ],
            [
                'payment.failed.v1',
                'Pagamento recusado',
                'Quando todos os gateways recusam',
                'x-circle',
            ],
            ['payment.refunded.v1', 'Reembolso', 'Quando um pagamento é reembolsado', 'refund'],
            [
                'payment.canceled.v1',
                'Pagamento cancelado',
                'Quando um pagamento é cancelado',
                'close',
            ],
            ['order.created.v1', 'Pedido criado', 'Quando o comprador confirma o pedido', 'cart'],
            [
                'checkout.session.expired.v1',
                'Checkout abandonado',
                'Quando o comprador sai sem pagar',
                'clock',
            ],
        ] as const
    ).map(([event, title, description, icon]): BlockDefinition => ({
        key: event,
        type: 'event_trigger',
        event,
        category: 'trigger',
        title,
        description,
        icon,
        tone: 'flow-tone-trigger',
        keywords: `gatilho evento quando ${title.toLowerCase()} automação`,
    })),
    {
        key: 'condition',
        type: 'condition',
        category: 'logic',
        title: 'Condição (SE)',
        description: 'Divide em verdadeiro ou falso usando E / OU',
        icon: 'branch',
        tone: 'flow-tone-logic',
        keywords: 'if se condicao e ou and or not nao logica regra filtro',
    },
    {
        key: 'switch',
        type: 'switch',
        category: 'logic',
        title: 'Roteador',
        description: 'Vários caminhos; vale o primeiro que combinar',
        icon: 'switch',
        tone: 'flow-tone-logic',
        keywords: 'switch roteador caminhos forma de pagamento metodo router',
    },
    {
        key: 'split',
        type: 'split',
        category: 'logic',
        title: 'Divisão A/B',
        description: 'Manda uma porcentagem das vendas para cada lado',
        icon: 'split',
        tone: 'flow-tone-logic',
        keywords: 'split ab teste porcentagem trafego dividir',
    },
    {
        key: 'gateway',
        type: 'gateway',
        category: 'gateway',
        title: 'Gateway',
        description: 'Cobra em um gateway; se falhar, segue para o próximo',
        icon: 'plug',
        tone: 'flow-tone-gateway',
        keywords: 'gateway cobrar stripe mercado pago abacate adquirente',
    },
    {
        key: 'cheapest',
        type: 'cheapest',
        category: 'gateway',
        title: 'Mais barato',
        description: 'Escolhe o de menor taxa entre os que aprovam bem',
        icon: 'coins',
        tone: 'flow-tone-gateway',
        keywords: 'custo taxa barato economia menor tarifa',
    },
    {
        key: 'checkout_default',
        type: 'checkout_default',
        category: 'gateway',
        title: 'Gateway do checkout',
        description: 'Usa o gateway e as reservas configurados no checkout',
        icon: 'cart',
        tone: 'flow-tone-gateway',
        keywords: 'padrao checkout default configurado',
    },
    {
        key: 'send_webhook',
        type: 'send_webhook',
        category: 'action',
        title: 'Enviar webhook',
        description: 'Avisa um sistema externo com os dados do evento',
        icon: 'webhook',
        tone: 'flow-tone-action',
        keywords: 'webhook http integracao api notificar sistema',
    },
    {
        key: 'send_email',
        type: 'send_email',
        category: 'action',
        title: 'Enviar e-mail',
        description: 'Para o cliente, a equipe ou endereços fixos',
        icon: 'mail',
        tone: 'flow-tone-action',
        keywords: 'email e-mail mensagem avisar cliente equipe notificar',
    },
    {
        key: 'success',
        type: 'success',
        category: 'outcome',
        title: 'Pagamento aprovado',
        description: 'Venda cobrada; ligue ações para depois',
        icon: 'check-circle',
        tone: 'flow-tone-success',
        keywords: 'sucesso aprovado pago fim',
    },
    {
        key: 'failed',
        type: 'failed',
        category: 'outcome',
        title: 'Pagamento recusado',
        description: 'Todos falharam; ligue ações para depois',
        icon: 'x-circle',
        tone: 'flow-tone-danger',
        keywords: 'falha recusado erro fim',
    },
    {
        key: 'section',
        type: 'section',
        category: 'utility',
        title: 'Seção',
        description: 'Moldura com título para organizar blocos',
        icon: 'layout',
        tone: 'flow-tone-section',
        keywords: 'secao grupo moldura frame organizar area separar titulo',
    },
    {
        key: 'note',
        type: 'note',
        category: 'utility',
        title: 'Nota',
        description: 'Um lembrete no canvas; não afeta as vendas',
        icon: 'note',
        tone: 'flow-tone-note',
        keywords: 'nota comentario post-it anotacao sticky',
    },
];

export const blockByType = Object.fromEntries(
    [...blocks].reverse().map((block) => [block.type, block]),
) as Record<FlowNodeType, BlockDefinition>;

export const eventLabels = Object.fromEntries(
    blocks.flatMap((block) => (block.event ? [[block.event, block.title]] : [])),
) as Record<FlowEvent, string>;

/** Definição visual do nó: gatilhos de evento usam a do evento escolhido. */
export function blockOf(node: FlowNode): BlockDefinition {
    if (node.type === 'event_trigger')
        return (
            blocks.find((block) => block.event === node.config.event) ?? blockByType.event_trigger
        );
    return blockByType[node.type];
}

export function isTrigger(type: FlowNodeType) {
    return type === 'trigger' || type === 'event_trigger';
}

export const categoryLabels: Record<BlockCategory, string> = {
    trigger: 'Gatilhos',
    logic: 'Lógica',
    gateway: 'Gateways',
    action: 'Ações',
    outcome: 'Saídas',
    utility: 'Utilidades',
};

export interface NodeOutput {
    readonly id: string;
    readonly label: string;
    readonly tone: 'neutral' | 'success' | 'danger' | 'brand' | 'warning';
}

/** Saídas de cada nó, na ordem em que aparecem de cima para baixo no card. */
export function nodeOutputs(node: FlowNode): NodeOutput[] {
    switch (node.type) {
        case 'trigger':
        case 'event_trigger':
            return [{ id: 'main', label: '', tone: 'neutral' }];
        case 'send_webhook':
        case 'send_email':
            return [{ id: 'next', label: '', tone: 'neutral' }];
        case 'condition':
            return [
                { id: 'true', label: 'verdadeiro', tone: 'success' },
                { id: 'false', label: 'falso', tone: 'neutral' },
            ];
        case 'switch':
            return [
                ...node.config.cases.map((item, index) => ({
                    id: item.id,
                    label: item.label || caseFallbackLabel(item, index),
                    tone: 'brand' as const,
                })),
                { id: 'otherwise', label: 'senão', tone: 'neutral' },
            ];
        case 'split':
            return [
                { id: 'a', label: `A · ${String(node.config.percentage)}%`, tone: 'brand' },
                { id: 'b', label: `B · ${String(100 - node.config.percentage)}%`, tone: 'warning' },
            ];
        case 'gateway':
        case 'cheapest':
        case 'checkout_default':
            return [
                { id: 'success', label: 'aprovado', tone: 'success' },
                { id: 'failure', label: 'falhou', tone: 'danger' },
            ];
        // Depois do resultado real da cobrança: lógica e ações (webhook, e-mail).
        case 'success':
        case 'failed':
            return [{ id: 'next', label: '', tone: 'neutral' }];
        default:
            return [];
    }
}

export function hasInput(type: FlowNodeType) {
    return !isTrigger(type) && type !== 'note' && type !== 'section';
}

export function outputLabel(node: FlowNode | undefined, handle: string) {
    if (!node) return '';
    return nodeOutputs(node).find((output) => output.id === handle)?.label ?? '';
}

export function outputTone(node: FlowNode | undefined, handle: string): NodeOutput['tone'] {
    if (!node) return 'neutral';
    return nodeOutputs(node).find((output) => output.id === handle)?.tone ?? 'neutral';
}

export function newId(prefix: string) {
    const random =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);
    return `${prefix}_${random}`;
}

export function createNode(
    type: FlowNodeType,
    position: { x: number; y: number },
    event?: FlowEvent,
): FlowNode {
    const prefixes: Partial<Record<FlowNodeType, string>> = {
        checkout_default: 'checkout',
        event_trigger: 'when',
        send_webhook: 'webhook',
        send_email: 'email',
    };
    const id = newId(prefixes[type] ?? type);
    const base = { id, position };
    switch (type) {
        case 'event_trigger':
            return { ...base, type, config: { event: event ?? 'payment.approved.v1' } };
        case 'send_webhook':
            return { ...base, type, config: { webhookEndpointId: null } };
        case 'send_email':
            return {
                ...base,
                type,
                config: { recipients: 'team', emails: [], subject: '', body: '' },
            };
        case 'condition':
            return {
                ...base,
                type,
                config: {
                    combinator: 'and',
                    conditions: [
                        { id: newId('c'), field: 'paymentMethod', operator: 'in', values: ['pix'] },
                    ],
                },
            };
        case 'switch':
            return {
                ...base,
                type,
                config: {
                    cases: (['card', 'pix', 'boleto'] as const).map((method) => ({
                        id: newId('case'),
                        label: methodLabels[method],
                        combinator: 'and' as const,
                        conditions: [
                            {
                                id: newId('c'),
                                field: 'paymentMethod' as const,
                                operator: 'in' as const,
                                values: [method],
                            },
                        ],
                    })),
                },
            };
        case 'split':
            return { ...base, type, config: { percentage: 50 } };
        case 'gateway':
            return { ...base, type, config: { gatewayConnectionId: null } };
        case 'cheapest':
            return { ...base, type, config: { gatewayConnectionIds: [] } };
        case 'note':
            return { ...base, type, config: { text: '' } };
        case 'section':
            return {
                ...base,
                type,
                config: { title: 'Nova seção', color: 'neutral', width: 640, height: 400 },
            };
        default:
            return { ...base, type, config: {} } as FlowNode;
    }
}

// --- Condições ------------------------------------------------------------------------

export const methodLabels: Record<RoutingPaymentMethod, string> = {
    card: 'Cartão',
    pix: 'Pix',
    boleto: 'Boleto',
    bank_transfer: 'Transferência',
};

export const fieldLabels: Record<FlowConditionField, string> = {
    paymentMethod: 'Forma de pagamento',
    amount: 'Valor da venda',
    currency: 'Moeda',
    environment: 'Ambiente',
    checkout: 'Checkout',
    product: 'Produto no pedido',
};

export const operatorLabels: Record<string, string> = {
    in: 'é',
    not_in: 'não é',
    gt: 'maior que',
    gte: 'maior ou igual a',
    lt: 'menor que',
    lte: 'menor ou igual a',
    eq: 'igual a',
    between: 'entre',
    not_between: 'fora da faixa',
    any_in: 'contém algum de',
    all_in: 'só contém',
    none_in: 'não contém',
};

export const fieldOperators: Record<FlowConditionField, string[]> = {
    paymentMethod: ['in', 'not_in'],
    amount: ['gt', 'gte', 'lt', 'lte', 'eq', 'between', 'not_between'],
    currency: ['in', 'not_in'],
    environment: ['in', 'not_in'],
    checkout: ['in', 'not_in'],
    product: ['any_in', 'all_in', 'none_in'],
};

export function defaultCondition(field: FlowConditionField): FlowCondition {
    const id = newId('c');
    switch (field) {
        case 'paymentMethod':
            return { id, field, operator: 'in', values: [] };
        case 'amount':
            return { id, field, operator: 'gte', amountMinor: 10_000 };
        case 'currency':
            return { id, field, operator: 'in', values: ['BRL'] };
        case 'environment':
            return { id, field, operator: 'in', values: ['production'] };
        case 'checkout':
            return { id, field, operator: 'in', values: [] };
        case 'product':
            return { id, field, operator: 'any_in', values: [] };
    }
}

export interface NameLookup {
    readonly checkouts: Map<string, string>;
    readonly products: Map<string, string>;
}

/** Condição em português corrido, para o card e o resumo. */
export function conditionSentence(condition: FlowCondition, names?: NameLookup) {
    const field = fieldLabels[condition.field];
    const operator = operatorLabels[condition.operator] ?? condition.operator;
    if (condition.field === 'amount') {
        const from = money(condition.amountMinor);
        if (condition.operator === 'between' || condition.operator === 'not_between')
            return `${field} ${operator} ${from} e ${money(condition.amountToMinor ?? condition.amountMinor)}`;
        return `${field} ${operator} ${from}`;
    }
    const label = (value: string) =>
        condition.field === 'paymentMethod'
            ? methodLabels[value as RoutingPaymentMethod]
            : condition.field === 'environment'
              ? value === 'production'
                  ? 'Produção'
                  : 'Sandbox'
              : condition.field === 'checkout'
                ? (names?.checkouts.get(value) ?? value)
                : condition.field === 'product'
                  ? (names?.products.get(value) ?? value)
                  : value;
    const values = condition.values.map(label);
    return `${field} ${operator} ${values.length ? joinOr(values) : '…'}`;
}

export function groupSentence(group: FlowConditionGroup, names?: NameLookup) {
    if (group.conditions.length === 0) return 'Sem condições';
    return group.conditions
        .map((condition) => conditionSentence(condition, names))
        .join(group.combinator === 'and' ? ' E ' : ' OU ');
}

function caseFallbackLabel(group: FlowConditionGroup, index: number) {
    const [first] = group.conditions;
    if (group.conditions.length === 1 && first?.field === 'paymentMethod')
        return (
            first.values.map((value) => methodLabels[value]).join(' / ') ||
            `Caminho ${String(index + 1)}`
        );
    return `Caminho ${String(index + 1)}`;
}

function joinOr(items: string[]) {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} ou ${items.at(-1) ?? ''}`;
}

export function money(minor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        minor / 100,
    );
}

export function toMinor(value: string) {
    const normalized = value.trim().replace(/\./g, '').replace(',', '.');
    if (!normalized) return undefined;
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : undefined;
}

export function fromMinor(value: number | undefined) {
    return value === undefined ? '' : (value / 100).toFixed(2).replace('.', ',');
}

// --- Layout ---------------------------------------------------------------------------

const columnGap = 340;
const rowGap = 48;

/** Altura aproximada do card renderizado, para o layout não sobrepor blocos. */
export function estimatedHeight(node: FlowNode | undefined) {
    if (!node) return 96;
    const outputs = nodeOutputs(node).length;
    const outputRows = outputs > 1 ? 28 + outputs * 38 : 0;
    switch (node.type) {
        case 'trigger':
        case 'event_trigger':
        case 'success':
        case 'failed':
            return 92;
        case 'condition':
            return 112 + Math.min(node.config.conditions.length, 4) * 22 + outputRows;
        case 'gateway':
        case 'cheapest':
            return 152 + outputRows;
        default:
            return 120 + outputRows;
    }
}

/**
 * Organiza o grafo em colunas a partir do gatilho (estilo n8n): cada nó fica uma coluna à
 * direita do nó mais distante que leva até ele; dentro da coluna, segue a ordem das saídas.
 */
export function autoLayout(graph: FlowGraph): FlowGraph {
    const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
    const outgoing = new Map<string, FlowEdge[]>();
    for (const edge of graph.edges)
        outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
    const order = (node: FlowNode) => nodeOutputs(node).map((output) => output.id);
    const sorted = (node: FlowNode) =>
        [...(outgoing.get(node.id) ?? [])].sort(
            (left, right) =>
                order(node).indexOf(left.sourceHandle) - order(node).indexOf(right.sourceHandle),
        );
    // Uma faixa por gatilho: roteamento primeiro, depois cada automação abaixo.
    const roots = [
        ...graph.nodes.filter((node) => node.type === 'trigger'),
        ...graph.nodes.filter((node) => node.type === 'event_trigger'),
    ];
    const placed = new Set<string>();
    const positioned = new Map<string, { x: number; y: number }>();
    let bandTop = 0;
    for (const root of roots) {
        const depth = new Map<string, number>();
        const visit = (id: string, level: number, trail: Set<string>) => {
            if (placed.has(id) || trail.has(id) || (depth.get(id) ?? -1) >= level) return;
            depth.set(id, level);
            const node = nodes.get(id);
            if (!node) return;
            const next = new Set(trail).add(id);
            for (const edge of sorted(node)) visit(edge.target, level + 1, next);
        };
        visit(root.id, 0, new Set());
        // Ordem vertical: a descoberta em profundidade preserva "verdadeiro em cima".
        const rank = new Map<string, number>();
        const walk = (id: string) => {
            if (rank.has(id) || !depth.has(id)) return;
            rank.set(id, rank.size);
            const node = nodes.get(id);
            if (node) for (const edge of sorted(node)) walk(edge.target);
        };
        walk(root.id);
        const columns = new Map<number, string[]>();
        for (const [id, level] of depth) columns.set(level, [...(columns.get(level) ?? []), id]);
        const totals = new Map<number, number>();
        for (const [level, ids] of columns) {
            ids.sort((left, right) => (rank.get(left) ?? 0) - (rank.get(right) ?? 0));
            totals.set(
                level,
                ids.reduce((sum, id) => sum + estimatedHeight(nodes.get(id)), 0) +
                    rowGap * (ids.length - 1),
            );
        }
        const bandHeight = Math.max(80, ...totals.values());
        for (const [level, ids] of columns) {
            let y = bandTop + (bandHeight - (totals.get(level) ?? 0)) / 2;
            for (const id of ids) {
                positioned.set(id, { x: level * columnGap, y: Math.round(y) });
                placed.add(id);
                y += estimatedHeight(nodes.get(id)) + rowGap;
            }
        }
        bandTop += bandHeight + 140;
    }
    // Nós soltos (fora as notas) ficam abaixo de tudo, sem se sobrepor.
    let loose = 0;
    return {
        ...graph,
        nodes: graph.nodes.map((node) => {
            const position = positioned.get(node.id);
            if (position) return { ...node, position };
            if (node.type === 'note' || node.type === 'section') return node;
            loose += 1;
            return { ...node, position: { x: (loose - 1) * columnGap, y: bandTop } };
        }),
    };
}

/** Cor de destaque por tipo de bloco: minimapa e miniaturas dos modelos. */
export function nodeColor(type: FlowNodeType) {
    switch (type) {
        case 'trigger':
        case 'event_trigger':
            return '#a3e635';
        case 'condition':
        case 'switch':
        case 'split':
            return '#fb923c';
        case 'send_webhook':
        case 'send_email':
            return '#22d3ee';
        case 'success':
            return '#4ade80';
        case 'failed':
            return '#f87171';
        case 'note':
            return '#fde047';
        case 'section':
            return 'rgba(148, 163, 184, 0.35)';
        default:
            return '#818cf8';
    }
}

/** Cor da ligação conforme a saída (aprovado, falhou, caminho, divisão). */
export function toneColor(tone: string) {
    return tone === 'success'
        ? '#16a34a'
        : tone === 'danger'
          ? '#e0485f'
          : tone === 'brand'
            ? '#6366f1'
            : tone === 'warning'
              ? '#d97706'
              : '#8b8e94';
}

/** Blocos só visuais: não entram no fluxo nem recebem ligações. */
export function isDecoration(type: FlowNodeType) {
    return type === 'note' || type === 'section';
}

export const sectionColors = ['neutral', 'lime', 'blue', 'violet', 'orange', 'pink'] as const;
