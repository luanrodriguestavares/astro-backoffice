import { defaultResultPage, type CheckoutResultPageKind } from '@astro/checkout-renderer/funnel';
import {
    appearanceToTheme,
    defaultCheckoutAppearance,
    type CheckoutAppearance,
} from '@astro/checkout-renderer/theme';

import type { CheckoutDocument } from '@/lib/api/types';

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

export type CheckoutTemplateId =
    | 'blank'
    | 'subscription'
    | 'digital-product'
    | 'express'
    | 'vsl'
    | 'presell'
    | 'pix-express'
    | 'high-ticket';

export type CheckoutTemplate = {
    id: CheckoutTemplateId;
    name: string;
    description: string;
    audience: string;
    highlights: string[];
    category: 'sales' | 'checkout' | 'recurring';
    flowSteps: number;
    prefersRecurring?: boolean;
};

export const checkoutTemplates: CheckoutTemplate[] = [
    {
        id: 'vsl',
        name: 'Vídeo de vendas',
        description:
            'Página com o seu vídeo e o botão que aparece no momento da oferta. Depois, checkout em uma tela.',
        audience: 'VSL',
        category: 'sales',
        flowSteps: 2,
        highlights: ['Vídeo com som ao toque', 'Botão no momento certo', 'Checkout direto'],
    },
    {
        id: 'presell',
        name: 'Pré-venda',
        description:
            'Artigo que aquece o visitante com história, benefícios e depoimentos antes de levar ao checkout.',
        audience: 'Advertorial',
        category: 'sales',
        flowSteps: 2,
        highlights: ['Página de conteúdo', 'Prova social', 'Botão para o checkout'],
    },
    {
        id: 'high-ticket',
        name: 'Mentoria e high ticket',
        description:
            'Checkout consultivo com dados completos, depoimentos, garantia estendida e FAQ para ofertas de alto valor.',
        audience: 'Alto valor',
        category: 'sales',
        flowSteps: 1,
        highlights: ['Telefone e CPF', 'Garantia de 30 dias', 'Objeções no FAQ'],
    },
    {
        id: 'pix-express',
        name: 'Pix na hora',
        description:
            'Tela enxuta só com Pix: menos campos, aprovação imediata e ideal para low ticket.',
        audience: 'Low ticket',
        category: 'checkout',
        flowSteps: 1,
        highlights: ['Somente Pix', 'Aprovação imediata', 'Tela única'],
    },
    {
        id: 'express',
        name: 'Checkout direto',
        description:
            'Banner, produto no topo e pagamento em uma tela. Ideal para tráfego pago no celular.',
        audience: 'Conversão rápida',
        category: 'checkout',
        flowSteps: 1,
        highlights: ['Tela única', 'Produto no topo', 'CTA com selo'],
    },
    {
        id: 'subscription',
        name: 'Assinatura e SaaS',
        description:
            'Planos lado a lado, cobrança recorrente clara e respostas sobre cancelamento.',
        audience: 'Recorrência',
        category: 'recurring',
        flowSteps: 1,
        highlights: ['Seletor de planos', 'Resumo recorrente', 'FAQ de cancelamento'],
        prefersRecurring: true,
    },
    {
        id: 'digital-product',
        name: 'Produto digital',
        description: 'Página de venda completa para cursos, ebooks, mentorias e comunidades.',
        audience: 'Infoproduto',
        category: 'sales',
        flowSteps: 1,
        highlights: ['Apresentação', 'Prova social', 'Garantia com selo'],
    },
    {
        id: 'blank',
        name: 'Essencial',
        description: 'Só o necessário para vender: produto, dados, pagamento e resumo.',
        audience: 'Do zero',
        category: 'checkout',
        flowSteps: 1,
        highlights: ['Dados', 'Pagamento', 'Resumo'],
    },
];

/**
 * Monta o checkout a partir do modelo e dos planos escolhidos de um produto. Com mais de um
 * plano, o checkout já vem com o seletor de planos (cada um vinculado ao seu preço).
 */
export function buildCheckoutFromTemplate(
    id: CheckoutTemplateId,
    chosen: TemplatePrice[],
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
    const plans = [...chosen].sort((a, b) => intervalWeight(a) - intervalWeight(b)).slice(0, 6);
    const selected = plans[0] ?? chosen[0];
    if (!selected) throw new Error('Escolha pelo menos um plano.');
    const products = plans.map((price) => ({
        productId: price.productId,
        priceId: price.priceId,
        isDefault: price.priceId === selected.priceId,
        minimumQuantity: 1,
        maximumQuantity: 1,
    }));
    if (id === 'subscription')
        return { document: subscriptionDocument(selected, plans, appearance), products };
    const document =
        id === 'digital-product'
            ? digitalProductDocument(selected, appearance)
            : id === 'express'
              ? expressDocument(selected, appearance)
              : id === 'vsl'
                ? vslDocument(selected, appearance)
                : id === 'presell'
                  ? presellDocument(selected, appearance)
                  : id === 'pix-express'
                    ? pixExpressDocument(selected, appearance)
                    : id === 'high-ticket'
                      ? highTicketDocument(selected, appearance)
                      : essentialDocument(selected, appearance);
    return { document: plans.length > 1 ? withPlanPicker(document, plans) : document, products };
}

/** Seletor de planos no topo da primeira coluna da grade do checkout. */
function withPlanPicker(document: CheckoutDocument, plans: TemplatePrice[]): CheckoutDocument {
    return {
        ...document,
        sections: document.sections.map((item) =>
            item.id === 'grid-template'
                ? {
                      ...item,
                      props: {
                          ...item.props,
                          column1: [
                              planPicker(plans, 'Escolha seu plano'),
                              ...((item.props.column1 as Block[] | undefined) ?? []),
                          ],
                      },
                  }
                : item,
        ),
    };
}

function planPicker(plans: TemplatePrice[], title: string, description = '') {
    return nested('plans-template', 'plan_comparison', {
        layout: 'compact',
        title,
        description,
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
    });
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
        pages: resultPages(),
        settings: {},
        seo: { title: seoTitle, description: 'Finalize sua compra com segurança.' },
    };
}

type Block = { type: string; props: Record<string, unknown> };

type CheckoutPages = NonNullable<CheckoutDocument['pages']>;

function resultPages(): CheckoutPages {
    const page = (kind: CheckoutResultPageKind, extra: CheckoutPages[number]['sections']) => {
        const base = defaultResultPage(kind);
        return { ...base, sections: [...base.sections, ...extra] } as CheckoutPages[number];
    };
    return [
        page('pix', [
            section('pix-trust', 'security_badges', {
                layout: 'pills',
                title: '',
                showEncryption: true,
                showGuarantee: true,
                showPrivacy: false,
            }),
        ]),
        page('boleto', []),
        page('success', [
            section('success-steps', 'benefits', {
                layout: 'steps',
                title: 'Seus próximos passos',
                items: [
                    {
                        icon: 'mail',
                        title: 'Confira seu e-mail',
                        description: 'O acesso e o comprovante chegam em instantes.',
                    },
                    {
                        icon: 'rocket',
                        title: 'Comece agora',
                        description: 'Entre na área do produto e dê o primeiro passo hoje.',
                    },
                    {
                        icon: 'headset',
                        title: 'Conte com o suporte',
                        description: 'Responda o e-mail de confirmação se precisar de ajuda.',
                    },
                ],
            }),
        ]),
        page('failure', [
            section('failure-help', 'paragraph_text', {
                content:
                    'Nada foi cobrado. Se preferir, fale com o suporte respondendo o e-mail da compra.',
                alignment: 'center',
                size: 'sm',
            }),
        ]),
    ];
}

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
                ],
                [
                    summary({
                        buttonLabel: 'Finalizar compra',
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

function vslDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    const checkout = expressDocument(selected, appearance);
    const videoPage: CheckoutPages[number] = {
        id: 'video',
        kind: 'content',
        name: 'Vídeo de vendas',
        sections: [
            section('video-headline', 'heading_text', {
                text: 'Assista ao vídeo até o fim: a oferta aparece logo abaixo',
                alignment: 'center',
                size: 'lg',
            }),
            section('video-player', 'video', {
                url: '',
                title: selected.productName,
                caption: '',
                posterUrl: '',
                format: 'landscape',
                autoplay: true,
                controls: false,
                resume: true,
                ctaEnabled: true,
                ctaLabel: 'Quero garantir minha vaga',
                ctaSublabel: 'Acesso imediato · Garantia de 7 dias',
                ctaReveal: 'time',
                ctaSeconds: 60,
                ctaAction: 'next',
                ctaPageId: '',
                ctaUrl: '',
                ctaNewTab: false,
                endAction: 'none',
            }),
            section('video-trust', 'security_badges', {
                layout: 'pills',
                title: '',
                showEncryption: true,
                showGuarantee: true,
                showPrivacy: true,
            }),
        ],
    };
    return {
        ...checkout,
        pages: [videoPage, ...(checkout.pages ?? [])],
        settings: { ...checkout.settings, startPageId: 'video' },
        seo: { ...checkout.seo, title: selected.productName },
    };
}

function presellDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    const checkout = expressDocument(selected, appearance);
    const article: CheckoutPages[number] = {
        id: 'presell',
        kind: 'content',
        name: 'Pré-venda',
        sections: [
            section('presell-headline', 'heading_text', {
                text: 'Conte aqui a descoberta que muda o jogo para o seu leitor',
                alignment: 'left',
                size: 'lg',
            }),
            section('presell-story', 'paragraph_text', {
                content:
                    'Abra com a dor do leitor, apresente a virada e mostre por que esta solução funciona. Textos curtos e em primeira pessoa convertem melhor.',
                alignment: 'left',
                size: 'md',
            }),
            section('presell-benefits', 'benefits', {
                layout: 'list',
                title: 'Por que funciona',
                items: [
                    {
                        icon: 'check',
                        title: 'Benefício principal',
                        description: 'O resultado mais desejado.',
                    },
                    {
                        icon: 'check',
                        title: 'Diferencial',
                        description: 'O que ninguém mais oferece.',
                    },
                    { icon: 'check', title: 'Facilidade', description: 'Como é simples começar.' },
                ],
            }),
            section('presell-testimonials', 'testimonials', {
                layout: 'cards',
                title: 'Quem testou aprovou',
                items: [
                    {
                        quote: 'Escreva aqui um depoimento real de cliente.',
                        name: 'Nome do cliente',
                        role: 'Cidade',
                        avatarUrl: '',
                        rating: 5,
                        verified: true,
                    },
                ],
            }),
            section('presell-cta', 'cta_button', {
                label: 'Quero aproveitar a oferta',
                sublabel: 'Condição especial por tempo limitado',
                alignment: 'stretch',
                variant: 'primary',
                delaySeconds: 0,
                action: 'checkout',
                pageId: '',
            }),
        ],
    };
    return {
        ...checkout,
        pages: [article, ...(checkout.pages ?? [])],
        settings: { ...checkout.settings, startPageId: 'presell' },
        seo: { ...checkout.seo, title: selected.productName },
    };
}

function pixExpressDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    return base(
        [
            logo('center'),
            grid(
                'grid-template',
                [
                    productHeader(selected),
                    customerForm(),
                    nested('payment-required', 'payment_methods', {
                        layout: 'list',
                        title: 'Pagamento via Pix',
                        description: 'Aprovação na hora, sem taxa extra.',
                        showCard: false,
                        showPix: true,
                        showBoleto: false,
                        showWallets: false,
                    }),
                ],
                [summary({ buttonLabel: 'Gerar Pix', badge: 'Aprovação imediata' }), trust()],
            ),
            footer(),
        ],
        'Pague com Pix',
        appearance,
        'md',
    );
}

function highTicketDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    return base(
        [
            logo('center'),
            section('hero-template', 'hero', {
                layout: 'centered',
                eyebrow: 'Vagas limitadas',
                title: selected.productName,
                description: 'Resuma a transformação e para quem esta oferta foi feita.',
                buttonLabel: 'Quero garantir minha vaga',
                buttonAction: 'payment',
                buttonUrl: '',
                buttonNewTab: false,
                imageUrl: '',
            }),
            grid(
                'grid-template',
                [
                    productHeader(selected),
                    nested('form-required', 'checkout_form', {
                        layout: 'card',
                        title: 'Seus dados',
                        description: 'Usamos para o contato do time e a emissão da nota.',
                        showPhone: true,
                        showDocument: true,
                    }),
                    paymentMethods('cards', 'Parcele no cartão ou pague via Pix.'),
                ],
                [
                    summary({
                        buttonLabel: 'Confirmar inscrição',
                        badge: 'Vagas limitadas',
                        layout: 'card',
                    }),
                    nested('guarantee-template', 'guarantee', {
                        layout: 'horizontal',
                        title: 'Garantia de 30 dias',
                        description:
                            'Participe e, se não for para você, devolvemos o valor integral.',
                        days: 30,
                    }),
                    trust(),
                ],
            ),
            section('testimonials-template', 'testimonials', {
                layout: 'cards',
                title: 'Resultados de quem participou',
                items: [
                    {
                        quote: 'Descreva o resultado concreto que este cliente alcançou.',
                        name: 'Nome do cliente',
                        role: 'Empresa ou cargo',
                        avatarUrl: '',
                        rating: 5,
                        verified: true,
                    },
                    {
                        quote: 'Números e prazos tornam o depoimento mais forte.',
                        name: 'Nome do cliente',
                        role: 'Empresa ou cargo',
                        avatarUrl: '',
                        rating: 5,
                        verified: true,
                    },
                ],
            }),
            section('faq-template', 'faq', {
                layout: 'accordion',
                title: 'Antes de decidir',
                items: [
                    {
                        question: 'Para quem é?',
                        answer: 'Descreva o perfil ideal de participante.',
                    },
                    {
                        question: 'Como funciona o acompanhamento?',
                        answer: 'Explique formato, duração e frequência.',
                    },
                    { question: 'Posso parcelar?', answer: 'Sim, no cartão de crédito.' },
                ],
            }),
            footer(),
        ],
        selected.productName,
        appearance,
    );
}

function essentialDocument(selected: TemplatePrice, appearance: CheckoutAppearance) {
    return base(
        [
            logo('center'),
            grid(
                'grid-template',
                [productHeader(selected), customerForm(), paymentMethods('list')],
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
        left.push(planPicker(plans, 'Escolha seu plano', 'Troque ou cancele quando quiser.'));
    left.push(customerForm(), paymentMethods('list', 'A cobrança se renova automaticamente.'));
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
                [productHeader(selected), customerForm(), paymentMethods('list')],
                [
                    summary({
                        buttonLabel: 'Finalizar compra',
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
