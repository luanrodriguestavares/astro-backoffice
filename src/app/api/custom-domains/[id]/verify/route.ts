import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { CustomDomain } from '@/lib/api/types';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const result = await apiFetch<CustomDomain>(
            `/api/v1/custom-domains/${encodeURIComponent(id)}/verify`,
            { method: 'POST', headers: { 'idempotency-key': randomUUID() } },
        );
        return NextResponse.json({ data: result });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), { status: error.problem.status });
        return NextResponse.json({ detail: 'Não foi possível verificar o DNS.' }, { status: 500 });
    }
}
