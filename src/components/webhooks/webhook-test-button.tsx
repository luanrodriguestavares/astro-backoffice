'use client';

import { useState } from 'react';

import { TableActionButton } from '@/components/ui/table-action-button';
import { showToast } from '@/components/ui/toast';

/** Envia `webhook.test` para o endpoint: valida URL, assinatura e resposta sem fazer uma compra. */
export function WebhookTestButton({ id }: { id: string }) {
    const [sending, setSending] = useState(false);
    const send = async () => {
        if (sending) return;
        setSending(true);
        const response = await fetch(`/api/webhooks/${encodeURIComponent(id)}/test`, {
            method: 'POST',
        });
        setSending(false);
        if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { detail?: string };
            showToast({
                tone: 'error',
                description: payload.detail ?? 'Não foi possível enviar o evento de teste.',
            });
            return;
        }
        showToast({
            tone: 'success',
            title: 'Evento de teste enviado',
            description: 'Acompanhe o resultado da entrega em Logs → Webhooks.',
        });
    };
    return <TableActionButton label="Enviar evento de teste" icon="bolt" onClick={send} />;
}
