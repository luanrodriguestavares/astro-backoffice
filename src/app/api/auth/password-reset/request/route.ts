import { NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';
import type { ApiEnvelope, ProblemDetails } from '@/lib/api/types';

export async function POST(request: Request) {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    if (!email) return redirect(request, '/forgot-password', 'error', 'Informe seu e-mail.');
    try {
        const response = await fetch(`${astroApiUrl()}/api/v1/auth/password-reset/request`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ email }),
            cache: 'no-store',
        });
        const payload = (await response.json()) as ApiEnvelope<{ accepted: true }> | ProblemDetails;
        if (!response.ok)
            return redirect(
                request,
                '/forgot-password',
                'error',
                (payload as ProblemDetails).detail || 'Não foi possível enviar o e-mail agora.',
            );
        return redirect(
            request,
            '/login',
            'message',
            'Se a conta existir, o link de recuperação foi enviado.',
        );
    } catch {
        return redirect(
            request,
            '/forgot-password',
            'error',
            'Não foi possível solicitar a recuperação agora.',
        );
    }
}

function redirect(request: Request, path: string, key: string, message: string) {
    const url = new URL(path, request.url);
    url.searchParams.set(key, message);
    return NextResponse.redirect(url, 303);
}
