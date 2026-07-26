import { NextResponse } from 'next/server';

import { apiFetchRaw, AstroApiError } from '@/lib/api/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const download = new URL(request.url).searchParams.get('download') === '1';
        const response = await apiFetchRaw(
            `/api/v1/files/${encodeURIComponent(id)}/content?disposition=${download ? 'attachment' : 'inline'}`,
            { headers: { accept: '*/*' } },
        );
        const headers = new Headers();
        for (const name of [
            'content-type',
            'content-length',
            'content-disposition',
            'cache-control',
            'x-content-type-options',
        ]) {
            const value = response.headers.get(name);
            if (value) headers.set(name, value);
        }
        return new Response(response.body, { status: response.status, headers });
    } catch (error) {
        if (error instanceof AstroApiError) {
            return NextResponse.json(
                { detail: error.problem.detail },
                { status: error.problem.status },
            );
        }
        return NextResponse.json(
            { detail: 'Não foi possível carregar o arquivo.' },
            { status: 500 },
        );
    }
}
