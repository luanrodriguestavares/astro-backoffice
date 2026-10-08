import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { GatewayRoutingRule } from '@/lib/api/types';

export async function POST(request: Request) {
    try {
        const input = (await request.json()) as Record<string, unknown>;
        const rule = await apiFetch<GatewayRoutingRule>('/api/v1/gateway-routing-rules', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(input),
        });
        return NextResponse.json({ data: rule });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível criar a regra de roteamento.' },
            { status: 500 },
        );
    }
}
