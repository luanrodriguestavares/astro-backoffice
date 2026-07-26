'use client';

import { Button } from '@/components/ui/button';

import '@puckeditor/core/puck.css';

import { Puck } from '@puckeditor/core';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { checkoutBuilderConfig, type BuilderData } from '@/components/checkout-builder/config';
import { CheckoutSelectField } from '@/components/checkout-builder/checkout-select-field';
import { Icon, type IconName } from '@/components/ui/icon';
import { documentToPuck, puckToDocument } from '@/lib/checkout/puck-data';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
import type { Checkout, CheckoutDocument, CheckoutDraft } from '@/lib/api/types';

const checkoutEditorPlugins = [
    {
        name: 'legacy-side-bar',
        render: () => (
            <div className="checkout-components-panel">
                <Puck.Components />
            </div>
        ),
    },
];

const componentIcons: Record<string, IconName> = {
    hero: 'bolt',
    logo: 'image',
    banner: 'image',
    text: 'code',
    image: 'image',
    video: 'play',
    benefits: 'check',
    testimonials: 'users',
    faq: 'code',
    guarantee: 'check',
    countdown: 'clock',
    product_summary: 'cart',
    checkout_form: 'user',
    order_summary: 'cart',
    coupon_field: 'tag',
    payment_methods: 'card',
    card_payment: 'card',
    pix_payment: 'bolt',
    boleto_payment: 'card',
    shipping_address: 'home',
    shipping_methods: 'link',
    security_badges: 'check',
    grid: 'layout',
    footer: 'layout',
};

function CheckoutDrawerItem({ children, name }: { children: React.ReactNode; name: string }) {
    const unavailable = name === 'shipping_address' || name === 'shipping_methods';
    return (
        <div
            className="checkout-drawer-item"
            data-unavailable={unavailable}
            aria-disabled={unavailable}
            onPointerDownCapture={
                unavailable
                    ? (event) => {
                          event.preventDefault();
                          event.stopPropagation();
                      }
                    : undefined
            }
            onDragStartCapture={
                unavailable
                    ? (event) => {
                          event.preventDefault();
                          event.stopPropagation();
                      }
                    : undefined
            }
        >
            <span className="checkout-drawer-item-icon">
                <Icon name={componentIcons[name] ?? 'box'} className="size-4" />
            </span>
            <div className="checkout-drawer-item-content">{children}</div>
            {unavailable && <span className="checkout-drawer-item-badge">Em breve</span>}
        </div>
    );
}

export function CheckoutEditor({ checkout, draft }: { checkout: Checkout; draft: CheckoutDraft }) {
    const publicUrl = checkoutPublicUrl(checkout.slug);
    const [initialData] = useState<BuilderData>(() => documentToPuck(draft.document));
    const current = useRef<BuilderData>(initialData);
    const revision = useRef(draft.revision);
    const document = useRef<CheckoutDocument>(draft.document);
    const saving = useRef(false);
    const [state, setState] = useState<'saved' | 'changed' | 'saving' | 'published' | 'error'>(
        'saved',
    );
    const [message, setMessage] = useState<string>();

    async function save(data: BuilderData = current.current) {
        if (saving.current) return false;
        saving.current = true;
        setState('saving');
        setMessage(undefined);
        const nextDocument = puckToDocument(data, document.current);
        const response = await fetch(`/api/checkouts/${checkout.id}/draft`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ document: nextDocument, revision: revision.current }),
        });
        const body = (await response.json()) as { data?: CheckoutDraft; detail?: string };
        saving.current = false;
        if (!response.ok || !body.data) {
            setState('error');
            setMessage(body.detail ?? 'Não foi possível salvar o rascunho.');
            return false;
        }
        revision.current = body.data.revision;
        document.current = body.data.document;
        setState('saved');
        setMessage('Rascunho salvo.');
        return true;
    }

    async function publish(data: BuilderData) {
        current.current = data as BuilderData;
        if (!(await save(data))) return;
        setState('saving');
        setMessage('Validando e publicando...');
        const response = await fetch(`/api/checkouts/${checkout.id}/publish`, { method: 'POST' });
        const body = (await response.json()) as { code?: string; detail?: string };
        if (!response.ok) {
            setState('error');
            setMessage(publishErrorMessage(body.code, body.detail));
            return;
        }
        setState('published');
        setMessage('Checkout publicado com sucesso.');
    }

    async function openPreview() {
        const width = Math.min(1440, Math.max(900, window.screen.availWidth - 120));
        const height = Math.min(1000, Math.max(700, window.screen.availHeight - 120));
        const preview = window.open(
            'about:blank',
            `checkout-preview-${checkout.id}`,
            `popup=yes,width=${width},height=${height},resizable=yes,scrollbars=yes`,
        );
        if (!preview) {
            setState('error');
            setMessage('Permita pop-ups para abrir o preview.');
            return;
        }
        preview.document.title = 'Preparando preview...';
        preview.document.body.innerHTML =
            '<p style="font:14px system-ui;padding:24px;color:#656579">Preparando preview do checkout...</p>';
        if (!(await save())) {
            preview.close();
            return;
        }
        preview.location.href = `/checkouts/${checkout.id}/preview`;
    }

    return (
        <div className="astro-checkout-editor min-h-screen overflow-hidden bg-[#f7f7fa]">
            <Puck
                config={checkoutBuilderConfig}
                data={initialData}
                height="100dvh"
                overrides={{
                    fieldTypes: { select: CheckoutSelectField },
                    drawerItem: CheckoutDrawerItem,
                }}
                plugins={checkoutEditorPlugins}
                ui={{ plugin: { current: 'legacy-side-bar' } }}
                viewports={[
                    { width: 390, height: 'auto', label: 'Celular', icon: 'Smartphone' },
                    { width: 768, height: 'auto', label: 'Tablet', icon: 'Tablet' },
                    { width: 1440, height: 'auto', label: 'Desktop', icon: 'Monitor' },
                ]}
                iframe={{ enabled: true, syncHostStyles: false }}
                onChange={(data) => {
                    current.current = data as BuilderData;
                    setState('changed');
                    setMessage(undefined);
                }}
                onPublish={publish}
                renderHeader={({ children }) => (
                    <header className="checkout-editor-header">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link
                                href="/checkouts"
                                aria-label="Voltar para checkouts"
                                className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#e6e4ee] bg-white/75 text-muted transition hover:border-brand/20 hover:bg-brand-soft hover:text-brand-strong"
                            >
                                <Icon name="arrow-right" className="size-3.5 rotate-180" />
                            </Link>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                                    {checkout.name}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <p className="truncate text-[10px] text-muted">
                                        /{checkout.slug}
                                    </p>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${state === 'error' ? 'bg-[#fff2f4] text-danger' : state === 'published' ? 'bg-[#e8f7f1] text-success' : 'bg-surface-muted text-muted'}`}
                                    >
                                        {statusLabel(state)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {message && (
                            <span className="hidden max-w-64 truncate text-[11px] text-muted xl:block">
                                {message}
                            </span>
                        )}
                        <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
                    </header>
                )}
                renderHeaderActions={() => (
                    <>
                        {(checkout.status === 'published' || state === 'published') && (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="hidden h-9 rounded-xl px-3 text-[11px] md:inline-flex"
                                    onClick={() => {
                                        void navigator.clipboard.writeText(publicUrl);
                                        setMessage('Link público copiado.');
                                    }}
                                >
                                    <Icon name="link" className="size-3.5" /> Copiar link
                                </Button>
                                <a
                                    href={publicUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e2e0eb] bg-white px-3 text-[11px] font-semibold text-foreground transition hover:border-brand/25 hover:bg-brand-soft hover:text-brand-strong"
                                >
                                    Abrir checkout{' '}
                                    <Icon name="arrow-right" className="size-3.5 -rotate-45" />
                                </a>
                            </>
                        )}
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9 rounded-xl px-3 text-[11px]"
                            disabled={state === 'saving'}
                            onClick={() => void openPreview()}
                        >
                            <Icon name="layout" className="size-3.5" /> Preview
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="hidden h-9 rounded-xl px-3 text-[11px] sm:inline-flex"
                            disabled={state === 'saving'}
                            onClick={() => void save()}
                        >
                            Salvar
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            className="h-9 rounded-xl px-3.5 text-[11px]"
                            disabled={state === 'saving'}
                            onClick={() => void publish(current.current)}
                        >
                            Publicar
                        </Button>
                    </>
                )}
            />
            {state === 'error' && message && (
                <aside
                    role="alert"
                    aria-live="assertive"
                    className="fixed right-4 top-[76px] z-[1000] w-[min(420px,calc(100vw-32px))] rounded-2xl border border-[#f3ccd3] bg-white p-4 shadow-[0_22px_70px_rgba(89,32,45,.18)]"
                >
                    <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0f2] text-danger">
                            <Icon name="close" className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[13px] font-semibold text-foreground">
                                Não foi possível publicar
                            </h2>
                            <p className="mt-1.5 text-[12px] leading-5 text-muted">{message}</p>
                        </div>
                        <Button
                            type="button"
                            aria-label="Fechar aviso"
                            onClick={() => {
                                setState('changed');
                                setMessage(undefined);
                            }}
                            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                        >
                            <Icon name="close" className="size-3" />
                        </Button>
                    </div>
                </aside>
            )}
        </div>
    );
}

function statusLabel(state: 'saved' | 'changed' | 'saving' | 'published' | 'error') {
    return {
        saved: 'Salvo',
        changed: 'Alterações não salvas',
        saving: 'Salvando...',
        published: 'Publicado',
        error: 'Erro',
    }[state];
}

const componentLabels: Record<string, string> = {
    product_summary: 'Itens do carrinho',
    checkout_form: 'Dados pessoais',
    order_summary: 'Resumo do pedido',
    payment_methods: 'Formas de pagamento',
};

function publishErrorMessage(code?: string, detail?: string) {
    if (code === 'CHECKOUT_RUNTIME_COMPONENTS_MISSING') {
        const missing =
            detail
                ?.split(':')[1]
                ?.replace('.', '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean) ?? [];
        const labels = missing.map((item) => componentLabels[item] ?? item);
        return `Adicione ${joinLabels(labels)} pela categoria Checkout na barra lateral. Esses blocos são necessários para concluir uma compra e podem ficar dentro ou fora de um grid.`;
    }
    if (code === 'CHECKOUT_PAYMENT_CONFIGURATION_INVALID')
        return 'Nenhum gateway ativo atende às formas de pagamento selecionadas. Configure um gateway compatível ou desative os métodos indisponíveis em Formas de pagamento.';
    if (code === 'CHECKOUT_NOT_PUBLISHABLE')
        return 'Todos os produtos e preços deste checkout precisam estar ativos antes da publicação.';
    return detail ?? 'Revise a configuração do checkout e tente publicar novamente.';
}

function joinLabels(labels: string[]) {
    if (labels.length === 0) return 'os componentes obrigatórios';
    if (labels.length === 1) return `“${labels[0]}”`;
    return `${labels
        .slice(0, -1)
        .map((label) => `“${label}”`)
        .join(', ')} e “${labels.at(-1)}”`;
}
