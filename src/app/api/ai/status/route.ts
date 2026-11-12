import { forwardAi } from '../proxy';

export function GET() {
    return forwardAi('/api/v1/ai/status', { method: 'GET' }, 'Não foi possível consultar a IA.');
}
