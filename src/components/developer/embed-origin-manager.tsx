'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';

export type EmbedOriginItem = { id: string; origin: string; createdAt: string };

/**
 * Domínios do app do SaaS que podem usar o checkout transparente: embutir o componente do Astro
 * (iframe) e chamar a API da sessão direto do navegador (headless).
 */
export function EmbedOriginManager({ origins }: { origins: EmbedOriginItem[] }) {
    const router = useRouter();
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);

    async function add(event: FormEvent) {
        event.preventDefault();
        if (!value.trim()) return;
        setBusy(true);
        try {
            const response = await fetch('/api/developer/embed-origins', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ origin: value.trim() }),
            });
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok)
                throw new Error(payload.detail ?? 'Não foi possível autorizar o domínio.');
            setValue('');
            showToast({ tone: 'success', description: 'Domínio autorizado.' });
            router.refresh();
        } catch (error) {
            showToast({
                tone: 'error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Não foi possível autorizar o domínio.',
            });
        } finally {
            setBusy(false);
        }
    }

    async function remove(item: EmbedOriginItem) {
        if (
            !window.confirm(
                `Remover ${item.origin}? Checkouts embutidos nesse app param de carregar imediatamente.`,
            )
        )
            return;
        setBusy(true);
        try {
            const response = await fetch(
                `/api/developer/embed-origins/${encodeURIComponent(item.id)}`,
                { method: 'DELETE' },
            );
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok)
                throw new Error(payload.detail ?? 'Não foi possível remover o domínio.');
            showToast({ tone: 'success', description: 'Domínio removido.' });
            router.refresh();
        } catch (error) {
            showToast({
                tone: 'error',
                description:
                    error instanceof Error ? error.message : 'Não foi possível remover o domínio.',
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="space-y-4" data-tour="developer-embed-origins">
            <div>
                <h2 className="text-[16px] font-semibold text-foreground">
                    Domínios do app (checkout transparente)
                </h2>
                <p className="mt-1 max-w-3xl text-[12px] leading-5 text-muted">
                    Para vender dentro do seu produto, autorize o endereço do seu app. Só esses
                    domínios podem embutir o checkout do Astro e usar a sessão de pagamento direto
                    do navegador. Use a origem exata, sem caminho: https://app.suaempresa.com.
                </p>
            </div>
            <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
                <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="https://app.suaempresa.com"
                    aria-label="Domínio do app"
                    inputMode="url"
                    className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 text-[13px] outline-none transition focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)] sm:max-w-md"
                />
                <Button type="submit" variant="primary" disabled={busy || !value.trim()}>
                    Autorizar domínio
                </Button>
            </form>
            {origins.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-[12px] text-muted">
                    Nenhum domínio autorizado. Sem ele, sessões criadas com{' '}
                    <code>uiMode: &quot;embedded&quot;</code> ou <code>&quot;custom&quot;</code> são
                    recusadas.
                </p>
            ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                    {origins.map((item) => (
                        <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                            <span className="flex min-w-0 items-center gap-2.5">
                                <Icon name="link" className="size-4 shrink-0 text-muted" />
                                <code className="truncate text-[13px] text-foreground">
                                    {item.origin}
                                </code>
                            </span>
                            <Button
                                type="button"
                                variant="danger"
                                disabled={busy}
                                onClick={() => void remove(item)}
                            >
                                Remover
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
