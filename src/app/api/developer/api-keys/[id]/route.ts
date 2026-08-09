import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const data = await apiFetch(`/api/v1/developer/api-keys/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), { status: error.problem.status });
        return NextResponse.json({ detail: 'Não foi possível revogar a chave.' }, { status: 500 });
    }
}
