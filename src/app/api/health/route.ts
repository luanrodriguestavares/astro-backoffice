import { NextResponse } from 'next/server';

import { astroApiUrl } from '@/lib/api/config';

export const dynamic = 'force-dynamic';

export async function GET() {
    const startedAt = Date.now();
    try {
        const response = await fetch(`${astroApiUrl()}/health/ready`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(3_000),
        });
        if (!response.ok) throw new Error(`upstream returned ${response.status}`);
        return NextResponse.json({
            status: 'ready',
            dependencies: { api: 'ready' },
            durationMs: Date.now() - startedAt,
        });
    } catch {
        return NextResponse.json(
            {
                status: 'not_ready',
                dependencies: { api: 'unavailable' },
                durationMs: Date.now() - startedAt,
            },
            { status: 503 },
        );
    }
}
