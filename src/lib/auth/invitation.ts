import { astroApiUrl } from '@/lib/api/config';
import type { ApiEnvelope } from '@/lib/api/types';

export interface InvitationPreview {
    organizationName: string;
    email: string;
    role: string;
    expiresAt: string;
}

export async function getInvitationPreview(token: string): Promise<InvitationPreview | undefined> {
    if (token.length < 32) return undefined;
    try {
        const url = new URL('/api/v1/organization-invitations/preview', astroApiUrl());
        url.searchParams.set('token', token);
        const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
        if (!response.ok) return undefined;
        return ((await response.json()) as ApiEnvelope<InvitationPreview>).data;
    } catch {
        return undefined;
    }
}
