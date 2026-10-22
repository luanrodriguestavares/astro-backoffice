import { NextResponse } from 'next/server';

import { apiFetchRaw, AstroApiError } from '@/lib/api/server';

const inlineContentTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'application/pdf',
    'text/plain',
]);

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
        ]) {
            const value = response.headers.get(name);
            if (value) headers.set(name, value);
        }
        // Defesa em profundidade na origem do backoffice: nada além de imagem raster, PDF e
        // texto puro renderiza inline, e nunca com scripts.
        const contentType = (headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase();
        if (!contentType || !inlineContentTypes.has(contentType)) {
            headers.set('content-type', 'application/octet-stream');
            headers.set(
                'content-disposition',
                (headers.get('content-disposition') ?? 'attachment').replace(
                    /^\s*inline/i,
                    'attachment',
                ),
            );
        }
        headers.set('x-content-type-options', 'nosniff');
        headers.set(
            'content-security-policy',
            contentType === 'application/pdf'
                ? "frame-ancestors 'self'"
                : "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
        );
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
