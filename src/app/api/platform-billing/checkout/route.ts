import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as unknown;
        const result = await apiFetch<{
            clientSecret: string | null;
            publishableKey: string;
            subscriptionId: string;
            status: 'requires_payment' | 'updated';
        }>('/api/v1/platform/billing/checkout', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return NextResponse.json({ data: result });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), { status: error.problem.status });
        return NextResponse.json({ detail: 'Não foi possível iniciar a assinatura.' }, { status: 500 });
    }
}
