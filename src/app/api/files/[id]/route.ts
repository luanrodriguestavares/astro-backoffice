import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { MediaFile } from '@/lib/api/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const file = await apiFetch<MediaFile>(`/api/v1/files/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: file });
    } catch (error) {
        return fileError(error, 'Não foi possível renomear o arquivo.');
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        await apiFetch(`/api/v1/files/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'idempotency-key': randomUUID() },
        });
        return NextResponse.json({ data: { accepted: true } });
    } catch (error) {
        return fileError(error, 'Não foi possível excluir o arquivo.');
    }
}

function fileError(error: unknown, fallback: string) {
    if (error instanceof AstroApiError) {
        const detail =
            error.problem.code === 'FILE_IN_USE'
                ? 'Este arquivo está sendo usado por um produto e não pode ser excluído.'
                : error.problem.detail;
        return NextResponse.json({ detail }, { status: error.problem.status });
    }
    return NextResponse.json({ detail: fallback }, { status: 500 });
}
