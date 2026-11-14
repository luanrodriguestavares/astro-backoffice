import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCheckoutFromTemplate } from '../src/lib/checkout/templates';

const monthlyPlan = {
    productId: 'product-1',
    priceId: 'price-1',
    productName: 'Astro',
    priceName: 'Plano mensal',
    amountMinor: 9_000,
    currency: 'BRL',
    pricingType: 'recurring',
    recurringInterval: 'month',
    recurringIntervalCount: 1,
};

describe('checkout templates', () => {
    it('cria assinatura com uma faixa informativa e apenas um CTA financeiro', () => {
        const { document } = buildCheckoutFromTemplate('subscription', [monthlyPlan]);
        const summaries: Record<string, unknown>[] = [];
        const visit = (value: unknown) => {
            if (Array.isArray(value)) return value.forEach(visit);
            if (!value || typeof value !== 'object') return;
            const record = value as Record<string, unknown>;
            if (record.type === 'product_summary' && record.props)
                summaries.push(record.props as Record<string, unknown>);
            Object.values(record).forEach(visit);
        };
        visit(document.sections);

        assert.equal(summaries.length, 2);
        const header = summaries.find((props) => props.id === 'product-header');
        assert.ok(header);
        assert.equal(header?.layout, 'header');
        assert.equal(header?.buttonLabel, '');
        assert.deepEqual(
            summaries.filter(
                (props) => typeof props.buttonLabel === 'string' && props.buttonLabel.length > 0,
            ).map((props) => props.buttonLabel),
            ['Assinar agora'],
        );
    });
});
