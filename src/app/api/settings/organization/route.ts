import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { Organization } from '@/lib/api/types';

export async function PATCH(request: Request) {
    try {
        const input = await request.json();
        const organization = await apiFetch<Organization>('/api/v1/organizations/current', {
            method: 'PATCH',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(input),
        });
        return NextResponse.json({ data: organization });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(
                { detail: error.problem.detail },
                { status: error.problem.status },
            );
        return NextResponse.json(
            { detail: 'Não foi possível atualizar a organização.' },
            { status: 500 },
        );
    }
}
