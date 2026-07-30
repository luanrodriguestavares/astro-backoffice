import { checkoutPublicBaseUrl } from '@/lib/api/config';

export function checkoutPublicUrl(slug: string) {
    return `${checkoutPublicBaseUrl()}/${encodeURIComponent(slug)}`;
}
