import { NextResponse } from 'next/server';

import { apiFetch, AstroApiError } from '@/lib/api/server';
import { clientProblem } from '@/lib/api/problem';

/**
 * Uma geração leva de 5 s a 1 min (mais quando o provedor está sobrecarregado e a API tenta de
 * novo). O limite padrão das chamadas à API é curto: aqui ele precisa cobrir a geração inteira,
 * senão o chat recebe erro enquanto a API continua gerando.
 */
export const AI_TIMEOUT_MS = 180_000;

/** Repassa um pedido de IA para a API, mantendo o problema (créditos, sobrecarga) para o chat. */
export async function forwardAi(path: string, init: RequestInit, fallback: string) {
    try {
        const data = await apiFetch<unknown>(path, {
            ...init,
            signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        });
        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof AstroApiError)
            return NextResponse.json(clientProblem(error.problem), {
                status: error.problem.status,
            });
        return NextResponse.json({ detail: fallback }, { status: 500 });
    }
}
