import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
    checkoutFixtures,
    fixturesDirectory,
    flowFixtures,
    serialize,
} from '../scripts/ai-fixtures';

/** Os nós de roteamento ganham ids aleatórios (`case_xxxxxxxx`); a comparação ignora isso. */
function stable(value: string) {
    return value.replaceAll(/"(case|c)_[0-9a-f]{8}"/g, '"$1_id"');
}

describe('AI fixtures (modelos prontos usados pela API)', () => {
    for (const [file, build] of [
        ['checkout-templates.json', checkoutFixtures],
        ['flow-templates.json', flowFixtures],
    ] as const)
        it(
            `${file} está em dia com os modelos; rode pnpm ai:fixtures se mudou`,
            // Os modelos ficam no repositório da API: o teste só roda com os dois lado a lado
            // (desenvolvimento local). No CI do backoffice a API não existe.
            { skip: !existsSync(fixturesDirectory) && 'repositório da API não está ao lado' },
            () => {
                const recorded = readFileSync(`${fixturesDirectory}${file}`, 'utf8');
                assert.deepEqual(
                    JSON.parse(stable(recorded)),
                    JSON.parse(stable(serialize(build()))),
                );
            },
        );
});
