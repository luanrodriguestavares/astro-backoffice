import { forwardAi } from '../proxy';

/** Mesmo limite da chamada à API (180 s). */
export const maxDuration = 180;

export async function POST(request: Request) {
    return forwardAi(
        '/api/v1/ai/checkout-generations',
        { method: 'POST', body: JSON.stringify(await request.json()) },
        'Não foi possível gerar o checkout.',
    );
}
