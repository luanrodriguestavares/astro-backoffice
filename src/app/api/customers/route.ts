import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { Customer } from '@/lib/api/types';

export async function POST(request: Request) {
    try {
        const input = await request.json();
        const customer = await apiFetch<Customer>('/api/v1/customers', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(input),
        });
        return NextResponse.json({ data: customer });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(
                { detail: error.problem.detail },
                { status: error.problem.status },
            );
        return NextResponse.json(
            { detail: 'Não foi possível cadastrar o cliente.' },
            { status: 500 },
        );
    }
}
