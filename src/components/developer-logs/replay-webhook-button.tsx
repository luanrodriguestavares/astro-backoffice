'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';

export function ReplayWebhookButton({
    deliveryId,
    disabled = false,
}: {
    deliveryId: string;
    disabled?: boolean;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function replay() {
        setSubmitting(true);
        try {
            const response = await fetch(
                `/api/developer/logs/webhook-deliveries/${encodeURIComponent(deliveryId)}/replay`,
                { method: 'POST' },
            );
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok)
                throw new Error(payload.detail ?? 'Não foi possível reenviar o webhook.');
            setOpen(false);
            showToast({
                tone: 'success',
                title: 'Webhook colocado na fila',
                description:
                    'Uma nova sequência de tentativas foi iniciada sem apagar o histórico.',
            });
            router.refresh();
        } catch (error) {
            showToast({
                tone: 'error',
                description:
                    error instanceof Error ? error.message : 'Não foi possível reenviar o webhook.',
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="primary"
                disabled={disabled}
                onClick={() => setOpen(true)}
            >
                <Icon name="play" className="size-3.5" />
                Reenviar webhook
            </Button>
            <Modal open={open} onClose={() => setOpen(false)} labelledBy="replay-webhook-title">
                <ModalHeader
                    titleId="replay-webhook-title"
                    eyebrow="Entrega de webhook"
                    title="Confirmar reenvio"
                    description="O mesmo evento será enviado novamente ao endpoint configurado."
                    onClose={() => setOpen(false)}
                />
                <ModalBody>
                    <p className="text-[13px] leading-6 text-muted">
                        O Astro iniciará uma nova sequência de tentativas com idempotência. As
                        tentativas anteriores continuarão visíveis no histórico para auditoria.
                    </p>
                    <code className="mt-4 block rounded-xl border border-border bg-surface-muted p-3 font-mono text-[11px]">
                        {deliveryId}
                    </code>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="primary" disabled={submitting} onClick={replay}>
                        {submitting ? 'Colocando na fila…' : 'Confirmar reenvio'}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}
