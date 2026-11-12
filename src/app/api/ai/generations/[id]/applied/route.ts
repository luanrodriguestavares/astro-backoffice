import { NextResponse } from 'next/server';

import { apiFetchRaw } from '@/lib/api/server';

/** Registra que o lojista aplicou a geração. Falhar aqui não atrapalha o lojista. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    await apiFetchRaw(`/api/v1/ai/generations/${encodeURIComponent(id)}/applied`, {
        method: 'POST',
    }).catch(() => undefined);
    return new NextResponse(null, { status: 204 });
}
