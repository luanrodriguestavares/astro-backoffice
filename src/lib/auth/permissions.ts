import { cache } from 'react';

import { apiFetch } from '@/lib/api/server';
import type { CurrentUser, Organization } from '@/lib/api/types';

export const currentUser = cache(() => apiFetch<CurrentUser>('/api/v1/auth/me'));

export const currentOrganization = cache(() =>
    apiFetch<Organization>('/api/v1/organizations/current'),
);

export async function currentPermissions() {
    return new Set((await currentOrganization()).permissions ?? []);
}
