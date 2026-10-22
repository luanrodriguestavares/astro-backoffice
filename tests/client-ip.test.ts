import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { forwardedClientIp } from '../src/lib/api/client-ip';

describe('client IP forwarding', () => {
    it('forwards the X-Forwarded-For chain received from the edge proxy', () => {
        assert.deepEqual(forwardedClientIp(new Headers({ 'x-forwarded-for': ' 203.0.113.7 ' })), {
            'x-forwarded-for': '203.0.113.7',
        });
    });

    it('omits the header when the request has no forwarded address', () => {
        assert.deepEqual(forwardedClientIp(new Headers()), {});
    });
});
