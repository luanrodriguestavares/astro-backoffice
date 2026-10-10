import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';

/** Repassa o corpo para a API; publicar e pausar exigem chave de idempotência. */
export async function forwardFlowRequest(
    request: Request,
    path: string,
    method: 'PUT' | 'POST' | 'PATCH',
    fallback: string,
    idempotent = false,
) {
    try {
        const input = (await request.json()) as Record<string, unknown>;
        const data = await apiFetch<unknown>(path, {
            method,
            ...(idempotent ? { headers: { 'idempotency-key': randomUUID() } } : {}),
            body: JSON.stringify(input),
        });
        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json({ detail: fallback }, { status: 500 });
    }
}
