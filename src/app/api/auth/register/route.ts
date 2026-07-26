import { NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';
import type { ApiEnvelope, ProblemDetails, SessionData } from '@/lib/api/types';
import { authenticatedRedirect } from '@/lib/auth/session';

export async function POST(request: Request) {
    const form = await request.formData();
    const input = {
        name: field(form, 'name'),
        email: field(form, 'email').toLowerCase(),
        password: field(form, 'password'),
        passwordConfirmation: field(form, 'passwordConfirmation'),
        legalName: field(form, 'legalName'),
        displayName: field(form, 'displayName'),
        slug: normalizeSlug(field(form, 'slug')),
        documentType: field(form, 'documentType'),
        documentNumber: field(form, 'documentNumber'),
        acceptedTerms: form.get('terms') === 'on',
    };
    const validationError = validate(input);
    if (validationError !== undefined) return registerError(request, validationError);

    try {
        const response = await fetch(`${astroApiUrl()}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({
                name: input.name,
                email: input.email,
                password: input.password,
                organization: {
                    legalName: input.legalName,
                    displayName: input.displayName,
                    slug: input.slug,
                    documentType: input.documentType,
                    documentNumber: input.documentNumber,
                },
            }),
            cache: 'no-store',
        });
        const payload = (await response.json()) as ApiEnvelope<SessionData> | ProblemDetails;
        if (!response.ok) {
            const problem = payload as ProblemDetails;
            const message =
                response.status === 409
                    ? 'Já existe uma conta, organização ou documento com esses dados.'
                    : problem.detail || 'Não foi possível criar sua conta.';
            return registerError(request, message);
        }
        return authenticatedRedirect(request, (payload as ApiEnvelope<SessionData>).data);
    } catch {
        return registerError(request, 'A API do Astro está indisponível no momento.');
    }
}

function validate(input: Record<string, string | boolean>) {
    if (Object.entries(input).some(([key, value]) => key !== 'acceptedTerms' && value === ''))
        return 'Preencha todos os campos obrigatórios.';
    if (String(input.password).length < 12) return 'A senha precisa ter pelo menos 12 caracteres.';
    if (input.password !== input.passwordConfirmation) return 'As senhas informadas não coincidem.';
    if (String(input.slug).length < 2) return 'Informe um identificador válido para a organização.';
    if (!input.acceptedTerms) return 'Você precisa aceitar os termos para continuar.';
    return undefined;
}

function field(form: FormData, name: string) {
    return String(form.get(name) ?? '').trim();
}

function normalizeSlug(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

function registerError(request: Request, message: string) {
    const url = new URL('/register', request.url);
    url.searchParams.set('error', message);
    return NextResponse.redirect(url, 303);
}
