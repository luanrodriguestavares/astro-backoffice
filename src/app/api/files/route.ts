import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';

type FileRecord = {
    id: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
    status: string;
};

export async function POST(request: Request) {
    try {
        const file = await apiFetch<FileRecord>('/api/v1/files', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: file });
    } catch (error) {
        if (error instanceof AstroApiError) {
            const problem = clientProblem(error.problem);
            const detail =
                error.problem.status === 413
                    ? 'O arquivo excede o limite de tamanho permitido.'
                    : error.problem.code === 'FILE_STORAGE_QUOTA_EXCEEDED'
                      ? 'O limite de armazenamento da organização foi atingido.'
                      : problem.detail;
            return NextResponse.json({ ...problem, detail }, { status: error.problem.status });
        }
        return NextResponse.json({ detail: 'Não foi possível enviar a imagem.' }, { status: 500 });
    }
}
