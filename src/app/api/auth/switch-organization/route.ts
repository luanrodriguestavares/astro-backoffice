import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { SessionData } from '@/lib/api/types';
import { applySessionCookies } from '@/lib/auth/session';

export async function POST(request: Request) {
    try {
        const input = (await request.json()) as { organizationId?: unknown };
        if (typeof input.organizationId !== 'string' || input.organizationId.length === 0) {
            return NextResponse.json({ detail: 'Selecione um workspace válido.' }, { status: 400 });
        }

        const session = await apiFetch<SessionData>('/api/v1/auth/switch-organization', {
            method: 'POST',
            body: JSON.stringify({ organizationId: input.organizationId }),
        });
        return applySessionCookies(NextResponse.json({ data: { accepted: true } }), session);
    } catch (error) {
        if (error instanceof AstroApiError) {
            return NextResponse.json(
                {
                    detail:
                        error.problem.status === 401
                            ? 'Este workspace não está disponível para a sua conta.'
                            : error.problem.detail,
                },
                { status: error.problem.status },
            );
        }
        return NextResponse.json(
            { detail: 'Não foi possível trocar de workspace.' },
            { status: 500 },
        );
    }
}
