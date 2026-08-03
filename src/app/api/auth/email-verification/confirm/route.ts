import { NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';
import type { ProblemDetails } from '@/lib/api/types';

export async function POST(request: Request) {
    const form = await request.formData();
    const token = String(form.get('token') ?? '').trim();
    if (!token) return verificationError(request, token, 'O link de confirmação é inválido.');
    try {
        const response = await fetch(`${astroApiUrl()}/api/v1/auth/email-verification/confirm`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ token }),
            cache: 'no-store',
        });
        if (!response.ok) {
            const problem = (await response.json()) as ProblemDetails;
            return verificationError(
                request,
                token,
                problem.detail || 'O link é inválido ou expirou.',
            );
        }
        const url = new URL('/login', request.url);
        url.searchParams.set('message', 'E-mail confirmado. Entre para continuar.');
        const redirect = NextResponse.redirect(url, 303);
        redirect.cookies.delete('astro_access');
        redirect.cookies.delete('astro_refresh');
        return redirect;
    } catch {
        return verificationError(request, token, 'Não foi possível confirmar o e-mail agora.');
    }
}

function verificationError(request: Request, token: string, message: string) {
    const url = new URL('/verify-email', request.url);
    if (token) url.searchParams.set('token', token);
    url.searchParams.set('error', message);
    return NextResponse.redirect(url, 303);
}
