import { NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';
import type { ApiEnvelope, ProblemDetails, SessionData } from '@/lib/api/types';
import { authenticatedRedirect } from '@/lib/auth/session';

export async function POST(request: Request) {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const remember = form.get('remember') === 'on';
    const invitationToken = String(form.get('invitationToken') ?? '').trim();
    if (email.length === 0 || password.length === 0)
        return loginError(request, 'Informe e-mail e senha.');

    try {
        const response = await fetch(`${astroApiUrl()}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ email, password }),
            cache: 'no-store',
        });
        const payload = (await response.json()) as ApiEnvelope<SessionData> | ProblemDetails;
        if (!response.ok)
            return loginError(request, 'Não foi possível entrar. Confira seus dados.');

        let session = (payload as ApiEnvelope<SessionData>).data;
        if (invitationToken) {
            const invitedSession = await acceptInvitation(session, invitationToken);
            if (invitedSession === undefined)
                return loginError(
                    request,
                    'Este convite não é válido para o e-mail informado ou não está mais disponível.',
                );
            session = invitedSession;
        }
        if (!session.user.emailVerified) {
            const verification = new URL('/verify-email', request.url);
            verification.searchParams.set('email', session.user.email);
            return authenticatedRedirect(
                request,
                session,
                `${verification.pathname}${verification.search}`,
                remember,
            );
        }
        if (session.organization === undefined) {
            const admin = await fetch(`${astroApiUrl()}/api/v1/admin/session`, {
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${session.accessToken}`,
                },
                cache: 'no-store',
            });
            if (admin.ok) return authenticatedRedirect(request, session, '/admin', remember);
        }
        return authenticatedRedirect(request, session, '/dashboard', remember);
    } catch {
        return loginError(request, 'A API do Astro está indisponível no momento.');
    }
}

async function acceptInvitation(session: SessionData, token: string): Promise<SessionData | undefined> {
    const accepted = await fetch(`${astroApiUrl()}/api/v1/organization-invitations/accept`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ token }),
        cache: 'no-store',
    });
    if (!accepted.ok) return undefined;
    const invitation = (await accepted.json()) as ApiEnvelope<{
        accepted: true;
        organizationId: string;
    }>;
    const switched = await fetch(`${astroApiUrl()}/api/v1/auth/switch-organization`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ organizationId: invitation.data.organizationId }),
        cache: 'no-store',
    });
    if (!switched.ok) return undefined;
    return ((await switched.json()) as ApiEnvelope<SessionData>).data;
}

function loginError(request: Request, message: string) {
    const url = new URL('/login', request.url);
    url.searchParams.set('error', message);
    const invitation = new URL(request.url).searchParams.get('invite');
    if (invitation) url.searchParams.set('invite', invitation);
    return NextResponse.redirect(url, 303);
}
