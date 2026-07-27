import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { Product } from '@/lib/api/types';

export async function POST(request: Request) {
    try {
        const input = (await request.json()) as { type?: unknown };
        if (input.type === 'physical') {
            return NextResponse.json(
                {
                    detail: 'Produtos físicos ainda não estão disponíveis. Crie um produto digital.',
                },
                { status: 422 },
            );
        }
        const product = await apiFetch<Product>('/api/v1/products', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(input),
        });
        return NextResponse.json({ data: product });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json({ detail: 'Não foi possível criar o produto.' }, { status: 500 });
    }
}
