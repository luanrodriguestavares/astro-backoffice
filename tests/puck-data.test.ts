import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { documentToPuck, puckToDocument } from '../src/lib/checkout/puck-data';
import type { CheckoutDocument } from '../src/lib/api/types';

describe('checkout document migration', () => {
    it('drops the legacy order summary so the cart is the only financial summary', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: {},
            layout: {},
            sections: [
                { id: 'cart', type: 'product_summary', visible: true, props: {} },
                { id: 'legacy-summary', type: 'order_summary', visible: true, props: {} },
            ],
            settings: {},
            seo: {},
        };

        const data = documentToPuck(document);
        assert.deepEqual(data.content.map((component) => component.type), ['product_summary']);
    });

    it('preserves global typography and CTA configuration through the publish contract', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: { fontFamily: 'poppins', headingFontWeight: '900', bodyFontWeight: '500' },
            layout: {},
            sections: [{
                id: 'hero',
                type: 'hero',
                visible: true,
                props: {
                    buttonLabel: 'Saiba mais',
                    buttonAction: 'faq',
                    buttonNewTab: false,
                },
            }],
            settings: {},
            seo: {},
        };

        const data = documentToPuck(document);
        const published = puckToDocument(data, document);
        assert.equal(published.theme.fontFamily, 'poppins');
        assert.equal(published.theme.headingFontWeight, '900');
        assert.equal(published.theme.bodyFontWeight, '500');
        assert.equal(published.layout.inputGroupStyle, 'filled');
        assert.deepEqual(published.sections[0]?.props, document.sections[0]?.props);
    });

    it('removes legacy redirects from the transactional checkout button', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: {},
            layout: {},
            sections: [{
                id: 'cart',
                type: 'product_summary',
                visible: true,
                props: {
                    buttonLabel: 'Finalizar compra',
                    buttonAction: 'url',
                    buttonUrl: 'https://example.com',
                    buttonNewTab: true,
                },
            }],
            settings: {},
            seo: {},
        };

        const published = puckToDocument(documentToPuck(document), document);
        assert.deepEqual(published.sections[0]?.props, { buttonLabel: 'Finalizar compra' });
    });
});
