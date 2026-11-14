import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { Plan } from '@/lib/api/types';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true';
        const plans = await apiFetch<Plan[]>(
            `/api/v1/products/${encodeURIComponent(id)}/plans${includeArchived ? '?includeArchived=true' : ''}`,
        );
        return NextResponse.json({ data: plans });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível carregar os planos.' },
            { status: 500 },
        );
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const plan = await apiFetch<Plan>(`/api/v1/products/${encodeURIComponent(id)}/plans`, {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: plan });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json({ detail: 'Não foi possível criar o plano.' }, { status: 500 });
    }
}
