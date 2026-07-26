const publicCheckoutBaseUrl = (
    process.env.NEXT_PUBLIC_CHECKOUT_URL ?? 'http://localhost:3002'
).replace(/\/$/, '');

export function checkoutPublicUrl(slug: string) {
    return `${publicCheckoutBaseUrl}/${encodeURIComponent(slug)}`;
}
