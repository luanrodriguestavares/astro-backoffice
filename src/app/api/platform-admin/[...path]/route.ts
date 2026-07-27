import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetch, AstroApiError } from '@/lib/api/server';

const allowedRoots = new Set(['organizations', 'users', 'plans']);

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await context.params;
        if (path.length === 0 || !allowedRoots.has(path[0] ?? ''))
            return NextResponse.json({ detail: 'Ação administrativa inválida.' }, { status: 404 });

        const data = await apiFetch<unknown>(
            `/api/v1/admin/${path.map(encodeURIComponent).join('/')}`,
            {
                method: request.method,
                body: request.method === 'GET' ? undefined : JSON.stringify(await request.json()),
            },
        );
        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível concluir a ação administrativa.' },
            { status: 500 },
        );
    }
}

export const PATCH = forward;
export const PUT = forward;
