import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { PageHeader } from '@/components/ui/page-header';
import { currentOrganization } from '@/lib/auth/permissions';

export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
    const organization = await currentOrganization();
    const canRead = organization.permissions?.includes('analytics.read') ?? false;
    return (
        <div>
            <PageHeader
                eyebrow="Analytics"
                title={
                    <>
                        Decisões com{' '}
                        <span className="font-serif font-normal italic text-brand">clareza.</span>
                    </>
                }
                description="Receita, conversão, recorrência e operação em uma visão analítica completa."
            />
            {canRead ? (
                <AnalyticsDashboard />
            ) : (
                <div className="glass-panel rounded-[28px] p-10 text-center">
                    <p className="text-sm font-semibold">Analytics indisponível para seu perfil</p>
                    <p className="mt-2 text-xs text-muted">
                        Solicite a permissão de leitura de analytics ao administrador do workspace.
                    </p>
                </div>
            )}
        </div>
    );
}
