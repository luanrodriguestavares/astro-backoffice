import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { CheckoutDraft } from '@/lib/api/types';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string; versionId: string }> },
) {
    try {
        const { id, versionId } = await params;
        const draft = await apiFetch<CheckoutDraft>(
            `/api/v1/checkouts/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`,
            { method: 'POST', headers: { 'idempotency-key': randomUUID() } },
        );
        return NextResponse.json({ data: draft });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível restaurar esta versão.' },
            { status: 500 },
        );
    }
}
