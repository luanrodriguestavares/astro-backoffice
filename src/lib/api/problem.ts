import type { ProblemDetails } from '@/lib/api/types';

const featureLabels: Record<string, string> = {
    'catalog.active_products': 'produtos ativos',
    'checkout.published': 'checkouts publicados',
    'commerce.orders': 'pedidos mensais',
    'subscriptions.active': 'assinaturas ativas',
    'gateways.connected': 'gateways conectados',
    'domains.custom': 'domínios personalizados',
    'workspace.members': 'usuários no workspace',
    'media.storage_bytes': 'armazenamento de mídia',
};

export function clientProblem(problem: ProblemDetails) {
    return {
        code: problem.code,
        detail: translatedDetail(problem),
        ...(problem.meta === undefined ? {} : { meta: problem.meta }),
    };
}

function translatedDetail(problem: ProblemDetails): string {
    if (problem.code !== 'PLAN_LIMIT_EXCEEDED') return problem.detail;
    const feature = typeof problem.meta?.feature === 'string' ? problem.meta.feature : 'recurso';
    const label = featureLabels[feature] ?? feature;
    const plan =
        typeof problem.meta?.planName === 'string' ? problem.meta.planName : 'seu plano atual';
    const used = typeof problem.meta?.used === 'number' ? problem.meta.used : undefined;
    const limit = typeof problem.meta?.limit === 'number' ? problem.meta.limit : undefined;
    const usage = used === undefined || limit === undefined ? '' : ` (${used}/${limit})`;
    return `Você atingiu o limite de ${label} do ${plan}${usage}. Libere capacidade ou faça upgrade para continuar.`;
}
