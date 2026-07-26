import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await apiFetch(`/api/v1/inventory/${id}/adjustments`, {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(
                { detail: error.problem.detail },
                { status: error.problem.status },
            );
        return NextResponse.json(
            { detail: 'Não foi possível ajustar o estoque.' },
            { status: 500 },
        );
    }
}
