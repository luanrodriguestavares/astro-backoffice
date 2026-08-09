import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function POST() {
    try {
        const result = await apiFetch<{ accepted: true }>('/api/v1/platform/billing/cancel', {
            method: 'POST',
        });
        return NextResponse.json({ data: result });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), { status: error.problem.status });
        return NextResponse.json({ detail: 'Não foi possível cancelar a assinatura.' }, { status: 500 });
    }
}
