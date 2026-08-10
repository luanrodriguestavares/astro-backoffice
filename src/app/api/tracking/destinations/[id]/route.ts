import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
    return mutate(request, context, 'PATCH');
}

export async function DELETE(request: Request, context: Context) {
    return mutate(request, context, 'DELETE');
}

async function mutate(request: Request, context: Context, method: 'PATCH' | 'DELETE') {
    try {
        const { id } = await context.params;
        const data = await apiFetch(`/api/v1/tracking/destinations/${encodeURIComponent(id)}`, {
            method,
            headers: { 'idempotency-key': randomUUID() },
            ...(method === 'PATCH' ? { body: JSON.stringify(await request.json()) } : {}),
        });
        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(
                { detail: error.problem.detail, code: error.problem.code },
                { status: error.problem.status },
            );
        return NextResponse.json(
            { detail: 'Não foi possível atualizar o destino.' },
            { status: 500 },
        );
    }
}
