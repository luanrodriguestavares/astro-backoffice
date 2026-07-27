import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';
import { astroApiUrl } from '@/lib/api/config';
import type { GatewayConnection } from '@/lib/api/types';

export async function POST(request: Request) {
    try {
        const input = (await request.json()) as Record<string, unknown>;
        const connection = await apiFetch<GatewayConnection>('/api/v1/gateway-connections', {
            method: 'POST',
            headers: { 'idempotency-key': randomUUID() },
            body: JSON.stringify(input),
        });
        return NextResponse.json({
            data: {
                ...connection,
                webhookUrl: `${astroApiUrl()}/webhooks/v1/gateway-webhooks/${connection.provider}/${connection.webhookPathToken}`,
            },
        });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json(
            { detail: 'Não foi possível conectar o gateway.' },
            { status: 500 },
        );
    }
}
