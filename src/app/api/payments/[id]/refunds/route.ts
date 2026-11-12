import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = (await request.json()) as {
            amountMinor: number;
            reason?: string;
            cancelSubscription?: boolean;
            /** Mesma chave em um reenvio do formulário: o reembolso não é pedido duas vezes. */
            idempotencyKey?: string;
        };
        const { idempotencyKey, ...payload } = body;
        const data = await apiFetch(`/api/v1/payments/${encodeURIComponent(id)}/refunds`, {
            method: 'POST',
            headers: { 'idempotency-key': idempotencyKey ?? randomUUID() },
            body: JSON.stringify(payload),
        });
        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível solicitar o reembolso.' },
            { status: 500 },
        );
    }
}
