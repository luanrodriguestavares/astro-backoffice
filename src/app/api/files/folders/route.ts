import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch } from '@/lib/api/server';
import { folderError } from '@/lib/files/errors';
import type { MediaFolder } from '@/lib/api/types';

export async function POST(request: Request) {
    try {
        const folder = await apiFetch<MediaFolder>('/api/v1/files/folders', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: folder });
    } catch (error) {
        return folderError(error, 'Não foi possível criar a pasta.');
    }
}
