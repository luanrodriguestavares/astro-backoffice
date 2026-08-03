import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ memberId: string }> },
) {
    try {
        const { memberId } = await params;
        const input = await request.json();
        const result = await apiFetch<{ accepted: true }>(
            `/api/v1/organizations/current/members/${encodeURIComponent(memberId)}`,
            {
                method: 'PATCH',
                headers: { 'idempotency-key': randomUUID() },
                body: JSON.stringify(input),
            },
        );
        return NextResponse.json({ data: result });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível alterar o acesso deste membro.' },
            { status: 500 },
        );
    }
}
