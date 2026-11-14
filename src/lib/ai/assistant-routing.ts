import type { AiTask } from '@/components/ai/ai-chat';

/**
 * Encaminha pedidos operacionais ao orquestrador mesmo quando o usuário está com o builder
 * visual em foco. Pedidos sem sinais claros continuam no agente de conteúdo/aparência.
 */
export function checkoutAssistantTask(request: string): AiTask {
    const text = request
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const operationalSignal =
        /\b(gateway|webhook|orquestr|rote(?:ar|amento)?|fallback|retentativa|split)\b/.test(text) ||
        /\b(mercado\s*pago|abacate\s*pay|stripe|pagar\.?me|asaas|paypal)\b/.test(text);
    const eventAutomation =
        /\b(email|notifica|avisa|dispara|envia)\b/.test(text) &&
        /\b(aprov|sucesso|erro|falha|recus|cancel|reembols)\w*/.test(text);
    const methods = ['pix', 'cartao', 'boleto'].filter((method) => text.includes(method)).length;
    const methodRouting =
        methods >= 2 && /\b(usar?|cobra|cobrar|processa|direciona|manda|via)\w*/.test(text);

    return operationalSignal || eventAutomation || methodRouting ? 'payment_flow' : 'checkout';
}
