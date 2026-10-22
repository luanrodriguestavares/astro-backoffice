'use client';

import { useMemo, useState, type ReactNode } from 'react';

import type { FunnelPaymentSummary } from '@/components/checkout-builder/checkout-funnel-canvas';
import { FlowEditor } from '@/components/orchestration/flow-editor/flow-editor';
import { Icon } from '@/components/ui/icon';
import type {
    CheckoutPaymentMethod,
    FlowGraph,
    FlowIssue,
    GatewayConnection,
    GatewayInsights,
    Product,
    WebhookEndpointSummary,
} from '@/lib/api/types';
import { connectionSupports } from '@/lib/checkout/gateway-bindings';
import {
    automationCount,
    readStrategy,
    routeSteps,
    strategyCopy,
    strategySentence,
    usableGateways,
} from '@/lib/orchestration/strategy';

export interface PaymentFlowResources {
    insights: GatewayInsights | null;
    products: Product[];
    webhooks: WebhookEndpointSummary[];
}

export function startingPaymentFlow(gatewayConnectionId: string | null = null): FlowGraph {
    return {
        nodes: [
            { id: 'trigger', type: 'trigger', position: { x: 0, y: 160 }, config: {} },
            {
                id: 'gateway',
                type: 'gateway',
                position: { x: 320, y: 160 },
                config: { gatewayConnectionId },
            },
            { id: 'success', type: 'success', position: { x: 660, y: 60 }, config: {} },
            { id: 'failed', type: 'failed', position: { x: 660, y: 280 }, config: {} },
        ],
        edges: [
            { id: 'e_trigger', source: 'trigger', sourceHandle: 'main', target: 'gateway' },
            { id: 'e_success', source: 'gateway', sourceHandle: 'success', target: 'success' },
            { id: 'e_failed', source: 'gateway', sourceHandle: 'failure', target: 'failed' },
        ],
    };
}

export function presetGatewayIds(
    connections: readonly GatewayConnection[],
): Record<CheckoutPaymentMethod, string[]> {
    const usable = usableGateways(connections);
    return Object.fromEntries(
        (['card', 'pix', 'boleto'] as const).map((method) => [
            method,
            usable
                .filter((connection) => connectionSupports(connection, method))
                .map((connection) => connection.id),
        ]),
    ) as Record<CheckoutPaymentMethod, string[]>;
}

/** O preset em uma frase, para o painel e o nó Pagamento. */
export function presetSentence(connections: readonly GatewayConnection[]) {
    const name = (id: string | undefined) =>
        connections.find((connection) => connection.id === id)?.name;
    const routes = Object.values(presetGatewayIds(connections));
    const primaries = [...new Set(routes.map((ids) => name(ids[0])))].filter(Boolean);
    const hasBackup = routes.some((ids) => ids.length > 1);
    if (primaries.length === 0) return 'Nenhum gateway ativo: conecte um para começar a vender.';
    return `${
        primaries.length === 1
            ? `Cobra no ${primaries[0] ?? ''}, o primeiro gateway ativo`
            : `Cada forma vai para o primeiro gateway que a aceita (${primaries.join(', ')})`
    }${hasBackup ? '; se recusar, tenta nos outros compatíveis.' : '.'}`;
}

export function usePaymentSummary({
    own,
    connections,
    errors,
    onOpen,
}: {
    own: FlowGraph | undefined;
    connections: readonly GatewayConnection[];
    errors: number;
    onOpen(): void;
}): FunnelPaymentSummary {
    return useMemo(() => {
        if (!own)
            return {
                source: 'preset',
                lines: [
                    { label: 'Estratégia', value: 'Padrão' },
                    { label: 'Como cobra', value: presetSentence(connections) },
                ],
                route: routeSteps(undefined, connections),
                errors: 0,
                onOpen,
            };
        const strategy = readStrategy(own);
        const automations = automationCount(own);
        return {
            source: 'own',
            lines: [
                {
                    label: 'Estratégia',
                    value: strategy ? strategyCopy[strategy.kind].title : 'Personalizada',
                },
                {
                    label: 'Como cobra',
                    value: strategy
                        ? strategySentence(strategy, connections)
                        : 'Fluxo montado no editor avançado.',
                },
                ...(automations > 0
                    ? [
                          {
                              label: 'Automações',
                              value: `${String(automations)} ${automations === 1 ? 'ação' : 'ações'}`,
                          },
                      ]
                    : []),
            ],
            route: routeSteps(own, connections),
            errors,
            onOpen,
        };
    }, [connections, errors, onOpen, own]);
}

/** Editor avançado (nós) do pagamento deste checkout. */
export function PaymentFlowTab({
    flow,
    connections,
    resources,
    canManageGateways,
    onChange,
    onIssues,
    leading,
}: {
    flow: FlowGraph | undefined;
    connections: GatewayConnection[];
    resources: PaymentFlowResources;
    canManageGateways: boolean;
    onChange(flow: FlowGraph | undefined): void;
    onIssues(issues: FlowIssue[]): void;
    /** Esquerda da barra do editor (voltar e identidade da área). */
    leading?: ReactNode;
}) {
    const [resetCount, setResetCount] = useState(0);

    if (!canManageGateways)
        return (
            <div className="ce-payment-empty">
                <section>
                    <span className="ce-payment-empty-icon">
                        <Icon name="lock" className="size-5" />
                    </span>
                    <h2>Sem acesso ao pagamento</h2>
                    <p>
                        Peça a quem gerencia gateways para montar o fluxo de pagamento deste
                        checkout.
                    </p>
                </section>
            </div>
        );

    // Sem fluxo próprio, mostra o preset como ponto de partida; a primeira edição já o
    // transforma no fluxo deste checkout.
    const current = flow ?? startingPaymentFlow(usableGateways(connections)[0]?.id ?? null);
    return (
        <div className="ce-payment-tab">
            <FlowEditor
                // Voltar ao padrão recarrega o editor com o preset.
                key={resetCount}
                graph={current}
                connections={connections}
                insights={resources.insights}
                products={resources.products}
                webhooks={resources.webhooks}
                onChange={onChange}
                onIssues={onIssues}
                leading={leading}
                actions={
                    flow === undefined ? undefined : (
                        <>
                            <button
                                type="button"
                                className="ce-button"
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            'Descartar o fluxo deste checkout e voltar ao padrão?',
                                        )
                                    ) {
                                        onChange(undefined);
                                        setResetCount((value) => value + 1);
                                    }
                                }}
                            >
                                <Icon name="undo" className="size-3.5" />
                                <span>Voltar ao padrão</span>
                            </button>
                        </>
                    )
                }
            />
        </div>
    );
}
