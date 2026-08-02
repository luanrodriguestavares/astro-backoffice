import { NextResponse } from 'next/server';

import { roadmapActionError } from '@/lib/community-roadmap/errors';
import { apiFetch } from '@/lib/api/server';

interface RoadmapLike {
    id: string;
    likesCount: number;
    likedByMe: boolean;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const engagement = await apiFetch<RoadmapLike>(
            `/api/v1/community-roadmap/ideas/${encodeURIComponent(id)}/like`,
            { method: 'POST' },
        );
        return NextResponse.json({ data: engagement });
    } catch (error) {
        return roadmapActionError(error, 'Não foi possível registrar sua curtida.');
    }
}
