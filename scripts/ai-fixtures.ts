/**
 * Gera os modelos prontos (checkouts e fluxos) como documentos completos em JSON, usados pela
 * API como exemplos para a IA e conferidos pelos testes de catálogo (`checkout-blocks.test.ts`).
 *
 *   pnpm ai:fixtures            # grava em ../api/src/modules/ai/fixtures/
 *
 * O teste `tests/ai-fixtures.test.ts` falha se um modelo mudar sem regerar os arquivos.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { flowTemplates } from '../src/components/orchestration/flow-editor/templates';
import {
    buildCheckoutFromTemplate,
    checkoutTemplates,
    type TemplatePrice,
} from '../src/lib/checkout/templates';

const oneTime: TemplatePrice = {
    productId: 'prd_example',
    priceId: 'prc_example',
    productName: 'Curso Exemplo',
    priceName: 'Acesso vitalício',
    amountMinor: 19_700,
    currency: 'BRL',
    pricingType: 'one_time',
};

const monthly: TemplatePrice = {
    productId: 'prd_saas',
    priceId: 'prc_monthly',
    productName: 'App Exemplo',
    priceName: 'Mensal',
    amountMinor: 4_900,
    currency: 'BRL',
    pricingType: 'recurring',
    recurringInterval: 'month',
    recurringIntervalCount: 1,
};

const yearly: TemplatePrice = {
    ...monthly,
    priceId: 'prc_yearly',
    priceName: 'Anual',
    amountMinor: 47_000,
    recurringInterval: 'year',
};

export function checkoutFixtures() {
    return checkoutTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        audience: template.audience,
        document: buildCheckoutFromTemplate(
            template.id,
            template.prefersRecurring === true ? [monthly, yearly] : [oneTime],
        ).document,
    }));
}

export function flowFixtures() {
    return flowTemplates.map((template) => ({
        id: template.id,
        kind: template.kind,
        title: template.title,
        description: template.description,
        graph: template.build({
            primaryGateway: 'gwc_primary',
            backupGateway: 'gwc_backup',
            webhookEndpoint: 'whk_example',
        }),
    }));
}

export const fixturesDirectory = fileURLToPath(
    new URL('../../api/src/modules/ai/fixtures/', import.meta.url),
);

export function serialize(value: unknown) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

if (process.argv[1]?.endsWith('ai-fixtures.ts')) {
    writeFileSync(`${fixturesDirectory}checkout-templates.json`, serialize(checkoutFixtures()));
    writeFileSync(`${fixturesDirectory}flow-templates.json`, serialize(flowFixtures()));
    process.stdout.write(`Modelos gravados em ${fixturesDirectory}\n`);
}
