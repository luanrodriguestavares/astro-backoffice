import { PlanAdminManager } from '@/components/platform-admin/plan-admin-manager';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/server';
import type { PlatformAdminPlan } from '@/lib/api/types';

export default async function AdminPlansPage() {
    const plans = await apiFetch<PlatformAdminPlan[]>('/api/v1/admin/plans');
    return (
        <div className="astro-themed-page">
            <PageHeader
                eyebrow="Oferta e governança"
                title="Planos e limites"
                description="Edite preços, posicionamento, recursos e limites aplicados pela plataforma. Toda mudança exige uma justificativa."
            />
            <PlanAdminManager initialPlans={plans} />
        </div>
    );
}
