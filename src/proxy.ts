import { NextRequest, NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';
import type { ApiEnvelope, SessionData } from '@/lib/api/types';
import { applySessionCookies } from '@/lib/auth/session';

export async function proxy(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api/')) return protectBffRequest(request);

    const accessToken = request.cookies.get('astro_access')?.value;
    if (accessToken !== undefined && !isExpiring(accessToken)) return NextResponse.next();

    const refreshToken = request.cookies.get('astro_refresh')?.value;
    if (refreshToken !== undefined) {
        try {
            const refresh = await fetch(`${astroApiUrl()}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', accept: 'application/json' },
                body: JSON.stringify({ refreshToken }),
                cache: 'no-store',
            });
            if (refresh.ok) {
                const payload = (await refresh.json()) as ApiEnvelope<SessionData>;
                return applySessionCookies(NextResponse.next(), payload.data);
            }
        } catch {
            // The login redirect below is the safe fallback when refresh is unavailable.
        }
    }

    const login = new URL('/login', request.url);
    login.searchParams.set('next', request.nextUrl.pathname);
    const response = NextResponse.redirect(login);
    response.cookies.delete('astro_access');
    response.cookies.delete('astro_refresh');
    return response;
}

function protectBffRequest(request: NextRequest) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return NextResponse.next();
    if (request.headers.get('sec-fetch-site') === 'cross-site')
        return NextResponse.json({ detail: 'Cross-site request rejected.' }, { status: 403 });
    const origin = request.headers.get('origin');
    if (origin !== null && origin !== request.nextUrl.origin)
        return NextResponse.json({ detail: 'Invalid request origin.' }, { status: 403 });
    return NextResponse.next();
}

function isExpiring(token: string) {
    try {
        const payload = JSON.parse(
            Buffer.from(token.split('.')[1] ?? '', 'base64url').toString(),
        ) as {
            exp?: number;
        };
        return payload.exp === undefined || payload.exp * 1000 <= Date.now() + 15_000;
    } catch {
        return true;
    }
}

export const config = {
    matcher: [
        '/api/:path*',
        '/dashboard/:path*',
        '/products/:path*',
        '/checkouts/:path*',
        '/coupons/:path*',
        '/developer/:path*',
        '/files/:path*',
        '/inventory/:path*',
        '/invoices/:path*',
        '/notifications/:path*',
        '/orders/:path*',
        '/payments/:path*',
        '/refunds/:path*',
        '/roadmap/:path*',
        '/shipping/:path*',
        '/subscriptions/:path*',
        '/customers/:path*',
        '/gateways/:path*',
        '/team/:path*',
        '/settings/:path*',
        '/webhooks/:path*',
        '/admin/:path*',
    ],
};
