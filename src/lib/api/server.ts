import { cookies, headers } from 'next/headers';

import { forwardedClientIp } from '@/lib/api/client-ip';
import { astroApiUrl } from '@/lib/api/config';
import type { ApiEnvelope, ProblemDetails, SessionData } from '@/lib/api/types';

const requestTimeoutMs = 15_000;
// Janela curta só para cobrir as chamadas paralelas de um mesmo render.
const refreshReuseMs = 10_000;
const pendingRefreshes = new Map<string, Promise<SessionData | undefined>>();

export class AstroApiError extends Error {
    constructor(public readonly problem: ProblemDetails) {
        super(problem.detail);
        this.name = 'AstroApiError';
    }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await authenticatedRequest(path, init);
    const payload = await readJson<ApiEnvelope<T> | ProblemDetails>(response);
    if (!response.ok) throw new AstroApiError(problemFrom(response, payload));
    if (payload === undefined)
        throw new AstroApiError({ status: 502, detail: 'A API retornou uma resposta inválida.' });
    return (payload as ApiEnvelope<T>).data;
}

export async function apiFetchRaw(path: string, init: RequestInit = {}): Promise<Response> {
    const response = await authenticatedRequest(path, init);
    if (!response.ok)
        throw new AstroApiError(problemFrom(response, await readJson<ProblemDetails>(response)));
    return response;
}

async function authenticatedRequest(path: string, init: RequestInit) {
    const cookieStore = await cookies();
    const clientIp = forwardedClientIp(await headers());
    const request = (accessToken?: string) =>
        send(`${astroApiUrl()}${path}`, {
            ...init,
            cache: 'no-store',
            signal: init.signal ?? AbortSignal.timeout(requestTimeoutMs),
            headers: {
                accept: 'application/json',
                ...clientIp,
                ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
                ...(accessToken === undefined ? {} : { authorization: `Bearer ${accessToken}` }),
                ...init.headers,
            },
        });

    let response = await request(cookieStore.get('astro_access')?.value);
    if (response.status === 401) {
        const refreshToken = cookieStore.get('astro_refresh')?.value;
        if (refreshToken !== undefined) {
            const refreshed = await sharedRefresh(refreshToken, clientIp);
            if (refreshed !== undefined) {
                persistSession(cookieStore, refreshed);
                response = await request(refreshed.accessToken);
            }
        }
    }

    return response;
}

// Vários apiFetch paralelos (ex.: layout do dashboard) recebem 401 juntos; cada um girar o mesmo
// refresh token faria a API detectar reuso e revogar a família de sessão inteira.
function sharedRefresh(refreshToken: string, clientIp: Record<string, string>) {
    const pending = pendingRefreshes.get(refreshToken);
    if (pending !== undefined) return pending;
    const refresh = refreshSession(refreshToken, clientIp).catch(() => undefined);
    pendingRefreshes.set(refreshToken, refresh);
    void refresh.then((session) => {
        // Falha não fica em cache: a próxima navegação pode tentar de novo.
        if (session === undefined) pendingRefreshes.delete(refreshToken);
        else setTimeout(() => pendingRefreshes.delete(refreshToken), refreshReuseMs);
    });
    return refresh;
}

async function refreshSession(refreshToken: string, clientIp: Record<string, string>) {
    const response = await send(`${astroApiUrl()}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            ...clientIp,
        },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
        signal: AbortSignal.timeout(requestTimeoutMs),
    });
    if (!response.ok) return undefined;
    return (await readJson<ApiEnvelope<SessionData>>(response))?.data;
}

async function send(url: string, init: RequestInit) {
    try {
        return await fetch(url, init);
    } catch (error) {
        const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
        throw new AstroApiError({
            status: timedOut ? 504 : 503,
            detail: timedOut
                ? 'A API do Astro demorou demais para responder.'
                : 'A API do Astro está indisponível no momento.',
        });
    }
}

// Erros de proxy (ex.: 502 em HTML) não podem virar SyntaxError.
async function readJson<T>(response: Response): Promise<T | undefined> {
    try {
        return (await response.json()) as T;
    } catch {
        return undefined;
    }
}

function problemFrom(response: Response, payload: unknown): ProblemDetails {
    const problem = payload as Partial<ProblemDetails> | undefined;
    if (typeof problem?.detail === 'string')
        return { ...problem, status: problem.status ?? response.status, detail: problem.detail };
    return {
        status: response.status,
        detail: 'A API do Astro retornou uma resposta inesperada.',
    };
}

function persistSession(cookieStore: Awaited<ReturnType<typeof cookies>>, session: SessionData) {
    const secure = process.env.NODE_ENV === 'production';
    try {
        cookieStore.set('astro_access', session.accessToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure,
            path: '/',
            maxAge: session.expiresIn,
            priority: 'high',
        });
        cookieStore.set('astro_refresh', session.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure,
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
            priority: 'high',
        });
    } catch {
        // Server Components cannot mutate cookies; the proxy persists them on navigation.
    }
}
