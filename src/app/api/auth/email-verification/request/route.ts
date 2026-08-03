import { NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';
import type { ApiEnvelope, ProblemDetails } from '@/lib/api/types';

export async function POST(request: Request) {
    const form = await request.formData();
    const email = String(form.get('email') ?? '')
        .trim()
        .toLowerCase();
    const url = new URL('/verify-email', request.url);
    if (email) url.searchParams.set('email', email);
    if (!email) {
        url.searchParams.set('error', 'Informe seu e-mail.');
        return NextResponse.redirect(url, 303);
    }
    try {
        const response = await fetch(`${astroApiUrl()}/api/v1/auth/email-verification/request`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ email }),
            cache: 'no-store',
        });
        const payload = (await response.json()) as ApiEnvelope<{ accepted: true }> | ProblemDetails;
        url.searchParams.set(
            response.ok ? 'message' : 'error',
            response.ok
                ? 'Se a conta precisar de confirmação, um novo link foi enviado.'
                : (payload as ProblemDetails).detail || 'Não foi possível enviar o e-mail agora.',
        );
    } catch {
        url.searchParams.set('error', 'Não foi possível enviar o e-mail agora.');
    }
    return NextResponse.redirect(url, 303);
}
