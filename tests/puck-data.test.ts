import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { documentToPuck, puckToDocument } from '../src/lib/checkout/puck-data';
import type { CheckoutDocument } from '../src/lib/api/types';

describe('checkout document migration', () => {
    it('recognizes a modified named theme as this checkout custom identity', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: { brandPreset: 'astro', accentColor: '#dc2626' },
            layout: {},
            sections: [],
            settings: {},
            seo: {},
        };

        const data = documentToPuck(document);
        const root = (data.root as { props: Record<string, unknown> }).props;

        assert.equal(root.brandPreset, 'custom');
        assert.deepEqual((root.customPreset as Record<string, unknown>).accentColor, '#dc2626');
    });

    it('keeps the checkout custom identity while another preset is selected', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: {
                brandPreset: 'astro',
                themeMode: 'light',
                grayTone: 'neutral',
                fontFamily: 'geist',
                headingFontFamily: 'inherit',
                headingFontWeight: '600',
                bodyFontWeight: '400',
                backgroundColor: '#f5f6f7',
                surfaceColor: '#ffffff',
                textColor: '#101214',
                accentColor: '#101214',
                radius: 'lg',
                shadow: 'xs',
                buttonStyle: 'solid',
                buttonShape: 'rounded',
                customPreset: { accentColor: '#dc2626', fontFamily: 'poppins' },
            },
            layout: {
                componentBackgroundStyle: 'filled',
                componentBorderStyle: 'visible',
                componentShadowMode: 'auto',
            },
            sections: [],
            settings: {},
            seo: {},
        };

        const published = puckToDocument(documentToPuck(document), document);

        assert.equal(published.theme.brandPreset, 'astro');
        assert.deepEqual(published.theme.customPreset, {
            fontFamily: 'poppins',
            accentColor: '#dc2626',
        });
    });

    it('drops the legacy order summary so the cart is the only financial summary', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: {},
            layout: {},
            sections: [
                { id: 'cart', type: 'product_summary', visible: true, props: {} },
                {
                    id: 'legacy-summary',
                    type: 'order_summary' as CheckoutDocument['sections'][number]['type'],
                    visible: true,
                    props: {},
                },
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

    it('preserves the custom spacer height when publishing', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: {},
            layout: {},
            sections: [
                {
                    id: 'breathing-room',
                    type: 'spacer_divider',
                    visible: true,
                    props: { layout: 'space', height: 137 },
                },
            ],
            settings: {},
            seo: {},
        };

        const published = puckToDocument(documentToPuck(document), document);
        assert.deepEqual(published.sections[0]?.props, { layout: 'space', height: 137 });
    });

    it('edits a result page without replacing checkout blocks or removing its required status', () => {
        const document: CheckoutDocument = {
            schemaVersion: 1,
            theme: {},
            layout: {},
            sections: [{ id: 'form', type: 'checkout_form', visible: true, props: {} }],
            pages: [
                {
                    id: 'success',
                    kind: 'success',
                    name: 'Compra aprovada',
                    sections: [
                        {
                            id: 'success-status',
                            type: 'payment_status',
                            visible: true,
                            props: { title: 'Tudo certo' },
                        },
                        {
                            id: 'success-title',
                            type: 'heading_text',
                            visible: true,
                            props: { text: 'Próximos passos' },
                        },
                    ],
                },
            ],
            settings: {},
            seo: {},
        };

        const data = documentToPuck(document, 'success');
        data.content = data.content.filter((component) => component.type !== 'payment_status');
        data.content.push({
            type: 'paragraph_text',
            props: { id: 'support', content: 'Ajuda', alignment: 'center', size: 'sm' },
        });
        const published = puckToDocument(data, document, 'success');
        const success = published.pages?.find((page) => page.id === 'success');

        assert.equal(published.sections[0]?.id, 'form');
        assert.deepEqual(
            success?.sections.map((section) => section.type),
            ['payment_status', 'heading_text', 'paragraph_text'],
        );
    });
});
