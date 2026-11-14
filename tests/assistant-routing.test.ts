import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkoutAssistantTask } from '../src/lib/ai/assistant-routing';

describe('checkout assistant routing', () => {
    it('routes gateway, event email and webhook requests to payment orchestration', () => {
        assert.equal(
            checkoutAssistantTask(
                'Usa Pix na AbacatePay, crédito e boleto no Mercado Pago, envia e-mail no sucesso e erro, e webhook.',
            ),
            'payment_flow',
        );
    });

    it('keeps visual and copy requests in the checkout builder', () => {
        assert.equal(
            checkoutAssistantTask('Deixe o topo mais direto, use fundo escuro e remova o FAQ.'),
            'checkout',
        );
        assert.equal(
            checkoutAssistantTask('Destaque o Pix no bloco de formas de pagamento.'),
            'checkout',
        );
    });
});
