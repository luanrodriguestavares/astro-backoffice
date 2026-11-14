import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import type { Plan } from '@/lib/api/types';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const plan = await apiFetch<Plan>(`/api/v1/plans/${encodeURIComponent(id)}`);
        return NextResponse.json({ data: plan });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json({ detail: 'Não foi possível carregar o plano.' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const plan = await apiFetch<Plan>(`/api/v1/plans/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: plan });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível atualizar o plano.' },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await apiFetch(`/api/v1/plans/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'idempotency-key': randomUUID() },
        });
        return NextResponse.json({ data: { accepted: true } });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json({ detail: 'Não foi possível arquivar o plano.' }, { status: 500 });
    }
}
