import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validatedUrl } from '../src/lib/api/config';

describe('production URL configuration', () => {
    it('normalizes an absolute URL', () => {
        assert.equal(validatedUrl('URL', 'https://astro.test/', '', true), 'https://astro.test');
    });

    it('rejects credentials and unsupported protocols', () => {
        assert.throws(() => validatedUrl('URL', 'https://user:pass@astro.test', '', false));
        assert.throws(() => validatedUrl('URL', 'file:///tmp/api', '', false));
    });
});
