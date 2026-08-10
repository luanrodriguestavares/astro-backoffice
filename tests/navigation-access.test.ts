import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canAccessNavigationItem } from '../src/lib/navigation/access';

const permissions = new Set(['tracking.manage', 'api_keys.manage']);

describe('dashboard navigation access', () => {
    it('hides plan-gated entries after downgrade and exposes public entries', () => {
        const essential = {
            active: true,
            features: ['reports.essential'],
        };
        assert.equal(
            canAccessNavigationItem(
                { permission: 'tracking.manage', feature: 'marketing.pixels' },
                permissions,
                essential,
            ),
            false,
        );
        assert.equal(canAccessNavigationItem({}, permissions, essential), true);
    });

    it('shows upgraded entries only when permission, feature and billing are active', () => {
        const pro = { active: true, features: ['marketing.pixels', 'api'] };
        assert.equal(
            canAccessNavigationItem(
                { permission: 'tracking.manage', feature: 'marketing.pixels' },
                permissions,
                pro,
            ),
            true,
        );
        assert.equal(
            canAccessNavigationItem(
                { permission: 'api_keys.manage', feature: 'api' },
                permissions,
                { ...pro, active: false },
            ),
            false,
        );
        assert.equal(
            canAccessNavigationItem(
                { permission: 'webhooks.manage', feature: 'api' },
                permissions,
                pro,
            ),
            false,
        );
    });
});
