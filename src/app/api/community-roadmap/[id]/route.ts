import { NextResponse } from 'next/server';

import { roadmapActionError } from '@/lib/community-roadmap/errors';
import { apiFetch } from '@/lib/api/server';
import type { RoadmapSubmission } from '@/lib/api/types';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const idea = await apiFetch<RoadmapSubmission>(
            `/api/v1/community-roadmap/ideas/${encodeURIComponent(id)}`,
            {
                method: 'PATCH',
                body: JSON.stringify(await request.json()),
            },
        );
        return NextResponse.json({ data: idea });
    } catch (error) {
        return roadmapActionError(error, 'Não foi possível editar sua sugestão.');
    }
}
