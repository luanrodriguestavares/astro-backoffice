import 'server-only';

import { apiFetch } from '@/lib/api/server';
import type { Checkout, Payment, Product, Refund, Subscription } from '@/lib/api/types';
import type { NotificationItem } from '@/lib/notifications/types';

const approvedPaymentStatuses = new Set(['approved', 'paid', 'captured', 'succeeded']);
const completedRefundStatuses = new Set(['completed', 'succeeded', 'approved']);
const limitedFeatures = [
    { feature: 'catalog.active_products', label: 'Produtos ativos', href: '/products' },
    { feature: 'checkout.published', label: 'Checkouts publicados', href: '/checkouts' },
    { feature: 'commerce.orders', label: 'Pedidos do ciclo', href: '/orders' },
    { feature: 'subscriptions.active', label: 'Assinaturas ativas', href: '/subscriptions' },
    { feature: 'gateways.connected', label: 'Gateways conectados', href: '/gateways' },
    { feature: 'workspace.members', label: 'Usuários no workspace', href: '/team' },
    { feature: 'media.storage_bytes', label: 'Armazenamento de mídia', href: '/files' },
] as const;

export async function getRecentNotifications(limit = 30) {
    const [payments, subscriptions, refunds, checkouts, products, planUsage] = await Promise.all([
        safely(() => apiFetch<Payment[]>('/api/v1/payments')),
        safely(() => apiFetch<Subscription[]>('/api/v1/subscriptions')),
        safely(() => apiFetch<Refund[]>('/api/v1/refunds')),
        safely(() => apiFetch<Checkout[]>('/api/v1/checkouts')),
        safely(() => apiFetch<Product[]>('/api/v1/products?limit=100')),
        Promise.all(
            limitedFeatures.map(async (definition) => ({
                ...definition,
                status: await safelyOne(() =>
                    apiFetch<PlanFeatureStatus>(
                        `/api/v1/platform/features/${encodeURIComponent(definition.feature)}`,
                    ),
                ),
            })),
        ),
    ]);

    const items: NotificationItem[] = [];

    for (const payment of payments) {
        if (!approvedPaymentStatuses.has(payment.status)) continue;
        items.push({
            id: `payment-${payment.id}`,
            title: 'Pagamento aprovado',
            description: `Pedido ${payment.orderId ?? payment.id} foi confirmado.`,
            createdAt: payment.approvedAt ?? payment.createdAt,
            href: '/payments',
            icon: 'check',
            tone: 'success',
        });
    }

    for (const subscription of subscriptions) {
        items.push({
            id: `subscription-${subscription.id}`,
            title: 'Nova assinatura',
            description: `A assinatura ${subscription.id} foi criada.`,
            createdAt: subscription.createdAt,
            href: '/subscriptions',
            icon: 'repeat',
            tone: 'brand',
        });
    }

    for (const refund of refunds) {
        if (!completedRefundStatuses.has(refund.status)) continue;
        items.push({
            id: `refund-${refund.id}`,
            title: 'Reembolso processado',
            description: `O pagamento ${refund.paymentId} foi reembolsado.`,
            createdAt: refund.completedAt ?? refund.createdAt,
            href: '/refunds',
            icon: 'refund',
            tone: 'warning',
        });
    }

    for (const checkout of checkouts) {
        items.push({
            id: `checkout-${checkout.id}`,
            title: checkout.status === 'published' ? 'Checkout publicado' : 'Checkout atualizado',
            description: checkout.name,
            createdAt: checkout.updatedAt,
            href: `/checkouts/${checkout.id}/builder`,
            icon: 'layout',
            tone: 'brand',
        });
    }

    for (const product of products) {
        items.push({
            id: `product-${product.id}`,
            title: 'Produto atualizado',
            description: product.name,
            createdAt: product.updatedAt,
            href: '/products',
            icon: 'box',
            tone: 'brand',
        });
    }

    for (const usage of planUsage) {
        if (
            usage.status === undefined ||
            usage.status.limit === null ||
            (!usage.status.nearingLimit && usage.status.remaining !== 0)
        )
            continue;
        const reached = usage.status.remaining === 0;
        items.push({
            id: `plan-limit-${usage.feature}`,
            title: reached ? 'Limite do plano atingido' : 'Você está perto do limite',
            description: `${usage.label}: ${formatUsage(usage.feature, usage.status.used)} de ${formatUsage(usage.feature, usage.status.limit)} utilizados.`,
            createdAt: new Date().toISOString(),
            href: usage.href,
            icon: reached ? 'bell' : 'bolt',
            tone: 'warning',
        });
    }

    return items
        .sort(
            (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, Math.max(1, Math.min(limit, 50)));
}

interface PlanFeatureStatus {
    feature: string;
    enabled: boolean;
    limit: number | null;
    used: number;
    remaining: number | null;
    usagePercent: number | null;
    nearingLimit: boolean;
}

function formatUsage(feature: string, value: number): string {
    if (feature !== 'media.storage_bytes') return String(value);
    const gibibytes = value / 1_073_741_824;
    return `${gibibytes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB`;
}

async function safely<T>(request: () => Promise<T[]>): Promise<T[]> {
    try {
        return await request();
    } catch {
        return [];
    }
}

async function safelyOne<T>(request: () => Promise<T>): Promise<T | undefined> {
    try {
        return await request();
    } catch {
        return undefined;
    }
}
