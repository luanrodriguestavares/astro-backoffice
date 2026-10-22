import { forwardFlowRequest } from '../proxy';

/** Problemas de um grafo com as referências atuais, sem salvar (fluxo de um checkout). */
export function POST(request: Request) {
    return forwardFlowRequest(
        request,
        '/api/v1/gateway-flow/validate',
        'POST',
        'Não foi possível validar o fluxo.',
    );
}
