export function astroApiUrl() {
    return (process.env.ASTRO_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
