import { forwardFlowRequest } from '../proxy';

export function PUT(request: Request) {
    return forwardFlowRequest(
        request,
        '/api/v1/gateway-flow/draft',
        'PUT',
        'Não foi possível salvar o rascunho do fluxo.',
    );
}
