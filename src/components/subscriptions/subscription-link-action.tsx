'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';

export interface SubscriptionCheckoutLink {
    id: string;
    name: string;
    url: string;
    /** Planos recorrentes que o checkout vende, já formatados ("Equipe · R$ 149,00/mês"). */
    plans: string[];
}

/**
 * "Gerar link de assinatura": no Astro a assinatura nasce quando o comprador assina pelo checkout
 * e informa o pagamento. Em vez de criar uma assinatura sem forma de pagamento (que ficava
 * incompleta no gateway), o lojista copia o link de um checkout publicado que vende o plano.
 */
export function SubscriptionLinkAction({ checkouts }: { checkouts: SubscriptionCheckoutLink[] }) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    async function copy(url: string) {
        try {
            await navigator.clipboard.writeText(url);
            showToast({ tone: 'success', description: 'Link copiado.' });
        } catch {
            showToast({ tone: 'error', description: 'Não foi possível copiar o link.' });
        }
    }

    return (
        <>
            <Button type="button" variant="primary" onClick={() => setOpen(true)}>
                <Icon name="link" className="size-3.5" />
                Gerar link de assinatura
            </Button>
            <Modal open={open} onClose={close} labelledBy="subscription-link-title">
                <ModalHeader
                    eyebrow="Recorrência"
                    title="Link de assinatura"
                    description="Envie o link do checkout ao cliente. A assinatura começa quando ele escolhe o plano e informa o pagamento."
                    titleId="subscription-link-title"
                    onClose={close}
                />
                <ModalBody>
                    {checkouts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-5 py-8 text-center">
                            <p className="text-[13px] font-semibold">
                                Nenhum checkout publicado vende planos recorrentes
                            </p>
                            <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-5 text-muted">
                                Crie um preço recorrente no produto e publique um checkout com ele
                                para gerar o link.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2.5">
                            {checkouts.map((checkout) => (
                                <li
                                    key={checkout.id}
                                    className="rounded-2xl border border-border bg-surface p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-semibold">
                                                {checkout.name}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">
                                                {checkout.plans.join(' · ')}
                                            </p>
                                        </div>
                                        <a
                                            href={checkout.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Abrir ${checkout.name}`}
                                            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                                        >
                                            <Icon name="expand" className="size-3.5" />
                                        </a>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-muted px-3 py-2 text-[11px]">
                                            {checkout.url}
                                        </code>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => void copy(checkout.url)}
                                            className="h-9 shrink-0 px-3.5"
                                        >
                                            <Icon name="copy" className="size-3.5" />
                                            Copiar
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Link
                        href="/checkouts"
                        className="ui-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-[var(--control-bg)] px-5 text-[13px] font-semibold text-muted hover:text-foreground"
                        data-variant="secondary"
                    >
                        Ir para checkouts
                    </Link>
                </ModalFooter>
            </Modal>
        </>
    );
}

/** Estado vazio da tela: de onde as assinaturas vêm e o atalho para criar um checkout. */
export function SubscriptionsEmptyState() {
    return (
        <section className="grid min-h-[340px] place-items-center rounded-[24px] border border-dashed border-border bg-surface-muted/35 p-8 text-center">
            <div className="max-w-md">
                <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                    <Icon name="repeat" className="size-5" />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold">Nenhuma assinatura ainda</h2>
                <p className="mt-1.5 text-[12px] leading-5 text-muted">
                    As assinaturas aparecem aqui quando um cliente assina pelo checkout. Publique um
                    checkout com um plano recorrente e compartilhe o link.
                </p>
                <Link
                    href="/checkouts"
                    className="ui-button mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-[13px] font-semibold text-brand-contrast"
                    data-variant="primary"
                >
                    <Icon name="plus" className="size-3.5" />
                    Criar checkout
                </Link>
            </div>
        </section>
    );
}
