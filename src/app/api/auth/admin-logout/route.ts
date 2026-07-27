import { NextRequest, NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';

export async function POST(request: NextRequest) {
    const refreshToken = request.cookies.get('astro_refresh')?.value;
    if (refreshToken !== undefined)
        await fetch(`${astroApiUrl()}/api/v1/auth/logout`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
            cache: 'no-store',
        }).catch(() => undefined);
    const response = NextResponse.redirect(new URL('/login', request.url), 303);
    response.cookies.delete('astro_access');
    response.cookies.delete('astro_refresh');
    return response;
}
