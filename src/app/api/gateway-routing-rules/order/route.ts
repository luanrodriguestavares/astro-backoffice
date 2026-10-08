import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { GatewayRoutingRule } from '@/lib/api/types';

export async function PUT(request: Request) {
    try {
        const input = (await request.json()) as { ruleIds?: string[] };
        const rules = await apiFetch<GatewayRoutingRule[]>('/api/v1/gateway-routing-rules/order', {
            method: 'PUT',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify({ ruleIds: input.ruleIds }),
        });
        return NextResponse.json({ data: rules });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível reordenar as regras.' },
            { status: 500 },
        );
    }
}
