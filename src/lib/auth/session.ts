import { NextResponse } from 'next/server';

import type { SessionData } from '@/lib/api/types';

export function authenticatedRedirect(
    request: Request,
    session: SessionData,
    destination = '/dashboard',
) {
    const response = NextResponse.redirect(new URL(destination, request.url), 303);
    return applySessionCookies(response, session);
}

export function applySessionCookies(response: NextResponse, session: SessionData) {
    const secure = process.env.NODE_ENV === 'production';
    response.cookies.set('astro_access', session.accessToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure,
        path: '/',
        maxAge: session.expiresIn,
        priority: 'high',
    });
    response.cookies.set('astro_refresh', session.refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure,
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        priority: 'high',
    });
    return response;
}
