import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { FlowGraph } from '../src/lib/api/types';
import {
    appendGraph,
    buildStrategy,
    readStrategy,
    replaceRouting,
    type PaymentStrategy,
} from '../src/lib/orchestration/strategy';

describe('payment strategies', () => {
    const strategies: PaymentStrategy[] = [
        { kind: 'single', gateway: 'gw_a' },
        { kind: 'failover', primary: 'gw_a', backup: 'gw_b' },
        { kind: 'split', a: 'gw_a', b: 'gw_b', percentage: 70 },
        { kind: 'cheapest', gateways: ['gw_a', 'gw_b'] },
    ];

    for (const strategy of strategies)
        it(`reads back the ${strategy.kind} strategy it builds`, () => {
            assert.deepEqual(readStrategy(buildStrategy(strategy)), strategy);
        });

    it('keeps automations when the strategy changes', () => {
        const current: FlowGraph = {
            ...buildStrategy({ kind: 'single', gateway: 'gw_a' }),
        };
        current.nodes.push({
            id: 'email',
            type: 'send_email',
            position: { x: 0, y: 0 },
            config: { recipients: 'customer', emails: [], subject: 'Obrigado', body: 'Oi' },
        });
        current.edges.push({
            id: 'e_email',
            source: 'success',
            sourceHandle: 'next',
            target: 'email',
        });

        const next = buildStrategy({ kind: 'failover', primary: 'gw_a', backup: 'gw_b' }, current);

        assert.ok(next.nodes.some((node) => node.id === 'email'));
        assert.ok(next.edges.some((edge) => edge.source === 'success' && edge.target === 'email'));
        assert.deepEqual(readStrategy(next), {
            kind: 'failover',
            primary: 'gw_a',
            backup: 'gw_b',
        });
    });

    it('treats other shapes as a custom flow', () => {
        const graph = buildStrategy({ kind: 'single', gateway: 'gw_a' });
        const gateway = graph.nodes.find((node) => node.type === 'gateway');
        if (gateway?.type === 'gateway') gateway.config.methods = ['pix'];
        assert.equal(readStrategy(graph), null);
    });

    it('replaces only the route and keeps automations wired to the new outcomes', () => {
        const current = buildStrategy({ kind: 'single', gateway: 'gw_a' });
        current.nodes.push({
            id: 'email',
            type: 'send_email',
            position: { x: 0, y: 0 },
            config: { recipients: 'team', emails: [], subject: 'Venda', body: 'Oi' },
        });
        current.edges.push({
            id: 'e_email',
            source: 'success',
            sourceHandle: 'next',
            target: 'email',
        });
        const routing = buildStrategy({ kind: 'cheapest', gateways: ['gw_a', 'gw_b'] });
        const success = routing.nodes.find((node) => node.type === 'success');

        const next = replaceRouting(current, routing);

        assert.ok(next.nodes.some((node) => node.id === 'email'));
        assert.ok(
            next.edges.some((edge) => edge.source === success?.id && edge.target === 'email'),
        );
        assert.deepEqual(readStrategy(next), { kind: 'cheapest', gateways: ['gw_a', 'gw_b'] });
    });

    it('appends an automation with fresh ids', () => {
        const current = buildStrategy({ kind: 'single', gateway: 'gw_a' });
        const next = appendGraph(current, current);
        const ids = next.nodes.map((node) => node.id);
        assert.equal(new Set(ids).size, ids.length);
        assert.equal(next.edges.length, current.edges.length * 2);
    });
});
