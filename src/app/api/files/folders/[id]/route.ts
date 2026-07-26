import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { folderError, translateFolderError } from '@/lib/files/errors';
import type { MediaFolder } from '@/lib/api/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const folder = await apiFetch<MediaFolder>(
            `/api/v1/files/folders/${encodeURIComponent(id)}`,
            {
                method: 'PATCH',
                headers: { 'idempotency-key': randomUUID() },
                body: JSON.stringify(await request.json()),
            },
        );
        return NextResponse.json({ data: folder });
    } catch (error) {
        return folderError(error, 'Não foi possível atualizar a pasta.');
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        await apiFetch(`/api/v1/files/folders/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'idempotency-key': randomUUID() },
        });
        return NextResponse.json({ data: { accepted: true } });
    } catch (error) {
        if (error instanceof AstroApiError) {
            const detail =
                error.problem.code === 'FILE_FOLDER_NOT_EMPTY'
                    ? 'Mova ou exclua os itens da pasta antes de removê-la.'
                    : translateFolderError(error.problem.code, error.problem.detail);
            return NextResponse.json({ detail }, { status: error.problem.status });
        }
        return NextResponse.json({ detail: 'Não foi possível excluir a pasta.' }, { status: 500 });
    }
}
