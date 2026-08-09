import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const result = await apiFetch<{ accepted: true }>(
            `/api/v1/custom-domains/${encodeURIComponent(id)}`,
            { method: 'DELETE', headers: { 'idempotency-key': randomUUID() } },
        );
        return NextResponse.json({ data: result });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), { status: error.problem.status });
        return NextResponse.json({ detail: 'Não foi possível remover o domínio.' }, { status: 500 });
    }
}
