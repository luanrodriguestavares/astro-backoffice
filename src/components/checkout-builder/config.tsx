'use client';

import { Button } from '@/components/ui/button';

import type { Config, Data, Slot } from '@puckeditor/core';
import { useEffect, useState } from 'react';
import { checkoutThemeVariables } from '@astro/checkout-renderer/theme';
import {
    CheckoutDataTable,
    CheckoutBenefits,
    CheckoutCardPayment,
    CheckoutCoupon,
    CheckoutFaq,
    CheckoutGuarantee,
    CheckoutHeadingText,
    CheckoutHero,
    CheckoutCustomerForm,
    CheckoutOrderSummary,
    CheckoutPaymentInstruction,
    CheckoutParagraphText,
    CheckoutPaymentMethods,
    CheckoutProductSummary,
    CheckoutTestimonials,
    CheckoutTextBlock,
    CheckoutTrustBadges,
} from '@astro/checkout-renderer/components';
import {
    CheckoutBeforeAfter,
    CheckoutClientLogos,
    CheckoutCountdown,
    CheckoutDivider,
    CheckoutFloatingCta,
    CheckoutFooter,
    CheckoutGrid,
    CheckoutImage,
    CheckoutLogo,
    CheckoutBanner,
    CheckoutPlans,
    CheckoutStats,
    CheckoutVideo,
} from '@astro/checkout-renderer/content-components';

import { ColorPickerField } from '@/components/checkout-builder/color-picker-field';

type BuilderProps = {
    hero: {
        layout: HeroLayout;
        eyebrow: string;
        title: string;
        description: string;
        buttonLabel: string;
        imageUrl: string;
    };
    heading_text: { text: string; alignment: 'left' | 'center' | 'right'; size: TextSize };
    paragraph_text: { content: string; alignment: 'left' | 'center' | 'right'; size: TextSize };
    text: { title: string; content: string; alignment: 'left' | 'center' };
    image: {
        url: string;
        alt: string;
        caption: string;
        aspectRatio: ImageRatio;
        shape: ImageShape;
        size: ImageSize;
        fit: 'cover' | 'contain';
        alignment: 'left' | 'center' | 'right';
    };
    video: {
        url: string;
        title: string;
        caption: string;
        posterUrl: string;
        aspectRatio: VideoRatio;
        autoplay: boolean;
        controls: boolean;
    };
    logo: {
        url: string;
        alt: string;
        alignment: 'left' | 'center' | 'right';
        size: SizePreset;
        radius: LogoRadius;
        overlapBanner: boolean;
    };
    banner: { imageUrl: string; alt: string; aspectRatio: BannerRatio; fit: 'cover' | 'contain' };
    grid: {
        columns: '1' | '2' | '3';
        columnGap: SizePreset;
        itemGap: SizePreset;
        padding: SizePreset;
        column1: Slot;
        column2: Slot;
        column3: Slot;
    };
    benefits: {
        layout: BenefitsLayout;
        title: string;
        items: { title: string; description: string }[];
    };
    testimonials: {
        layout: TestimonialsLayout;
        title: string;
        items: { quote: string; name: string; role: string }[];
    };
    faq: { layout: FaqLayout; title: string; items: { question: string; answer: string }[] };
    guarantee: { layout: GuaranteeLayout; title: string; description: string; days: number };
    countdown: { layout: CountdownLayout; title: string; deadline: string };
    plan_comparison: {
        layout: PlanComparisonLayout;
        title: string;
        plans: { name: string; price: string; description: string; featured: boolean }[];
    };
    data_table: {
        layout: DataTableLayout;
        title: string;
        showLines: boolean;
        rows: { label: string; value: string; detail: string }[];
    };
    stats: {
        layout: StatsLayout;
        title: string;
        items: { value: string; label: string; detail: string }[];
    };
    before_after: {
        layout: BeforeAfterLayout;
        title: string;
        beforeTitle: string;
        beforeText: string;
        afterTitle: string;
        afterText: string;
    };
    client_logos: {
        layout: ClientLogosLayout;
        title: string;
        logos: { name: string; imageUrl: string }[];
    };
    floating_cta: { layout: FloatingCtaLayout; text: string; buttonLabel: string };
    spacer_divider: { layout: SpacerDividerLayout; size: SizePreset; label: string };
    product_summary: { layout: ProductLayout; title: string; description: string };
    checkout_form: {
        layout: FormLayout;
        title: string;
        description: string;
        buttonLabel: string;
        showPhone: boolean;
        showDocument: boolean;
    };
    order_summary: { layout: SummaryLayout; title: string };
    payment_methods: {
        layout: PaymentLayout;
        title: string;
        description: string;
        showCard: boolean;
        showPix: boolean;
        showBoleto: boolean;
    };
    card_payment: {
        layout: CardPaymentLayout;
        title: string;
        description: string;
        showInstallments: boolean;
    };
    pix_payment: {
        layout: PaymentInstructionLayout;
        title: string;
        description: string;
        expiresIn: string;
    };
    boleto_payment: {
        layout: PaymentInstructionLayout;
        title: string;
        description: string;
        dueInDays: number;
    };
    shipping_address: { title: string; description: string };
    shipping_methods: { title: string; economyLabel: string; expressLabel: string };
    coupon_field: { layout: CouponLayout; title: string; placeholder: string; buttonLabel: string };
    security_badges: {
        layout: TrustLayout;
        title: string;
        showEncryption: boolean;
        showGuarantee: boolean;
        showPrivacy: boolean;
    };
    footer: { layout: FooterLayout; text: string; showSecurity: boolean };
};

type ThemeMode = 'light' | 'dark' | 'system';

type GrayTone = 'neutral' | 'gray' | 'zinc' | 'slate';

type FontPreset =
    | 'system'
    | 'geist'
    | 'inter'
    | 'montserrat'
    | 'poppins'
    | 'roboto'
    | 'open-sans'
    | 'lato'
    | 'arial'
    | 'georgia'
    | 'serif'
    | 'mono';

type FontWeightPreset = '400' | '500' | '600' | '700' | '800' | '900';

type SizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type WidthPreset = 'sm' | 'md' | 'lg' | 'xl' | 'full';

type ShadowPreset = 'none' | 'xs' | 'sm' | 'md' | 'lg';

type LogoRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

type BannerRatio = '4/1' | '3/1' | '2/1' | '16/9' | '1/1' | '4/5';

type ImageRatio = 'auto' | '21/9' | '16/9' | '4/3' | '1/1' | '4/5' | '9/16';

type ImageShape = 'rectangle' | 'soft' | 'square' | 'circle' | 'pill';

type ImageSize = 'sm' | 'md' | 'lg' | 'full';

type VideoRatio = '16/9' | '4/3' | '1/1' | '9/16';

type InputGroupStyle = 'filled' | 'outlined';
type ComponentBackgroundStyle = 'filled' | 'transparent';
type ComponentBorderStyle = 'visible' | 'hidden';
type ComponentShadowMode = 'auto' | 'visible' | 'hidden';

type HeroLayout = 'choose' | 'centered' | 'split' | 'compact' | 'media-card' | 'editorial';

type CountdownLayout = 'cards' | 'banner' | 'minimal';
type PlanComparisonLayout = 'cards' | 'columns' | 'compact';
type DataTableLayout = 'table' | 'matrix' | 'specs';
type StatsLayout = 'cards' | 'strip' | 'editorial';
type BeforeAfterLayout = 'split' | 'cards' | 'timeline';
type ClientLogosLayout = 'grid' | 'strip' | 'cloud';
type FloatingCtaLayout = 'bar' | 'pill' | 'card';
type SpacerDividerLayout = 'space' | 'line' | 'label';

type BenefitsLayout = 'cards' | 'list' | 'steps' | 'feature-grid' | 'checklist';
type TextSize = 'sm' | 'md' | 'lg' | 'xl';

type TestimonialsLayout = 'cards' | 'featured' | 'compact' | 'wall' | 'spotlight';

type FaqLayout = 'accordion' | 'cards' | 'split';

type GuaranteeLayout = 'horizontal' | 'seal' | 'banner' | 'boxed' | 'minimal';

type ProductLayout = 'card' | 'compact' | 'detailed';

type FormLayout = 'card' | 'compact' | 'plain';

type SummaryLayout = 'card' | 'receipt' | 'highlight';

type PaymentLayout = 'cards' | 'list' | 'segmented';

type CardPaymentLayout = 'standard' | 'compact' | 'visual';

type CouponLayout = 'inline' | 'card' | 'minimal';

type PaymentInstructionLayout = 'split' | 'card' | 'compact';

type TrustLayout = 'pills' | 'cards' | 'strip';

type FooterLayout = 'centered' | 'columns' | 'minimal';

export type BuilderRootProps = {
    themeMode: ThemeMode;
    grayTone: GrayTone;
    fontFamily: FontPreset;
    headingFontWeight: FontWeightPreset;
    bodyFontWeight: FontWeightPreset;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    accentColor: string;
    radius: SizePreset;
    shadow: ShadowPreset;
    maxWidth: WidthPreset;
    componentGap: SizePreset;
    pagePadding: SizePreset;
    inputGroupStyle: InputGroupStyle;
    componentBackgroundStyle: ComponentBackgroundStyle;
    componentBorderStyle: ComponentBorderStyle;
    componentShadowMode: ComponentShadowMode;
};

export type BuilderData = Data<BuilderProps, BuilderRootProps>;

const alignment = [
    { label: 'Esquerda', value: 'left' },
    { label: 'Centralizado', value: 'center' },
] as const;
const booleanOptions = [
    { label: 'Exibir', value: true },
    { label: 'Ocultar', value: false },
] as const;
const sizeOptions = [
    { label: 'XS', value: 'xs' },
    { label: 'SM', value: 'sm' },
    { label: 'MD', value: 'md' },
    { label: 'LG', value: 'lg' },
    { label: 'XL', value: 'xl' },
] as const;
const shadowOptions = [{ label: 'Sem sombra', value: 'none' }, ...sizeOptions.slice(0, 4)] as const;
const fontWeightOptions = [
    { label: 'Regular', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'Semibold', value: '600' },
    { label: 'Bold', value: '700' },
    { label: 'Extra bold', value: '800' },
    { label: 'Black', value: '900' },
] as const;
const textSizeOptions = [
    { label: 'Pequeno', value: 'sm' },
    { label: 'Normal', value: 'md' },
    { label: 'Grande', value: 'lg' },
    { label: 'Extra grande', value: 'xl' },
] as const;
const colorField = (label: string) => ({
    type: 'custom' as const,
    label,
    render: ({
        name,
        value,
        onChange,
        field,
    }: {
        name: string;
        value: string;
        onChange: (value: string) => void;
        field: { label?: string };
    }) => <ColorPickerField name={name} label={field.label} value={value} onChange={onChange} />,
});
const heroLayoutField = {
    type: 'custom' as const,
    label: 'Template da apresentação',
    render: ({ value, onChange }: { value: HeroLayout; onChange: (value: HeroLayout) => void }) => (
        <HeroLayoutPicker value={value} onChange={onChange} />
    ),
};
const countdownLayoutField = {
    type: 'custom' as const,
    label: 'Template do cronômetro',
    render: ({
        value,
        onChange,
    }: {
        value: CountdownLayout;
        onChange: (value: CountdownLayout) => void;
    }) => <CountdownLayoutPicker value={value} onChange={onChange} />,
};
const benefitsLayoutField = templateField<BenefitsLayout>('Template dos benefícios', [
    { value: 'cards', label: 'Cartões', description: 'Benefícios em grade.' },
    { value: 'list', label: 'Lista', description: 'Leitura vertical objetiva.' },
    { value: 'steps', label: 'Etapas', description: 'Fluxo numerado.' },
    { value: 'feature-grid', label: 'Grade premium', description: 'Cartoes visuais com icones.' },
    { value: 'checklist', label: 'Checklist', description: 'Lista compacta com checks.' },
]);
const testimonialsLayoutField = templateField<TestimonialsLayout>('Template dos depoimentos', [
    { value: 'cards', label: 'Cartões', description: 'Depoimentos com o mesmo peso.' },
    { value: 'featured', label: 'Destaque', description: 'Um relato principal em evidência.' },
    { value: 'compact', label: 'Compacto', description: 'Prova social mais discreta.' },
    { value: 'wall', label: 'Mural', description: 'Varios relatos em bloco editorial.' },
    { value: 'spotlight', label: 'Spotlight', description: 'Relato principal com assinatura forte.' },
]);
const faqLayoutField = templateField<FaqLayout>('Template das perguntas', [
    { value: 'accordion', label: 'Acordeão', description: 'Respostas abertas sob demanda.' },
    { value: 'cards', label: 'Cartões', description: 'Perguntas e respostas sempre visíveis.' },
    { value: 'split', label: 'Dividido', description: 'Título lateral e perguntas à direita.' },
]);
const guaranteeLayoutField = templateField<GuaranteeLayout>('Template da garantia', [
    { value: 'horizontal', label: 'Horizontal', description: 'Selo e texto lado a lado.' },
    { value: 'seal', label: 'Selo central', description: 'Garantia como destaque principal.' },
    { value: 'banner', label: 'Faixa', description: 'Bloco forte usando a cor do tema.' },
    { value: 'boxed', label: 'Caixa segura', description: 'Bloco sobrio com resumo de risco.' },
    { value: 'minimal', label: 'Minimalista', description: 'Garantia discreta e elegante.' },
]);
const planComparisonLayoutField = templateField<PlanComparisonLayout>('Template da comparação', [
    { value: 'cards', label: 'Cards', description: 'Planos em cartões comparáveis.' },
    { value: 'columns', label: 'Colunas', description: 'Tabela visual por plano.' },
    { value: 'compact', label: 'Compacto', description: 'Lista curta para checkout estreito.' },
]);
const dataTableLayoutField = templateField<DataTableLayout>('Template da tabela', [
    { value: 'table', label: 'Tabela clássica', description: 'Cabeçalho e linhas tradicionais.' },
    { value: 'matrix', label: 'Matriz', description: 'Tabela comparativa em colunas.' },
    { value: 'specs', label: 'Ficha técnica', description: 'Tabela de especificações.' },
]);
const statsLayoutField = templateField<StatsLayout>('Template das estatísticas', [
    { value: 'cards', label: 'Cards', description: 'Métricas em grade.' },
    { value: 'strip', label: 'Faixa', description: 'Números em linha compacta.' },
    { value: 'editorial', label: 'Editorial', description: 'Uma métrica principal e detalhes.' },
]);
const beforeAfterLayoutField = templateField<BeforeAfterLayout>('Template antes/depois', [
    { value: 'split', label: 'Dividido', description: 'Antes e depois lado a lado.' },
    { value: 'cards', label: 'Cards', description: 'Comparação em cartões.' },
    { value: 'timeline', label: 'Linha do tempo', description: 'Mudança em sequência.' },
]);
const clientLogosLayoutField = templateField<ClientLogosLayout>('Template dos logos', [
    { value: 'grid', label: 'Grade', description: 'Logos organizados em grade.' },
    { value: 'strip', label: 'Faixa', description: 'Linha compacta de clientes.' },
    { value: 'cloud', label: 'Nuvem', description: 'Logos com pesos visuais diferentes.' },
]);
const floatingCtaLayoutField = templateField<FloatingCtaLayout>('Template do CTA', [
    { value: 'bar', label: 'Barra', description: 'CTA fixo na base.' },
    { value: 'pill', label: 'Pill', description: 'CTA flutuante compacto.' },
    { value: 'card', label: 'Card', description: 'CTA flutuante com mais presença.' },
]);
const spacerDividerLayoutField = templateField<SpacerDividerLayout>('Template do espaçador', [
    { value: 'space', label: 'Espaço', description: 'Respiro vertical invisível.' },
    { value: 'line', label: 'Linha', description: 'Divisor simples.' },
    { value: 'label', label: 'Com texto', description: 'Divisor com rótulo central.' },
]);
const productLayoutField = templateField<ProductLayout>('Template dos itens', [
    { value: 'card', label: 'Cartão', description: 'Resumo completo do produto.' },
    { value: 'compact', label: 'Compacto', description: 'Produto e preço em uma linha.' },
    { value: 'detailed', label: 'Detalhado', description: 'Visual de recibo com quantidade.' },
]);
const formLayoutField = templateField<FormLayout>('Template dos dados', [
    { value: 'card', label: 'Cartão', description: 'Formulário tradicional.' },
    { value: 'compact', label: 'Compacto', description: 'Campos básicos lado a lado.' },
    { value: 'plain', label: 'Sem caixa', description: 'Integração leve com a página.' },
]);
const summaryLayoutField = templateField<SummaryLayout>('Template do resumo', [
    { value: 'card', label: 'Cartão', description: 'Resumo equilibrado.' },
    { value: 'receipt', label: 'Recibo', description: 'Linhas e total em formato fiscal.' },
    { value: 'highlight', label: 'Total destacado', description: 'Valor final ganha prioridade.' },
]);
const paymentLayoutField = templateField<PaymentLayout>('Template do pagamento', [
    { value: 'cards', label: 'Cartões', description: 'Métodos visuais em grade.' },
    { value: 'list', label: 'Lista', description: 'Opções amplas e descritivas.' },
    { value: 'segmented', label: 'Segmentado', description: 'Seletor compacto em uma faixa.' },
]);
const cardPaymentLayoutField = templateField<CardPaymentLayout>('Template dos dados de pagamento', [
    { value: 'standard', label: 'Padrão', description: 'Campos amplos e confortáveis.' },
    { value: 'compact', label: 'Compacto', description: 'Ocupa menos espaço na página.' },
    {
        value: 'visual',
        label: 'Cartão visual',
        description: 'Prévia do cartão ao lado dos campos.',
    },
]);
const couponLayoutField = templateField<CouponLayout>('Template do cupom', [
    { value: 'inline', label: 'Linha', description: 'Campo e botão lado a lado.' },
    { value: 'card', label: 'Cartao', description: 'Cupom em bloco destacado.' },
    { value: 'minimal', label: 'Minimalista', description: 'Entrada discreta e compacta.' },
]);
const paymentInstructionLayoutField = templateField<PaymentInstructionLayout>(
    'Template da instrucao',
    [
        { value: 'split', label: 'Dividido', description: 'Código e detalhes lado a lado.' },
        { value: 'card', label: 'Cartao', description: 'Instrucao central em destaque.' },
        { value: 'compact', label: 'Compacto', description: 'Bloco curto para laterais.' },
    ],
);
const trustLayoutField = templateField<TrustLayout>('Template dos selos', [
    { value: 'pills', label: 'Pills', description: 'Selos pequenos em linha.' },
    { value: 'cards', label: 'Cartoes', description: 'Selos com mais presenca.' },
    { value: 'strip', label: 'Faixa', description: 'Barra de seguranca.' },
]);
const footerLayoutField = templateField<FooterLayout>('Template do rodape', [
    { value: 'centered', label: 'Centralizado', description: 'Texto simples central.' },
    { value: 'columns', label: 'Colunas', description: 'Marca, suporte e seguranca.' },
    { value: 'minimal', label: 'Minimal', description: 'Linha fina e discreta.' },
]);
const checkoutPageStyles = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lato:wght@400;700;900&family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Roboto:wght@400;500;700;900&display=swap");
  [data-checkout-page] input,
  [data-checkout-page] select,
  [data-checkout-page] textarea {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
  }
  [data-checkout-page] *,
  [data-checkout-page] *::before,
  [data-checkout-page] *::after {
    box-sizing: border-box;
  }
  [data-checkout-page] section,
  [data-checkout-page] article,
  [data-checkout-page] aside,
  [data-checkout-page] figure,
  [data-checkout-page] footer,
  [data-checkout-page] div {
    min-width: 0;
  }
  [data-checkout-page] img,
  [data-checkout-page] video,
  [data-checkout-page] iframe {
    max-width: 100%;
  }
  [data-checkout-page] input:focus,
  [data-checkout-page] input:focus-visible,
  [data-checkout-page] select:focus,
  [data-checkout-page] select:focus-visible,
  [data-checkout-page] textarea:focus,
  [data-checkout-page] textarea:focus-visible {
    border-color: var(--checkout-accent) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--checkout-accent) 18%, transparent) !important;
    outline: none !important;
  }
  [data-checkout-page] button {
    transition: filter 150ms ease, transform 150ms ease, box-shadow 150ms ease;
  }
  [data-checkout-page] button:hover {
    filter: brightness(.88);
    transform: translateY(-1px);
  }
  [data-checkout-page] button:active {
    filter: brightness(.8);
    transform: translateY(0);
  }
  [data-checkout-page] .checkout-primary-button:hover {
    background: color-mix(in srgb, var(--checkout-accent) 82%, black) !important;
    filter: none;
    box-shadow: 0 13px 28px color-mix(in srgb, var(--checkout-accent) 30%, transparent) !important;
  }
  [data-checkout-page] .checkout-payment-option {
    transition: border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
  }
  [data-checkout-page] .checkout-payment-option:hover {
    border-color: color-mix(in srgb, var(--checkout-accent) 48%, var(--checkout-border)) !important;
    transform: translateY(-1px);
  }
  [data-checkout-page] .checkout-payment-option:has(input:checked) {
    border-color: var(--checkout-accent) !important;
    background: color-mix(in srgb, var(--checkout-accent) 8%, var(--checkout-surface)) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--checkout-accent) 13%, transparent);
  }
  [data-checkout-page] [data-puck-overlay] {
    --puck-color-selection-border: var(--checkout-accent);
  }
  .checkout-page-content > * {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: grid;
    align-items: stretch;
    gap: var(--checkout-component-gap);
  }
  @media (max-width: 720px) {
    [data-checkout-page] {
      padding: clamp(8px, 2.8vw, 14px) !important;
    }
    [data-checkout-page] .checkout-page-content {
      gap: clamp(14px, 4vw, 22px) !important;
    }
    [data-checkout-page] section,
    [data-checkout-page] article,
    [data-checkout-page] aside,
    [data-checkout-page] figure,
    [data-checkout-page] footer {
      max-width: 100% !important;
      min-width: 0 !important;
    }
    [data-checkout-page] section[style*="padding: 28px"],
    [data-checkout-page] aside[style*="padding: 28px"],
    [data-checkout-page] article[style*="padding: 24px"],
    [data-checkout-page] footer[style*="padding: 24px"] {
      padding: clamp(14px, 4vw, 18px) !important;
    }
    [data-checkout-page] section[style*="padding: clamp"],
    [data-checkout-page] aside[style*="padding: clamp"],
    [data-checkout-page] article[style*="padding: clamp"],
    [data-checkout-page] figure[style*="padding: clamp"] {
      padding-left: clamp(14px, 4vw, 18px) !important;
      padding-right: clamp(14px, 4vw, 18px) !important;
    }
    [data-checkout-page] [style*="grid-template-columns"] {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    [data-checkout-page] [style*="min-width: 220px"],
    [data-checkout-page] [style*="min-width: 240px"],
    [data-checkout-page] [style*="min-width: 280px"] {
      min-width: 0 !important;
    }
    [data-checkout-page] [style*="min-height: 520px"] {
      min-height: 360px !important;
    }
    [data-checkout-page] [style*="min-height: 360px"] {
      min-height: 220px !important;
    }
    [data-checkout-page] [style*="min-height: 260px"] {
      min-height: 180px !important;
    }
    [data-checkout-page] [style*="max-width: 760px"],
    [data-checkout-page] [style*="max-width: 780px"],
    [data-checkout-page] [style*="max-width: 800px"],
    [data-checkout-page] [style*="max-width: 820px"] {
      max-width: 100% !important;
    }
    [data-checkout-page] input,
    [data-checkout-page] select,
    [data-checkout-page] textarea,
    [data-checkout-page] button {
      width: 100%;
      max-width: 100%;
    }
    [data-checkout-page] input[type="radio"],
    [data-checkout-page] input[type="checkbox"] {
      width: auto;
      max-width: none;
      flex: 0 0 auto;
    }
    [data-checkout-page] .checkout-payment-option,
    [data-checkout-page] label[style*="display: flex"] {
      align-items: flex-start !important;
    }
  }
  [data-checkout-page][data-checkout-width="sm"] {
    padding-inline: clamp(8px, 2.8vw, 14px) !important;
  }
  [data-checkout-page][data-checkout-width="sm"] .checkout-page-content {
    gap: clamp(14px, 4vw, 22px) !important;
  }
  [data-checkout-page][data-checkout-width="sm"] section,
  [data-checkout-page][data-checkout-width="sm"] article,
  [data-checkout-page][data-checkout-width="sm"] aside,
  [data-checkout-page][data-checkout-width="sm"] figure,
  [data-checkout-page][data-checkout-width="sm"] footer {
    max-width: 100% !important;
    min-width: 0 !important;
  }
  [data-checkout-page][data-checkout-width="sm"] section[style*="padding: 28px"],
  [data-checkout-page][data-checkout-width="sm"] aside[style*="padding: 28px"],
  [data-checkout-page][data-checkout-width="sm"] article[style*="padding: 24px"],
  [data-checkout-page][data-checkout-width="sm"] footer[style*="padding: 24px"] {
    padding: clamp(14px, 4vw, 18px) !important;
  }
  [data-checkout-page][data-checkout-width="sm"] section[style*="padding: clamp"],
  [data-checkout-page][data-checkout-width="sm"] aside[style*="padding: clamp"],
  [data-checkout-page][data-checkout-width="sm"] article[style*="padding: clamp"],
  [data-checkout-page][data-checkout-width="sm"] figure[style*="padding: clamp"] {
    padding-left: clamp(14px, 4vw, 18px) !important;
    padding-right: clamp(14px, 4vw, 18px) !important;
  }
  [data-checkout-page][data-checkout-width="sm"] [style*="grid-template-columns"] {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  [data-checkout-page][data-checkout-width="sm"] [style*="min-width: 220px"],
  [data-checkout-page][data-checkout-width="sm"] [style*="min-width: 240px"],
  [data-checkout-page][data-checkout-width="sm"] [style*="min-width: 280px"],
  [data-checkout-page][data-checkout-width="sm"] [style*="min-width: 320px"] {
    min-width: 0 !important;
  }
  [data-checkout-page][data-checkout-width="sm"] input,
  [data-checkout-page][data-checkout-width="sm"] select,
  [data-checkout-page][data-checkout-width="sm"] textarea,
  [data-checkout-page][data-checkout-width="sm"] button {
    width: 100%;
    max-width: 100%;
  }
  [data-checkout-page][data-checkout-width="sm"] input[type="radio"],
  [data-checkout-page][data-checkout-width="sm"] input[type="checkbox"] {
    width: auto;
    max-width: none;
    flex: 0 0 auto;
  }
`;

export const checkoutBuilderConfig: Config<BuilderProps, BuilderRootProps> = {
    categories: {
        content: {
            title: 'Conteúdo',
            components: [
                'hero',
                'logo',
                'banner',
                'video',
                'heading_text',
                'paragraph_text',
                'text',
                'image',
                'benefits',
                'testimonials',
                'faq',
                'guarantee',
                'countdown',
            ],
            defaultExpanded: false,
        },
        conversion: {
            title: 'Conversao',
            components: [
                'plan_comparison',
                'data_table',
                'stats',
                'before_after',
                'client_logos',
                'floating_cta',
                'spacer_divider',
            ],
            defaultExpanded: false,
        },
        checkout: {
            title: 'Checkout',
            components: ['product_summary', 'checkout_form', 'order_summary', 'coupon_field'],
            defaultExpanded: false,
        },
        payment: {
            title: 'Pagamento',
            components: ['payment_methods', 'card_payment', 'pix_payment', 'boleto_payment'],
            defaultExpanded: false,
        },
        shipping: {
            title: 'Frete',
            components: ['shipping_address', 'shipping_methods'],
            defaultExpanded: false,
        },
        trust: { title: 'Confiança', components: ['security_badges'], defaultExpanded: false },
        structure: { title: 'Estrutura', components: ['grid', 'footer'], defaultExpanded: false },
    },
    root: {
        label: 'Página',
        fields: {
            themeMode: {
                type: 'select',
                label: 'Tema',
                options: [
                    { label: 'Claro', value: 'light' },
                    { label: 'Escuro', value: 'dark' },
                    { label: 'Sistema', value: 'system' },
                ],
            },
            grayTone: {
                type: 'select',
                label: 'Tom de cinza',
                options: [
                    { label: 'Neutro', value: 'neutral' },
                    { label: 'Gray', value: 'gray' },
                    { label: 'Zinc', value: 'zinc' },
                    { label: 'Slate', value: 'slate' },
                ],
            },
            fontFamily: {
                type: 'select',
                label: 'Tipografia',
                options: [
                    { label: 'Sistema', value: 'system' },
                    { label: 'Geist', value: 'geist' },
                    { label: 'Inter', value: 'inter' },
                    { label: 'Montserrat', value: 'montserrat' },
                    { label: 'Poppins', value: 'poppins' },
                    { label: 'Roboto', value: 'roboto' },
                    { label: 'Open Sans', value: 'open-sans' },
                    { label: 'Lato', value: 'lato' },
                    { label: 'Arial', value: 'arial' },
                    { label: 'Georgia', value: 'georgia' },
                    { label: 'Serif clássica', value: 'serif' },
                    { label: 'Monoespaçada', value: 'mono' },
                ],
            },
            headingFontWeight: {
                type: 'select',
                label: 'Peso dos titulos',
                options: fontWeightOptions,
            },
            bodyFontWeight: {
                type: 'select',
                label: 'Peso do texto padrao',
                options: fontWeightOptions,
            },
            backgroundColor: colorField('Cor do fundo'),
            surfaceColor: colorField('Cor dos componentes'),
            textColor: colorField('Cor do texto'),
            accentColor: colorField('Cor principal'),
            radius: { type: 'select', label: 'Arredondamento dos cantos', options: sizeOptions },
            shadow: { type: 'select', label: 'Sombra', options: shadowOptions },
            maxWidth: {
                type: 'select',
                label: 'Largura',
                options: [
                    { label: 'SM', value: 'sm' },
                    { label: 'MD', value: 'md' },
                    { label: 'LG', value: 'lg' },
                    { label: 'XL', value: 'xl' },
                    { label: 'Total', value: 'full' },
                ],
            },
            componentGap: {
                type: 'select',
                label: 'Espaçamento entre componentes',
                options: sizeOptions,
            },
            pagePadding: {
                type: 'select',
                label: 'Margem interna da página',
                options: sizeOptions,
            },
            inputGroupStyle: {
                type: 'select',
                label: 'Estilo dos blocos de checkout',
                options: [
                    { label: 'Fundo preenchido', value: 'filled' },
                    { label: 'Fundo vazado com borda', value: 'outlined' },
                ],
            },
            componentBackgroundStyle: {
                type: 'select',
                label: 'Fundo dos componentes',
                options: [
                    { label: 'Preenchido', value: 'filled' },
                    { label: 'Vazado', value: 'transparent' },
                ],
            },
            componentBorderStyle: {
                type: 'select',
                label: 'Borda dos componentes',
                options: [
                    { label: 'Com borda', value: 'visible' },
                    { label: 'Sem borda', value: 'hidden' },
                ],
            },
            componentShadowMode: {
                type: 'select',
                label: 'Sombra dos componentes',
                options: [
                    { label: 'Automatica', value: 'auto' },
                    { label: 'Sempre exibir', value: 'visible' },
                    { label: 'Ocultar', value: 'hidden' },
                ],
            },
        },
        defaultProps: {
            themeMode: 'light',
            grayTone: 'neutral',
            fontFamily: 'system',
            headingFontWeight: '700',
            bodyFontWeight: '400',
            backgroundColor: '#f7f7fb',
            surfaceColor: '#ffffff',
            textColor: '#202235',
            accentColor: '#7065e8',
            radius: 'md',
            shadow: 'sm',
            maxWidth: 'lg',
            componentGap: 'md',
            pagePadding: 'lg',
            inputGroupStyle: 'filled',
            componentBackgroundStyle: 'filled',
            componentBorderStyle: 'visible',
            componentShadowMode: 'auto',
        },
        render: ({ children, ...theme }) => {
            const palette = resolvePalette(theme);
            return (
                <div
                    data-checkout-page
                    data-checkout-width={theme.maxWidth ?? 'lg'}
                    style={{
                        ...variables(theme),
                        colorScheme: theme.themeMode === 'system' ? 'light dark' : theme.themeMode,
                        minHeight: '100vh',
                        background: palette.background,
                        color: palette.text,
                        fontFamily: fontStack(theme.fontFamily),
                        fontWeight: Number(theme.bodyFontWeight ?? '400'),
                        padding: spacingValue(theme.pagePadding),
                    }}
                >
                    <style>{checkoutPageStyles}</style>
                    <main
                        className="checkout-page-content"
                        style={{
                            width: '100%',
                            maxWidth: widthValue(theme.maxWidth),
                            margin: '0 auto',
                            display: 'grid',
                            alignItems: 'stretch',
                            gap: spacingValue(theme.componentGap),
                        }}
                    >
                        {children}
                    </main>
                </div>
            );
        },
    },
    components: {
        hero: {
            label: 'Apresentação',
            fields: {
                layout: heroLayoutField,
                eyebrow: { type: 'text', label: 'Chamada superior', contentEditable: true },
                title: { type: 'textarea', label: 'Título', contentEditable: true },
                description: { type: 'textarea', label: 'Descrição', contentEditable: true },
                buttonLabel: { type: 'text', label: 'Texto do botão' },
                imageUrl: { type: 'text', label: 'Imagem do template (opcional)' },
            },
            defaultProps: {
                layout: 'choose',
                eyebrow: 'Oferta especial',
                title: 'Uma transformação começa aqui',
                description:
                    'Apresente de forma clara o principal resultado que seu produto entrega.',
                buttonLabel: 'Quero começar',
                imageUrl: '',
            },
            render: ({ layout, eyebrow, title, description, buttonLabel, imageUrl }) => (
                <CheckoutHero
                    layout={layout ?? 'centered'}
                    eyebrow={eyebrow}
                    title={title}
                    description={description}
                    buttonLabel={buttonLabel}
                    imageUrl={imageUrl}
                />
            ),
        },
        logo: {
            label: 'Logo',
            fields: {
                url: { type: 'text', label: 'URL HTTPS' },
                alt: { type: 'text', label: 'Texto alternativo' },
                alignment: {
                    type: 'radio',
                    label: 'Alinhamento',
                    options: [
                        { label: 'Esquerda', value: 'left' },
                        { label: 'Centro', value: 'center' },
                        { label: 'Direita', value: 'right' },
                    ],
                },
                size: { type: 'select', label: 'Tamanho', options: sizeOptions },
                radius: {
                    type: 'select',
                    label: 'Arredondamento',
                    options: [
                        { label: 'Sem arredondamento', value: 'none' },
                        { label: 'Suave', value: 'sm' },
                        { label: 'Médio', value: 'md' },
                        { label: 'Grande', value: 'lg' },
                        { label: 'Totalmente redondo', value: 'full' },
                    ],
                },
                overlapBanner: {
                    type: 'radio',
                    label: 'Posição',
                    options: [
                        { label: 'Normal', value: false },
                        { label: 'Sobrepor ao banner anterior', value: true },
                    ],
                },
            },
            defaultProps: {
                url: '',
                alt: 'Logo da marca',
                alignment: 'center',
                size: 'md',
                radius: 'md',
                overlapBanner: false,
            },
            render: ({ url, alt, alignment, size, radius, overlapBanner }) => (
                <CheckoutLogo url={url} alt={alt} alignment={alignment} size={size} radius={radius} overlap={overlapBanner} />
            ),
        },
        banner: {
            label: 'Banner',
            fields: {
                imageUrl: { type: 'text', label: 'Imagem HTTPS' },
                alt: { type: 'text', label: 'Texto alternativo' },
                aspectRatio: {
                    type: 'select',
                    label: 'Formato',
                    options: [
                        { label: 'Faixa baixa · 4:1', value: '4/1' },
                        { label: 'Panorâmico · 3:1', value: '3/1' },
                        { label: 'Retangular alto · 2:1', value: '2/1' },
                        { label: 'Paisagem · 16:9', value: '16/9' },
                        { label: 'Quadrado · 1:1', value: '1/1' },
                        { label: 'Vertical · 4:5', value: '4/5' },
                    ],
                },
                fit: {
                    type: 'select',
                    label: 'Ajuste da imagem',
                    options: [
                        { label: 'Preencher', value: 'cover' },
                        { label: 'Mostrar inteira', value: 'contain' },
                    ],
                },
            },
            defaultProps: {
                imageUrl: '',
                alt: 'Banner da oferta',
                aspectRatio: '3/1',
                fit: 'cover',
            },
            render: ({ imageUrl, alt, aspectRatio, fit }) => (
                <CheckoutBanner imageUrl={imageUrl} alt={alt} aspectRatio={aspectRatio} fit={fit} />
            ),
        },
        grid: {
            label: 'Grid',
            fields: {
                columns: {
                    type: 'radio',
                    label: 'Colunas',
                    options: [
                        { label: '1 coluna', value: '1' },
                        { label: '2 colunas', value: '2' },
                        { label: '3 colunas', value: '3' },
                    ],
                },
                columnGap: {
                    type: 'select',
                    label: 'Espaçamento entre colunas',
                    options: sizeOptions,
                },
                itemGap: { type: 'select', label: 'Espaçamento entre itens', options: sizeOptions },
                padding: { type: 'select', label: 'Espaçamento vertical', options: sizeOptions },
                column1: { type: 'slot' },
                column2: { type: 'slot' },
                column3: { type: 'slot' },
            },
            defaultProps: {
                columns: '2',
                columnGap: 'md',
                itemGap: 'md',
                padding: 'xs',
                column1: [],
                column2: [],
                column3: [],
            },
            render: ({
                columns,
                columnGap,
                itemGap,
                padding,
                column1: Column1,
                column2: Column2,
                column3: Column3,
            }) => (
                <CheckoutGrid
                    columns={columns}
                    columnGap={columnGap}
                    itemGap={itemGap}
                    padding={padding}
                >
                    {[
                        <Column1 key="column-1" minEmptyHeight={160} />,
                        <Column2 key="column-2" minEmptyHeight={160} />,
                        <Column3 key="column-3" minEmptyHeight={160} />,
                    ]}
                </CheckoutGrid>
            ),
        },
        heading_text: {
            label: 'Titulo',
            fields: {
                text: { type: 'textarea', label: 'Texto', contentEditable: true },
                alignment: {
                    type: 'radio',
                    label: 'Alinhamento',
                    options: [
                        { label: 'Esquerda', value: 'left' },
                        { label: 'Centro', value: 'center' },
                        { label: 'Direita', value: 'right' },
                    ],
                },
                size: { type: 'select', label: 'Tamanho', options: textSizeOptions },
            },
            defaultProps: {
                text: 'Uma oferta pensada para o seu proximo passo',
                alignment: 'center',
                size: 'lg',
            },
            render: ({ text, alignment, size }) => (
                <CheckoutHeadingText text={text} alignment={alignment} size={size ?? 'lg'} />
            ),
        },
        paragraph_text: {
            label: 'Paragrafo',
            fields: {
                content: { type: 'textarea', label: 'Texto', contentEditable: true },
                alignment: {
                    type: 'radio',
                    label: 'Alinhamento',
                    options: [
                        { label: 'Esquerda', value: 'left' },
                        { label: 'Centro', value: 'center' },
                        { label: 'Direita', value: 'right' },
                    ],
                },
                size: { type: 'select', label: 'Tamanho', options: textSizeOptions },
            },
            defaultProps: {
                content:
                    'Use este bloco para explicar detalhes, contexto, instrucoes ou qualquer texto livre sem precisar criar um titulo.',
                alignment: 'left',
                size: 'md',
            },
            render: ({ content, alignment, size }) => (
                <CheckoutParagraphText alignment={alignment} size={size ?? 'md'}>
                    {content}
                </CheckoutParagraphText>
            ),
        },
        text: {
            label: 'Texto com titulo',
            fields: {
                title: { type: 'text', label: 'Título', contentEditable: true },
                content: { type: 'textarea', label: 'Conteúdo', contentEditable: true },
                alignment: { type: 'radio', label: 'Alinhamento', options: alignment },
            },
            defaultProps: {
                title: 'Conte sua história',
                content:
                    'Explique o problema, apresente a solução e ajude seu cliente a entender por que essa oferta é ideal para ele.',
                alignment: 'left',
            },
            render: ({ title, content, alignment }) => (
                <CheckoutTextBlock title={title} alignment={alignment}>
                    {content}
                </CheckoutTextBlock>
            ),
        },
        image: {
            label: 'Imagem',
            fields: {
                url: { type: 'text', label: 'URL HTTPS' },
                alt: { type: 'text', label: 'Texto alternativo' },
                caption: { type: 'text', label: 'Legenda' },
                aspectRatio: {
                    type: 'select',
                    label: 'Formato',
                    options: [
                        { label: 'Automatico', value: 'auto' },
                        { label: 'Panoramico 21:9', value: '21/9' },
                        { label: 'Paisagem 16:9', value: '16/9' },
                        { label: 'Classico 4:3', value: '4/3' },
                        { label: 'Quadrado 1:1', value: '1/1' },
                        { label: 'Retrato 4:5', value: '4/5' },
                        { label: 'Vertical 9:16', value: '9/16' },
                    ],
                },
                shape: {
                    type: 'select',
                    label: 'Formato visual',
                    options: [
                        { label: 'Retangulo', value: 'rectangle' },
                        { label: 'Cantos suaves', value: 'soft' },
                        { label: 'Quadrado', value: 'square' },
                        { label: 'Redondo', value: 'circle' },
                        { label: 'Pill', value: 'pill' },
                    ],
                },
                size: {
                    type: 'select',
                    label: 'Tamanho',
                    options: [
                        { label: 'Pequeno', value: 'sm' },
                        { label: 'Medio', value: 'md' },
                        { label: 'Grande', value: 'lg' },
                        { label: 'Largura total', value: 'full' },
                    ],
                },
                fit: {
                    type: 'select',
                    label: 'Ajuste',
                    options: [
                        { label: 'Preencher', value: 'cover' },
                        { label: 'Mostrar inteira', value: 'contain' },
                    ],
                },
                alignment: {
                    type: 'radio',
                    label: 'Alinhamento',
                    options: [
                        { label: 'Esquerda', value: 'left' },
                        { label: 'Centro', value: 'center' },
                        { label: 'Direita', value: 'right' },
                    ],
                },
            },
            defaultProps: {
                url: '',
                alt: 'Imagem da oferta',
                caption: '',
                aspectRatio: '16/9',
                shape: 'soft',
                size: 'full',
                fit: 'cover',
                alignment: 'center',
            },
            render: ({ url, alt, caption, aspectRatio, shape, size, fit, alignment }) => (
                <CheckoutImage
                    url={url}
                    alt={alt}
                    caption={caption}
                    aspectRatio={aspectRatio ?? '16/9'}
                    shape={shape ?? 'soft'}
                    size={size ?? 'full'}
                    fit={fit ?? 'cover'}
                    alignment={alignment}
                />
            ),
        },
        video: {
            label: 'Player de vídeo',
            fields: {
                url: { type: 'text', label: 'URL do YouTube, Vimeo ou vídeo HTTPS' },
                title: { type: 'text', label: 'Título acessível' },
                caption: { type: 'text', label: 'Legenda' },
                posterUrl: { type: 'text', label: 'Capa HTTPS (vídeo direto)' },
                aspectRatio: {
                    type: 'select',
                    label: 'Formato',
                    options: [
                        { label: 'Paisagem · 16:9', value: '16/9' },
                        { label: 'Clássico · 4:3', value: '4/3' },
                        { label: 'Quadrado · 1:1', value: '1/1' },
                        { label: 'Vertical · 9:16', value: '9/16' },
                    ],
                },
                autoplay: {
                    type: 'radio',
                    label: 'Reprodução automática',
                    options: booleanOptions,
                },
                controls: { type: 'radio', label: 'Controles', options: booleanOptions },
            },
            defaultProps: {
                url: '',
                title: 'Vídeo de apresentação',
                caption: '',
                posterUrl: '',
                aspectRatio: '16/9',
                autoplay: false,
                controls: true,
            },
            render: ({ url, title, caption, posterUrl, aspectRatio, autoplay, controls }) => (
                <CheckoutVideo
                    url={url}
                    title={title}
                    caption={caption}
                    posterUrl={posterUrl}
                    aspectRatio={aspectRatio ?? '16/9'}
                    autoplay={autoplay ?? false}
                    controls={controls ?? true}
                />
            ),
        },
        benefits: {
            label: 'Benefícios',
            fields: {
                layout: benefitsLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                items: {
                    type: 'array',
                    label: 'Benefícios',
                    min: 1,
                    max: 6,
                    arrayFields: {
                        title: { type: 'text', label: 'Título' },
                        description: { type: 'textarea', label: 'Descrição' },
                    },
                    defaultItemProps: {
                        title: 'Novo benefício',
                        description: 'Descreva este benefício.',
                    },
                    getItemSummary: (item) => item.title,
                },
            },
            defaultProps: {
                layout: 'cards',
                title: 'Por que escolher esta oferta?',
                items: [
                    {
                        title: 'Resultado rápido',
                        description: 'Comece imediatamente com um caminho claro.',
                    },
                    {
                        title: 'Método comprovado',
                        description: 'Siga um processo estruturado e objetivo.',
                    },
                    { title: 'Suporte de verdade', description: 'Tenha ajuda quando precisar.' },
                ],
            },
            render: ({ layout, title, items }) => (
                <CheckoutBenefits layout={layout ?? 'cards'} title={title} items={items} />
            ),
        },
        testimonials: {
            label: 'Depoimentos',
            fields: {
                layout: testimonialsLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                items: {
                    type: 'array',
                    label: 'Depoimentos',
                    min: 1,
                    max: 6,
                    arrayFields: {
                        quote: { type: 'textarea', label: 'Depoimento' },
                        name: { type: 'text', label: 'Nome' },
                        role: { type: 'text', label: 'Identificação' },
                    },
                    defaultItemProps: {
                        quote: 'Essa experiência mudou minha forma de trabalhar.',
                        name: 'Cliente',
                        role: 'Cliente verificado',
                    },
                    getItemSummary: (item) => item.name,
                },
            },
            defaultProps: {
                layout: 'cards',
                title: 'Quem já comprou recomenda',
                items: [
                    {
                        quote: 'Consegui colocar tudo em prática rapidamente e os resultados apareceram.',
                        name: 'Marina Costa',
                        role: 'Cliente verificada',
                    },
                    {
                        quote: 'Conteúdo direto, organizado e muito mais completo do que eu esperava.',
                        name: 'Rafael Lima',
                        role: 'Cliente verificado',
                    },
                ],
            },
            render: ({ layout, title, items }) => (
                <CheckoutTestimonials layout={layout ?? 'cards'} title={title} items={items} />
            ),
        },
        faq: {
            label: 'Perguntas frequentes',
            fields: {
                layout: faqLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                items: {
                    type: 'array',
                    label: 'Perguntas',
                    min: 1,
                    max: 10,
                    arrayFields: {
                        question: { type: 'text', label: 'Pergunta' },
                        answer: { type: 'textarea', label: 'Resposta' },
                    },
                    defaultItemProps: { question: 'Nova pergunta', answer: 'Escreva a resposta.' },
                    getItemSummary: (item) => item.question,
                },
            },
            defaultProps: {
                layout: 'accordion',
                title: 'Perguntas frequentes',
                items: [
                    {
                        question: 'Como recebo o acesso?',
                        answer: 'Você receberá as instruções logo após a confirmação do pagamento.',
                    },
                    {
                        question: 'O pagamento é seguro?',
                        answer: 'Sim. O pagamento é processado diretamente por um gateway homologado.',
                    },
                ],
            },
            render: ({ layout, title, items }) => (
                <CheckoutFaq layout={layout ?? 'accordion'} title={title} items={items} />
            ),
        },
        guarantee: {
            label: 'Garantia',
            fields: {
                layout: guaranteeLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                description: { type: 'textarea', label: 'Descrição', contentEditable: true },
                days: { type: 'number', label: 'Dias', min: 0, max: 365 },
            },
            defaultProps: {
                layout: 'horizontal',
                title: 'Garantia de 7 dias',
                description:
                    'Experimente com tranquilidade. Se não fizer sentido, solicite o reembolso dentro do prazo.',
                days: 7,
            },
            render: ({ layout, title, description, days }) => (
                <CheckoutGuarantee
                    layout={layout ?? 'horizontal'}
                    title={title}
                    description={description}
                    days={days}
                />
            ),
        },
        countdown: {
            label: 'Contagem regressiva',
            fields: {
                layout: countdownLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                deadline: { type: 'text', label: 'Data limite (ISO)' },
            },
            defaultProps: {
                layout: 'cards',
                title: 'Esta condição termina em breve',
                deadline: '2026-12-31T23:59:59-03:00',
            },
            render: ({ layout, title, deadline }) => (
                <CheckoutCountdown layout={layout ?? 'cards'} title={title} deadline={deadline} />
            ),
        },
        product_summary: {
            label: 'Itens do carrinho',
            fields: {
                layout: productLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                description: { type: 'textarea', label: 'Descrição', contentEditable: true },
            },
            defaultProps: {
                layout: 'card',
                title: 'Itens do carrinho',
                description: 'Confira o produto selecionado e suas condições.',
            },
            render: ({ layout, title, description }) => (
                <CheckoutProductSummary
                    layout={layout ?? 'card'}
                    title={title}
                    description={description}
                    product={{ name: 'Produto selecionado', quantity: '1 unidade', price: 'R$ —' }}
                />
            ),
        },
        checkout_form: {
            label: 'Dados pessoais',
            resolvePermissions: (data) => ({ delete: !isProtectedCheckoutForm(data.props.id) }),
            fields: {
                layout: formLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                description: { type: 'textarea', label: 'Descrição', contentEditable: true },
                buttonLabel: { type: 'text', label: 'Texto do botão' },
                showPhone: { type: 'radio', label: 'Telefone opcional', options: booleanOptions },
                showDocument: {
                    type: 'radio',
                    label: 'CPF/CNPJ opcional',
                    options: booleanOptions,
                },
            },
            defaultProps: {
                layout: 'card',
                title: 'Dados pessoais',
                description: 'Preencha as informações para concluir a compra.',
                buttonLabel: 'Finalizar compra',
                showPhone: false,
                showDocument: false,
            },
            render: ({ layout, title, description, buttonLabel, showPhone, showDocument }) => (
                <CustomerFormPreview
                    layout={layout ?? 'card'}
                    title={title}
                    description={description}
                    buttonLabel={buttonLabel}
                    showPhone={showPhone ?? false}
                    showDocument={showDocument ?? false}
                />
            ),
        },
        order_summary: {
            label: 'Resumo do pedido',
            fields: {
                layout: summaryLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
            },
            defaultProps: { layout: 'card', title: 'Resumo do pedido' },
            render: ({ layout, title }) => (
                <CheckoutOrderSummary
                    layout={layout ?? 'card'}
                    title={title}
                    lines={[
                        { label: 'Subtotal', value: 'R$ —' },
                        { label: 'Desconto', value: 'R$ 0,00' },
                        { label: 'Frete', value: 'A calcular' },
                    ]}
                    total="R$ —"
                />
            ),
        },
        payment_methods: {
            label: 'Formas de pagamento',
            fields: {
                layout: paymentLayoutField,
                title: { type: 'text', label: 'Título' },
                description: { type: 'textarea', label: 'Descrição' },
                showCard: { type: 'radio', label: 'Cartão', options: booleanOptions },
                showPix: { type: 'radio', label: 'Pix', options: booleanOptions },
                showBoleto: { type: 'radio', label: 'Boleto', options: booleanOptions },
            },
            defaultProps: {
                layout: 'cards',
                title: 'Formas de pagamento',
                description: 'Escolha uma forma de pagamento segura.',
                showCard: true,
                showPix: true,
                showBoleto: true,
            },
            render: ({ layout, title, description, showCard, showPix, showBoleto }) => (
                <PaymentMethodsPreview
                    layout={layout ?? 'cards'}
                    title={title}
                    description={description}
                    showCard={showCard}
                    showPix={showPix}
                    showBoleto={showBoleto}
                />
            ),
        },
        card_payment: {
            label: 'Dados de pagamento',
            fields: {
                layout: cardPaymentLayoutField,
                title: { type: 'text', label: 'Título' },
                description: { type: 'textarea', label: 'Descrição' },
                showInstallments: { type: 'radio', label: 'Parcelamento', options: booleanOptions },
            },
            defaultProps: {
                layout: 'standard',
                title: 'Dados de pagamento',
                description: 'Suas informações são protegidas e criptografadas.',
                showInstallments: true,
            },
            render: ({ layout, title, description, showInstallments }) => (
                <CheckoutCardPayment
                    layout={layout ?? 'standard'}
                    title={title}
                    description={description}
                    secureElement={
                        <CardPaymentFields
                            compact={layout === 'compact'}
                            showInstallments={showInstallments}
                        />
                    }
                />
            ),
        },
        pix_payment: {
            label: 'Pagamento via Pix',
            fields: {
                layout: paymentInstructionLayoutField,
                title: { type: 'text', label: 'Título' },
                description: { type: 'textarea', label: 'Descrição' },
                expiresIn: { type: 'text', label: 'Tempo de expiração' },
            },
            defaultProps: {
                layout: 'split',
                title: 'Pague com Pix',
                description: 'Escaneie o QR Code ou copie o código Pix.',
                expiresIn: '30 minutos',
            },
            render: ({ layout, title, description, expiresIn }) => (
                <CheckoutPaymentInstruction
                    kind="pix"
                    layout={layout ?? 'split'}
                    title={title}
                    description={description}
                    code="00020126••••••••••••••••"
                    codeLabel="Código Pix copia e cola"
                    footer={<p style={{ fontSize: 12, opacity: 0.62 }}>Expira em {expiresIn}.</p>}
                />
            ),
        },
        boleto_payment: {
            label: 'Pagamento via boleto',
            fields: {
                layout: paymentInstructionLayoutField,
                title: { type: 'text', label: 'Título' },
                description: { type: 'textarea', label: 'Descrição' },
                dueInDays: { type: 'number', label: 'Vencimento em dias', min: 1, max: 30 },
            },
            defaultProps: {
                layout: 'split',
                title: 'Pague com boleto',
                description: 'O pedido sera confirmado apos a compensacao bancaria.',
                dueInDays: 3,
            },
            render: ({ layout, title, description, dueInDays }) => (
                <CheckoutPaymentInstruction
                    kind="boleto"
                    layout={layout ?? 'split'}
                    title={title}
                    description={description}
                    code="00190.00009 01234.567890 12345.678901 1 00000000000000"
                    codeLabel="Código de barras"
                    footer={<p style={{ fontSize: 12, opacity: 0.62 }}>Vencimento em {dueInDays} dias.</p>}
                />
            ),
        },
        shipping_address: {
            label: 'Dados de entrega',
            fields: {
                title: { type: 'text', label: 'Título' },
                description: { type: 'textarea', label: 'Descrição' },
            },
            defaultProps: {
                title: 'Dados de entrega',
                description: 'Informe onde o pedido deve ser entregue.',
            },
            render: ({ title, description }) => (
                <section style={{ ...checkoutCard(), padding: 28 }}>
                    <h2 style={checkoutHeading()}>{title}</h2>
                    <p style={checkoutDescription()}>{description}</p>
                    <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(120px, 1fr) 2fr',
                                gap: 14,
                            }}
                        >
                            <CheckoutInput
                                required
                                label="CEP *"
                                name="shippingPostalCode"
                                autoComplete="postal-code"
                                placeholder="00000-000"
                            />
                            <CheckoutInput
                                required
                                label="Rua *"
                                name="shippingStreet"
                                autoComplete="address-line1"
                                placeholder="Nome da rua"
                            />
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(100px, 1fr) 2fr',
                                gap: 14,
                            }}
                        >
                            <CheckoutInput
                                required
                                label="Número *"
                                name="shippingNumber"
                                placeholder="123"
                            />
                            <CheckoutInput
                                label="Complemento"
                                name="shippingComplement"
                                autoComplete="address-line2"
                                placeholder="Apto, bloco..."
                            />
                        </div>
                        <CheckoutInput
                            required
                            label="Bairro *"
                            name="shippingDistrict"
                            placeholder="Seu bairro"
                        />
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr minmax(90px, 1fr)',
                                gap: 14,
                            }}
                        >
                            <CheckoutInput
                                required
                                label="Cidade *"
                                name="shippingCity"
                                autoComplete="address-level2"
                                placeholder="Sua cidade"
                            />
                            <CheckoutInput
                                required
                                label="Estado *"
                                name="shippingState"
                                autoComplete="address-level1"
                                placeholder="UF"
                            />
                        </div>
                    </div>
                </section>
            ),
        },
        shipping_methods: {
            label: 'Frete',
            fields: {
                title: { type: 'text', label: 'Título' },
                economyLabel: { type: 'text', label: 'Frete econômico' },
                expressLabel: { type: 'text', label: 'Frete expresso' },
            },
            defaultProps: {
                title: 'Frete',
                economyLabel: 'Entrega econômica',
                expressLabel: 'Entrega expressa',
            },
            render: ({ title, economyLabel, expressLabel }) => (
                <section style={{ ...checkoutCard(), padding: 28 }}>
                    <h2 style={checkoutHeading()}>{title}</h2>
                    <p style={checkoutDescription()}>
                        Selecione a opção que funciona melhor para você.
                    </p>
                    <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
                        <ShippingOption
                            value="economy"
                            title={economyLabel}
                            detail="5 a 8 dias úteis"
                            price="R$ 12,90"
                            defaultChecked
                        />
                        <ShippingOption
                            value="express"
                            title={expressLabel}
                            detail="2 a 3 dias úteis"
                            price="R$ 24,90"
                        />
                    </div>
                </section>
            ),
        },
        coupon_field: {
            label: 'Cupom de desconto',
            fields: {
                layout: couponLayoutField,
                title: { type: 'text', label: 'Título' },
                placeholder: { type: 'text', label: 'Placeholder' },
                buttonLabel: { type: 'text', label: 'Texto do botão' },
            },
            defaultProps: {
                layout: 'inline',
                title: 'Tem um cupom?',
                placeholder: 'Digite o código',
                buttonLabel: 'Aplicar',
            },
            render: ({ layout, title, placeholder, buttonLabel }) => (
                <CouponPreview
                    layout={layout ?? 'inline'}
                    title={title}
                    placeholder={placeholder}
                    buttonLabel={buttonLabel}
                />
            ),
        },
        security_badges: {
            label: 'Selos de seguranca',
            fields: {
                layout: trustLayoutField,
                title: { type: 'text', label: 'Titulo' },
                showEncryption: { type: 'radio', label: 'Criptografia', options: booleanOptions },
                showGuarantee: { type: 'radio', label: 'Garantia', options: booleanOptions },
                showPrivacy: { type: 'radio', label: 'Privacidade', options: booleanOptions },
            },
            defaultProps: {
                layout: 'pills',
                title: 'Compra protegida',
                showEncryption: true,
                showGuarantee: true,
                showPrivacy: true,
            },
            render: ({ layout, title, showEncryption, showGuarantee, showPrivacy }) => (
                <CheckoutTrustBadges
                    layout={layout ?? 'pills'}
                    title={title}
                    badges={[
                        ...(showEncryption ? [{ id: 'encryption', label: 'Dados criptografados' }] : []),
                        ...(showGuarantee ? [{ id: 'guarantee', label: 'Compra garantida' }] : []),
                        ...(showPrivacy ? [{ id: 'privacy', label: 'Privacidade protegida' }] : []),
                    ]}
                />
            ),
        },
        plan_comparison: {
            label: 'Comparação de planos',
            fields: {
                layout: planComparisonLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                plans: {
                    type: 'array',
                    label: 'Planos',
                    min: 1,
                    max: 6,
                    arrayFields: {
                        name: { type: 'text', label: 'Nome' },
                        price: { type: 'text', label: 'Preço' },
                        description: { type: 'textarea', label: 'Descrição' },
                        featured: { type: 'radio', label: 'Destaque', options: booleanOptions },
                    },
                    defaultItemProps: {
                        name: 'Plano',
                        price: 'R$ 97',
                        description: 'Acesso completo aos principais recursos.',
                        featured: false,
                    },
                    getItemSummary: (item) => item.name,
                },
            },
            defaultProps: {
                layout: 'cards',
                title: 'Escolha o melhor plano',
                plans: [
                    { name: 'Básico', price: 'R$ 47', description: 'Para começar.', featured: false },
                    { name: 'Pro', price: 'R$ 97', description: 'Mais vendido.', featured: true },
                ],
            },
            render: ({ layout, title, plans }) => (
                <CheckoutPlans layout={layout ?? 'cards'} title={title} plans={plans} />
            ),
        },
        data_table: {
            label: 'Tabela',
            fields: {
                layout: dataTableLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                showLines: { type: 'radio', label: 'Linhas internas', options: booleanOptions },
                rows: {
                    type: 'array',
                    label: 'Linhas',
                    min: 1,
                    max: 12,
                    arrayFields: {
                        label: { type: 'text', label: 'Nome' },
                        value: { type: 'text', label: 'Valor' },
                        detail: { type: 'textarea', label: 'Detalhe' },
                    },
                    defaultItemProps: { label: 'Item', value: 'Incluido', detail: 'Detalhe da linha.' },
                    getItemSummary: (item) => item.label,
                },
            },
            defaultProps: {
                layout: 'table',
                title: 'O que está incluído',
                showLines: true,
                rows: [
                    { label: 'Acesso', value: 'Completo', detail: 'Todos os módulos liberados.' },
                    { label: 'Suporte', value: 'Prioritário', detail: 'Atendimento em horário comercial.' },
                ],
            },
            render: ({ layout, title, showLines, rows }) => (
                <CheckoutDataTable
                    layout={layout ?? 'table'}
                    title={title}
                    showLines={showLines ?? true}
                    rows={rows}
                />
            ),
        },
        stats: {
            label: 'Estatísticas',
            fields: {
                layout: statsLayoutField,
                title: { type: 'text', label: 'Título', contentEditable: true },
                items: {
                    type: 'array',
                    label: 'Metricas',
                    min: 1,
                    max: 8,
                    arrayFields: {
                        value: { type: 'text', label: 'Valor' },
                        label: { type: 'text', label: 'Rótulo' },
                        detail: { type: 'text', label: 'Detalhe' },
                    },
                    defaultItemProps: { value: '98%', label: 'Satisfacao', detail: 'entre clientes' },
                    getItemSummary: (item) => item.label,
                },
            },
            defaultProps: {
                layout: 'cards',
                title: 'Resultados em numeros',
                items: [
                    { value: '98%', label: 'Satisfacao', detail: 'entre clientes' },
                    { value: '+2k', label: 'Compras', detail: 'processadas' },
                ],
            },
            render: ({ layout, title, items }) => (
                <CheckoutStats layout={layout ?? 'cards'} title={title} items={items} />
            ),
        },
        before_after: {
            label: 'Antes e depois',
            fields: {
                layout: beforeAfterLayoutField,
                title: { type: 'text', label: 'Titulo', contentEditable: true },
                beforeTitle: { type: 'text', label: 'Titulo antes' },
                beforeText: { type: 'textarea', label: 'Texto antes' },
                afterTitle: { type: 'text', label: 'Titulo depois' },
                afterText: { type: 'textarea', label: 'Texto depois' },
            },
            defaultProps: {
                layout: 'split',
                title: 'Antes e depois',
                beforeTitle: 'Antes',
                beforeText: 'Processo manual, lento e sem clareza.',
                afterTitle: 'Depois',
                afterText: 'Fluxo organizado, rápido e previsível.',
            },
            render: (props) => (
                <CheckoutBeforeAfter
                    layout={props.layout ?? 'split'}
                    title={props.title}
                    before={{ title: props.beforeTitle, text: props.beforeText }}
                    after={{ title: props.afterTitle, text: props.afterText }}
                />
            ),
        },
        client_logos: {
            label: 'Logos de clientes',
            fields: {
                layout: clientLogosLayoutField,
                title: { type: 'text', label: 'Titulo', contentEditable: true },
                logos: {
                    type: 'array',
                    label: 'Logos',
                    min: 1,
                    max: 16,
                    arrayFields: {
                        name: { type: 'text', label: 'Nome' },
                        imageUrl: { type: 'text', label: 'URL da imagem' },
                    },
                    defaultItemProps: { name: 'Cliente', imageUrl: '' },
                    getItemSummary: (item) => item.name,
                },
            },
            defaultProps: {
                layout: 'grid',
                title: 'Clientes que confiam',
                logos: [
                    { name: 'Cliente A', imageUrl: '' },
                    { name: 'Cliente B', imageUrl: '' },
                    { name: 'Cliente C', imageUrl: '' },
                ],
            },
            render: ({ layout, title, logos }) => (
                <CheckoutClientLogos layout={layout ?? 'grid'} title={title} logos={logos} />
            ),
        },
        floating_cta: {
            label: 'CTA flutuante',
            fields: {
                layout: floatingCtaLayoutField,
                text: { type: 'text', label: 'Texto' },
                buttonLabel: { type: 'text', label: 'Botão' },
            },
            defaultProps: {
                layout: 'bar',
                text: 'Pronto para finalizar?',
                buttonLabel: 'Comprar agora',
            },
            render: ({ layout, text, buttonLabel }) => (
                <CheckoutFloatingCta layout={layout ?? 'bar'} text={text} buttonLabel={buttonLabel} />
            ),
        },
        spacer_divider: {
            label: 'Espaçador e divisor',
            fields: {
                layout: spacerDividerLayoutField,
                size: { type: 'select', label: 'Tamanho', options: sizeOptions },
                label: { type: 'text', label: 'Texto' },
            },
            defaultProps: { layout: 'line', size: 'md', label: 'Continuar' },
            render: ({ layout, size, label }) => (
                <CheckoutDivider layout={layout ?? 'line'} size={size ?? 'md'} label={label} />
            ),
        },
        footer: {
            label: 'Rodape',
            fields: {
                layout: footerLayoutField,
                text: { type: 'text', label: 'Texto', contentEditable: true },
                showSecurity: {
                    type: 'radio',
                    label: 'Selo de seguranca',
                    options: [
                        { label: 'Exibir', value: true },
                        { label: 'Ocultar', value: false },
                    ],
                },
            },
            defaultProps: {
                layout: 'centered',
                text: 'Pagamento seguro processado pelo Astro.',
                showSecurity: true,
            },
            render: ({ layout, text, showSecurity }) => (
                <CheckoutFooter
                    layout={layout ?? 'centered'}
                    text={text}
                    showSecurity={showSecurity}
                />
            ),
        },
    },
};

type TemplateOption<T extends string> = { value: T; label: string; description: string };

function templateField<T extends string>(label: string, options: TemplateOption<T>[]) {
    return {
        type: 'custom' as const,
        label,
        render: ({ value, onChange }: { value: T; onChange: (value: T) => void }) => (
            <TemplatePicker value={value} options={options} onChange={onChange} />
        ),
    };
}

function TemplatePicker<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: TemplateOption<T>[];
    onChange: (value: T) => void;
}) {
    return (
        <div className="checkout-hero-layout-picker">
            {options.map((option, index) => (
                <button
                    key={option.value}
                    type="button"
                    className="checkout-hero-layout-option"
                    data-selected={(value ?? options[0].value) === option.value}
                    aria-pressed={(value ?? options[0].value) === option.value}
                    onClick={() => onChange(option.value)}
                >
                    <span
                        style={{
                            display: 'grid',
                            height: 54,
                            gridTemplateColumns: index === 1 ? '1fr' : 'repeat(3, 1fr)',
                            alignItems: 'center',
                            gap: 4,
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            background:
                                index === 2
                                    ? 'var(--brand)'
                                    : 'color-mix(in srgb, var(--brand-soft) 72%, var(--surface))',
                            padding: 7,
                        }}
                    >
                        {[1, 2, 3].map((item) => (
                            <i
                                key={item}
                                style={{
                                    display: 'block',
                                    height: index === 1 ? 7 : 28,
                                    borderRadius: 4,
                                    background:
                                        index === 2
                                            ? 'rgb(255 255 255 / 76%)'
                                            : item === 1
                                              ? 'color-mix(in srgb, var(--brand) 42%, var(--surface))'
                                              : 'color-mix(in srgb, var(--brand-soft) 72%, var(--surface-muted))',
                                }}
                            />
                        ))}
                    </span>
                    <span>
                        <strong style={{ display: 'block', fontSize: 12 }}>{option.label}</strong>
                        <small
                            style={{
                                display: 'block',
                                marginTop: 3,
                                color: '#717185',
                                fontSize: 10,
                                lineHeight: 1.35,
                            }}
                        >
                            {option.description}
                        </small>
                    </span>
                </button>
            ))}
        </div>
    );
}

type BenefitItem = { title: string; description: string };

// Temporary visual migration reference; the builder renders CheckoutBenefits.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BenefitsSection({
    layout,
    title,
    items,
}: {
    layout: BenefitsLayout;
    title: string;
    items: BenefitItem[];
}) {
    const itemCount = Math.max(items.length, 1);
    if (layout === 'checklist')
        return (
            <section style={{ ...card(), padding: 'clamp(26px, 5vw, 46px)' }}>
                <h2 style={heading()}>{title}</h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
                        gap: 12,
                        marginTop: 24,
                    }}
                >
                    {items.map((item, index) => (
                        <article
                            key={`${item.title}-${index}`}
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'flex-start',
                                border: 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
                                borderRadius: 16,
                                background: 'var(--checkout-muted)',
                                padding: 16,
                            }}
                        >
                            <span style={{ ...numberBadge(), width: 30, height: 30 }}>✓</span>
                            <span>
                                <strong style={{ display: 'block', fontSize: 14 }}>{item.title}</strong>
                                <small style={{ display: 'block', marginTop: 5, lineHeight: 1.55, opacity: 0.65 }}>
                                    {item.description}
                                </small>
                            </span>
                        </article>
                    ))}
                </div>
            </section>
        );
    if (layout === 'feature-grid')
        return (
            <section
                style={{
                    ...card(),
                    overflow: 'hidden',
                    padding: 0,
                    background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--checkout-accent) 9%, var(--checkout-surface)), var(--checkout-surface))',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            alignContent: 'center',
                            minHeight: 260,
                            padding: 'clamp(28px, 5vw, 54px)',
                            borderRight: 'var(--checkout-card-border-width) solid var(--checkout-component-divider)',
                        }}
                    >
                        <span style={heroEyebrow()}>Beneficios</span>
                        <h2 style={{ ...heading(), marginTop: 12 }}>{title}</h2>
                        <p
                            style={{
                                margin: '14px 0 0',
                                maxWidth: 360,
                                fontSize: 14,
                                lineHeight: 1.7,
                                opacity: 0.64,
                            }}
                        >
                            Destaques organizados para leitura rapida, sem limitar a quantidade de itens.
                        </p>
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(auto-fit, minmax(${itemCount > 4 ? 190 : 220}px, 1fr))`,
                            gap: 0,
                        }}
                    >
                        {items.map((item, index) => (
                            <article
                                key={`${item.title}-${index}`}
                                style={{
                                    minHeight: 180,
                                    padding: 24,
                                    borderLeft:
                                        'var(--checkout-card-border-width) solid var(--checkout-component-divider)',
                                    borderTop:
                                        index > 0
                                            ? 'var(--checkout-card-border-width) solid var(--checkout-component-divider)'
                                            : 0,
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-grid',
                                        minWidth: 34,
                                        height: 34,
                                        placeItems: 'center',
                                        borderRadius: 999,
                                        background: 'var(--checkout-accent)',
                                        color: '#fff',
                                        fontSize: 12,
                                        fontWeight: 900,
                                        paddingInline: 10,
                                    }}
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <h3
                                    style={{
                                        margin: '18px 0 0',
                                        fontSize: 18,
                                        letterSpacing: '-.02em',
                                    }}
                                >
                                    {item.title}
                                </h3>
                                <p
                                    style={{
                                        margin: '9px 0 0',
                                        fontSize: 13,
                                        lineHeight: 1.65,
                                        opacity: 0.68,
                                    }}
                                >
                                    {item.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        );
    if (layout === 'cards')
        return (
            <section style={{ ...fullWidth(), padding: '32px 0' }}>
                <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 16,
                        marginTop: 28,
                    }}
                >
                    {items.map((item, index) => (
                        <article key={`${item.title}-${index}`} style={{ ...card(), padding: 24 }}>
                            <span style={numberBadge()}>{index + 1}</span>
                            <h3 style={{ margin: '18px 0 0', fontSize: 18 }}>{item.title}</h3>
                            <p
                                style={{
                                    margin: '9px 0 0',
                                    fontSize: 14,
                                    lineHeight: 1.65,
                                    opacity: 0.68,
                                }}
                            >
                                {item.description}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        );
    if (layout === 'list')
        return (
            <section style={{ ...card(), padding: 'clamp(28px, 5vw, 48px)' }}>
                <h2 style={heading()}>{title}</h2>
                <div style={{ display: 'grid', gap: 0, marginTop: 24 }}>
                    {items.map((item, index) => (
                        <div
                            key={`${item.title}-${index}`}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '40px minmax(0,1fr)',
                                gap: 14,
                                padding: '18px 0',
                                borderTop: 'var(--checkout-card-border-width) solid var(--checkout-component-divider)',
                            }}
                        >
                            <span style={{ ...numberBadge(), width: 36, height: 36 }}>✓</span>
                            <div>
                                <strong style={{ fontSize: 15 }}>{item.title}</strong>
                                <p
                                    style={{
                                        margin: '5px 0 0',
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        opacity: 0.66,
                                    }}
                                >
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    if (layout === 'steps')
        return (
            <section style={{ ...fullWidth(), padding: '32px 0' }}>
                <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
                        gap: 12,
                        marginTop: 28,
                    }}
                >
                    {items.map((item, index) => (
                        <article
                            key={`${item.title}-${index}`}
                            style={{
                                position: 'relative',
                                padding: 24,
                                borderTop: '3px solid var(--checkout-accent)',
                                background:
                                    'color-mix(in srgb, var(--checkout-accent) 5%, var(--checkout-surface))',
                                borderRadius: '0 0 var(--checkout-radius) var(--checkout-radius)',
                            }}
                        >
                            <span
                                style={{
                                    color: 'var(--checkout-accent)',
                                    fontSize: 12,
                                    fontWeight: 850,
                                }}
                            >
                                0{index + 1}
                            </span>
                            <h3 style={{ margin: '12px 0 0', fontSize: 17 }}>{item.title}</h3>
                            <p
                                style={{
                                    margin: '8px 0 0',
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    opacity: 0.66,
                                }}
                            >
                                {item.description}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        );
    return null;
}

type TestimonialItem = { quote: string; name: string; role: string };

// Temporary visual migration reference; the builder renders CheckoutTestimonials.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TestimonialsSection({
    layout,
    title,
    items,
}: {
    layout: TestimonialsLayout;
    title: string;
    items: TestimonialItem[];
}) {
    if (layout === 'spotlight' && items.length) {
        const [first, ...rest] = items;
        return (
            <section
                style={{
                    ...card(),
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: 18,
                    padding: 'clamp(26px, 5vw, 48px)',
                    alignItems: 'stretch',
                }}
            >
                <div>
                    <span style={heroEyebrow()}>Prova social</span>
                    <h2 style={{ ...heading(), marginTop: 12 }}>{title}</h2>
                    <TestimonialCard item={first} featured />
                </div>
                <div style={{ display: 'grid', gap: 12, alignContent: 'center' }}>
                    {rest.map((item, index) => (
                        <TestimonialMini key={`${item.name}-${index}`} item={item} />
                    ))}
                </div>
            </section>
        );
    }
    if (layout === 'wall')
        return (
            <section style={{ ...fullWidth(), padding: '32px 0' }}>
                <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                        gap: 12,
                        marginTop: 28,
                    }}
                >
                    {items.map((item, index) => (
                        <TestimonialMini key={`${item.name}-${index}`} item={item} tall={index % 3 === 0} />
                    ))}
                </div>
            </section>
        );
    if (layout === 'featured' && items.length)
        return (
            <section style={{ ...fullWidth(), padding: '32px 0' }}>
                <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                        gap: 16,
                        marginTop: 28,
                    }}
                >
                    <TestimonialCard item={items[0]} featured />
                    {items.length > 1 && (
                        <div style={{ display: 'grid', gap: 16 }}>
                            {items.slice(1).map((item, index) => (
                                <TestimonialCard key={`${item.name}-${index}`} item={item} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        );
    if (layout === 'compact')
        return (
            <section style={{ ...card(), padding: 28 }}>
                <h2 style={{ ...checkoutHeading(), fontSize: 18 }}>{title}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 20 }}>
                    {items.map((item, index) => (
                        <blockquote
                            key={`${item.name}-${index}`}
                            style={{ minWidth: 220, flex: 1, margin: 0 }}
                        >
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65 }}>
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <footer style={{ marginTop: 10, fontSize: 11, opacity: 0.62 }}>
                                {item.name} · {item.role}
                            </footer>
                        </blockquote>
                    ))}
                </div>
            </section>
        );
    return (
        <section style={{ ...fullWidth(), padding: '32px 0' }}>
            <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                    marginTop: 28,
                }}
            >
                {items.map((item, index) => (
                    <TestimonialCard key={`${item.name}-${index}`} item={item} />
                ))}
            </div>
        </section>
    );
}

function TestimonialCard({
    item,
    featured = false,
}: {
    item: TestimonialItem;
    featured?: boolean;
}) {
    return (
        <blockquote
            style={{
                ...card(),
                margin: 0,
                padding: featured ? 36 : 28,
                background: featured
                    ? 'color-mix(in srgb, var(--checkout-accent) 8%, var(--checkout-surface))'
                    : 'var(--checkout-surface)',
            }}
        >
            <span style={{ color: 'var(--checkout-accent)', fontSize: 30, lineHeight: 1 }}>“</span>
            <p style={{ margin: '8px 0 0', fontSize: featured ? 20 : 16, lineHeight: 1.7 }}>
                {item.quote}
            </p>
            <footer style={{ marginTop: 20 }}>
                <strong style={{ fontSize: 14 }}>{item.name}</strong>
                <span style={{ display: 'block', marginTop: 3, fontSize: 12, opacity: 0.6 }}>
                    {item.role}
                </span>
            </footer>
        </blockquote>
    );
}

function TestimonialMini({ item, tall = false }: { item: TestimonialItem; tall?: boolean }) {
    return (
        <blockquote
            style={{
                ...card(),
                margin: 0,
                minHeight: tall ? 190 : undefined,
                padding: 20,
            }}
        >
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>&ldquo;{item.quote}&rdquo;</p>
            <footer style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                <span
                    style={{
                        display: 'grid',
                        width: 34,
                        height: 34,
                        placeItems: 'center',
                        borderRadius: 999,
                        background:
                            'color-mix(in srgb, var(--checkout-accent) 14%, var(--checkout-muted))',
                        color: 'var(--checkout-accent)',
                        fontWeight: 800,
                    }}
                >
                    {item.name.slice(0, 1)}
                </span>
                <span>
                    <strong style={{ display: 'block', fontSize: 13 }}>{item.name}</strong>
                    <small style={{ opacity: 0.58 }}>{item.role}</small>
                </span>
            </footer>
        </blockquote>
    );
}

type FaqItem = { question: string; answer: string };

// Temporary visual migration reference; the builder renders CheckoutFaq.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FaqSection({
    layout,
    title,
    items,
}: {
    layout: FaqLayout;
    title: string;
    items: FaqItem[];
}) {
    if (layout === 'cards') {
        return (
            <section style={{ ...fullWidth(), padding: '32px 0' }}>
                <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 16,
                        marginTop: 28,
                    }}
                >
                    {items.map((item, index) => (
                        <article
                            key={`${item.question}-${index}`}
                            style={{ ...card(), padding: 24 }}
                        >
                            <span
                                style={{
                                    display: 'grid',
                                    width: 34,
                                    height: 34,
                                    placeItems: 'center',
                                    borderRadius: 10,
                                    background:
                                        'color-mix(in srgb, var(--checkout-accent) 12%, var(--checkout-muted))',
                                    color: 'var(--checkout-accent)',
                                    fontWeight: 850,
                                }}
                            >
                                ?
                            </span>
                            <h3 style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.4 }}>
                                {item.question}
                            </h3>
                            <p
                                style={{
                                    margin: '9px 0 0',
                                    fontSize: 14,
                                    lineHeight: 1.7,
                                    opacity: 0.68,
                                }}
                            >
                                {item.answer}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        );
    }

    const questions = (
        <div>
            {items.map((item, index) => (
                <details
                    key={`${item.question}-${index}`}
                    style={{
                        borderTop: index === 0 ? '1px solid var(--checkout-border)' : 0,
                        borderBottom: 'var(--checkout-card-border-width) solid var(--checkout-component-divider)',
                        padding: '18px 2px',
                    }}
                >
                    <summary style={{ cursor: 'pointer', fontWeight: 750, lineHeight: 1.45 }}>
                        {item.question}
                    </summary>
                    <p
                        style={{
                            margin: '12px 24px 0 0',
                            fontSize: 14,
                            lineHeight: 1.7,
                            opacity: 0.7,
                        }}
                    >
                        {item.answer}
                    </p>
                </details>
            ))}
        </div>
    );
    if (layout === 'split') {
        return (
            <section
                style={{
                    ...card(),
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: 'clamp(28px, 6vw, 72px)',
                    alignItems: 'start',
                    padding: 'clamp(28px, 5vw, 52px)',
                }}
            >
                <div>
                    <span style={heroEyebrow()}>Tire suas dúvidas</span>
                    <h2 style={{ ...heading(), marginTop: 12 }}>{title}</h2>
                    <p
                        style={{
                            margin: '14px 0 0',
                            maxWidth: 390,
                            fontSize: 14,
                            lineHeight: 1.7,
                            opacity: 0.64,
                        }}
                    >
                        Encontre respostas rápidas antes de concluir sua compra.
                    </p>
                </div>
                {questions}
            </section>
        );
    }
    return (
        <section style={{ ...card(), padding: 'clamp(28px, 5vw, 52px)' }}>
            <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
            <div style={{ maxWidth: 800, margin: '28px auto 0' }}>{questions}</div>
        </section>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function VideoPlayer({
    url,
    title,
    caption,
    posterUrl,
    aspectRatio,
    autoplay,
    controls,
}: {
    url: string;
    title: string;
    caption: string;
    posterUrl: string;
    aspectRatio: VideoRatio;
    autoplay: boolean;
    controls: boolean;
}) {
    const source = resolveVideoSource(url, autoplay, controls);
    return (
        <figure style={{ ...card(), margin: 0, overflow: 'hidden', padding: 10 }}>
            <div
                style={{
                    position: 'relative',
                    aspectRatio,
                    overflow: 'hidden',
                    borderRadius: 'calc(var(--checkout-radius) - 6px)',
                    background: '#11131c',
                }}
            >
                {source?.kind === 'embed' && (
                    <iframe
                        title={title || 'Vídeo'}
                        src={source.url}
                        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                        }}
                    />
                )}
                {source?.kind === 'direct' && (
                    <video
                        title={title || 'Vídeo'}
                        src={source.url}
                        poster={safeHttpsUrl(posterUrl) ? posterUrl : undefined}
                        autoPlay={autoplay}
                        muted={autoplay}
                        controls={controls}
                        playsInline
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            background: '#08090d',
                        }}
                    />
                )}
                {!source && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'grid',
                            placeItems: 'center',
                            color: '#fff',
                            textAlign: 'center',
                            background:
                                'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--checkout-accent) 32%, #171923), #0d0e14 72%)',
                        }}
                    >
                        <div>
                            <span
                                style={{
                                    display: 'grid',
                                    width: 64,
                                    height: 64,
                                    margin: '0 auto',
                                    placeItems: 'center',
                                    border: '1px solid rgb(255 255 255 / 24%)',
                                    borderRadius: '50%',
                                    background: 'var(--checkout-accent)',
                                    boxShadow:
                                        '0 14px 34px color-mix(in srgb, var(--checkout-accent) 38%, transparent)',
                                    fontSize: 24,
                                }}
                            >
                                ▶
                            </span>
                            <strong style={{ display: 'block', marginTop: 16, fontSize: 15 }}>
                                Adicione seu vídeo
                            </strong>
                            <small style={{ display: 'block', marginTop: 5, opacity: 0.62 }}>
                                YouTube, Vimeo ou arquivo HTTPS
                            </small>
                        </div>
                    </div>
                )}
            </div>
            {caption && (
                <figcaption
                    style={{
                        padding: '12px 8px 4px',
                        textAlign: 'center',
                        fontSize: 13,
                        lineHeight: 1.5,
                        opacity: 0.65,
                    }}
                >
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}

function resolveVideoSource(
    value: string,
    autoplay: boolean,
    controls: boolean,
): { kind: 'embed' | 'direct'; url: string } | null {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') return null;
        const host = url.hostname.replace(/^www\./, '');
        let id = '';
        if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] ?? '';
        if (host === 'youtube.com' || host === 'm.youtube.com')
            id =
                url.searchParams.get('v') ??
                url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ??
                '';
        if (/^[\w-]{6,20}$/.test(id))
            return {
                kind: 'embed',
                url: `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}&rel=0`,
            };
        if (host === 'vimeo.com' || host === 'player.vimeo.com') {
            const vimeoId = url.pathname
                .split('/')
                .filter(Boolean)
                .findLast((part) => /^\d+$/.test(part));
            if (vimeoId)
                return {
                    kind: 'embed',
                    url: `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}`,
                };
        }
        return { kind: 'direct', url: url.toString() };
    } catch {
        return null;
    }
}

// Temporary visual migration reference; the builder renders CheckoutGuarantee.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GuaranteeSection({
    layout,
    title,
    description,
    days,
}: {
    layout: GuaranteeLayout;
    title: string;
    description: string;
    days: number;
}) {
    const titleIncludesDays = new RegExp(`\\b${days}\\s*dias?\\b`, 'i').test(title);
    const seal = <GuaranteeSeal days={days} compact={layout === 'minimal'} />;
    if (layout === 'minimal')
        return (
            <section
                style={{
                    ...card(),
                    display: 'grid',
                    gridTemplateColumns: titleIncludesDays
                        ? 'minmax(0, 1fr)'
                        : 'auto minmax(0, 1fr)',
                    alignItems: 'center',
                    gap: 14,
                    padding: 'clamp(16px, 4vw, 22px)',
                    boxShadow: 'none',
                }}
            >
                {!titleIncludesDays && seal}
                <div>
                    <h2 style={{ ...checkoutHeading(), fontSize: 17 }}>{title}</h2>
                    <p style={{ margin: '5px 0 0', fontSize: 13, lineHeight: 1.55, opacity: 0.66 }}>
                        {description}
                    </p>
                </div>
            </section>
        );
    if (layout === 'boxed')
        return (
            <section
                style={{
                    ...card(),
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0,1fr)',
                    gap: 18,
                    alignItems: 'center',
                    padding: 'clamp(24px, 5vw, 42px)',
                    background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--checkout-accent) 8%, var(--checkout-group-bg)), var(--checkout-group-bg))',
                }}
            >
                {seal}
                <div>
                    <h2 style={{ ...checkoutHeading(), fontSize: 24 }}>{title}</h2>
                    <p style={{ margin: '8px 0 0', maxWidth: 720, lineHeight: 1.7, opacity: 0.68 }}>
                        {description}
                    </p>
                </div>
            </section>
        );
    if (layout === 'seal')
        return (
            <section style={{ ...card(), padding: 'clamp(28px,6vw,54px)', textAlign: 'center' }}>
                <span style={{ display: 'inline-grid' }}>{seal}</span>
                <h2 style={{ margin: '22px 0 0', fontSize: 25 }}>{title}</h2>
                <p
                    style={{
                        maxWidth: 680,
                        margin: '10px auto 0',
                        lineHeight: 1.65,
                        opacity: 0.68,
                    }}
                >
                    {description}
                </p>
            </section>
        );
    if (layout === 'banner')
        return (
            <section
                style={{
                    ...fullWidth(),
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr)',
                    alignItems: 'center',
                    gap: 24,
                    borderRadius: 'var(--checkout-radius)',
                    background:
                        'linear-gradient(135deg,var(--checkout-accent),color-mix(in srgb,var(--checkout-accent) 70%,#17152d))',
                    color: '#fff',
                    padding: 'clamp(26px,5vw,46px)',
                    boxShadow: 'var(--checkout-shadow)',
                }}
            >
                <GuaranteeSeal days={days} inverted />
                <div>
                    <h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2>
                    <p style={{ margin: '7px 0 0', lineHeight: 1.6, opacity: 0.78 }}>
                        {description}
                    </p>
                </div>
            </section>
        );
    return (
        <section
            style={{
                ...card(),
                display: 'grid',
                gridTemplateColumns: 'auto minmax(0, 1fr)',
                alignItems: 'center',
                gap: 18,
                padding: 'clamp(22px, 5vw, 32px)',
                border: 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
            }}
        >
            {seal}
            <div>
                <h2 style={{ margin: 0, fontSize: 23 }}>{title}</h2>
                <p style={{ margin: '8px 0 0', lineHeight: 1.65, opacity: 0.7 }}>{description}</p>
            </div>
        </section>
    );
}

function GuaranteeSeal({
    days,
    compact = false,
    inverted = false,
}: {
    days: number;
    compact?: boolean;
    inverted?: boolean;
}) {
    const size = compact ? 46 : 68;
    return (
        <span
            aria-hidden="true"
            style={{
                display: 'grid',
                width: size,
                height: size,
                flex: `0 0 ${size}px`,
                placeItems: 'center',
                border: inverted
                    ? '1px solid rgb(255 255 255 / 42%)'
                    : 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
                borderRadius: 18,
                background: inverted
                    ? 'rgb(255 255 255 / 14%)'
                    : 'color-mix(in srgb, var(--checkout-accent) 10%, var(--checkout-surface))',
                color: inverted ? '#fff' : 'var(--checkout-accent)',
                boxShadow: inverted
                    ? 'none'
                    : '0 12px 26px color-mix(in srgb, var(--checkout-accent) 16%, transparent)',
                textAlign: 'center',
            }}
        >
            <span style={{ display: 'grid', gap: 1, lineHeight: 1 }}>
                <strong style={{ fontSize: compact ? 17 : 24, fontWeight: 900 }}>{days}</strong>
                <small style={{ fontSize: compact ? 8 : 9, fontWeight: 800, textTransform: 'uppercase' }}>
                    dias
                </small>
            </span>
        </span>
    );
}

// Temporary visual migration reference; the builder renders CheckoutProductSummary.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProductSection({
    layout,
    title,
    description,
}: {
    layout: ProductLayout;
    title: string;
    description: string;
}) {
    const item = (
        <>
            <div
                style={{
                    display: 'grid',
                    width: 62,
                    aspectRatio: '1',
                    placeItems: 'center',
                    borderRadius: 13,
                    background:
                        'color-mix(in srgb,var(--checkout-accent) 12%,var(--checkout-muted))',
                    color: 'var(--checkout-accent)',
                    fontSize: 22,
                }}
            >
                ◇
            </div>
            <div>
                <strong style={{ display: 'block', fontSize: 15 }}>Produto selecionado</strong>
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, opacity: 0.58 }}>
                    1 unidade
                </span>
            </div>
            <strong style={{ marginLeft: 'auto', fontSize: 20 }}>R$ —</strong>
        </>
    );
    if (layout === 'compact')
        return (
            <section
                style={{
                    ...checkoutCard(),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 18,
                }}
            >
                {item}
            </section>
        );
    if (layout === 'detailed')
        return (
            <section style={{ ...checkoutCard(), padding: 28 }}>
                <h2 style={checkoutHeading()}>{title}</h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0,1fr) auto auto',
                        gap: 18,
                        marginTop: 20,
                        padding: '18px 0',
                        borderBlock: '1px dashed var(--checkout-border)',
                        fontSize: 13,
                    }}
                >
                    <strong>Produto selecionado</strong>
                    <span style={{ opacity: 0.6 }}>Qtd. 1</span>
                    <strong>R$ —</strong>
                </div>
                <p style={{ margin: '14px 0 0', fontSize: 12, opacity: 0.58 }}>{description}</p>
            </section>
        );
    return (
        <section style={{ ...checkoutCard(), padding: 28 }}>
            <h2 style={checkoutHeading()}>{title}</h2>
            <p style={checkoutDescription()}>{description}</p>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginTop: 24,
                    paddingTop: 22,
                    borderTop: 'var(--checkout-card-border-width) solid var(--checkout-component-divider)',
                }}
            >
                {item}
            </div>
        </section>
    );
}

function CustomerFormPreview({
    layout,
    title,
    description,
    buttonLabel,
    showPhone,
    showDocument,
}: BuilderProps['checkout_form']) {
    const [values, setValues] = useState({ name: '', email: '', phone: '', document: '' });
    return (
        <CheckoutCustomerForm
            layout={layout}
            title={title}
            description={description}
            buttonLabel={buttonLabel}
            showPhone={showPhone}
            showDocument={showDocument}
            values={values}
            onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
            onSubmit={() => undefined}
        />
    );
}

// Temporary visual migration reference; the builder renders CheckoutCustomerForm.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CheckoutFormSection({
    layout,
    title,
    description,
    buttonLabel,
    showPhone,
    showDocument,
}: {
    layout: FormLayout;
    title: string;
    description: string;
    buttonLabel: string;
    showPhone: boolean;
    showDocument: boolean;
}) {
    const fields = (
        <>
            <CheckoutInput
                required
                label="Nome completo *"
                name="customerName"
                autoComplete="name"
                placeholder="Digite seu nome"
            />
            <CheckoutInput
                required
                label="E-mail *"
                name="customerEmail"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
            />
            {showPhone && (
                <CheckoutInput
                    label="Telefone"
                    name="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                />
            )}
            {showDocument && (
                <CheckoutInput
                    label="CPF/CNPJ"
                    name="customerDocument"
                    placeholder="000.000.000-00"
                />
            )}
        </>
    );
    return (
        <form
            onSubmit={(event) => event.preventDefault()}
            style={{
                ...(layout === 'plain' ? fullWidth() : checkoutCard()),
                padding: layout === 'plain' ? '12px 0' : 28,
            }}
        >
            <h2 style={checkoutHeading()}>{title}</h2>
            <p style={checkoutDescription()}>{description}</p>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        layout === 'compact' ? 'repeat(auto-fit,minmax(220px,1fr))' : '1fr',
                    gap: 16,
                    marginTop: 24,
                }}
            >
                {fields}
            </div>
            <p style={{ margin: '16px 0 0', fontSize: 10, lineHeight: 1.5, opacity: 0.58 }}>
                Ao continuar, você concorda com os <u>Termos de uso</u> e a{' '}
                <u>Política de privacidade</u>.
            </p>
            <Button
                type="submit"
                className="checkout-primary-button"
                style={{ ...primaryButton(), width: '100%', marginTop: 16 }}
            >
                {buttonLabel}
            </Button>
            <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 10, opacity: 0.5 }}>
                🔒 Pagamento e dados protegidos
            </p>
        </form>
    );
}

// Temporary visual migration reference; the builder renders CheckoutOrderSummary.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OrderSummarySection({ layout, title }: { layout: SummaryLayout; title: string }) {
    const rows = (
        <div style={{ display: 'grid', gap: 13, fontSize: 14 }}>
            <div style={summaryRow()}>
                <span style={{ opacity: 0.64 }}>Subtotal</span>
                <span>R$ —</span>
            </div>
            <div style={summaryRow()}>
                <span style={{ opacity: 0.64 }}>Desconto</span>
                <span>R$ 0,00</span>
            </div>
            <div style={summaryRow()}>
                <span style={{ opacity: 0.64 }}>Frete</span>
                <span>A calcular</span>
            </div>
        </div>
    );
    if (layout === 'receipt')
        return (
            <aside style={{ ...checkoutCard(), padding: 28, borderStyle: 'dashed' }}>
                <h2 style={checkoutHeading()}>{title}</h2>
                <div
                    style={{
                        marginTop: 20,
                        paddingBlock: 18,
                        borderBlock: '1px dashed var(--checkout-border)',
                    }}
                >
                    {rows}
                </div>
                <div style={{ ...summaryRow(), marginTop: 18, fontSize: 21, fontWeight: 850 }}>
                    <span>Total</span>
                    <span>R$ —</span>
                </div>
            </aside>
        );
    if (layout === 'highlight')
        return (
            <aside style={{ ...checkoutCard(), overflow: 'hidden' }}>
                <div style={{ padding: 24 }}>
                    <h2 style={checkoutHeading()}>{title}</h2>
                    <div style={{ marginTop: 20 }}>{rows}</div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        background: 'var(--checkout-accent)',
                        color: '#fff',
                        padding: '20px 24px',
                        fontSize: 22,
                        fontWeight: 850,
                    }}
                >
                    <span>Total</span>
                    <span>R$ —</span>
                </div>
            </aside>
        );
    return (
        <aside style={{ ...checkoutCard(), padding: 28 }}>
            <h2 style={checkoutHeading()}>{title}</h2>
            <div style={{ marginTop: 20 }}>{rows}</div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: 'var(--checkout-card-border-width) solid var(--checkout-component-divider)',
                    fontSize: 21,
                    fontWeight: 850,
                }}
            >
                <span>Total</span>
                <span>R$ —</span>
            </div>
        </aside>
    );
}

function PaymentMethodsPreview({
    layout,
    title,
    description,
    showCard,
    showPix,
    showBoleto,
}: BuilderProps['payment_methods']) {
    const options = [
        ...(showCard ? [{ id: 'card', icon: '▣', title: 'Cartão de crédito', description: 'Pague com segurança e parcele sua compra' }] : []),
        ...(showPix ? [{ id: 'pix', icon: '◇', title: 'Pix', description: 'Aprovação imediata e pagamento por QR Code' }] : []),
        ...(showBoleto ? [{ id: 'boleto', icon: '▤', title: 'Boleto bancário', description: 'Compensação em até 3 dias úteis' }] : []),
    ];
    const [selectedId, setSelectedId] = useState(options[0]?.id);
    const effectiveSelectedId = options.some((option) => option.id === selectedId)
        ? selectedId
        : options[0]?.id;
    return (
        <CheckoutPaymentMethods
            layout={layout}
            title={title}
            description={description}
            options={options}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedId}
        />
    );
}

// Temporary visual migration reference; the builder renders CheckoutPaymentMethods.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PaymentMethodsSection({
    layout,
    title,
    description,
    showCard,
    showPix,
    showBoleto,
}: {
    layout: PaymentLayout;
    title: string;
    description: string;
    showCard: boolean;
    showPix: boolean;
    showBoleto: boolean;
}) {
    const options = [
        {
            show: showCard,
            value: 'card',
            icon: '▣',
            title: 'Cartão de crédito',
            detail: 'Pague com segurança e parcele sua compra',
        },
        {
            show: showPix,
            value: 'pix',
            icon: '◇',
            title: 'Pix',
            detail: 'Aprovação imediata e pagamento por QR Code',
        },
        {
            show: showBoleto,
            value: 'boleto',
            icon: '▤',
            title: 'Boleto bancário',
            detail: 'Compensação em até 3 dias úteis',
        },
    ].filter((item) => item.show);
    return (
        <section style={{ ...checkoutCard(), padding: 'clamp(20px, 5vw, 28px)' }}>
            <h2 style={checkoutHeading()}>{title}</h2>
            <p style={checkoutDescription()}>{description}</p>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        layout === 'cards'
                            ? 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))'
                            : layout === 'segmented'
                              ? 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))'
                              : 'minmax(0, 1fr)',
                    gap: layout === 'segmented' ? 6 : 10,
                    marginTop: 22,
                    padding: layout === 'segmented' ? 5 : 0,
                    border: layout === 'segmented' ? '1px solid var(--checkout-border)' : 0,
                    borderRadius: layout === 'segmented' ? 14 : 0,
                    background: layout === 'segmented' ? 'var(--checkout-muted)' : 'transparent',
                }}
            >
                {options.map((option, index) => (
                    <PaymentOption
                        key={option.value}
                        {...option}
                        compact={layout === 'segmented'}
                        defaultChecked={index === 0}
                    />
                ))}
            </div>
            <p
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 6,
                    margin: '14px 0 0',
                    fontSize: 10,
                    opacity: 0.54,
                }}
            >
                <span style={{ color: 'var(--checkout-accent)' }}>✓</span> Ambiente protegido e
                dados criptografados
            </p>
        </section>
    );
}

function CardPaymentFields({
    compact = false,
    showInstallments,
}: {
    compact?: boolean;
    showInstallments: boolean;
}) {
    return (
        <div style={{ display: 'grid', gap: compact ? 12 : 16 }}>
            <CheckoutInput
                required
                label="Número do cartão *"
                name="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
            />
            <CheckoutInput
                required
                label="Nome impresso no cartão *"
                name="cardName"
                autoComplete="cc-name"
                placeholder="Como está no cartão"
            />
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: compact ? 10 : 14,
                }}
            >
                <CheckoutInput
                    required
                    label="Validade *"
                    name="cardExpiry"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                />
                <CheckoutInput
                    required
                    label="CVV *"
                    name="cardCvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                />
                {showInstallments && (
                    <label style={inputLabel()}>
                        <span>Parcelas</span>
                        <select name="installments" defaultValue="1" style={inputControl()}>
                            <option value="1">1x sem juros</option>
                            <option value="2">2x sem juros</option>
                            <option value="3">3x sem juros</option>
                        </select>
                    </label>
                )}
            </div>
        </div>
    );
}

// Temporary visual migration reference; the builder renders CheckoutCardPayment.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CardPaymentSection({
    layout,
    title,
    description,
    showInstallments,
}: {
    layout: CardPaymentLayout;
    title: string;
    description: string;
    showInstallments: boolean;
}) {
    if (layout === 'visual') {
        return (
            <section style={{ ...checkoutCard(), padding: 28 }}>
                <h2 style={checkoutHeading()}>{title}</h2>
                <p style={checkoutDescription()}>{description}</p>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                        gap: 28,
                        alignItems: 'center',
                        marginTop: 24,
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            display: 'flex',
                            width: '100%',
                            maxWidth: 430,
                            aspectRatio: '1.586',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            justifySelf: 'center',
                            borderRadius: 24,
                            background:
                                'radial-gradient(circle at 88% 12%, rgb(255 255 255 / 30%), transparent 26%), linear-gradient(135deg, color-mix(in srgb, var(--checkout-accent) 86%, white), var(--checkout-accent) 54%, color-mix(in srgb, var(--checkout-accent) 82%, black))',
                            boxShadow:
                                '0 20px 44px color-mix(in srgb, var(--checkout-accent) 24%, transparent)',
                            color: '#fff',
                            padding: 'clamp(18px, 4vw, 26px)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    width: 38,
                                    height: 28,
                                    borderRadius: 7,
                                    background:
                                        'linear-gradient(135deg,#f8dd8c 0 45%,#d1a747 45% 55%,#f6d77b 55%)',
                                    boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 12%)',
                                }}
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <i
                                    style={{
                                        width: 21,
                                        height: 21,
                                        borderRadius: 999,
                                        background: '#ff5f57',
                                        opacity: 0.9,
                                    }}
                                />
                                <i
                                    style={{
                                        width: 21,
                                        height: 21,
                                        marginLeft: -9,
                                        borderRadius: 999,
                                        background: '#ffbd2e',
                                        opacity: 0.9,
                                    }}
                                />
                            </span>
                        </div>
                        <strong
                            style={{ fontSize: 'clamp(16px, 2.2vw, 22px)', letterSpacing: '.12em' }}
                        >
                            •••• •••• •••• 4242
                        </strong>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 16,
                                fontSize: 10,
                                textTransform: 'uppercase',
                            }}
                        >
                            <span>
                                <small style={{ display: 'block', opacity: 0.64 }}>
                                    Nome no cartão
                                </small>
                                <b
                                    style={{
                                        display: 'block',
                                        marginTop: 4,
                                        letterSpacing: '.08em',
                                    }}
                                >
                                    SEU NOME
                                </b>
                            </span>
                            <span>
                                <small style={{ display: 'block', opacity: 0.64 }}>Validade</small>
                                <b style={{ display: 'block', marginTop: 4 }}>MM/AA</b>
                            </span>
                        </div>
                    </div>
                    <CardPaymentFields compact showInstallments={showInstallments} />
                </div>
            </section>
        );
    }

    return (
        <section style={{ ...checkoutCard(), padding: layout === 'compact' ? 22 : 28 }}>
            <h2 style={checkoutHeading()}>{title}</h2>
            <p style={checkoutDescription()}>{description}</p>
            <div style={{ marginTop: layout === 'compact' ? 18 : 24 }}>
                <CardPaymentFields
                    compact={layout === 'compact'}
                    showInstallments={showInstallments}
                />
            </div>
        </section>
    );
}

const heroLayouts: { value: Exclude<HeroLayout, 'choose'>; name: string; description: string }[] = [
    { value: 'centered', name: 'Centralizado', description: 'Título em destaque e CTA central.' },
    { value: 'split', name: 'Dividido', description: 'Conteúdo de um lado e imagem do outro.' },
    { value: 'compact', name: 'Compacto', description: 'Mensagem curta com CTA lateral.' },
    { value: 'media-card', name: 'Imagem em card', description: 'Imagem ampla com conteúdo sobreposto.' },
    { value: 'editorial', name: 'Editorial', description: 'Titulo forte, texto e imagem lateral menor.' },
];

function HeroLayoutPicker({
    value,
    onChange,
}: {
    value: HeroLayout;
    onChange: (value: HeroLayout) => void;
}) {
    const selected = value ?? 'choose';
    return (
        <div className="checkout-hero-layout-picker">
            {heroLayouts.map((layout) => (
                <button
                    key={layout.value}
                    type="button"
                    className="checkout-hero-layout-option"
                    data-selected={selected === layout.value}
                    aria-pressed={selected === layout.value}
                    onClick={() => onChange(layout.value)}
                >
                    <span className="checkout-hero-layout-preview" data-layout={layout.value}>
                        <span />
                    </span>
                    <span>
                        <strong style={{ display: 'block', fontSize: 12 }}>{layout.name}</strong>
                        <small
                            style={{
                                display: 'block',
                                marginTop: 3,
                                color: '#717185',
                                fontSize: 10,
                                lineHeight: 1.35,
                            }}
                        >
                            {layout.description}
                        </small>
                    </span>
                </button>
            ))}
        </div>
    );
}

// Kept temporarily only as a migration reference until all hero templates have visual snapshots.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HeroSection({
    layout,
    eyebrow,
    title,
    description,
    buttonLabel,
    imageUrl,
}: {
    layout: HeroLayout;
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    imageUrl: string;
}) {
    const content = (
        <>
            <p style={heroEyebrow()}>{eyebrow}</p>
            <h1
                style={{
                    margin: '14px 0 0',
                    fontSize: 'clamp(34px, 5vw, 62px)',
                    lineHeight: 1.04,
                    letterSpacing: '-.045em',
                }}
            >
                {title}
            </h1>
            <p
                style={{
                    margin: '18px 0 0',
                    maxWidth: 680,
                    fontSize: 17,
                    lineHeight: 1.7,
                    opacity: 0.72,
                }}
            >
                {description}
            </p>
        </>
    );

    if (layout === 'choose') {
        return (
            <section
                style={{
                    ...card(),
                    display: 'grid',
                    minHeight: 220,
                    placeItems: 'center',
                    border: '1.5px dashed color-mix(in srgb, var(--checkout-accent) 42%, var(--checkout-border))',
                    padding: 32,
                    textAlign: 'center',
                }}
            >
                <div>
                    <span
                        style={{
                            display: 'grid',
                            width: 44,
                            height: 44,
                            margin: '0 auto',
                            placeItems: 'center',
                            borderRadius: 13,
                            background:
                                'color-mix(in srgb, var(--checkout-accent) 12%, var(--checkout-surface))',
                            color: 'var(--checkout-accent)',
                            fontSize: 20,
                        }}
                    >
                        ▤
                    </span>
                    <strong style={{ display: 'block', marginTop: 14, fontSize: 18 }}>
                        Escolha um template de apresentação
                    </strong>
                    <span style={{ display: 'block', marginTop: 6, fontSize: 13, opacity: 0.64 }}>
                        Use o primeiro campo do painel lateral para começar.
                    </span>
                </div>
            </section>
        );
    }

    if (layout === 'split') {
        return (
            <section
                style={{
                    ...card(),
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                    alignItems: 'stretch',
                    overflow: 'hidden',
                }}
            >
                <div style={{ alignSelf: 'center', padding: 'clamp(34px, 6vw, 68px)' }}>
                    {content}
                    <Button
                        type="button"
                        className="checkout-primary-button"
                        style={primaryButton()}
                    >
                        {buttonLabel}
                    </Button>
                </div>
                <div
                    role={safeHttpsUrl(imageUrl) ? 'img' : undefined}
                    aria-label={safeHttpsUrl(imageUrl) ? 'Imagem da apresentação' : undefined}
                    style={{
                        minHeight: 'clamp(220px, 48vw, 360px)',
                        margin: 18,
                        overflow: 'hidden',
                        borderRadius: 'calc(var(--checkout-radius) - 4px)',
                        background: safeHttpsUrl(imageUrl)
                            ? `url(${JSON.stringify(imageUrl)}) center / cover no-repeat`
                            : 'radial-gradient(circle at 70% 22%, color-mix(in srgb, var(--checkout-accent) 48%, transparent), transparent 32%), linear-gradient(145deg, color-mix(in srgb, var(--checkout-accent) 16%, var(--checkout-muted)), var(--checkout-muted))',
                    }}
                />
            </section>
        );
    }

    if (layout === 'compact') {
        return (
            <section
                style={{
                    ...card(),
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 24,
                    overflow: 'hidden',
                    padding: 'clamp(28px, 5vw, 48px)',
                }}
            >
                <div style={{ minWidth: 'min(100%, 320px)', flex: '1 1 560px' }}>
                    <p style={heroEyebrow()}>{eyebrow}</p>
                    <h1
                        style={{
                            margin: '10px 0 0',
                            fontSize: 'clamp(28px, 4vw, 44px)',
                            lineHeight: 1.08,
                            letterSpacing: '-.04em',
                        }}
                    >
                        {title}
                    </h1>
                    <p
                        style={{
                            margin: '13px 0 0',
                            maxWidth: 720,
                            fontSize: 15,
                            lineHeight: 1.65,
                            opacity: 0.7,
                        }}
                    >
                        {description}
                    </p>
                </div>
                <Button
                    type="button"
                    className="checkout-primary-button"
                    style={{ ...primaryButton(), flex: '0 0 auto', marginTop: 0 }}
                >
                    {buttonLabel}
                </Button>
            </section>
        );
    }

    if (layout === 'media-card') {
        return (
            <section
                style={{
                    ...card(),
                    position: 'relative',
                    minHeight: 'clamp(360px, 78vw, 520px)',
                    overflow: 'hidden',
                    display: 'grid',
                    alignItems: 'end',
                    padding: 'clamp(20px, 4vw, 34px)',
                    background: safeHttpsUrl(imageUrl)
                        ? `linear-gradient(180deg, rgb(0 0 0 / 10%), rgb(0 0 0 / 68%)), url(${JSON.stringify(imageUrl)}) center / cover no-repeat`
                        : 'linear-gradient(135deg, color-mix(in srgb, var(--checkout-accent) 20%, var(--checkout-muted)), var(--checkout-muted))',
                    color: safeHttpsUrl(imageUrl) ? '#fff' : 'var(--checkout-text)',
                }}
            >
                <div style={{ maxWidth: 760 }}>
                    {content}
                    <Button type="button" className="checkout-primary-button" style={primaryButton()}>
                        {buttonLabel}
                    </Button>
                </div>
            </section>
        );
    }

    if (layout === 'editorial') {
        return (
            <section
                style={{
                    ...fullWidth(),
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(220px, .8fr)',
                    gap: 'clamp(22px, 5vw, 54px)',
                    alignItems: 'center',
                    padding: 'clamp(26px, 5vw, 54px) 0',
                }}
            >
                <div>
                    {content}
                    <Button type="button" className="checkout-primary-button" style={primaryButton()}>
                        {buttonLabel}
                    </Button>
                </div>
                <div
                    role={safeHttpsUrl(imageUrl) ? 'img' : undefined}
                    aria-label={safeHttpsUrl(imageUrl) ? 'Imagem da apresentacao' : undefined}
                    style={{
                        aspectRatio: '4/5',
                        borderRadius: 'var(--checkout-radius)',
                        background: safeHttpsUrl(imageUrl)
                            ? `url(${JSON.stringify(imageUrl)}) center / cover no-repeat`
                            : 'color-mix(in srgb, var(--checkout-accent) 10%, var(--checkout-muted))',
                        boxShadow: 'var(--checkout-shadow)',
                    }}
                />
            </section>
        );
    }

    return (
        <section
            style={{
                ...card(),
                position: 'relative',
                overflow: 'hidden',
                padding: 'clamp(36px, 7vw, 88px) 24px',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    width: 280,
                    height: 280,
                    borderRadius: 999,
                    background: 'var(--checkout-accent)',
                    opacity: 0.1,
                    filter: 'blur(24px)',
                    right: -80,
                    top: -100,
                }}
            />
            <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
                {content}
                <Button type="button" className="checkout-primary-button" style={primaryButton()}>
                    {buttonLabel}
                </Button>
            </div>
        </section>
    );
}

const countdownLayouts: { value: CountdownLayout; name: string; description: string }[] = [
    { value: 'cards', name: 'Blocos', description: 'Unidades separadas em cartões.' },
    { value: 'banner', name: 'Faixa de destaque', description: 'Fundo colorido e alto contraste.' },
    { value: 'minimal', name: 'Minimalista', description: 'Linha compacta e elegante.' },
];

function CountdownLayoutPicker({
    value,
    onChange,
}: {
    value: CountdownLayout;
    onChange: (value: CountdownLayout) => void;
}) {
    return (
        <div className="checkout-hero-layout-picker">
            {countdownLayouts.map((layout) => (
                <button
                    key={layout.value}
                    type="button"
                    className="checkout-hero-layout-option"
                    data-selected={(value ?? 'cards') === layout.value}
                    aria-pressed={(value ?? 'cards') === layout.value}
                    onClick={() => onChange(layout.value)}
                >
                    <CountdownTemplatePreview layout={layout.value} />
                    <span>
                        <strong style={{ display: 'block', fontSize: 12 }}>{layout.name}</strong>
                        <small
                            style={{
                                display: 'block',
                                marginTop: 3,
                                color: '#717185',
                                fontSize: 10,
                                lineHeight: 1.35,
                            }}
                        >
                            {layout.description}
                        </small>
                    </span>
                </button>
            ))}
        </div>
    );
}

function CountdownTemplatePreview({ layout }: { layout: CountdownLayout }) {
    if (layout === 'banner') {
        return (
            <span
                style={{
                    display: 'grid',
                    height: 54,
                    gridTemplateColumns: '1fr repeat(3, 12px)',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: 8,
                    background: 'var(--brand)',
                    padding: 7,
                }}
            >
                <i
                    style={{
                        width: 28,
                        height: 4,
                        borderRadius: 9,
                        background: 'white',
                        opacity: 0.8,
                    }}
                />
                {[1, 2, 3].map((item) => (
                    <i
                        key={item}
                        style={{ height: 20, borderRadius: 3, background: 'white', opacity: 0.9 }}
                    />
                ))}
            </span>
        );
    }
    if (layout === 'minimal') {
        return (
            <span
                style={{
                    display: 'flex',
                    height: 54,
                    alignItems: 'center',
                    gap: 5,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--control-bg)',
                    padding: 7,
                }}
            >
                <i style={{ width: 13, height: 13, borderRadius: 99, background: 'var(--brand)' }} />
                <i style={{ width: 24, height: 4, borderRadius: 9, background: 'color-mix(in srgb, var(--brand) 24%, var(--border))' }} />
                <i
                    style={{
                        width: 25,
                        height: 8,
                        marginLeft: 'auto',
                        borderRadius: 4,
                        background: 'var(--brand)',
                    }}
                />
            </span>
        );
    }
    return (
        <span
            style={{
                display: 'grid',
                height: 54,
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 3,
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'color-mix(in srgb, var(--brand-soft) 72%, var(--surface))',
                padding: 7,
            }}
        >
            {[1, 2, 3, 4].map((item) => (
                <i
                    key={item}
                    style={{
                        borderRadius: 4,
                        background: '#ddd8ff',
                        boxShadow: 'inset 0 -5px 0 rgb(117 102 234 / 22%)',
                    }}
                />
            ))}
        </span>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function CountdownSection({
    layout,
    title,
    deadline,
}: {
    layout: CountdownLayout;
    title: string;
    deadline: string;
}) {
    const [remaining, setRemaining] = useState<CountdownTime>({
        valid: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const update = () => setRemaining(countdownTime(deadline));
        update();
        const interval = window.setInterval(update, 1000);
        return () => window.clearInterval(interval);
    }, [deadline]);

    if (!remaining.valid) {
        return (
            <section style={{ ...card(), padding: 28, textAlign: 'center' }}>
                <strong>{title}</strong>
                <p style={{ margin: '8px 0 0', color: 'var(--checkout-accent)', fontSize: 14 }}>
                    Defina uma data válida.
                </p>
            </section>
        );
    }

    const units = [
        { value: remaining.days, label: 'Dias' },
        { value: remaining.hours, label: 'Horas' },
        { value: remaining.minutes, label: 'Min' },
        { value: remaining.seconds, label: 'Seg' },
    ];

    if (layout === 'banner') {
        return (
            <section
                style={{
                    ...fullWidth(),
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 22,
                    overflow: 'hidden',
                    borderRadius: 'var(--checkout-radius)',
                    background:
                        'linear-gradient(135deg, var(--checkout-accent), color-mix(in srgb, var(--checkout-accent) 72%, #17152d))',
                    boxShadow: 'var(--checkout-shadow)',
                    color: '#fff',
                    padding: 'clamp(24px, 4vw, 38px)',
                }}
            >
                <div>
                    <span
                        style={{
                            display: 'block',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '.12em',
                            textTransform: 'uppercase',
                            opacity: 0.72,
                        }}
                    >
                        Oferta por tempo limitado
                    </span>
                    <h2
                        style={{
                            margin: '7px 0 0',
                            fontSize: 'clamp(20px, 3vw, 30px)',
                            letterSpacing: '-.03em',
                        }}
                    >
                        {title}
                    </h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {units.map((unit) => (
                        <TimeUnit key={unit.label} {...unit} inverted />
                    ))}
                </div>
            </section>
        );
    }

    if (layout === 'minimal') {
        return (
            <section
                style={{
                    ...card(),
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 18,
                    padding: 22,
                }}
            >
                <span
                    style={{
                        display: 'grid',
                        width: 44,
                        height: 44,
                        flex: '0 0 44px',
                        placeItems: 'center',
                        borderRadius: 999,
                        background:
                            'color-mix(in srgb, var(--checkout-accent) 12%, var(--checkout-surface))',
                        color: 'var(--checkout-accent)',
                        fontSize: 20,
                    }}
                >
                    ◷
                </span>
                <div style={{ minWidth: 180, flex: '1 1 280px' }}>
                    <h2 style={{ margin: 0, fontSize: 17, letterSpacing: '-.02em' }}>{title}</h2>
                    <span style={{ display: 'block', marginTop: 4, fontSize: 12, opacity: 0.58 }}>
                        {formatDeadline(deadline)}
                    </span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 7,
                        color: 'var(--checkout-accent)',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 850,
                    }}
                >
                    {units.map((unit, index) => (
                        <span key={unit.label} style={{ display: 'contents' }}>
                            <span style={{ fontSize: 20 }}>
                                {twoDigits(unit.value)}
                                <small
                                    style={{
                                        marginLeft: 2,
                                        fontSize: 9,
                                        textTransform: 'uppercase',
                                        opacity: 0.62,
                                    }}
                                >
                                    {unit.label.slice(0, 1)}
                                </small>
                            </span>
                            {index < units.length - 1 && <span style={{ opacity: 0.35 }}>:</span>}
                        </span>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section style={{ ...card(), padding: 'clamp(26px, 5vw, 42px)', textAlign: 'center' }}>
            <span
                style={{
                    color: 'var(--checkout-accent)',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                }}
            >
                Não deixe para depois
            </span>
            <h2
                style={{
                    margin: '8px 0 0',
                    fontSize: 'clamp(21px, 3vw, 30px)',
                    letterSpacing: '-.03em',
                }}
            >
                {title}
            </h2>
            <div
                style={{
                    display: 'grid',
                    maxWidth: 620,
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: 10,
                    margin: '24px auto 0',
                }}
            >
                {units.map((unit) => (
                    <TimeUnit key={unit.label} {...unit} />
                ))}
            </div>
            <span style={{ display: 'block', marginTop: 16, fontSize: 11, opacity: 0.5 }}>
                {formatDeadline(deadline)}
            </span>
        </section>
    );
}

function TimeUnit({
    value,
    label,
    inverted = false,
}: {
    value: number;
    label: string;
    inverted?: boolean;
}) {
    return (
        <span
            style={{
                display: 'grid',
                minWidth: 62,
                border: inverted
                    ? '1px solid rgb(255 255 255 / 24%)'
                    : '1px solid var(--checkout-border)',
                borderRadius: 12,
                background: inverted ? 'rgb(255 255 255 / 12%)' : 'var(--checkout-muted)',
                padding: '12px 9px',
                textAlign: 'center',
                backdropFilter: inverted ? 'blur(8px)' : undefined,
            }}
        >
            <strong style={{ fontSize: 23, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {twoDigits(value)}
            </strong>
            <small
                style={{
                    marginTop: 6,
                    fontSize: 9,
                    fontWeight: 750,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    opacity: 0.6,
                }}
            >
                {label}
            </small>
        </span>
    );
}

type CountdownTime = {
    valid: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

function countdownTime(deadline: string): CountdownTime {
    const end = new Date(deadline).getTime();
    if (!Number.isFinite(end)) return { valid: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const total = Math.max(0, Math.floor((end - Date.now()) / 1000));
    return {
        valid: true,
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    };
}

function twoDigits(value: number) {
    return String(value).padStart(2, '0');
}

type Palette = { background: string; surface: string; text: string; muted: string; border: string };

const palettes: Record<GrayTone, { light: Palette; dark: Palette }> = {
    neutral: {
        light: {
            background: '#f7f7fb',
            surface: '#ffffff',
            text: '#202235',
            muted: '#f4f4f8',
            border: '#e4e4ec',
        },
        dark: {
            background: '#111318',
            surface: '#1b1e25',
            text: '#f5f7fa',
            muted: '#252932',
            border: '#343945',
        },
    },
    gray: {
        light: {
            background: '#f3f4f6',
            surface: '#ffffff',
            text: '#1f2937',
            muted: '#f3f4f6',
            border: '#dfe2e7',
        },
        dark: {
            background: '#111827',
            surface: '#1f2937',
            text: '#f9fafb',
            muted: '#293548',
            border: '#374151',
        },
    },
    zinc: {
        light: {
            background: '#f4f4f5',
            surface: '#ffffff',
            text: '#27272a',
            muted: '#f4f4f5',
            border: '#e4e4e7',
        },
        dark: {
            background: '#18181b',
            surface: '#27272a',
            text: '#fafafa',
            muted: '#303034',
            border: '#3f3f46',
        },
    },
    slate: {
        light: {
            background: '#f1f5f9',
            surface: '#ffffff',
            text: '#1e293b',
            muted: '#f1f5f9',
            border: '#dbe3ec',
        },
        dark: {
            background: '#0f172a',
            surface: '#1e293b',
            text: '#f8fafc',
            muted: '#27364a',
            border: '#334155',
        },
    },
};

function resolvePalette(theme: BuilderRootProps) {
    const tone = palettes[theme.grayTone] ?? palettes.neutral;
    if (theme.themeMode === 'system') return systemPalette(tone.light, tone.dark);
    const preset = theme.themeMode === 'dark' ? tone.dark : tone.light;
    if (theme.themeMode === 'light' && theme.grayTone === 'neutral') {
        return {
            ...preset,
            background: safeColor(theme.backgroundColor, preset.background),
            surface: safeColor(theme.surfaceColor, preset.surface),
            text: safeColor(theme.textColor, preset.text),
        };
    }
    return preset;
}

function systemPalette(light: Palette, dark: Palette): Palette {
    return {
        background: `light-dark(${light.background}, ${dark.background})`,
        surface: `light-dark(${light.surface}, ${dark.surface})`,
        text: `light-dark(${light.text}, ${dark.text})`,
        muted: `light-dark(${light.muted}, ${dark.muted})`,
        border: `light-dark(${light.border}, ${dark.border})`,
    };
}

function variables(theme: BuilderRootProps) {
    const shared = checkoutThemeVariables(theme, theme);
    return {
        ...shared,
        '--checkout-muted': shared['--checkout-muted-bg'],
    } as React.CSSProperties;
}

function fontStack(font: FontPreset) {
    return (
        {
            system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            geist: 'Geist, Inter, system-ui, sans-serif',
            inter: "Inter, 'Segoe UI', system-ui, sans-serif",
            montserrat: "Montserrat, Avenir, 'Segoe UI', sans-serif",
            poppins: "Poppins, Montserrat, 'Segoe UI', sans-serif",
            roboto: 'Roboto, Arial, sans-serif',
            'open-sans': "'Open Sans', Arial, sans-serif",
            lato: "Lato, 'Segoe UI', sans-serif",
            arial: 'Arial, Helvetica, sans-serif',
            georgia: "Georgia, 'Times New Roman', serif",
            serif: "'Iowan Old Style', Baskerville, 'Times New Roman', serif",
            mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
        }[font] ?? 'system-ui, sans-serif'
    );
}

function fullWidth(): React.CSSProperties {
    return { width: '100%', minWidth: 0, boxSizing: 'border-box' };
}

function card(): React.CSSProperties {
    return {
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        background: 'var(--checkout-card-bg)',
        border: 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
        borderRadius: 'var(--checkout-radius)',
        boxShadow: 'var(--checkout-card-shadow)',
        color: 'var(--checkout-text)',
    };
}

function checkoutCard(): React.CSSProperties {
    return {
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        background: 'var(--checkout-group-bg)',
        border: 'var(--checkout-group-border-width) solid var(--checkout-group-border)',
        borderRadius: 'var(--checkout-radius)',
        boxShadow: 'var(--checkout-group-shadow)',
        color: 'var(--checkout-text)',
    };
}

function heading(): React.CSSProperties {
    return {
        margin: 0,
        fontSize: 'clamp(26px, 4vw, 40px)',
        fontWeight: 'var(--checkout-heading-weight)' as React.CSSProperties['fontWeight'],
        lineHeight: 1.15,
        letterSpacing: '-.035em',
    };
}

// Temporary visual migration reference; the builder renders CheckoutPaymentInstruction.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PixPaymentSection({
    layout,
    title,
    description,
    expiresIn,
}: {
    layout: PaymentInstructionLayout;
    title: string;
    description: string;
    expiresIn: string;
}) {
    const qr = <div style={qrPlaceholder()}>PIX</div>;
    const details = (
        <div>
            <h2 style={checkoutHeading()}>{title}</h2>
            <p style={checkoutDescription()}>{description}</p>
            <p style={{ margin: '14px 0 0', fontSize: 13, opacity: 0.65 }}>
                O código expira em {expiresIn}.
            </p>
            <input
                aria-label="Código Pix"
                readOnly
                value="00020126••••••••••••••••"
                style={{ ...inputControl(), width: '100%', marginTop: 12, fontFamily: 'monospace' }}
            />
            <Button
                type="button"
                onClick={() => void navigator.clipboard?.writeText('00020126')}
                style={{ ...secondaryButton(), width: '100%', marginTop: 10 }}
            >
                Copiar código Pix
            </Button>
        </div>
    );

    if (layout === 'compact')
        return (
            <section style={{ ...checkoutCard(), display: 'grid', gap: 14, padding: 22 }}>
                {details}
            </section>
        );
    if (layout === 'card')
        return (
            <section style={{ ...checkoutCard(), padding: 28, textAlign: 'center' }}>
                <div style={{ width: 172, maxWidth: '70%', margin: '0 auto' }}>{qr}</div>
                <div style={{ marginTop: 22 }}>{details}</div>
            </section>
        );
    return (
        <section style={{ ...checkoutCard(), padding: 28 }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
                    gap: 24,
                    alignItems: 'center',
                }}
            >
                {qr}
                {details}
            </div>
        </section>
    );
}

// Temporary visual migration reference; the builder renders CheckoutPaymentInstruction.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BoletoPaymentSection({
    layout,
    title,
    description,
    dueInDays,
}: {
    layout: PaymentInstructionLayout;
    title: string;
    description: string;
    dueInDays: number;
}) {
    const barcode = (
        <div
            style={{
                height: layout === 'compact' ? 34 : 48,
                background:
                    'repeating-linear-gradient(90deg, var(--checkout-text) 0 2px, transparent 2px 5px, var(--checkout-text) 5px 8px, transparent 8px 12px)',
                opacity: 0.42,
            }}
        />
    );
    const info = (
        <>
            <h2 style={checkoutHeading()}>{title}</h2>
            <p style={checkoutDescription()}>{description}</p>
            <strong style={{ display: 'block', marginTop: 16 }}>Vencimento em {dueInDays} dias</strong>
        </>
    );
    if (layout === 'compact')
        return (
            <section style={{ ...checkoutCard(), display: 'grid', gap: 14, padding: 22 }}>
                {info}
                {barcode}
                <Button type="button" style={{ ...secondaryButton(), width: '100%' }}>Gerar boleto</Button>
            </section>
        );
    if (layout === 'card')
        return (
            <section style={{ ...checkoutCard(), padding: 28, textAlign: 'center' }}>
                {info}
                <div style={{ marginTop: 20, padding: 18, borderRadius: 14, background: 'var(--checkout-muted)' }}>
                    {barcode}
                </div>
                <Button type="button" style={{ ...secondaryButton(), width: '100%', marginTop: 12 }}>Gerar boleto</Button>
            </section>
        );
    return (
        <section style={{ ...checkoutCard(), padding: 28 }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                    gap: 22,
                    alignItems: 'center',
                }}
            >
                <div>{info}</div>
                <div
                    style={{
                        padding: 18,
                        border: 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
                        borderRadius: 14,
                        background: 'var(--checkout-muted)',
                    }}
                >
                    {barcode}
                </div>
            </div>
            <Button type="button" style={{ ...secondaryButton(), width: '100%', marginTop: 14 }}>Gerar boleto</Button>
        </section>
    );
}

function checkoutHeading(): React.CSSProperties {
    return {
        margin: 0,
        fontSize: 22,
        fontWeight: 'var(--checkout-heading-weight)' as React.CSSProperties['fontWeight'],
        lineHeight: 1.25,
        letterSpacing: '-.025em',
    };
}

function checkoutDescription(): React.CSSProperties {
    return { margin: '8px 0 0', fontSize: 14, lineHeight: 1.65, opacity: 0.68 };
}

function checkoutTable(minWidth: number): React.CSSProperties {
    return {
        width: '100%',
        minWidth,
        borderCollapse: 'separate',
        borderSpacing: 0,
        color: 'var(--checkout-text)',
        fontSize: 13,
    };
}

function tableHeadCell(align: 'left' | 'center' | 'right', showLines: boolean): React.CSSProperties {
    return {
        padding: '0 12px 12px',
        borderBottom: showLines ? '1px solid var(--checkout-visual-divider)' : 0,
        color: 'var(--checkout-accent)',
        fontSize: 11,
        fontWeight: 850,
        letterSpacing: '.08em',
        textAlign: align,
        textTransform: 'uppercase',
    };
}

function tableCell(
    align: 'left' | 'center' | 'right',
    index: number,
    showLines: boolean,
): React.CSSProperties {
    return {
        padding: '14px 12px',
        borderTop: showLines && index ? '1px solid var(--checkout-visual-divider)' : 0,
        lineHeight: 1.55,
        opacity: 0.78,
        textAlign: align,
        verticalAlign: 'top',
    };
}

function tablePill(): React.CSSProperties {
    return {
        display: 'inline-flex',
        justifyContent: 'center',
        minWidth: 84,
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--checkout-accent) 10%, transparent)',
        color: 'var(--checkout-accent)',
        padding: '6px 10px',
        fontSize: 11,
        fontWeight: 850,
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function imageWidth(size: ImageSize) {
    return { sm: 'min(100%, 360px)', md: 'min(100%, 560px)', lg: 'min(100%, 760px)', full: '100%' }[
        size
    ];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function imageMinHeight(size: ImageSize) {
    return {
        sm: 'clamp(160px, 42vw, 220px)',
        md: 'clamp(190px, 48vw, 320px)',
        lg: 'clamp(220px, 56vw, 420px)',
        full: 'clamp(220px, 56vw, 420px)',
    }[size];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function imageAspectRatio(ratio: ImageRatio, shape: ImageShape) {
    if (shape === 'circle' || shape === 'square') return '1/1';
    if (shape === 'pill') return '21/9';
    return ratio === 'auto' ? undefined : ratio;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function imageRadius(shape: ImageShape) {
    return {
        rectangle: '0px',
        soft: 'calc(var(--checkout-radius) - 6px)',
        square: 'calc(var(--checkout-radius) - 6px)',
        circle: '999px',
        pill: '999px',
    }[shape];
}

function heroEyebrow(): React.CSSProperties {
    return {
        margin: 0,
        color: 'var(--checkout-accent)',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
    };
}

function primaryButton(): React.CSSProperties {
    return {
        display: 'inline-flex',
        justifyContent: 'center',
        marginTop: 26,
        border: 0,
        borderRadius: 12,
        background: 'var(--checkout-accent)',
        color: 'white',
        padding: '15px 24px',
        fontSize: 15,
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 10px 24px color-mix(in srgb, var(--checkout-accent) 22%, transparent)',
    };
}

function secondaryButton(): React.CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
        border: 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
        borderRadius: 10,
        background: 'var(--checkout-card-bg)',
        color: 'var(--checkout-text)',
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 750,
        cursor: 'pointer',
    };
}

function numberBadge(): React.CSSProperties {
    return {
        display: 'grid',
        width: 38,
        height: 38,
        placeItems: 'center',
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--checkout-accent) 14%, white)',
        color: 'var(--checkout-accent)',
        fontWeight: 850,
    };
}

function qrPlaceholder(): React.CSSProperties {
    return {
        display: 'grid',
        aspectRatio: '1',
        placeItems: 'center',
        border: '10px solid var(--checkout-surface)',
        borderRadius: 12,
        background:
            'repeating-conic-gradient(var(--checkout-text) 0 25%, var(--checkout-surface) 0 50%) 0 / 18px 18px',
        boxShadow: '0 0 0 1px var(--checkout-border)',
        color: 'var(--checkout-accent)',
        fontWeight: 900,
    };
}

function inputControl(): React.CSSProperties {
    return {
        boxSizing: 'border-box',
        minHeight: 46,
        border: '1px solid var(--checkout-border)',
        borderRadius: 11,
        outline: 'none',
        background: 'var(--checkout-surface)',
        color: 'var(--checkout-text)',
        padding: '0 13px',
        font: 'inherit',
        fontSize: 14,
    };
}

function inputLabel(): React.CSSProperties {
    return {
        minWidth: 0,
        display: 'grid',
        gap: 7,
        color: 'var(--checkout-text)',
        fontSize: 12,
        fontWeight: 700,
    };
}

function CheckoutInput({
    label,
    ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label style={inputLabel()}>
            <span>{label}</span>
            <input {...input} style={{ ...inputControl(), width: '100%' }} />
        </label>
    );
}

function PaymentOption({
    value,
    icon,
    title,
    detail,
    compact = false,
    defaultChecked = false,
}: {
    value: string;
    icon: string;
    title: string;
    detail: string;
    compact?: boolean;
    defaultChecked?: boolean;
}) {
    return (
        <label
            className="checkout-payment-option"
            style={{
                display: 'flex',
                minWidth: 0,
                width: '100%',
                alignItems: 'center',
                gap: compact ? 8 : 12,
                minHeight: compact ? 54 : 82,
                border: compact
                    ? '1px solid transparent'
                    : 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
                borderRadius: compact ? 10 : 13,
                padding: compact ? '9px 10px' : 14,
                background: compact ? 'transparent' : 'var(--checkout-card-bg)',
                cursor: 'pointer',
            }}
        >
            <input
                type="radio"
                name="paymentMethod"
                value={value}
                defaultChecked={defaultChecked}
                style={{ flex: '0 0 auto', accentColor: 'var(--checkout-accent)' }}
            />
            <span
                style={{
                    display: 'grid',
                    width: compact ? 30 : 40,
                    height: compact ? 30 : 40,
                    flex: `0 0 ${compact ? 30 : 40}px`,
                    placeItems: 'center',
                    borderRadius: compact ? 8 : 11,
                    background:
                        'color-mix(in srgb,var(--checkout-accent) 10%,var(--checkout-muted))',
                    color: 'var(--checkout-accent)',
                    fontSize: compact ? 14 : 18,
                    fontWeight: 900,
                }}
            >
                {icon}
            </span>
            <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                <strong style={{ display: 'block', fontSize: compact ? 12 : 14, lineHeight: 1.25 }}>
                    {title}
                </strong>
                {!compact && (
                    <small
                        style={{
                            display: 'block',
                            marginTop: 3,
                            fontSize: 11,
                            lineHeight: 1.35,
                            opacity: 0.58,
                        }}
                    >
                        {detail}
                    </small>
                )}
            </span>
        </label>
    );
}

function ShippingOption({
    value,
    title,
    detail,
    price,
    defaultChecked = false,
}: {
    value: string;
    title: string;
    detail: string;
    price: string;
    defaultChecked?: boolean;
}) {
    return (
        <label
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid var(--checkout-border)',
                borderRadius: 12,
                padding: 15,
                cursor: 'pointer',
            }}
        >
            <input
                type="radio"
                name="shippingMethod"
                value={value}
                defaultChecked={defaultChecked}
                style={{ accentColor: 'var(--checkout-accent)' }}
            />
            <span style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 13 }}>{title}</strong>
                <small style={{ opacity: 0.6 }}>{detail}</small>
            </span>
            <strong style={{ fontSize: 13 }}>{price}</strong>
        </label>
    );
}

function summaryRow(): React.CSSProperties {
    return { display: 'flex', justifyContent: 'space-between', gap: 18 };
}

function CouponPreview({
    layout,
    title,
    placeholder,
    buttonLabel,
}: BuilderProps['coupon_field']) {
    const [value, setValue] = useState('');
    const [message, setMessage] = useState('');
    return (
        <CheckoutCoupon
            layout={layout}
            title={title}
            placeholder={placeholder}
            buttonLabel={buttonLabel}
            value={value}
            message={message && <p style={{ fontSize: 12, color: 'var(--checkout-accent)' }}>{message}</p>}
            onChange={(next) => {
                setValue(next);
                setMessage('');
            }}
            onApply={() => setMessage('Cupom de demonstração aplicado.')}
        />
    );
}

// Temporary visual migration reference; the builder renders CheckoutCoupon.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CouponSection({
    layout,
    title,
    placeholder,
    buttonLabel,
}: {
    layout: CouponLayout;
    title: string;
    placeholder: string;
    buttonLabel: string;
}) {
    const control = (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: layout === 'minimal' ? '1fr' : 'minmax(0, 1fr) auto',
                gap: 10,
                marginTop: layout === 'minimal' ? 12 : 18,
            }}
        >
            <input name="coupon" placeholder={placeholder} style={{ ...inputControl(), width: '100%' }} />
            <Button type="button" style={{ ...secondaryButton(), width: layout === 'minimal' ? '100%' : undefined }}>
                {buttonLabel}
            </Button>
        </div>
    );
    if (layout === 'minimal')
        return (
            <section style={{ ...fullWidth(), padding: '8px 0' }}>
                <details style={{ ...checkoutCard(), padding: 18 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'var(--checkout-heading-weight)' as React.CSSProperties['fontWeight'] }}>
                        {title}
                    </summary>
                    {control}
                </details>
            </section>
        );
    if (layout === 'card')
        return (
            <section
                style={{
                    ...checkoutCard(),
                    padding: 28,
                    background:
                        'linear-gradient(135deg, color-mix(in srgb,var(--checkout-accent) 7%, var(--checkout-group-bg)), var(--checkout-group-bg))',
                }}
            >
                <span style={heroEyebrow()}>Oferta</span>
                <h2 style={{ ...checkoutHeading(), marginTop: 8 }}>{title}</h2>
                {control}
            </section>
        );
    return (
        <section style={{ ...checkoutCard(), padding: 28 }}>
            <h2 style={checkoutHeading()}>{title}</h2>
            {control}
        </section>
    );
}

// Temporary visual migration reference; the builder renders CheckoutTrustBadges.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TrustSection({
    layout,
    title,
    showEncryption,
    showGuarantee,
    showPrivacy,
}: {
    layout: TrustLayout;
    title: string;
    showEncryption: boolean;
    showGuarantee: boolean;
    showPrivacy: boolean;
}) {
    const badges = [
        showEncryption ? 'Dados criptografados' : '',
        showGuarantee ? 'Compra garantida' : '',
        showPrivacy ? 'Privacidade protegida' : '',
    ].filter(Boolean);
    if (layout === 'strip')
        return (
            <section style={{ ...card(), display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 18 }}>
                <strong>{title}</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {badges.map((label) => <TrustBadge key={label} label={label} />)}
                </div>
            </section>
        );
    if (layout === 'cards')
        return (
            <section style={{ ...fullWidth(), padding: '28px 0' }}>
                <h2 style={{ ...checkoutHeading(), textAlign: 'center', fontSize: 20 }}>{title}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 16 }}>
                    {badges.map((label) => (
                        <article key={label} style={{ ...card(), padding: 18, textAlign: 'center' }}>
                            <span style={{ ...numberBadge(), margin: '0 auto' }}>✓</span>
                            <strong style={{ display: 'block', marginTop: 12, fontSize: 13 }}>{label}</strong>
                        </article>
                    ))}
                </div>
            </section>
        );
    return (
        <section style={{ ...fullWidth(), textAlign: 'center', padding: '28px 0' }}>
            <h2 style={{ ...checkoutHeading(), fontSize: 18 }}>{title}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                {badges.map((label) => <TrustBadge key={label} label={label} />)}
            </div>
        </section>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function FooterSection({
    layout,
    text,
    showSecurity,
}: {
    layout: FooterLayout;
    text: string;
    showSecurity: boolean;
}) {
    if (layout === 'columns')
        return (
            <footer style={{ ...card(), display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 18, padding: 24, fontSize: 12, lineHeight: 1.6 }}>
                <div><strong>Astro</strong><p style={{ margin: '8px 0 0', opacity: 0.62 }}>{text}</p></div>
                <div><strong>Suporte</strong><p style={{ margin: '8px 0 0', opacity: 0.62 }}>Acesso e compra protegidos.</p></div>
                {showSecurity && <div><strong>Seguranca</strong><p style={{ margin: '8px 0 0', opacity: 0.62 }}>Ambiente protegido e pagamento criptografado.</p></div>}
            </footer>
        );
    if (layout === 'minimal')
        return (
            <footer style={{ ...fullWidth(), borderTop: 'var(--checkout-card-border-width) solid var(--checkout-component-divider)', padding: '18px 0', textAlign: 'center', fontSize: 11, opacity: 0.58 }}>
                {text}{showSecurity ? ' · Pagamento seguro' : ''}
            </footer>
        );
    return (
        <footer style={{ ...fullWidth(), padding: '28px 16px', textAlign: 'center', fontSize: 12, lineHeight: 1.6, opacity: 0.62 }}>
            <p style={{ margin: 0 }}>{text}</p>
            {showSecurity && <p style={{ margin: '8px 0 0' }}>Ambiente protegido e pagamento criptografado</p>}
        </footer>
    );
}

function TrustBadge({ label }: { label: string }) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                border: 'var(--checkout-card-border-width) solid var(--checkout-card-border)',
                borderRadius: 999,
                background: 'var(--checkout-card-bg)',
                padding: '9px 13px',
                fontSize: 12,
                fontWeight: 700,
            }}
        >
            <span style={{ color: 'var(--checkout-accent)' }}>✓</span>
            {label}
        </span>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function PlanComparisonSection({
    layout,
    title,
    plans,
}: {
    layout: PlanComparisonLayout;
    title: string;
    plans: { name: string; price: string; description: string; featured: boolean }[];
}) {
    if (layout === 'compact')
        return (
            <section style={{ ...checkoutCard(), padding: 'clamp(18px, 5vw, 28px)' }}>
                <h2 style={checkoutHeading()}>{title}</h2>
                <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                    {plans.map((plan, index) => (
                        <div key={`${plan.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', borderTop: index ? 'var(--checkout-card-border-width) solid var(--checkout-component-divider)' : 0, paddingTop: index ? 12 : 0 }}>
                            <span><strong>{plan.name}</strong><small style={{ display: 'block', marginTop: 3, opacity: 0.62 }}>{plan.description}</small></span>
                            <strong style={{ color: plan.featured ? 'var(--checkout-accent)' : 'var(--checkout-text)' }}>{plan.price}</strong>
                        </div>
                    ))}
                </div>
            </section>
        );
    return (
        <section style={{ ...fullWidth(), padding: '28px 0' }}>
            <h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: layout === 'columns' ? `repeat(${Math.min(Math.max(plans.length, 1), 4)}, minmax(0,1fr))` : 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 14, marginTop: 24 }}>
                {plans.map((plan, index) => (
                    <article key={`${plan.name}-${index}`} style={{ ...card(), padding: 22, borderColor: plan.featured ? 'var(--checkout-accent)' : undefined, background: plan.featured ? 'color-mix(in srgb,var(--checkout-accent) 7%,var(--checkout-card-bg))' : undefined }}>
                        {plan.featured && <span style={heroEyebrow()}>Mais escolhido</span>}
                        <h3 style={{ margin: plan.featured ? '10px 0 0' : 0, fontSize: 20 }}>{plan.name}</h3>
                        <strong style={{ display: 'block', marginTop: 12, fontSize: 28, color: 'var(--checkout-accent)' }}>{plan.price}</strong>
                        <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6, opacity: 0.68 }}>{plan.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

// Kept temporarily only as a migration reference until all table templates have visual snapshots.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DataTableSection({
    layout,
    title,
    showLines,
    rows,
}: {
    layout: DataTableLayout;
    title: string;
    showLines: boolean;
    rows: { label: string; value: string; detail: string }[];
}) {
    if (layout === 'matrix') {
        return (
            <section style={{ ...checkoutCard(), padding: 'clamp(18px,5vw,28px)' }}>
                <h2 style={checkoutHeading()}>{title}</h2>
                <div style={{ marginTop: 18, overflowX: 'auto' }}>
                    <table style={checkoutTable(520)}>
                        <thead>
                            <tr>
                                <th style={tableHeadCell('left', showLines)}>Item</th>
                                <th style={tableHeadCell('center', showLines)}>Status</th>
                                <th style={tableHeadCell('left', showLines)}>Detalhe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`${row.label}-${index}`}>
                                    <td style={tableCell('left', index, showLines)}><strong>{row.label}</strong></td>
                                    <td style={tableCell('center', index, showLines)}><span style={tablePill()}>{row.value}</span></td>
                                    <td style={tableCell('left', index, showLines)}>{row.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    }
    if (layout === 'specs') {
        return (
            <section style={{ ...checkoutCard(), padding: 'clamp(18px,5vw,28px)' }}>
                <h2 style={checkoutHeading()}>{title}</h2>
                <div style={{ marginTop: 18, overflowX: 'auto' }}>
                    <table style={checkoutTable(460)}>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`${row.label}-${index}`}>
                                    <th style={{ ...tableCell('left', index, showLines), width: '34%', fontWeight: 850 }}>{row.label}</th>
                                    <td style={{ ...tableCell('left', index, showLines), color: 'var(--checkout-accent)', fontWeight: 850 }}>{row.value}</td>
                                    <td style={tableCell('left', index, showLines)}>{row.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    }
    return (
        <section style={{ ...checkoutCard(), padding: 'clamp(18px,5vw,28px)' }}>
            <h2 style={checkoutHeading()}>{title}</h2>
            <div style={{ marginTop: 18, overflowX: 'auto' }}>
                <table style={checkoutTable(520)}>
                    <thead>
                        <tr>
                            <th style={tableHeadCell('left', showLines)}>Nome</th>
                            <th style={tableHeadCell('left', showLines)}>Descrição</th>
                            <th style={tableHeadCell('right', showLines)}>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={`${row.label}-${index}`}>
                                <td style={tableCell('left', index, showLines)}><strong>{row.label}</strong></td>
                                <td style={tableCell('left', index, showLines)}>{row.detail}</td>
                                <td style={{ ...tableCell('right', index, showLines), fontWeight: 850 }}>{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function StatsSection({ layout, title, items }: { layout: StatsLayout; title: string; items: { value: string; label: string; detail: string }[] }) {
    if (layout === 'editorial' && items.length) {
        const [first, ...rest] = items;
        return <section style={{ ...card(), display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 20, padding: 'clamp(22px,5vw,38px)' }}><div><span style={heroEyebrow()}>Numeros</span><h2 style={{ ...heading(), marginTop: 10 }}>{title}</h2><strong style={{ display: 'block', marginTop: 20, fontSize: 46, color: 'var(--checkout-accent)' }}>{first.value}</strong><span>{first.label}</span><p style={{ margin: '6px 0 0', opacity: 0.62 }}>{first.detail}</p></div><div style={{ display: 'grid', gap: 10 }}>{rest.map((item, index) => <StatMini key={`${item.label}-${index}`} item={item} />)}</div></section>;
    }
    return <section style={{ ...fullWidth(), padding: layout === 'strip' ? '12px 0' : '28px 0' }}><h2 style={{ ...checkoutHeading(), textAlign: layout === 'strip' ? 'left' : 'center', fontSize: 24 }}>{title}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,160px),1fr))', gap: layout === 'strip' ? 0 : 12, marginTop: 18 }}>{items.map((item, index) => <StatMini key={`${item.label}-${index}`} item={item} framed={layout === 'cards'} />)}</div></section>;
}

function StatMini({ item, framed = true }: { item: { value: string; label: string; detail: string }; framed?: boolean }) {
    return <article style={{ ...(framed ? card() : fullWidth()), padding: framed ? 18 : '12px 0', textAlign: 'center' }}><strong style={{ display: 'block', fontSize: 28, color: 'var(--checkout-accent)' }}>{item.value}</strong><span style={{ display: 'block', marginTop: 4, fontWeight: 800 }}>{item.label}</span><small style={{ display: 'block', marginTop: 3, opacity: 0.58 }}>{item.detail}</small></article>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function BeforeAfterSection({ layout, title, beforeTitle, beforeText, afterTitle, afterText }: BuilderProps['before_after']) {
    const item = (name: string, text: string, positive: boolean) => <article style={{ ...card(), padding: 22, borderColor: positive ? 'var(--checkout-accent)' : undefined }}><span style={{ ...numberBadge(), background: positive ? 'var(--checkout-accent)' : undefined, color: positive ? '#fff' : undefined }}>{positive ? '✓' : '−'}</span><h3 style={{ margin: '16px 0 0', fontSize: 20 }}>{name}</h3><p style={{ margin: '8px 0 0', lineHeight: 1.65, opacity: 0.68 }}>{text}</p></article>;
    if (layout === 'timeline') return <section style={{ ...checkoutCard(), padding: 'clamp(20px,5vw,34px)' }}><h2 style={checkoutHeading()}>{title}</h2><div style={{ display: 'grid', gap: 12, marginTop: 20 }}>{item(beforeTitle, beforeText, false)}{item(afterTitle, afterText, true)}</div></section>;
    return <section style={{ ...fullWidth(), padding: '28px 0' }}><h2 style={{ ...heading(), textAlign: 'center' }}>{title}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 14, marginTop: 24 }}>{item(beforeTitle, beforeText, false)}{item(afterTitle, afterText, true)}</div></section>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function ClientLogosSection({ layout, title, logos }: { layout: ClientLogosLayout; title: string; logos: { name: string; imageUrl: string }[] }) {
    return <section style={{ ...(layout === 'strip' ? checkoutCard() : fullWidth()), padding: layout === 'strip' ? 20 : '28px 0', textAlign: 'center' }}><h2 style={{ ...checkoutHeading(), fontSize: 20 }}>{title}</h2><div style={{ display: 'grid', gridTemplateColumns: layout === 'strip' ? 'repeat(auto-fit,minmax(110px,1fr))' : 'repeat(auto-fit,minmax(min(100%,130px),1fr))', gap: layout === 'cloud' ? 18 : 10, alignItems: 'center', marginTop: 18 }}>{logos.map((logo, index) => <div key={`${logo.name}-${index}`} style={{ ...card(), display: 'grid', minHeight: layout === 'cloud' && index % 2 === 0 ? 86 : 68, placeItems: 'center', padding: 12, opacity: 0.82 }}>{safeHttpsUrl(logo.imageUrl) ? <>
        {/* The merchant-controlled URL is runtime data and cannot use Next's static image allowlist. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.imageUrl} alt={logo.name} loading="lazy" decoding="async" style={{ maxHeight: 38, objectFit: 'contain' }} />
    </> : <strong style={{ fontSize: 13 }}>{logo.name}</strong>}</div>)}</div></section>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function FloatingCtaSection({ layout, text, buttonLabel }: { layout: FloatingCtaLayout; text: string; buttonLabel: string }) {
    return <section style={{ ...fullWidth(), position: 'sticky', bottom: 12, zIndex: 5, display: 'flex', justifyContent: layout === 'pill' ? 'center' : 'stretch', pointerEvents: 'none' }}><div style={{ ...(layout === 'card' ? card() : checkoutCard()), display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: layout === 'pill' ? 'auto' : '100%', padding: layout === 'pill' ? '10px 10px 10px 16px' : 14, borderRadius: layout === 'pill' ? 999 : 'var(--checkout-radius)', pointerEvents: 'auto' }}><strong style={{ fontSize: 13 }}>{text}</strong><Button type="button" className="checkout-primary-button" style={{ ...primaryButton(), marginTop: 0, padding: '11px 16px' }}>{buttonLabel}</Button></div></section>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function SpacerDividerSection({ layout, size, label }: { layout: SpacerDividerLayout; size: SizePreset; label: string }) {
    const height = spacingValue(size) * 2;
    if (layout === 'space') return <div aria-hidden="true" style={{ ...fullWidth(), height }} />;
    return <div style={{ ...fullWidth(), display: 'grid', gridTemplateColumns: layout === 'label' ? '1fr auto 1fr' : '1fr', alignItems: 'center', gap: 12, minHeight: height }}><span style={{ height: 1, background: 'var(--checkout-visual-divider)' }} />{layout === 'label' && <><span style={{ color: 'var(--checkout-accent)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{label}</span><span style={{ height: 1, background: 'var(--checkout-visual-divider)' }} /></>}</div>;
}

function widthValue(size: WidthPreset) {
    return { sm: 760, md: 920, lg: 1120, xl: 1320, full: 1440 }[size] ?? 1120;
}

function spacingValue(size: SizePreset) {
    return { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 }[size] ?? 20;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function slotStyle(gap: SizePreset) {
    return {
        '--checkout-component-gap': `${spacingValue(gap)}px`,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        display: 'grid',
        alignContent: 'start',
        alignItems: 'stretch',
        gap: spacingValue(gap),
    } as React.CSSProperties;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function logoSize(size: SizePreset) {
    return { xs: 72, sm: 104, md: 144, lg: 192, xl: 256 }[size] ?? 144;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- visual migration reference
function logoRadiusValue(radius: LogoRadius) {
    return { none: 0, sm: 8, md: 16, lg: 28, full: '50%' }[radius] ?? 16;
}

function safeColor(value: string, fallback: string) {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function safeHttpsUrl(value: string) {
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}

function isProtectedCheckoutForm(id: unknown) {
    return id === 'form-required' || id === 'form-initial';
}

function formatDeadline(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Defina uma data válida'
        : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}
