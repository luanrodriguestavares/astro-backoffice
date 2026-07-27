import { NextResponse } from 'next/server';

import { roadmapActionError } from '@/lib/community-roadmap/errors';
import { apiFetch } from '@/lib/api/server';
import type { RoadmapIdea } from '@/lib/api/types';

export async function POST(request: Request) {
    try {
        const idea = await apiFetch<RoadmapIdea>('/api/v1/community-roadmap/admin/ideas', {
            method: 'POST',
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json({ data: idea });
    } catch (error) {
        return roadmapActionError(error, 'Não foi possível publicar a ideia.');
    }
}
