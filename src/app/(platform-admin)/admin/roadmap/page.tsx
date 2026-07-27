import { CommunityRoadmap } from '@/components/community-roadmap/community-roadmap';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { RoadmapDashboard } from '@/lib/api/types';

export default async function AdminRoadmapPage() {
    const roadmap = await apiFetch<RoadmapDashboard>('/api/v1/community-roadmap');
    return (
        <div className="astro-themed-page roadmap-page">
            <PageHeader
                eyebrow="Voz da comunidade"
                title="Roadmap e moderação"
                description="Revise sugestões, lapide a comunicação e mova ideias pelo quadro conforme o Astro evolui."
            />
            <CommunityRoadmap roadmap={roadmap} adminMode />
        </div>
    );
}
