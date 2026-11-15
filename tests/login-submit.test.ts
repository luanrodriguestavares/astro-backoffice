import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
    new URL('../src/components/auth/login-form.tsx', import.meta.url),
    'utf8',
);

test('login communicates and locks the pending authentication state', () => {
    assert.match(source, /event\.preventDefault\(\)/);
    assert.match(source, /flushSync\(\(\) => setPending\(true\)\)/);
    assert.match(source, /HTMLFormElement\.prototype\.submit\.call\(form\)/);
    assert.doesNotMatch(source, /fieldset disabled=\{pending\}/);
    assert.match(source, /disabled=\{pending\}/);
    assert.match(source, /aria-busy=\{pending\}/);
    assert.match(source, /animate-spin/);
    assert.match(source, /Entrando\.\.\./);
});
