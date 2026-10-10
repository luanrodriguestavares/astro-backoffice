import { forwardFlowRequest } from '../proxy';

export function POST(request: Request) {
    return forwardFlowRequest(
        request,
        '/api/v1/gateway-flow/publish',
        'POST',
        'Não foi possível publicar o fluxo.',
        true,
    );
}
