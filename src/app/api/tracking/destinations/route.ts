import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function POST(request: Request) {
    try {
        const data = await apiFetch('/api/v1/tracking/destinations', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data });
    } catch (error) {
        return trackingError(error, 'Não foi possível criar o destino.');
    }
}

function trackingError(error: unknown, fallback: string) {
    if (error instanceof AstroApiError)
        return NextResponse.json(
            { detail: error.problem.detail, code: error.problem.code },
            { status: error.problem.status },
        );
    return NextResponse.json({ detail: fallback }, { status: 500 });
}
