'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import type { CheckoutDocument, FlowGraph } from '@/lib/api/types';
import { checkoutAssistantTask } from '@/lib/ai/assistant-routing';

import {
    AiChat,
    aiRequest,
    AppliedCard,
    ResultActions,
    useAiApplied,
    type AiReply,
} from './ai-chat';
import { FlowResult, type FlowGeneration } from './flow-ai-chat';

export interface CheckoutAiPrice {
    priceId: string;
    priceName: string;
    amountMinor: number;
    currency: string;
    pricingType: string;
    recurringInterval?: string | null;
}

interface CheckoutGeneration {
    id: string;
    status: 'succeeded' | 'invalid';
    reply: string;
    /** Nulos quando a IA só respondeu, sem checkout novo. */
    document: CheckoutDocument | null;
    quality: { score: number; issues: { severity: string; message: string }[] } | null;
    adjustments: string[];
    /** Diferenças reais em relação à versão anterior, calculadas pelo Astro. */
    changes?: string[];
    credits: { charged: number; remaining: number | null };
}

interface Brand {
    accentColor: string;
    logoUrl: string;
    bannerUrl: string;
    guaranteeDays: string;
}

const suggestions = [
    'Curso online para iniciantes, público no celular vindo do Instagram. Visual acolhedor e direto.',
    'Mentoria de alto valor para empresários. Visual sóbrio e premium, com FAQ de objeções.',
    'Ebook barato com Pix na hora. Checkout enxuto, uma coluna, sem distrações.',
    'Assinatura de software para pequenas empresas. Visual moderno, transmitir confiança.',
] as const;

const loadingSteps = [
    'Entendendo o pedido e a tela atual…',
    'Escolhendo o agente certo…',
    'Montando a alteração…',
    'Validando antes de aplicar…',
] as const;

const workspaceSuggestions = [
    suggestions[0],
    suggestions[1],
    'Pix na AbacatePay; cartão e boleto no Mercado Pago.',
    'No sucesso envie e-mail ao cliente e chame o webhook; no erro avise a equipe.',
] as const;

const areaLabels: Record<string, string> = {
    logo: 'Logo',
    banner: 'Banner',
    hero: 'Abertura',
    heading_text: 'Título',
    paragraph_text: 'Texto',
    text: 'Texto',
    image: 'Imagem',
    video: 'Vídeo',
    benefits: 'Benefícios',
    testimonials: 'Depoimentos',
    faq: 'Perguntas',
    guarantee: 'Garantia',
    countdown: 'Contagem',
    plan_comparison: 'Planos',
    data_table: 'Tabela',
    before_after: 'Antes e depois',
    floating_cta: 'Botão fixo',
    spacer_divider: 'Divisória',
    product_summary: 'Resumo',
    checkout_form: 'Dados',
    payment_methods: 'Pagamento',
    coupon_field: 'Cupom',
    security_badges: 'Selos',
    footer: 'Rodapé',
};

/** Chat da criação de checkout: descreve a oferta e cria o checkout com o resultado. */
export function CheckoutAiChat({
    productName,
    prices,
    creating,
    onCreate,
    compact = false,
    actionLabel = 'Criar checkout com este',
    confirmText,
    storageKey,
    onApplyPaymentFlow,
}: {
    storageKey?: string;
    productName: string;
    prices: CheckoutAiPrice[];
    creating: boolean;
    onCreate(document: CheckoutDocument, generationId: string): void;
    compact?: boolean;
    actionLabel?: string;
    /** Pede confirmação no cartão antes de aplicar (substitui a página existente). */
    confirmText?: string;
    /** No workspace, permite encaminhar pedidos operacionais ao orquestrador de pagamento. */
    onApplyPaymentFlow?: (graph: FlowGraph) => void;
}) {
    const [brand, setBrand] = useState<Brand>({
        accentColor: '',
        logoUrl: '',
        bannerUrl: '',
        guaranteeDays: '',
    });
    const [brandOpen, setBrandOpen] = useState(false);
    const filled = Object.values(brand).filter((value) => value.trim() !== '').length;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className={`ai-brand-bar shrink-0 border-b border-border ${compact ? 'px-5 py-2.5' : 'px-6 py-3'}`}>
                <div className="mx-auto max-w-[760px]">
                    <button
                        type="button"
                        onClick={() => setBrandOpen((open) => !open)}
                        aria-expanded={brandOpen}
                        className="ai-brand-toggle flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[12.5px] -mx-2"
                    >
                        <span className="ai-brand-icon grid size-7 shrink-0 place-items-center rounded-lg">
                            <Icon name="image" className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-semibold leading-4">Marca e imagens</span>
                            <span className="block truncate text-[11.5px] leading-4 text-muted">
                                {filled > 0
                                    ? `${String(filled)} de 4 preenchidos`
                                    : 'Opcional · cor, logo, banner e garantia'}
                            </span>
                        </span>
                        <Icon
                            name="chevron-down"
                            className={`size-4 text-muted transition ${brandOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {brandOpen && (
                        <div className={`ai-fade-in mt-3 grid gap-2.5 pb-1 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
                            <BrandField
                                label="Cor da marca"
                                placeholder="#c2185b"
                                value={brand.accentColor}
                                onChange={(accentColor) => setBrand({ ...brand, accentColor })}
                                swatch
                            />
                            <BrandField
                                label="Dias de garantia"
                                placeholder="7"
                                value={brand.guaranteeDays}
                                onChange={(guaranteeDays) =>
                                    setBrand({ ...brand, guaranteeDays: guaranteeDays.replace(/\D/g, '') })
                                }
                            />
                            <BrandField
                                label="URL do logo (https)"
                                placeholder="https://…/logo.png"
                                value={brand.logoUrl}
                                onChange={(logoUrl) => setBrand({ ...brand, logoUrl })}
                            />
                            <BrandField
                                label="URL do banner (https)"
                                placeholder="https://…/banner.jpg"
                                value={brand.bannerUrl}
                                onChange={(bannerUrl) => setBrand({ ...brand, bannerUrl })}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <AiChat<CheckoutGeneration | FlowGeneration>
                    task="checkout"
                    {...(onApplyPaymentFlow
                        ? { taskForRequest: checkoutAssistantTask }
                        : {})}
                    title={
                        onApplyPaymentFlow
                            ? `O que você quer ajustar em ${productName}?`
                            : `Descreva o checkout de ${productName}`
                    }
                    subtitle={
                        onApplyPaymentFlow
                            ? 'Posso editar a página ou montar a orquestração de pagamento. Identifico o destino pelo pedido e mostro a alteração antes de aplicar.'
                            : 'Conte para quem você vende, de onde vem o tráfego e o clima da marca. A IA monta estrutura, cores, tipografia e textos com os blocos do editor; você revisa e ajusta tudo depois.'
                    }
                    placeholder={
                        compact
                            ? 'Descreva a oferta, o público e o estilo…'
                            : 'Ex.: curso de confeitaria para iniciantes, tráfego do Instagram, visual acolhedor.'
                    }
                    suggestions={onApplyPaymentFlow ? workspaceSuggestions : suggestions}
                    loadingSteps={loadingSteps}
                    maxLength={2000}
                    compact={compact}
                    {...(storageKey ? { storageKey } : {})}
                    generate={async (
                        request,
                        previousGenerationId,
                        conversation,
                    ): Promise<AiReply<CheckoutGeneration | FlowGeneration>> => {
                        if (
                            onApplyPaymentFlow &&
                            checkoutAssistantTask(request) === 'payment_flow'
                        ) {
                            const result = await aiRequest<FlowGeneration>(
                                '/api/ai/payment-flow-generations',
                                {
                                    request,
                                    conversation,
                                    ...(previousGenerationId ? { previousGenerationId } : {}),
                                },
                            );
                            return {
                                id: result.id,
                                text: result.reply,
                                hasResult: result.graph !== null,
                                result,
                                remaining: result.credits.remaining,
                                task: 'payment_flow',
                            };
                        }
                        const result = await aiRequest<CheckoutGeneration>(
                            '/api/ai/checkout-generations',
                            {
                                ...buildInput(request, productName, prices, brand),
                                conversation,
                                ...(previousGenerationId ? { previousGenerationId } : {}),
                            },
                        );
                        return {
                            id: result.id,
                            text: result.reply,
                            hasResult: result.document !== null,
                            result,
                            remaining: result.credits.remaining,
                            task: 'checkout',
                        };
                    }}
                    renderResult={(result, _reply, latest) =>
                        'graph' in result ? (
                            result.graph && onApplyPaymentFlow ? (
                                <FlowResult
                                    result={result}
                                    graph={result.graph}
                                    latest={latest}
                                    onApply={onApplyPaymentFlow}
                                />
                            ) : null
                        ) : (
                            <CheckoutResult
                                result={result}
                                latest={latest}
                                creating={creating}
                                actionLabel={actionLabel}
                                {...(confirmText ? { confirmText } : {})}
                                onCreate={() => {
                                    if (result.document) onCreate(result.document, result.id);
                                }}
                            />
                        )
                    }
                />
            </div>
        </div>
    );
}

function buildInput(request: string, productName: string, prices: CheckoutAiPrice[], brand: Brand) {
    const https = (value: string) => (/^https:\/\/\S+$/i.test(value.trim()) ? value.trim() : undefined);
    const accent = /^#[0-9a-f]{6}$/i.test(brand.accentColor.trim()) ? brand.accentColor.trim() : undefined;
    const days = brand.guaranteeDays === '' ? undefined : Number(brand.guaranteeDays);
    const logoUrl = https(brand.logoUrl);
    const bannerUrl = https(brand.bannerUrl);
    return {
        brief: request,
        product: {
            name: productName,
            prices: prices.map((price) => ({
                priceId: price.priceId,
                name: price.priceName,
                amountMinor: price.amountMinor,
                currency: price.currency,
                pricingType: price.pricingType === 'recurring' ? 'recurring' : 'one_time',
                ...(price.recurringInterval
                    ? { recurringInterval: price.recurringInterval }
                    : {}),
            })),
        },
        ...(accent ? { brand: { accentColor: accent } } : {}),
        ...(logoUrl || bannerUrl
            ? {
                  assets: {
                      ...(logoUrl ? { logoUrl } : {}),
                      ...(bannerUrl ? { bannerUrl } : {}),
                  },
              }
            : {}),
        ...(days !== undefined && days <= 365 ? { guaranteeDays: days } : {}),
    };
}

function BrandField({
    label,
    placeholder,
    value,
    onChange,
    swatch = false,
}: {
    label: string;
    placeholder: string;
    value: string;
    onChange(value: string): void;
    swatch?: boolean;
}) {
    const valid = /^#[0-9a-f]{6}$/i.test(value.trim());
    return (
        <label className="grid gap-1 text-[11.5px] text-muted">
            {label}
            <span className="ai-field flex h-9 items-center gap-2 rounded-xl border border-border bg-[var(--control-bg)] px-3 transition">
                {swatch && (
                    <span
                        className="size-4 shrink-0 rounded-md border border-border"
                        style={{ background: valid ? value.trim() : 'transparent' }}
                    />
                )}
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted"
                />
            </span>
        </label>
    );
}

function CheckoutResult({
    result,
    latest,
    creating,
    actionLabel,
    confirmText,
    onCreate,
}: {
    result: CheckoutGeneration;
    latest: boolean;
    creating: boolean;
    actionLabel: string;
    confirmText?: string;
    onCreate(): void;
}) {
    const [showAdjustments, setShowAdjustments] = useState(false);
    const applied = useAiApplied(result.id);
    if (!result.document || !result.quality) return null;
    const theme = result.document.theme as Record<string, string | undefined>;
    const outline = outlineOf(result.document);
    // No workspace (com confirmação) o cartão vira o resumo; na criação, o editor abre em seguida.
    if (applied && confirmText) {
        const blocks = outline.reduce((total, area) => total + area.blocks.length, 0);
        return (
            <AppliedCard
                title="Proposta aplicada na página"
                items={[
                    { icon: 'layers', label: `${String(blocks)} blocos na página` },
                    {
                        icon: 'type',
                        label: `Tipografia ${fontLabel(theme.headingFontFamily, theme.fontFamily)}`,
                    },
                    { icon: 'check-circle', label: `Qualidade ${String(result.quality.score)}` },
                ]}
                actionLabel="Ver na página"
            />
        );
    }
    const errors = result.quality.issues.filter((issue) => issue.severity === 'error');
    const score = result.quality.score;
    return (
        <article className="ai-result @container overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-start justify-between gap-4 px-4 pt-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Proposta de checkout
                </p>
                <span
                    title="Nota do verificador de design (contraste, blocos obrigatórios, organização)"
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${score >= 90 ? 'bg-[color-mix(in_srgb,var(--success,#1f9d55)_14%,transparent)] text-[var(--success,#1f9d55)]' : score >= 70 ? 'bg-surface-muted text-foreground' : 'bg-[#fff0f2] text-danger'}`}
                >
                    Qualidade {score}
                </span>
            </div>

            {result.changes && result.changes.length > 0 && (
                <div className="mx-4 mt-3 rounded-xl border border-border px-3.5 py-2.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                        O que mudou
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-[12px] leading-[18px]">
                        {result.changes.map((change) => (
                            <li key={change} className="flex gap-1.5">
                                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-foreground/50" />
                                {change}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="mx-4 mt-3 grid gap-3 @[520px]:grid-cols-[auto_1fr]">
                <div
                    className="flex h-[112px] w-full flex-col justify-between rounded-xl border border-border p-3 @[520px]:h-[132px] @[520px]:w-[168px]"
                    style={{ background: theme.backgroundColor }}
                >
                    <div
                        className="rounded-lg p-2.5 shadow-sm"
                        style={{ background: theme.surfaceColor, color: theme.textColor }}
                    >
                        <p className="text-[12px] font-semibold leading-4">Aa · {fontLabel(theme.headingFontFamily, theme.fontFamily)}</p>
                        <p className="mt-0.5 text-[10px] opacity-70">{fontLabel(theme.fontFamily)}</p>
                    </div>
                    <span
                        className="block rounded-full py-1.5 text-center text-[10.5px] font-semibold"
                        style={{
                            background: theme.accentColor,
                            color: readableOn(theme.accentColor),
                            borderRadius: theme.buttonShape === 'square' ? 6 : 999,
                        }}
                    >
                        Finalizar compra
                    </span>
                </div>
                <div className="grid content-start gap-1.5">
                    {outline.map((area) => (
                        <div key={area.label} className="flex flex-wrap items-center gap-1.5">
                            <span className="w-[70px] shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                                {area.label}
                            </span>
                            {area.blocks.map((block, index) => (
                                <span
                                    key={`${block}-${String(index)}`}
                                    className="rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-[11px]"
                                >
                                    {areaLabels[block] ?? block}
                                </span>
                            ))}
                        </div>
                    ))}
                    <div className="mt-1 flex items-center gap-1.5">
                        {[theme.backgroundColor, theme.surfaceColor, theme.textColor, theme.accentColor].map(
                            (color, index) =>
                                color && (
                                    <span
                                        key={`${color}-${String(index)}`}
                                        title={color}
                                        className="size-4 rounded-full border border-border"
                                        style={{ background: color }}
                                    />
                                ),
                        )}
                    </div>
                </div>
            </div>

            {errors.length > 0 && (
                <div className="mx-4 mt-3 rounded-xl border border-[#f2cbd0] bg-[#fff7f8] px-3.5 py-2.5 text-[12px] leading-5 text-danger dark:bg-[rgb(120_20_40/14%)]">
                    <p className="font-semibold">Revise no editor antes de publicar</p>
                    <ul className="mt-1 list-disc pl-4">
                        {errors.map((issue) => (
                            <li key={issue.message}>{issue.message}</li>
                        ))}
                    </ul>
                </div>
            )}
            {result.adjustments.length > 0 && (
                <div className="mx-4 mt-3">
                    <button
                        type="button"
                        onClick={() => setShowAdjustments((open) => !open)}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground"
                    >
                        <Icon
                            name="chevron-down"
                            className={`size-3 transition ${showAdjustments ? 'rotate-180' : ''}`}
                        />
                        {result.adjustments.length} ajuste(s) feitos pelo Astro
                    </button>
                    {showAdjustments && (
                        <ul className="ai-fade-in mt-1.5 list-disc space-y-0.5 pl-5 text-[11.5px] leading-5 text-muted">
                            {result.adjustments.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <ResultActions
                note={
                    confirmText
                        ? 'Fica como alteração não salva no editor · peça ajustes aqui antes, se quiser'
                        : 'Abre no editor como rascunho · peça ajustes aqui antes, se quiser'
                }
                label={actionLabel}
                {...(confirmText ? { confirmText, doneLabel: 'Aplicado' } : {})}
                disabled={!latest}
                busy={creating}
                generationId={result.id}
                onConfirm={onCreate}
            />
        </article>
    );
}

type Block = { type: string; props?: Record<string, unknown> };

/** Estrutura por área: topo, coluna principal, lateral e rodapé (como a IA montou). */
function outlineOf(document: CheckoutDocument) {
    const sections = document.sections as Block[];
    const gridIndex = sections.findIndex((section) => section.type === 'grid');
    const grid = gridIndex >= 0 ? sections[gridIndex] : undefined;
    const column = (name: string) =>
        ((grid?.props?.[name] as Block[] | undefined) ?? [])
            .filter((block) => !(block.type === 'product_summary' && block.props?.mobileOnly === true))
            .map((block) => block.type);
    const areas = grid
        ? [
              { label: 'Topo', blocks: sections.slice(0, gridIndex).map((block) => block.type) },
              { label: 'Principal', blocks: column('column1') },
              { label: 'Lateral', blocks: column('column2') },
              { label: 'Final', blocks: sections.slice(gridIndex + 1).map((block) => block.type) },
          ]
        : [{ label: 'Página', blocks: sections.map((block) => block.type) }];
    return areas.filter((area) => area.blocks.length > 0);
}

const fontNames: Record<string, string> = {
    system: 'Sistema',
    inter: 'Inter',
    geist: 'Geist',
    'dm-sans': 'DM Sans',
    manrope: 'Manrope',
    'plus-jakarta': 'Plus Jakarta',
    outfit: 'Outfit',
    sora: 'Sora',
    'space-grotesk': 'Space Grotesk',
    montserrat: 'Montserrat',
    poppins: 'Poppins',
    roboto: 'Roboto',
    'open-sans': 'Open Sans',
    lato: 'Lato',
    playfair: 'Playfair',
    fraunces: 'Fraunces',
    'instrument-serif': 'Instrument Serif',
    georgia: 'Georgia',
    serif: 'Serif',
    arial: 'Arial',
    mono: 'Mono',
};

function fontLabel(font?: string, fallback?: string) {
    const value = font === undefined || font === '' || font === 'inherit' ? fallback : font;
    return fontNames[value ?? ''] ?? value ?? 'Sistema';
}

/** Branco ou quase preto sobre a cor do botão, o que tiver mais contraste. */
function readableOn(color?: string) {
    const hex = /^#([0-9a-f]{6})$/i.exec(color ?? '')?.[1];
    if (!hex) return '#ffffff';
    const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
    const luminance = 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
    return luminance > 0.55 ? '#101214' : '#ffffff';
}
