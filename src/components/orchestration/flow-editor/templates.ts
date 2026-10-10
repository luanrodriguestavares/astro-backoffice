import type { FlowGraph, FlowNode } from '@/lib/api/types';
import { autoLayout, createNode } from '@/lib/orchestration/flow';

/**
 * Modelos prontos do editor. Roteamento substitui o quadro (decide o gateway); automações
 * são adicionadas ao que já existe (reagem a eventos com webhooks e e-mails).
 */

export interface FlowTemplate {
    readonly id: string;
    readonly kind: 'routing' | 'automation';
    readonly title: string;
    readonly description: string;
    /** Grafo já organizado, com os gateways e endpoints que a conta tiver. */
    build(references: TemplateReferences): FlowGraph;
}

export interface TemplateReferences {
    readonly primaryGateway: string | null;
    readonly backupGateway: string | null;
    readonly webhookEndpoint: string | null;
}

interface RoutingTemplate {
    readonly title: string;
    readonly description: string;
    build(primary: string | null, backup: string | null): FlowGraph;
}

const at = { x: 0, y: 0 };

function gateway(id: string, connection: string | null): FlowNode {
    return { id, type: 'gateway', position: at, config: { gatewayConnectionId: connection } };
}

function simple(type: 'trigger' | 'checkout_default' | 'success' | 'failed', id: string): FlowNode {
    return { id, type, position: at, config: {} };
}

const routingTemplates: readonly RoutingTemplate[] = [
    {
        title: 'Por forma de pagamento com reserva',
        description: 'Roteador por cartão, Pix e boleto; cartão tem um gateway reserva.',
        build(primary, backup) {
            const router = createNode('switch', at);
            const cases = router.type === 'switch' ? router.config.cases : [];
            const [card, pix, boleto] = cases;
            return {
                nodes: [
                    simple('trigger', 'trigger'),
                    { ...router, id: 'router' },
                    gateway('card_1', primary),
                    gateway('card_2', backup),
                    gateway('pix_1', primary),
                    gateway('boleto_1', primary),
                    simple('checkout_default', 'checkout_1'),
                    simple('success', 'success_1'),
                    simple('failed', 'failed_1'),
                ],
                edges: [
                    { id: 'e1', source: 'trigger', sourceHandle: 'main', target: 'router' },
                    { id: 'e2', source: 'router', sourceHandle: card?.id ?? '', target: 'card_1' },
                    { id: 'e3', source: 'router', sourceHandle: pix?.id ?? '', target: 'pix_1' },
                    {
                        id: 'e4',
                        source: 'router',
                        sourceHandle: boleto?.id ?? '',
                        target: 'boleto_1',
                    },
                    { id: 'e5', source: 'router', sourceHandle: 'otherwise', target: 'checkout_1' },
                    { id: 'e6', source: 'card_1', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e7', source: 'card_1', sourceHandle: 'failure', target: 'card_2' },
                    { id: 'e8', source: 'card_2', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e9', source: 'card_2', sourceHandle: 'failure', target: 'failed_1' },
                    { id: 'e10', source: 'pix_1', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e11', source: 'pix_1', sourceHandle: 'failure', target: 'failed_1' },
                    { id: 'e12', source: 'boleto_1', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e13', source: 'boleto_1', sourceHandle: 'failure', target: 'failed_1' },
                    {
                        id: 'e14',
                        source: 'checkout_1',
                        sourceHandle: 'success',
                        target: 'success_1',
                    },
                    {
                        id: 'e15',
                        source: 'checkout_1',
                        sourceHandle: 'failure',
                        target: 'failed_1',
                    },
                ],
            };
        },
    },
    {
        title: 'Valor alto em gateway dedicado',
        description: 'Vendas a partir de R$ 500 vão para um gateway; o resto segue o checkout.',
        build(primary, backup) {
            return {
                nodes: [
                    simple('trigger', 'trigger'),
                    {
                        id: 'high_value',
                        type: 'condition',
                        position: at,
                        name: 'Valor alto?',
                        config: {
                            combinator: 'and',
                            conditions: [
                                { id: 'c1', field: 'amount', operator: 'gte', amountMinor: 50_000 },
                            ],
                        },
                    },
                    gateway('gateway_1', primary),
                    gateway('gateway_2', backup),
                    simple('checkout_default', 'checkout_1'),
                    simple('success', 'success_1'),
                    simple('failed', 'failed_1'),
                ],
                edges: [
                    { id: 'e1', source: 'trigger', sourceHandle: 'main', target: 'high_value' },
                    { id: 'e2', source: 'high_value', sourceHandle: 'true', target: 'gateway_1' },
                    { id: 'e3', source: 'high_value', sourceHandle: 'false', target: 'checkout_1' },
                    { id: 'e4', source: 'gateway_1', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e5', source: 'gateway_1', sourceHandle: 'failure', target: 'gateway_2' },
                    { id: 'e6', source: 'gateway_2', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e7', source: 'gateway_2', sourceHandle: 'failure', target: 'failed_1' },
                    {
                        id: 'e8',
                        source: 'checkout_1',
                        sourceHandle: 'success',
                        target: 'success_1',
                    },
                    { id: 'e9', source: 'checkout_1', sourceHandle: 'failure', target: 'failed_1' },
                ],
            };
        },
    },
    {
        title: 'Pix pelo mais barato',
        description: 'Pix compara a taxa dos gateways; outras formas seguem o checkout.',
        build(primary, backup) {
            return {
                nodes: [
                    simple('trigger', 'trigger'),
                    {
                        id: 'is_pix',
                        type: 'condition',
                        position: at,
                        name: 'É Pix?',
                        config: {
                            combinator: 'and',
                            conditions: [
                                {
                                    id: 'c1',
                                    field: 'paymentMethod',
                                    operator: 'in',
                                    values: ['pix'],
                                },
                            ],
                        },
                    },
                    {
                        id: 'cheapest_1',
                        type: 'cheapest',
                        position: at,
                        config: {
                            gatewayConnectionIds: [primary, backup].filter(
                                (id): id is string => id !== null,
                            ),
                        },
                    },
                    simple('checkout_default', 'checkout_1'),
                    simple('success', 'success_1'),
                    simple('failed', 'failed_1'),
                ],
                edges: [
                    { id: 'e1', source: 'trigger', sourceHandle: 'main', target: 'is_pix' },
                    { id: 'e2', source: 'is_pix', sourceHandle: 'true', target: 'cheapest_1' },
                    { id: 'e3', source: 'is_pix', sourceHandle: 'false', target: 'checkout_1' },
                    {
                        id: 'e4',
                        source: 'cheapest_1',
                        sourceHandle: 'success',
                        target: 'success_1',
                    },
                    { id: 'e5', source: 'cheapest_1', sourceHandle: 'failure', target: 'failed_1' },
                    {
                        id: 'e6',
                        source: 'checkout_1',
                        sourceHandle: 'success',
                        target: 'success_1',
                    },
                    { id: 'e7', source: 'checkout_1', sourceHandle: 'failure', target: 'failed_1' },
                ],
            };
        },
    },
    {
        title: 'Teste A/B entre gateways',
        description: 'Metade das vendas em cada gateway, com o outro como reserva.',
        build(primary, backup) {
            return {
                nodes: [
                    simple('trigger', 'trigger'),
                    { id: 'split_1', type: 'split', position: at, config: { percentage: 50 } },
                    gateway('a_1', primary),
                    gateway('a_2', backup),
                    gateway('b_1', backup),
                    gateway('b_2', primary),
                    simple('success', 'success_1'),
                    simple('failed', 'failed_1'),
                ],
                edges: [
                    { id: 'e1', source: 'trigger', sourceHandle: 'main', target: 'split_1' },
                    { id: 'e2', source: 'split_1', sourceHandle: 'a', target: 'a_1' },
                    { id: 'e3', source: 'split_1', sourceHandle: 'b', target: 'b_1' },
                    { id: 'e4', source: 'a_1', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e5', source: 'a_1', sourceHandle: 'failure', target: 'a_2' },
                    { id: 'e6', source: 'a_2', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e7', source: 'a_2', sourceHandle: 'failure', target: 'failed_1' },
                    { id: 'e8', source: 'b_1', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e9', source: 'b_1', sourceHandle: 'failure', target: 'b_2' },
                    { id: 'e10', source: 'b_2', sourceHandle: 'success', target: 'success_1' },
                    { id: 'e11', source: 'b_2', sourceHandle: 'failure', target: 'failed_1' },
                ],
            };
        },
    },
];

const automationTemplates: readonly {
    readonly title: string;
    readonly description: string;
    build(webhook: string | null): FlowGraph;
}[] = [
    {
        title: 'Avisar a equipe em vendas altas',
        description: 'Pagamento aprovado acima de R$ 1.000 manda e-mail para a equipe.',
        build() {
            return {
                nodes: [
                    {
                        id: 'approved',
                        type: 'event_trigger',
                        position: at,
                        config: { event: 'payment.approved.v1' },
                    },
                    {
                        id: 'high_sale',
                        type: 'condition',
                        position: at,
                        name: 'Venda alta?',
                        config: {
                            combinator: 'and',
                            conditions: [
                                {
                                    id: 'c1',
                                    field: 'amount',
                                    operator: 'gte',
                                    amountMinor: 100_000,
                                },
                            ],
                        },
                    },
                    {
                        id: 'notify_team',
                        type: 'send_email',
                        position: at,
                        config: {
                            recipients: 'team',
                            emails: [],
                            subject: 'Venda alta aprovada: {{valor}}',
                            body: '{{cliente.nome}} pagou {{valor}} via {{forma_pagamento}}.\nPedido: {{pedido}}',
                        },
                    },
                ],
                edges: [
                    { id: 'e1', source: 'approved', sourceHandle: 'main', target: 'high_sale' },
                    { id: 'e2', source: 'high_sale', sourceHandle: 'true', target: 'notify_team' },
                ],
            };
        },
    },
    {
        title: 'Webhook para o ERP',
        description: 'Avisa seu sistema quando um pagamento é aprovado ou reembolsado.',
        build(webhook) {
            return {
                nodes: [
                    {
                        id: 'approved',
                        type: 'event_trigger',
                        position: at,
                        config: { event: 'payment.approved.v1' },
                    },
                    {
                        id: 'refunded',
                        type: 'event_trigger',
                        position: at,
                        config: { event: 'payment.refunded.v1' },
                    },
                    {
                        id: 'erp_paid',
                        type: 'send_webhook',
                        position: at,
                        config: { webhookEndpointId: webhook },
                    },
                    {
                        id: 'erp_refund',
                        type: 'send_webhook',
                        position: at,
                        config: { webhookEndpointId: webhook },
                    },
                ],
                edges: [
                    { id: 'e1', source: 'approved', sourceHandle: 'main', target: 'erp_paid' },
                    { id: 'e2', source: 'refunded', sourceHandle: 'main', target: 'erp_refund' },
                ],
            };
        },
    },
    {
        title: 'Recuperar checkout abandonado',
        description: 'Quando o comprador sai sem pagar, manda um e-mail para ele voltar.',
        build() {
            return {
                nodes: [
                    {
                        id: 'abandoned',
                        type: 'event_trigger',
                        position: at,
                        config: { event: 'checkout.session.expired.v1' },
                    },
                    {
                        id: 'recover',
                        type: 'send_email',
                        position: at,
                        config: {
                            recipients: 'customer',
                            emails: [],
                            subject: 'Seu pedido está esperando, {{cliente.nome}}',
                            body: 'Olá {{cliente.nome}}, você deixou uma compra de {{valor}} em aberto. Volte para concluir quando quiser.',
                        },
                    },
                ],
                edges: [{ id: 'e1', source: 'abandoned', sourceHandle: 'main', target: 'recover' }],
            };
        },
    },
];

export const flowTemplates: readonly FlowTemplate[] = [
    ...automationTemplates.map((template, index): FlowTemplate => ({
        id: `automation-${String(index)}`,
        kind: 'automation',
        title: template.title,
        description: template.description,
        build: (references) => autoLayout(template.build(references.webhookEndpoint)),
    })),
    ...routingTemplates.map((template, index): FlowTemplate => ({
        id: `routing-${String(index)}`,
        kind: 'routing',
        title: template.title,
        description: template.description,
        build: (references) =>
            autoLayout(template.build(references.primaryGateway, references.backupGateway)),
    })),
];
