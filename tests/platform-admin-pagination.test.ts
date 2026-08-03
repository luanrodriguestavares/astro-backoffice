import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { adminPagination } from '../src/lib/platform-admin/pagination';

describe('platform admin pagination', () => {
    it('uses safe defaults and calculates the server offset', () => {
        assert.deepEqual(adminPagination(undefined, undefined), {
            page: 1,
            pageSize: 10,
            offset: 0,
        });
        assert.deepEqual(adminPagination('3', '20'), {
            page: 3,
            pageSize: 20,
            offset: 40,
        });
    });

    it('rejects unsupported page sizes and invalid pages', () => {
        assert.deepEqual(adminPagination('-2', '999'), {
            page: 1,
            pageSize: 10,
            offset: 0,
        });
    });
});
