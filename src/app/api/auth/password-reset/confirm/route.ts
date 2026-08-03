import { NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';
import type { ProblemDetails } from '@/lib/api/types';

export async function POST(request: Request) {
    const form = await request.formData();
    const token = String(form.get('token') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('passwordConfirmation') ?? '');
    if (!token) return resetError(request, token, 'O link de recuperação é inválido.');
    if (password.length < 12)
        return resetError(request, token, 'A senha precisa ter pelo menos 12 caracteres.');
    if (password !== confirmation)
        return resetError(request, token, 'As senhas informadas não coincidem.');
    try {
        const response = await fetch(`${astroApiUrl()}/api/v1/auth/password-reset/confirm`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ token, password }),
            cache: 'no-store',
        });
        if (!response.ok) {
            const problem = (await response.json()) as ProblemDetails;
            return resetError(request, token, problem.detail || 'O link é inválido ou expirou.');
        }
        const url = new URL('/login', request.url);
        url.searchParams.set('message', 'Senha atualizada. Você já pode entrar.');
        return NextResponse.redirect(url, 303);
    } catch {
        return resetError(request, token, 'Não foi possível redefinir a senha agora.');
    }
}

function resetError(request: Request, token: string, message: string) {
    const url = new URL('/reset-password', request.url);
    if (token) url.searchParams.set('token', token);
    url.searchParams.set('error', message);
    return NextResponse.redirect(url, 303);
}
