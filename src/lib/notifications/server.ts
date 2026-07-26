import 'server-only';

import { apiFetch } from '@/lib/api/server';
import type { Checkout, Payment, Product, Refund, Subscription } from '@/lib/api/types';
import type { NotificationItem } from '@/lib/notifications/types';

const approvedPaymentStatuses = new Set(['approved', 'paid', 'captured', 'succeeded']);
const completedRefundStatuses = new Set(['completed', 'succeeded', 'approved']);

export async function getRecentNotifications(limit = 30) {
    const [payments, subscriptions, refunds, checkouts, products] = await Promise.all([
        safely(() => apiFetch<Payment[]>('/api/v1/payments')),
        safely(() => apiFetch<Subscription[]>('/api/v1/subscriptions')),
        safely(() => apiFetch<Refund[]>('/api/v1/refunds')),
        safely(() => apiFetch<Checkout[]>('/api/v1/checkouts')),
        safely(() => apiFetch<Product[]>('/api/v1/products?limit=100')),
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

    return items
        .sort(
            (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, Math.max(1, Math.min(limit, 50)));
}

async function safely<T>(request: () => Promise<T[]>): Promise<T[]> {
    try {
        return await request();
    } catch {
        return [];
    }
}
