import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const coupon = await apiFetch(`/api/v1/coupons/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: coupon });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(
                { detail: error.problem.detail },
                { status: error.problem.status },
            );
        return NextResponse.json(
            { detail: 'Não foi possível atualizar o escopo do cupom.' },
            { status: 500 },
        );
    }
}
