import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { Checkout } from '@/lib/api/types';

export async function POST(request: Request) {
    try {
        const checkout = await apiFetch<Checkout>('/api/v1/checkouts', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: checkout });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(
                { detail: error.problem.detail },
                { status: error.problem.status },
            );
        return NextResponse.json({ detail: 'Não foi possível criar o checkout.' }, { status: 500 });
    }
}
