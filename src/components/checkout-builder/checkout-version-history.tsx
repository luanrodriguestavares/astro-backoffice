'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import type { CheckoutDraft, CheckoutVersion } from '@/lib/api/types';

export function CheckoutVersionHistory({
    checkoutId,
    hasUnsavedChanges,
    onClose,
    onRestored,
}: {
    checkoutId: string;
    hasUnsavedChanges: boolean;
    onClose: () => void;
    onRestored: (draft: CheckoutDraft, version: CheckoutVersion) => void;
}) {
    const [versions, setVersions] = useState<CheckoutVersion[]>([]);
    const [selected, setSelected] = useState<CheckoutVersion>();
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        void fetch(`/api/checkouts/${encodeURIComponent(checkoutId)}/versions`, {
            signal: controller.signal,
        })
            .then(async (response) => {
                const body = (await response.json()) as {
                    data?: CheckoutVersion[];
                    detail?: string;
                };
                if (!response.ok || !body.data)
                    throw new Error(body.detail ?? 'Não foi possível carregar o histórico.');
                setVersions(body.data);
            })
            .catch((reason: unknown) => {
                if (reason instanceof DOMException && reason.name === 'AbortError') return;
                setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o histórico.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [checkoutId]);

    async function restore() {
        if (!selected || restoring) return;
        setRestoring(true);
        setError('');
        const response = await fetch(
            `/api/checkouts/${encodeURIComponent(checkoutId)}/versions/${encodeURIComponent(selected.id)}/restore`,
            { method: 'POST' },
        );
        const body = (await response.json()) as { data?: CheckoutDraft; detail?: string };
        setRestoring(false);
        if (!response.ok || !body.data) {
            setError(body.detail ?? 'Não foi possível restaurar esta versão.');
            return;
        }
        onRestored(body.data, selected);
    }

    return (
        <Modal
            open
            onClose={restoring ? () => undefined : onClose}
            labelledBy="checkout-version-history-title"
            maxWidth="max-w-xl"
        >
            <ModalHeader
                eyebrow="Checkout"
                title="Histórico de versões"
                description="Cada publicação cria uma versão imutável que pode ser restaurada como rascunho."
                titleId="checkout-version-history-title"
                onClose={onClose}
            />
            <ModalBody className="space-y-3">
                {hasUnsavedChanges && (
                    <div className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-[12px] leading-5 text-warning">
                        Existem alterações locais não salvas. Restaurar uma versão substituirá o
                        conteúdo atual do editor.
                    </div>
                )}
                {error && (
                    <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-[12px] text-danger">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="grid min-h-48 place-items-center text-sm text-muted">
                        Carregando histórico...
                    </div>
                ) : versions.length === 0 ? (
                    <div className="grid min-h-48 place-items-center text-center">
                        <div>
                            <Icon name="clock" className="mx-auto size-7 text-brand" />
                            <p className="mt-3 text-sm font-semibold">Nenhuma versão publicada</p>
                            <p className="mt-1 max-w-sm text-[12px] leading-5 text-muted">
                                Salvar atualiza apenas o rascunho. Publique o checkout para criar a
                                primeira versão recuperável.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {versions.map((version) => {
                            const active = selected?.id === version.id;
                            return (
                                <Button
                                    key={version.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setSelected(version)}
                                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? 'border-brand/45 bg-brand-soft/70 shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_8%,transparent)]' : 'border-border bg-[var(--control-bg)] hover:border-brand/25 hover:bg-surface-muted/55'}`}
                                >
                                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}>
                                        {active ? (
                                            <Icon name="check" className="size-4" />
                                        ) : (
                                            <Icon name="clock" className="size-4" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[13px] font-semibold">
                                            Versão {version.versionNumber}
                                        </span>
                                        <span className="mt-1 block text-[11px] text-muted">
                                            Publicada em {dateTime(version.createdAt)}
                                        </span>
                                    </span>
                                    <span className="hidden font-mono text-[10px] text-muted sm:block">
                                        {version.checksum.slice(0, 10)}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button type="button" variant="secondary" disabled={restoring} onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    disabled={!selected || restoring}
                    onClick={() => void restore()}
                >
                    <Icon name="repeat" className="size-3.5" />
                    {restoring ? 'Restaurando...' : 'Restaurar versão'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}

function dateTime(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}
