import { forwardFlowRequest } from './proxy';

export function PATCH(request: Request) {
    return forwardFlowRequest(
        request,
        '/api/v1/gateway-flow',
        'PATCH',
        'Não foi possível alterar o status do fluxo.',
        true,
    );
}
