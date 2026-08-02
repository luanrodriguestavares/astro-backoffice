import { CommunityRoadmap } from '@/components/community-roadmap/community-roadmap';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { RoadmapDashboard } from '@/lib/api/types';

export default async function RoadmapPage() {
    const roadmap = await apiFetch<RoadmapDashboard>('/api/v1/community-roadmap');
    return (
        <div className="astro-themed-page roadmap-page">
            <PageHeader
                eyebrow="Roadmap do Astro"
                title="Você pede. A gente constrói."
                description="Sugira novas funcionalidades, vote nas ideias da comunidade e acompanhe o desenvolvimento do produto."
            />
            <CommunityRoadmap roadmap={roadmap} />
        </div>
    );
}
