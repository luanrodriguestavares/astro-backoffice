export function astroApiUrl() {
    return validatedUrl('ASTRO_API_URL', process.env.ASTRO_API_URL, 'http://localhost:3000', false);
}

export function checkoutPublicBaseUrl() {
    return validatedUrl(
        'NEXT_PUBLIC_CHECKOUT_URL',
        process.env.NEXT_PUBLIC_CHECKOUT_URL,
        'http://localhost:3002',
        true,
    );
}

export function validatedUrl(
    name: string,
    value: string | undefined,
    developmentFallback: string,
    publicUrl: boolean,
) {
    if (process.env.NODE_ENV === 'production' && !value)
        throw new Error(`${name} is required in production`);
    let parsed: URL;
    try {
        parsed = new URL(value ?? developmentFallback);
    } catch {
        throw new Error(`${name} must be an absolute URL`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol))
        throw new Error(`${name} must use http or https`);
    if (parsed.username || parsed.password)
        throw new Error(`${name} must not contain credentials`);
    if (publicUrl && process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:')
        throw new Error(`${name} must use https in production`);
    return parsed.toString().replace(/\/$/, '');
}
