import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { CheckoutVersion } from '@/lib/api/types';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const versions = await apiFetch<CheckoutVersion[]>(
            `/api/v1/checkouts/${encodeURIComponent(id)}/versions`,
        );
        return NextResponse.json({ data: versions });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível carregar o histórico do checkout.' },
            { status: 500 },
        );
    }
}
