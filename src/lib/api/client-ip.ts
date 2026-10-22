// Repassa à API o X-Forwarded-For recebido do Caddy. A API só confia nele vindo de saltos
// privados (este servidor Next na rede interna) e usa o IP real do usuário no rate limit;
// sem isso todos os usuários dividiriam o bucket do IP deste servidor.
export function forwardedClientIp(source: Pick<Headers, 'get'>): Record<string, string> {
    const value = source.get('x-forwarded-for')?.trim();
    return value ? { 'x-forwarded-for': value.slice(0, 512) } : {};
}
