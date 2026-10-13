import { defaultResultScreens } from '@astro/checkout-renderer/result-screens';
import {
    appearanceToTheme,
    defaultCheckoutAppearance,
    type CheckoutAppearance,
} from '@astro/checkout-renderer/theme';

import type { CheckoutDocument } from '@/lib/api/types';

/** Preço do catálogo usado para montar o modelo. */
export type TemplatePrice = {
    productId: string;
    priceId: string;
    productName: string;
    priceName: string;
    amountMinor: number;
    currency: string;
    pricingType: string;
    recurringInterval?: string | null;
    recurringIntervalCount?: number | null;
};

export type CheckoutTemplateId = 'blank' | 'subscription' | 'digital-product' | 'express';

export type CheckoutTemplate = {
    id: CheckoutTemplateId;
    name: string;
    description: string;
    /** Para quem é: aparece como etiqueta no seletor. */
    audience: string;
    highlights: string[];
    /** Preferir preços recorrentes ao sugerir o produto. */
    prefersRecurring?: boolean;
};

export const checkoutTemplates: CheckoutTemplate[] = [
    {
        id: 'express',
        name: 'Checkout direto',
        description:
            'Banner, produto no topo e pagamento em uma tela. Ideal para tráfego pago no celular.',
        audience: 'Conversão rápida',
        highlights: ['Tela única', 'Produto no topo', 'CTA com selo'],
    },
    {
        id: 'subscription',
        name: 'Assinatura e SaaS',
        description:
            'Planos lado a lado, cobrança recorrente clara e respostas sobre cancelamento.',
        audience: 'Recorrência',
        highlights: ['Seletor de planos', 'Resumo recorrente', 'FAQ de cancelamento'],
        prefersRecurring: true,
    },
    {
        id: 'digital-product',
        name: 'Produto digital',
        description: 'Página de venda completa para cursos, ebooks, mentorias e comunidades.',
        audience: 'Infoproduto',
        highlights: ['Apresentação', 'Prova social', 'Garantia com selo'],
    },
    {
        id: 'blank',
        name: 'Essencial',
        description: 'Só o necessário para vender: produto, dados, pagamento e resumo.',
        audience: 'Do zero',
        highlights: ['Dados', 'Pagamento', 'Resumo'],
    },
];

/**
 * Monta o documento e os produtos do checkout a partir do modelo, do preço escolhido e da
 * aparência definida no assistente de criação.
 */
export function buildCheckoutFromTemplate(
    id: CheckoutTemplateId,
    selected: TemplatePrice,
    catalog: TemplatePrice[],
    appearance: CheckoutAppearance = defaultCheckoutAppearance,
): {
    document: CheckoutDocument;
    products: {
        productId: string;
        priceId: string;
        isDefault: boolean;
        minimumQuantity: number;
        maximumQuantity: number;
    }[];
} {
    const product = (price: TemplatePrice, isDefault: boolean) => ({
        productId: price.productId,
        priceId: price.priceId,
        isDefault,
        minimumQuantity: 1,
        maximumQuantity: 1,
    });
    if (id === 'subscription') {
        // Outros preços recorrentes do mesmo produto viram planos selecionáveis (mensal, anual...).
        const plans = [
            selected,
            ...catalog.filter(
                (price) =>
                    price.productId === selected.productId &&
                    price.priceId !== selected.priceId &&
                    price.pricingType === 'recurring',
            ),
        ]
            .slice(0, 4)
            .sort((a, b) => intervalWeight(a) - intervalWeight(b));
        return {
            document: subscriptionDocument(selected, plans, appearance),
            products: plans.map((price) => product(price, price.priceId === selected.priceId)),
        };
    }
    const document =
        id === 'digital-product'
            ? digitalProductDocument(selected, appearance)
            : id === 'express'
              ? expressDocument(selected, appearance)
              : essentialDocument(selected, appearance);
    return { document, products: [product(selected, true)] };
}

function base(
    sections: CheckoutDocument['sections'],
    seoTitle: string,
    appearance: CheckoutAppearance,
    maxWidth: 'md' | 'lg' = 'lg',
): CheckoutDocument {
    const { theme, layout } = appearanceToTheme(appearance);
    return {
        schemaVersion: 1,
        theme,
        layout: {
            maxWidth,
            pagePadding: 'lg',
            inputGroupStyle: 'filled',
            ...layout,
        },
        sections,
        settings: { resultScreens: defaultResultScreens },
        seo: { title: seoTitle, description: 'Finalize sua compra com segurança.' },
    };
}

type Block = { type: string; props: Record<string, unknown> };

function section(id: string, type: string, props: Record<string, unknown>) {
    return { id, type, visible: true, props } as CheckoutDocument['sections'][number];
}

function nested(id: string, type: string, props: Record<string, unknown>): Block {
    return { type, props: { id, ...props } };
}

function grid(id: string, column1: Block[], column2: Block[]) {
    return section(id, 'grid', {
        columns: '2',
        columnGap: 'md',
        itemGap: 'sm',
        padding: 'xs',
        column1,
        column2,
        column3: [],
    });
}

/*
 * Peças comuns. Todo modelo segue a mesma ordem de leitura do celular: o que estou comprando
 * (banner e faixa do produto), quem sou eu (dados), como pago (formas e detalhes) e o
 * fechamento (resumo, CTA e selo). Os textos são curtos de propósito: no estilo compacto o
 * bloco mostra só o título; as descrições aparecem apenas no estilo completo.
 */
const logo = (alignment: 'left' | 'center', overlapBanner = false) =>
    section('logo-template', 'logo', {
        url: '',
        alt: 'Logo da marca',
        alignment,
        size: 'sm',
        radius: 'md',
        overlapBanner,
    });

const banner = () =>
    section('banner-template', 'banner', {
        imageUrl: '',
        mobileImageUrl: '',
        alt: 'Banner da oferta',
        aspectRatio: '3/1',
        mobileAspectRatio: '16/9',
        fit: 'cover',
    });

const productHeader = (selected: TemplatePrice) =>
    nested('product-header', 'product_summary', {
        layout: 'header',
        mobileOnly: true,
        title: '',
        description: '',
        buttonLabel: '',
        imageUrl: '',
        badge: '',
        recurringLabel: recurringText(selected),
    });

const customerForm = () =>
    nested('form-required', 'checkout_form', {
        layout: 'card',
        title: 'Dados pessoais',
        description: 'Para enviar o acesso e o comprovante.',
        showPhone: false,
        showDocument: false,
    });

const paymentMethods = (
    layout: 'cards' | 'list' | 'segmented',
    description = 'Escolha como prefere pagar.',
) =>
    nested('payment-required', 'payment_methods', {
        layout,
        title: 'Pagamento',
        description,
        showCard: true,
        showPix: true,
        showBoleto: false,
        showWallets: true,
    });

const cardPayment = (showInstallments: boolean) =>
    nested('card-template', 'card_payment', {
        layout: 'compact',
        title: 'Dados do cartão',
        description: 'Criptografados e enviados direto ao processador.',
        showInstallments,
    });

const pixPayment = () =>
    nested('pix-template', 'pix_payment', {
        layout: 'compact',
        title: 'Pagamento via Pix',
        description: 'O QR Code aparece logo depois de confirmar.',
        expiresIn: '30 minutos',
    });

const summary = (props: {
    title?: string;
    buttonLabel: string;
    badge?: string;
    recurringLabel?: string;
    layout?: 'card' | 'compact';
}) =>
    nested('product-required', 'product_summary', {
        layout: props.layout ?? 'compact',
        title: props.title ?? 'Resumo do pedido',
        description: '',
        buttonLabel: props.buttonLabel,
        badge: props.badge ?? '',
        recurringLabel: props.recurringLabel ?? '',
        imageUrl: '',
    });

const trust = () =>
    nested('trust-template', 'security_badges', {
        layout: 'strip',
        title: 'Compra protegida',
        showEncryption: true,
        showGuarantee: true,
        showPrivacy: true,
    });

const footer = (text = 'Compra 100% segura · Dados protegidos') =>
    section('footer-template', 'footer', { layout: 'minimal', text, showSecurity: true });

function expressDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    return base(
        [
            banner(),
            logo('left', true),
            grid(
                'grid-template',
                [
                    productHeader(selected),
                    customerForm(),
                    paymentMethods('list', 'Pix aprova na hora.'),
                    cardPayment(true),
                    pixPayment(),
                ],
                [
                    summary({
                        buttonLabel: 'Pagar agora',
                        recurringLabel: recurringText(selected),
                    }),
                    nested('guarantee-template', 'guarantee', {
                        layout: 'minimal',
                        title: 'Garantia de 7 dias',
                        description: 'Não gostou? Devolvemos seu dinheiro.',
                        days: 7,
                    }),
                    trust(),
                ],
            ),
            footer(),
        ],
        'Finalize sua compra',
        appearance,
    );
}

function essentialDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    return base(
        [
            logo('center'),
            grid(
                'grid-template',
                [
                    productHeader(selected),
                    customerForm(),
                    paymentMethods('list'),
                    cardPayment(true),
                    pixPayment(),
                ],
                [
                    summary({
                        buttonLabel: 'Finalizar compra',
                        recurringLabel: recurringText(selected),
                    }),
                ],
            ),
            footer(),
        ],
        'Finalize sua compra',
        appearance,
        'md',
    );
}

function subscriptionDocument(
    selected: TemplatePrice,
    plans: TemplatePrice[],
    appearance: CheckoutAppearance,
) {
    const left: Block[] = [productHeader(selected)];
    if (plans.length > 1)
        left.push(
            nested('plans-template', 'plan_comparison', {
                layout: 'compact',
                title: 'Escolha seu plano',
                description: 'Troque ou cancele quando quiser.',
                plans: plans.map((price, index) => ({
                    name: price.priceName,
                    priceId: price.priceId,
                    price: money(price.amountMinor, price.currency),
                    period: periodLabel(price),
                    originalPrice: '',
                    description: price.productName,
                    features: '',
                    featured: index === plans.length - 1,
                })),
            }),
        );
    left.push(
        customerForm(),
        paymentMethods('list', 'A cobrança se renova automaticamente.'),
        cardPayment(false),
        pixPayment(),
    );
    const right: Block[] = [
        summary({
            title: 'Sua assinatura',
            buttonLabel: 'Assinar agora',
            recurringLabel: recurringText(selected),
        }),
        nested('benefits-template', 'benefits', {
            layout: 'checklist',
            title: 'Incluído no seu plano',
            items: [
                { title: 'Acesso imediato', description: 'Comece a usar assim que confirmar.' },
                { title: 'Atualizações contínuas', description: 'Novidades sem custo adicional.' },
                { title: 'Suporte dedicado', description: 'Fale com o time quando precisar.' },
            ],
        }),
        nested('guarantee-template', 'guarantee', {
            layout: 'minimal',
            title: 'Cancele quando quiser',
            description: 'Sem fidelidade e sem multa.',
            days: 7,
        }),
        trust(),
    ];
    return base(
        [
            banner(),
            logo('center', true),
            grid('grid-template', left, right),
            section('faq-template', 'faq', {
                layout: 'accordion',
                title: 'Dúvidas sobre a assinatura',
                items: [
                    {
                        question: 'Como funciona a renovação?',
                        answer: 'A assinatura é renovada automaticamente no fim de cada período, no mesmo cartão.',
                    },
                    {
                        question: 'Posso cancelar a qualquer momento?',
                        answer: 'Sim. O cancelamento interrompe as próximas cobranças e você mantém o acesso até o fim do período pago.',
                    },
                    {
                        question: 'Posso trocar de plano depois?',
                        answer: 'Sim. A mudança vale a partir do próximo ciclo de cobrança.',
                    },
                ],
            }),
            footer('Pagamento recorrente processado com segurança.'),
        ],
        'Assine agora',
        appearance,
    );
}

function digitalProductDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    return base(
        [
            banner(),
            logo('center', true),
            section('hero-template', 'hero', {
                layout: 'centered',
                eyebrow: 'Acesso imediato',
                title: selected.productName,
                description: 'Explique em uma frase a transformação que o comprador terá.',
                buttonLabel: 'Quero garantir meu acesso',
                buttonAction: 'payment',
                buttonUrl: '',
                buttonNewTab: false,
                imageUrl: '',
            }),
            section('benefits-template', 'benefits', {
                layout: 'cards',
                title: 'O que você recebe',
                items: [
                    {
                        icon: 'rocket',
                        title: 'Resultado na prática',
                        description: 'Conteúdo direto ao ponto para aplicar já.',
                    },
                    {
                        icon: 'smartphone',
                        title: 'Acesse de onde quiser',
                        description: 'Computador, tablet ou celular.',
                    },
                    {
                        icon: 'award',
                        title: 'Certificado',
                        description: 'Comprove o que você aprendeu.',
                    },
                ],
            }),
            grid(
                'grid-template',
                [
                    productHeader(selected),
                    customerForm(),
                    paymentMethods('list'),
                    cardPayment(true),
                    pixPayment(),
                ],
                [
                    summary({
                        buttonLabel: 'Quero meu acesso',
                        badge: 'Acesso imediato',
                        layout: 'card',
                    }),
                    nested('guarantee-template', 'guarantee', {
                        layout: 'horizontal',
                        title: 'Risco zero para você',
                        description:
                            'Se não fizer sentido, peça o reembolso integral dentro do prazo.',
                        days: 7,
                    }),
                    trust(),
                ],
            ),
            section('testimonials-template', 'testimonials', {
                layout: 'cards',
                title: 'Quem já comprou recomenda',
                items: [
                    {
                        quote: 'Escreva aqui um depoimento real de cliente.',
                        name: 'Nome do cliente',
                        role: 'Profissão',
                        avatarUrl: '',
                        rating: 5,
                        verified: true,
                    },
                    {
                        quote: 'Depoimentos com resultado concreto convertem mais.',
                        name: 'Nome do cliente',
                        role: 'Profissão',
                        avatarUrl: '',
                        rating: 5,
                        verified: true,
                    },
                    {
                        quote: 'Prefira frases curtas e específicas.',
                        name: 'Nome do cliente',
                        role: 'Profissão',
                        avatarUrl: '',
                        rating: 5,
                        verified: false,
                    },
                ],
            }),
            section('faq-template', 'faq', {
                layout: 'accordion',
                title: 'Perguntas frequentes',
                items: [
                    {
                        question: 'Como recebo o acesso?',
                        answer: 'Por e-mail, logo após a confirmação do pagamento.',
                    },
                    {
                        question: 'Por quanto tempo terei acesso?',
                        answer: 'Ajuste esta resposta conforme a sua oferta.',
                    },
                    {
                        question: 'O pagamento é seguro?',
                        answer: 'Sim. Os dados são processados com criptografia por um gateway homologado.',
                    },
                ],
            }),
            footer(),
        ],
        selected.productName,
        appearance,
    );
}

function money(amountMinor: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(
        amountMinor / 100,
    );
}

/** "/mês", "/ano", "a cada 3 meses"... vazio para cobrança única. */
export function periodLabel(price: TemplatePrice) {
    if (price.pricingType !== 'recurring' || !price.recurringInterval) return '';
    const count = price.recurringIntervalCount ?? 1;
    const unit = (
        {
            day: ['dia', 'dias'],
            week: ['semana', 'semanas'],
            month: ['mês', 'meses'],
            year: ['ano', 'anos'],
        } as Record<string, [string, string]>
    )[price.recurringInterval] ?? [price.recurringInterval, price.recurringInterval];
    return count === 1 ? `/${unit[0]}` : `a cada ${count} ${unit[1]}`;
}

function intervalWeight(price: TemplatePrice) {
    const days =
        ({ day: 1, week: 7, month: 30, year: 365 } as Record<string, number>)[
            price.recurringInterval ?? ''
        ] ?? 0;
    return days * (price.recurringIntervalCount ?? 1);
}

/** Texto do resumo: "Cobrança mensal", "Cobrança anual", "Cobrança a cada 3 meses". */
function recurringText(price: TemplatePrice) {
    const period = periodLabel(price);
    if (!period) return '';
    const single: Record<string, string> = {
        '/dia': 'Cobrança diária',
        '/semana': 'Cobrança semanal',
        '/mês': 'Cobrança mensal',
        '/ano': 'Cobrança anual',
    };
    return single[period] ?? `Cobrança ${period}`;
}
