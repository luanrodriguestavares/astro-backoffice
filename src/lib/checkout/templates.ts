import { checkoutBrandPresets } from '@astro/checkout-renderer/theme';

import { blankCheckoutDocument } from '@/lib/checkout/document';
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
        highlights: ['Urgência', 'Prova social', 'Garantia com selo'],
    },
    {
        id: 'express',
        name: 'Checkout direto',
        description:
            'Uma tela, poucas distrações e pagamento em segundos. Ideal para tráfego pago.',
        audience: 'Conversão rápida',
        highlights: ['Tela única', 'Pix em destaque', 'Resumo compacto'],
    },
    {
        id: 'blank',
        name: 'Em branco',
        description: 'Só a estrutura essencial de pagamento para você montar do seu jeito.',
        audience: 'Do zero',
        highlights: ['Dados', 'Pagamento', 'Resumo'],
    },
];

/** Monta o documento e os produtos do checkout a partir do modelo e do preço escolhido. */
export function buildCheckoutFromTemplate(
    id: CheckoutTemplateId,
    selected: TemplatePrice,
    catalog: TemplatePrice[],
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
            document: subscriptionDocument(selected, plans),
            products: plans.map((price) => product(price, price.priceId === selected.priceId)),
        };
    }
    const document =
        id === 'digital-product'
            ? digitalProductDocument(selected)
            : id === 'express'
              ? expressDocument()
              : blankCheckoutDocument;
    return { document, products: [product(selected, true)] };
}

const astro = checkoutBrandPresets.find((preset) => preset.value === 'astro')!;

function base(sections: CheckoutDocument['sections'], seoTitle: string): CheckoutDocument {
    return {
        schemaVersion: 1,
        theme: { ...astro.theme, brandPreset: 'astro' },
        layout: {
            maxWidth: 'lg',
            componentGap: 'sm',
            pagePadding: 'lg',
            inputGroupStyle: 'filled',
            ...astro.layout,
        },
        sections,
        settings: {},
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

const logo = (alignment: 'left' | 'center') =>
    section('logo-template', 'logo', {
        url: '',
        alt: 'Logo da marca',
        alignment,
        size: 'sm',
        radius: 'md',
        overlapBanner: false,
    });

const customerForm = (layout: 'card' | 'compact' = 'card') =>
    nested('form-required', 'checkout_form', {
        layout,
        title: 'Seus dados',
        description: 'Usamos para enviar o acesso e o comprovante.',
        showPhone: false,
        showDocument: false,
    });

const trust = (layout: 'pills' | 'strip' | 'cards') =>
    nested('trust-template', 'security_badges', {
        layout,
        title: 'Compra protegida',
        showEncryption: true,
        showGuarantee: true,
        showPrivacy: true,
    });

function subscriptionDocument(selected: TemplatePrice, plans: TemplatePrice[]) {
    const left: Block[] = [];
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
        customerForm('compact'),
        nested('payment-required', 'payment_methods', {
            layout: 'list',
            title: 'Forma de pagamento',
            description: 'A cobrança se renova automaticamente no cartão.',
            showCard: true,
            showPix: true,
            showBoleto: false,
        }),
        nested('card-template', 'card_payment', {
            layout: 'standard',
            title: 'Dados do cartão',
            description: 'Processados com criptografia pelo gateway de pagamento.',
            showInstallments: false,
        }),
    );
    const right: Block[] = [
        nested('product-required', 'product_summary', {
            layout: 'card',
            title: 'Sua assinatura',
            description: 'Você só será cobrado depois de confirmar.',
            buttonLabel: 'Assinar agora',
            recurringLabel: recurringText(selected),
            badge: '',
            imageUrl: '',
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
            description:
                'Sem fidelidade e sem multa. Você mantém o acesso até o fim do período pago.',
            days: 7,
        }),
        trust('strip'),
    ];
    return base(
        [
            logo('center'),
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
                    {
                        question: 'Recebo nota ou comprovante?',
                        answer: 'Sim. Cada cobrança gera um comprovante enviado para o seu e-mail.',
                    },
                ],
            }),
            section('footer-template', 'footer', {
                layout: 'minimal',
                text: 'Pagamento recorrente processado com segurança.',
                showSecurity: true,
            }),
        ],
        'Assine agora',
    );
}

function digitalProductDocument(selected: TemplatePrice) {
    return base(
        [
            section('countdown-template', 'countdown', {
                layout: 'banner',
                title: 'Condição especial por tempo limitado',
                deadline: inDays(3),
            }),
            logo('center'),
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
                    customerForm('card'),
                    nested('payment-required', 'payment_methods', {
                        layout: 'cards',
                        title: 'Como você quer pagar?',
                        description: 'Escolha uma forma de pagamento segura.',
                        showCard: true,
                        showPix: true,
                        showBoleto: true,
                    }),
                    nested('card-template', 'card_payment', {
                        layout: 'visual',
                        title: 'Dados do cartão',
                        description: 'Criptografados de ponta a ponta.',
                        showInstallments: true,
                    }),
                ],
                [
                    nested('product-required', 'product_summary', {
                        layout: 'card',
                        title: 'Resumo do pedido',
                        description: 'Confira antes de finalizar.',
                        buttonLabel: 'Finalizar compra',
                        badge: 'Acesso vitalício',
                        recurringLabel: '',
                        imageUrl: '',
                    }),
                    nested('guarantee-template', 'guarantee', {
                        layout: 'horizontal',
                        title: 'Risco zero para você',
                        description:
                            'Se não fizer sentido, peça o reembolso integral dentro do prazo.',
                        days: 7,
                    }),
                    trust('pills'),
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
                layout: 'split',
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
            section('footer-template', 'footer', {
                layout: 'centered',
                text: 'Pagamento processado com segurança.',
                showSecurity: true,
            }),
        ],
        selected.productName,
    );
}

function expressDocument() {
    return base(
        [
            section('countdown-template', 'countdown', {
                layout: 'minimal',
                title: 'Preço promocional válido por pouco tempo',
                deadline: inDays(1),
            }),
            logo('left'),
            grid(
                'grid-template',
                [
                    customerForm('compact'),
                    nested('payment-required', 'payment_methods', {
                        layout: 'segmented',
                        title: 'Pagamento',
                        description: 'Pix aprova na hora.',
                        showCard: true,
                        showPix: true,
                        showBoleto: false,
                    }),
                    nested('card-template', 'card_payment', {
                        layout: 'compact',
                        title: 'Dados do cartão',
                        description: 'Ambiente criptografado.',
                        showInstallments: true,
                    }),
                ],
                [
                    nested('product-required', 'product_summary', {
                        layout: 'compact',
                        title: 'Seu pedido',
                        description: '',
                        buttonLabel: 'Pagar agora',
                        badge: '',
                        recurringLabel: '',
                        imageUrl: '',
                    }),
                    nested('guarantee-template', 'guarantee', {
                        layout: 'minimal',
                        title: 'Garantia de 7 dias',
                        description: 'Não gostou? Devolvemos seu dinheiro.',
                        days: 7,
                    }),
                    trust('strip'),
                ],
            ),
            section('footer-template', 'footer', {
                layout: 'minimal',
                text: 'Pagamento processado com segurança.',
                showSecurity: false,
            }),
        ],
        'Finalize sua compra',
    );
}

function inDays(days: number) {
    return new Date(Date.now() + days * 86_400_000).toISOString();
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
