import { NextResponse } from 'next/server';

import { AstroApiError } from '@/lib/api/server';

export function folderError(error: unknown, fallback: string) {
    if (error instanceof AstroApiError) {
        return NextResponse.json(
            { detail: translateFolderError(error.problem.code, error.problem.detail) },
            { status: error.problem.status },
        );
    }
    return NextResponse.json({ detail: fallback }, { status: 500 });
}

export function translateFolderError(code: string | undefined, detail: string) {
    if (code === 'FILE_FOLDER_NAME_CONFLICT')
        return 'Já existe uma pasta com esse nome neste local.';
    if (code === 'FILE_FOLDER_LIMIT_REACHED') return 'O limite de 100 pastas foi atingido.';
    if (code === 'FILE_FOLDER_DEPTH_EXCEEDED')
        return 'A estrutura permite no máximo oito níveis de pastas.';
    if (code === 'FILE_FOLDER_CYCLE')
        return 'Uma pasta não pode ser movida para dentro dela mesma ou de uma subpasta.';
    return detail;
}
