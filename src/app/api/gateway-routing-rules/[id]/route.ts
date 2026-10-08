import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { GatewayRoutingRule } from '@/lib/api/types';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const input = (await request.json()) as Record<string, unknown>;
        const rule = await apiFetch<GatewayRoutingRule>(
            `/api/v1/gateway-routing-rules/${encodeURIComponent(id)}`,
            {
                method: 'PATCH',
                headers: { 'idempotency-key': randomUUID() },
                body: JSON.stringify(input),
            },
        );
        return NextResponse.json({ data: rule });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível atualizar a regra de roteamento.' },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await apiFetch(`/api/v1/gateway-routing-rules/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        return NextResponse.json({ data: { accepted: true } });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível remover a regra de roteamento.' },
            { status: 500 },
        );
    }
}
