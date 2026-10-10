import { forwardFlowRequest } from '../proxy';

export function POST(request: Request) {
    return forwardFlowRequest(
        request,
        '/api/v1/gateway-flow/simulate',
        'POST',
        'Não foi possível simular o fluxo.',
    );
}
