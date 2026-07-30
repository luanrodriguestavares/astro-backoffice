import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    checkoutReadinessIssues,
    connectionSupports,
    enabledPaymentMethods,
    presentRequiredComponents,
    selectableConnections,
} from '../src/lib/checkout/gateway-bindings';
import type { GatewayConnection } from '../src/lib/api/types';

function connection(overrides: Partial<GatewayConnection> = {}): GatewayConnection {
    return {
        id: 'gwc_test',
        provider: 'stripe',
        name: 'Principal',
        environment: 'production',
        status: 'active',
        publicConfiguration: {},
        capabilities: { payments: { methods: { card: {}, pix: {} } } },
        capabilitiesFetchedAt: '2026-07-29T00:00:00.000Z',
        capabilitiesExpiresAt: null,
        credentialsConfigured: true,
        externalAccountId: null,
        lastTestedAt: null,
        lastSuccessAt: null,
        lastFailureAt: null,
        failureReason: null,
        version: 1,
        createdAt: '2026-07-29T00:00:00.000Z',
        updatedAt: '2026-07-29T00:00:00.000Z',
        ...overrides,
    };
}

describe('gateway bindings', () => {
    it('reads supported methods from the actual gateway capability contract', () => {
        assert.equal(connectionSupports(connection(), 'card'), true);
        assert.equal(connectionSupports(connection(), 'boleto'), false);
    });

    it('only offers active compatible connections from the selected environment', () => {
        const result = selectableConnections(
            [
                connection(),
                connection({ id: 'gwc_sandbox', environment: 'sandbox' }),
                connection({ id: 'gwc_disabled', status: 'disabled' }),
            ],
            'card',
            'production',
        );
        assert.deepEqual(result.map(({ id }) => id), ['gwc_test']);
    });

    it('derives enabled methods from combined and dedicated payment components', () => {
        assert.deepEqual(
            enabledPaymentMethods([
                {
                    type: 'payment_methods',
                    props: { showCard: true, showPix: false, showBoleto: true },
                },
                { type: 'pix_payment', props: {} },
            ]),
            ['card', 'boleto', 'pix'],
        );
    });

    it('finds required checkout components nested inside grid slots', () => {
        assert.deepEqual(
            presentRequiredComponents([
                {
                    type: 'grid',
                    props: {
                        column1: [
                            { type: 'product_summary', props: {} },
                            { type: 'checkout_form', props: {} },
                        ],
                        column2: [
                            { type: 'order_summary', props: {} },
                            {
                                type: 'payment_methods',
                                props: { showCard: true, showPix: false, showBoleto: false },
                            },
                        ],
                    },
                },
            ]),
            ['product_summary', 'checkout_form', 'payment_methods'],
        );
    });

    it('explains missing components and production bindings before publication', () => {
        const issues = checkoutReadinessIssues({
            content: [
                {
                    type: 'payment_methods',
                    props: { showCard: true, showPix: false, showBoleto: false },
                },
            ],
            environment: 'production',
            bindings: {},
            connections: [connection()],
        });
        assert.deepEqual(issues, [
            'component:product_summary',
            'component:checkout_form',
            'payment:card:binding',
        ]);
    });
});
