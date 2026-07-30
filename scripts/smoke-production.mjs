const baseUrl = (process.env.ASTRO_BACKOFFICE_URL ?? '').replace(/\/$/, '');

if (!baseUrl) throw new Error('ASTRO_BACKOFFICE_URL is required');

const health = await fetch(`${baseUrl}/api/health`, {
    signal: AbortSignal.timeout(5_000),
    redirect: 'error',
});
if (!health.ok) throw new Error(`Backoffice readiness failed with HTTP ${health.status}`);

const login = await fetch(`${baseUrl}/login`, {
    signal: AbortSignal.timeout(5_000),
    redirect: 'manual',
});
if (!login.ok) throw new Error(`Backoffice login failed with HTTP ${login.status}`);

const requiredHeaders = [
    'content-security-policy',
    'referrer-policy',
    'x-content-type-options',
    'x-frame-options',
];
for (const header of requiredHeaders) {
    if (!login.headers.has(header)) throw new Error(`Missing security header: ${header}`);
}

console.log('Backoffice production smoke passed');
