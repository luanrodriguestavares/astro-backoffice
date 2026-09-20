import { NextResponse } from 'next/server';

import { apiFetch } from '@/lib/api/server';
import type { Checkout, Customer, Payment, Product, Subscription } from '@/lib/api/types';
import { currentPermissions } from '@/lib/auth/permissions';

type Coupon = {
    id: string;
    name: string;
    code: string;
    status: string;
    scope: { name: string } | null;
};

type Order = {
    id: string;
    customerId: string;
    status: string;
    currency: string;
    totalMinor: number;
};

export type GlobalSearchResult = {
    id: string;
    label: string;
    description: string;
    group: string;
    href: string;
    icon: 'users' | 'box' | 'layout' | 'cart' | 'card' | 'repeat' | 'tag';
};

export async function GET(request: Request) {
    const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    if (query.length < 2) return NextResponse.json({ data: [] });

    const permissions = await currentPermissions();
    const canReadCatalog = permissions.has('products.read');
    const canReadPayments = permissions.has('payments.read');
    const canReadSubscriptions = permissions.has('subscriptions.read');

    const [customers, products, checkouts, coupons, orders, payments, subscriptions] =
        await Promise.all([
            canReadCatalog ? safeFetch<Customer[]>('/api/v1/customers') : Promise.resolve([]),
            canReadCatalog
                ? safeFetch<Product[]>('/api/v1/products?limit=100')
                : Promise.resolve([]),
            canReadCatalog ? safeFetch<Checkout[]>('/api/v1/checkouts') : Promise.resolve([]),
            canReadCatalog ? safeFetch<Coupon[]>('/api/v1/coupons') : Promise.resolve([]),
            canReadPayments ? safeFetch<Order[]>('/api/v1/orders') : Promise.resolve([]),
            canReadPayments ? safeFetch<Payment[]>('/api/v1/payments') : Promise.resolve([]),
            canReadSubscriptions
                ? safeFetch<Subscription[]>('/api/v1/subscriptions')
                : Promise.resolve([]),
        ]);

    const customerById = new Map(customers.map((item) => [item.id, item]));
    const productById = new Map(products.map((item) => [item.id, item]));
    const results: GlobalSearchResult[] = [];

    addMatches(results, customers, query, (customer) => ({
        id: customer.id,
        label: customer.name,
        description: customer.email,
        group: 'Clientes',
        icon: 'users',
        href: focusHref('/customers', customer.id, customer.name),
        haystack: `${customer.id} ${customer.name} ${customer.email}`,
    }));
    addMatches(results, products, query, (product) => ({
        id: product.id,
        label: product.name,
        description: `Produto · /${product.slug}`,
        group: 'Produtos',
        icon: 'box',
        href: focusHref('/products', product.id, product.name),
        haystack: `${product.id} ${product.name} ${product.slug} ${product.shortDescription ?? ''}`,
    }));
    addMatches(results, checkouts, query, (checkout) => ({
        id: checkout.id,
        label: checkout.name,
        description: `Checkout · /${checkout.slug}`,
        group: 'Checkouts',
        icon: 'layout',
        href: focusHref('/checkouts', checkout.id, checkout.name),
        haystack: `${checkout.id} ${checkout.name} ${checkout.slug} ${checkout.status}`,
    }));
    addMatches(results, orders, query, (order) => {
        const customer = customerById.get(order.customerId);
        return {
            id: order.id,
            label: `Pedido ${shortId(order.id)}`,
            description: customer?.name ?? `Cliente ${shortId(order.customerId)}`,
            group: 'Pedidos',
            icon: 'cart',
            href: focusHref('/orders', order.id, order.id),
            haystack: `${order.id} ${order.status} ${customer?.name ?? ''} ${customer?.email ?? ''}`,
        };
    });
    addMatches(results, payments, query, (payment) => {
        const customer = customerById.get(payment.customerId);
        return {
            id: payment.id,
            label: `Pagamento ${shortId(payment.id)}`,
            description: `${customer?.name ?? 'Cliente'} · ${payment.status}`,
            group: 'Pagamentos',
            icon: 'card',
            href: focusHref('/payments', payment.id, payment.id),
            haystack: `${payment.id} ${payment.orderId ?? ''} ${payment.status} ${payment.paymentMethod} ${customer?.name ?? ''} ${customer?.email ?? ''}`,
        };
    });
    addMatches(results, subscriptions, query, (subscription) => {
        const customer = customerById.get(subscription.customerId);
        const product = productById.get(subscription.productId);
        return {
            id: subscription.id,
            label: product?.name ?? `Assinatura ${shortId(subscription.id)}`,
            description: `${customer?.name ?? 'Cliente'} · ${subscription.status}`,
            group: 'Assinaturas',
            icon: 'repeat',
            href: focusHref(
                '/subscriptions',
                subscription.id,
                product?.name ?? customer?.name ?? subscription.id,
            ),
            haystack: `${subscription.id} ${subscription.status} ${customer?.name ?? ''} ${customer?.email ?? ''} ${product?.name ?? ''}`,
        };
    });
    addMatches(results, coupons, query, (coupon) => ({
        id: coupon.id,
        label: coupon.name,
        description: `Cupom ${coupon.code} · ${coupon.status}`,
        group: 'Cupons',
        icon: 'tag',
        href: focusHref('/coupons', coupon.id, coupon.code || coupon.name),
        haystack: `${coupon.id} ${coupon.name} ${coupon.code} ${coupon.status} ${coupon.scope?.name ?? ''}`,
    }));

    return NextResponse.json({ data: results.slice(0, 21) });
}

async function safeFetch<T>(path: string): Promise<T> {
    try {
        return await apiFetch<T>(path);
    } catch {
        return [] as T;
    }
}

function addMatches<T>(
    target: GlobalSearchResult[],
    items: T[],
    query: string,
    project: (item: T) => GlobalSearchResult & { haystack: string },
) {
    const term = normalize(query);
    let matches = 0;
    for (const item of items) {
        const { haystack, ...result } = project(item);
        if (normalize(haystack).includes(term)) {
            target.push(result);
            matches += 1;
            if (matches === 3) return;
        }
    }
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
}

function shortId(value: string) {
    return value.slice(0, 8);
}

function focusHref(path: string, id: string, query: string) {
    return `${path}?q=${encodeURIComponent(query)}&focus=${encodeURIComponent(id)}`;
}
