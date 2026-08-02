'use client';

import { Button, ButtonLink, buttonClassName } from '@/components/ui/button';

import '@puckeditor/core/puck.css';

import { Puck } from '@puckeditor/core';
import { useRef, useState } from 'react';

import {
    CheckoutBuilderMediaContext,
    checkoutBuilderConfig,
    type BuilderData,
} from '@/components/checkout-builder/config';
import { CheckoutSelectField } from '@/components/checkout-builder/checkout-select-field';
import { PaymentGatewaySettings } from '@/components/checkout-builder/payment-gateway-settings';
import { Icon, type IconName } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import { documentToPuck, puckToDocument } from '@/lib/checkout/puck-data';
import {
    checkoutReadinessIssues,
    enabledPaymentMethods,
    presentRequiredComponents,
    type RequiredCheckoutComponent,
} from '@/lib/checkout/gateway-bindings';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
import type {
    Checkout,
    CheckoutDocument,
    CheckoutDraft,
    CheckoutEnvironment,
    CheckoutPaymentMethod,
    GatewayConnection,
    MediaFile,
} from '@/lib/api/types';

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
    plan_comparison: 'layout',
    data_table: 'layout',
    stats: 'bolt',
    before_after: 'layout',
    client_logos: 'users',
    floating_cta: 'bolt',
    spacer_divider: 'layout',
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

export function CheckoutEditor({
    checkout,
    draft,
    gatewayConnections,
    mediaFiles,
    mediaApiUrl,
}: {
    checkout: Checkout;
    draft: CheckoutDraft;
    gatewayConnections: GatewayConnection[];
    mediaFiles: MediaFile[];
    mediaApiUrl: string;
}) {
    const publicUrl = checkoutPublicUrl(checkout.slug);
    const [initialData] = useState<BuilderData>(() => documentToPuck(draft.document));
    const current = useRef<BuilderData>(initialData);
    const revision = useRef(draft.revision);
    const document = useRef<CheckoutDocument>(draft.document);
    const saving = useRef(false);
    const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(false);
    const [environment, setEnvironment] = useState<CheckoutEnvironment>(
        draft.document.settings.environment ?? 'sandbox',
    );
    const [bindings, setBindings] = useState<Partial<Record<CheckoutPaymentMethod, string>>>(
        draft.document.settings.paymentGatewayBindings ?? {},
    );
    const [enabledMethods, setEnabledMethods] = useState<CheckoutPaymentMethod[]>(() =>
        enabledPaymentMethods(initialData.content),
    );
    const [builderContent, setBuilderContent] = useState(initialData.content);
    const [presentComponents, setPresentComponents] = useState<RequiredCheckoutComponent[]>(() =>
        presentRequiredComponents(initialData.content),
    );
    const readinessIssues = checkoutReadinessIssues({
        content: builderContent,
        environment,
        bindings,
        connections: gatewayConnections,
    });
    const [state, setState] = useState<'saved' | 'changed' | 'saving' | 'published' | 'error'>(
        'saved',
    );

    async function save(data: BuilderData = current.current, notify = true) {
        if (saving.current) return false;
        saving.current = true;
        setState('saving');
        const nextDocument = puckToDocument(data, document.current);
        nextDocument.settings = {
            ...nextDocument.settings,
            environment,
            paymentGatewayBindings: bindings,
        };
        const response = await fetch(`/api/checkouts/${checkout.id}/draft`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ document: nextDocument, revision: revision.current }),
        });
        const body = (await response.json()) as { data?: CheckoutDraft; detail?: string };
        saving.current = false;
        if (!response.ok || !body.data) {
            setState('error');
            showToast({
                tone: 'error',
                title: 'Falha ao salvar',
                description: body.detail ?? 'Não foi possível salvar o rascunho.',
            });
            return false;
        }
        revision.current = body.data.revision;
        document.current = body.data.document;
        setState('saved');
        if (notify)
            showToast({
                tone: 'success',
                title: 'Rascunho salvo',
                description: 'As alterações do checkout foram salvas.',
            });
        return true;
    }

    function changeEnvironment(next: CheckoutEnvironment) {
        setEnvironment(next);
        setBindings({});
        setState('changed');
    }

    function changeBinding(method: CheckoutPaymentMethod, connectionId: string | undefined) {
        setBindings((currentBindings) => {
            const next = { ...currentBindings };
            if (connectionId === undefined) delete next[method];
            else next[method] = connectionId;
            return next;
        });
        setState('changed');
    }

    async function publish(data: BuilderData) {
        current.current = data as BuilderData;
        const issues = checkoutReadinessIssues({
            content: data.content,
            environment,
            bindings,
            connections: gatewayConnections,
        });
        if (issues.length > 0) {
            setPaymentSettingsOpen(true);
            showToast({
                tone: 'warning',
                title: 'Checkout ainda não está pronto',
                description:
                    'Confira os componentes obrigatórios e o processamento de pagamentos antes de publicar.',
                duration: 7_000,
            });
            return;
        }
        if (!(await save(data, false))) return;
        setState('saving');
        const response = await fetch(`/api/checkouts/${checkout.id}/publish`, { method: 'POST' });
        const body = (await response.json()) as { code?: string; detail?: string };
        if (!response.ok) {
            if (isReadinessError(body.code)) setPaymentSettingsOpen(true);
            setState('error');
            showToast({
                tone: 'error',
                title: 'Não foi possível publicar',
                description: publishErrorMessage(body.code, body.detail),
                duration: 7_000,
            });
            return;
        }
        setState('published');
        showToast({
            tone: 'success',
            title: 'Checkout publicado',
            description: 'A versão pública já está disponível para seus clientes.',
        });
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
            showToast({
                tone: 'warning',
                title: 'Preview bloqueado',
                description: 'Permita pop-ups no navegador para abrir o preview.',
            });
            return;
        }
        preview.document.title = 'Preparando preview...';
        preview.document.body.innerHTML =
            '<p style="font:14px system-ui;padding:24px;color:#656579">Preparando preview do checkout...</p>';
        if (!(await save(current.current, false))) {
            preview.close();
            return;
        }
        preview.location.href = `/checkouts/${checkout.id}/preview`;
    }

    return (
        <div className="astro-checkout-editor min-h-screen overflow-hidden bg-background">
            <CheckoutBuilderMediaContext.Provider
                value={{ files: mediaFiles, apiUrl: mediaApiUrl }}
            >
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
                        setBuilderContent(data.content);
                        setEnabledMethods(enabledPaymentMethods(data.content));
                        setPresentComponents(presentRequiredComponents(data.content));
                        setState('changed');
                    }}
                    onPublish={publish}
                    renderHeader={({ children }) => (
                        <header className="checkout-editor-header">
                            <div className="flex min-w-0 items-center gap-3">
                                <ButtonLink
                                    href="/checkouts"
                                    variant="icon"
                                    aria-label="Voltar para checkouts"
                                    className="size-9 shrink-0 rounded-xl"
                                >
                                    <Icon name="arrow-right" className="size-3.5 rotate-180" />
                                </ButtonLink>
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
                            <div className="ml-auto flex shrink-0 items-center gap-2">
                                {children}
                            </div>
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
                                            showToast({
                                                tone: 'success',
                                                title: 'Link copiado',
                                                description:
                                                    'O link público do checkout foi copiado.',
                                            });
                                        }}
                                    >
                                        <Icon name="link" className="size-3.5" /> Copiar link
                                    </Button>
                                    <a
                                        href={publicUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={buttonClassName(
                                            'secondary',
                                            'h-9 rounded-xl px-3 text-[11px]',
                                        )}
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
                                onClick={() => setPaymentSettingsOpen(true)}
                            >
                                <Icon
                                    name={readinessIssues.length === 0 ? 'check' : 'bolt'}
                                    className="size-3.5"
                                />
                                Prontidão
                                {readinessIssues.length > 0 && (
                                    <span className="grid min-w-5 place-items-center rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold text-warning">
                                        {readinessIssues.length}
                                    </span>
                                )}
                            </Button>
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
            </CheckoutBuilderMediaContext.Provider>
            <PaymentGatewaySettings
                open={paymentSettingsOpen}
                environment={environment}
                bindings={bindings}
                enabledMethods={enabledMethods}
                presentComponents={presentComponents}
                connections={gatewayConnections}
                onEnvironmentChange={changeEnvironment}
                onBindingChange={changeBinding}
                onClose={() => setPaymentSettingsOpen(false)}
            />
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
    if (code === 'CHECKOUT_GATEWAY_BINDING_REQUIRED')
        return 'Escolha uma conexão para cada forma de pagamento habilitada antes de publicar em produção.';
    if (code === 'CHECKOUT_GATEWAY_BINDING_UNAVAILABLE')
        return 'Uma conexão selecionada não está ativa neste ambiente. Escolha outra conexão na central de prontidão.';
    if (code === 'CHECKOUT_GATEWAY_BINDING_INCOMPATIBLE')
        return 'Uma conexão selecionada não suporta o método ou a moeda deste checkout.';
    if (code === 'PRODUCTION_GATEWAY_NOT_VERIFIED')
        return 'Teste a conexão na área Gateways antes de publicar. O último teste precisa estar válido e recente.';
    if (code === 'PRODUCTION_GATEWAY_CAPABILITIES_STALE')
        return 'As capacidades do gateway estão desatualizadas. Execute um novo teste da conexão.';
    if (code === 'PRODUCTION_GATEWAY_WEBHOOK_SECRET_REQUIRED')
        return 'Configure o segredo de webhook desta conexão antes de receber pagamentos reais.';
    if (code === 'PRODUCTION_MOCK_GATEWAY_FORBIDDEN')
        return 'O gateway de testes não pode ser usado em produção. Selecione uma conexão real.';
    if (code === 'PRODUCTION_PHYSICAL_PRODUCT_UNSUPPORTED')
        return 'Produtos físicos e frete ainda não fazem parte da V1 de produção.';
    if (code === 'CHECKOUT_NOT_PUBLISHABLE')
        return 'Todos os produtos e preços deste checkout precisam estar ativos antes da publicação.';
    return detail ?? 'Revise a configuração do checkout e tente publicar novamente.';
}

function isReadinessError(code?: string) {
    return (
        code === 'CHECKOUT_RUNTIME_COMPONENTS_MISSING' ||
        code === 'CHECKOUT_PAYMENT_CONFIGURATION_INVALID' ||
        code?.startsWith('CHECKOUT_GATEWAY_') === true ||
        code?.startsWith('PRODUCTION_GATEWAY_') === true ||
        code === 'PRODUCTION_MOCK_GATEWAY_FORBIDDEN'
    );
}

function joinLabels(labels: string[]) {
    if (labels.length === 0) return 'os componentes obrigatórios';
    if (labels.length === 1) return `“${labels[0]}”`;
    return `${labels
        .slice(0, -1)
        .map((label) => `“${label}”`)
        .join(', ')} e “${labels.at(-1)}”`;
}
