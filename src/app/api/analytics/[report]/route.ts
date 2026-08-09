import { NextResponse } from 'next/server';

import { clientProblem } from '@/lib/api/problem';
import { apiFetchRaw, AstroApiError } from '@/lib/api/server';

export async function GET(request: Request, context: { params: Promise<{ report: string }> }) {
    try {
        const { report } = await context.params;
        const search = new URL(request.url).search;
        const response = await apiFetchRaw(
            `/api/v1/analytics/${encodeURIComponent(report)}${search}`,
        );
        const disposition = response.headers.get('content-disposition');
        return new Response(response.body, {
            status: response.status,
            headers: {
                'content-type': response.headers.get('content-type') ?? 'application/json',
                ...(disposition === null ? {} : { 'content-disposition': disposition }),
            },
        });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível gerar o relatório.' },
            { status: 500 },
        );
    }
}
