import type { CheckoutDocument } from '@/lib/api/types';

export const blankCheckoutDocument: CheckoutDocument = {
    schemaVersion: 1,
    theme: {
        backgroundColor: '#f7f7fb',
        surfaceColor: '#ffffff',
        textColor: '#202235',
        accentColor: '#7065e8',
        themeMode: 'light',
        grayTone: 'neutral',
        fontFamily: 'system',
        radius: 'md',
        shadow: 'sm',
    },
    layout: {
        maxWidth: 'lg',
        componentGap: 'md',
        pagePadding: 'lg',
        inputGroupStyle: 'filled',
        componentBackgroundStyle: 'filled',
        componentBorderStyle: 'visible',
        componentShadowMode: 'auto',
    },
    sections: [
        {
            id: 'form-required',
            type: 'checkout_form',
            visible: true,
            props: {
                layout: 'card',
                title: 'Dados pessoais',
                description: 'Preencha as informações para concluir a compra.',
                showPhone: false,
                showDocument: false,
            },
        },
        {
            id: 'payment-required',
            type: 'payment_methods',
            visible: true,
            props: {
                layout: 'cards',
                title: 'Formas de pagamento',
                description: 'Escolha uma forma de pagamento segura.',
                showCard: true,
                showPix: true,
                showBoleto: true,
            },
        },
        {
            id: 'product-required',
            type: 'product_summary',
            visible: true,
            props: {
                layout: 'card',
                title: 'Carrinho e resumo',
                description: 'Revise os itens e valores antes de finalizar.',
                buttonLabel: 'Finalizar compra',
            },
        },
    ],
    settings: { showPoweredBy: true },
    seo: { title: '', description: '' },
};

export const defaultCheckoutDocument: CheckoutDocument = {
    schemaVersion: 1,
    theme: {
        themeMode: 'light',
        grayTone: 'neutral',
        fontFamily: 'system',
        backgroundColor: '#f7f7fb',
        surfaceColor: '#ffffff',
        textColor: '#202235',
        accentColor: '#7065e8',
        radius: 'md',
        shadow: 'sm',
    },
    layout: {
        maxWidth: 'lg',
        componentGap: 'md',
        pagePadding: 'lg',
        inputGroupStyle: 'filled',
        componentBackgroundStyle: 'filled',
        componentBorderStyle: 'visible',
        componentShadowMode: 'auto',
    },
    sections: [
        {
            id: 'hero-initial',
            type: 'hero',
            visible: true,
            props: {
                layout: 'centered',
                eyebrow: 'Oferta especial',
                title: 'Transforme seus resultados hoje',
                description: 'Uma solução completa, simples e segura para você avançar.',
                buttonLabel: 'Quero começar agora',
                buttonAction: 'payment',
                buttonUrl: '',
                imageUrl: '',
                alignment: 'center',
            },
        },
        {
            id: 'benefits-initial',
            type: 'benefits',
            visible: true,
            props: {
                layout: 'cards',
                title: 'Tudo o que você precisa',
                items: [
                    {
                        title: 'Acesso imediato',
                        description: 'Comece assim que o pagamento for confirmado.',
                    },
                    {
                        title: 'Compra segura',
                        description: 'Seus dados são processados com segurança.',
                    },
                    {
                        title: 'Suporte dedicado',
                        description: 'Conte com ajuda sempre que precisar.',
                    },
                ],
            },
        },
        {
            id: 'guarantee-initial',
            type: 'guarantee',
            visible: true,
            props: {
                layout: 'horizontal',
                title: 'Garantia de 7 dias',
                description:
                    'Experimente sem riscos. Se não fizer sentido para você, solicite o reembolso dentro do prazo.',
                days: 7,
            },
        },
        {
            id: 'form-initial',
            type: 'checkout_form',
            visible: true,
            props: {
                layout: 'card',
                title: 'Dados pessoais',
                description: 'Preencha as informações para concluir a compra.',
                showPhone: false,
                showDocument: false,
            },
        },
        {
            id: 'product-initial',
            type: 'product_summary',
            visible: true,
            props: {
                layout: 'card',
                title: 'Carrinho e resumo',
                description: 'Revise os itens e valores antes de finalizar.',
                buttonLabel: 'Finalizar compra',
            },
        },
        {
            id: 'payment-initial',
            type: 'payment_methods',
            visible: true,
            props: {
                layout: 'cards',
                title: 'Formas de pagamento',
                description: 'Escolha como deseja pagar.',
                showCard: true,
                showPix: true,
                showBoleto: false,
            },
        },
        {
            id: 'footer-initial',
            type: 'footer',
            visible: true,
            props: { text: 'Pagamento seguro processado pelo Astro.', showSecurity: true },
        },
    ],
    settings: { showPoweredBy: true },
    seo: { title: 'Checkout seguro', description: 'Finalize sua compra com segurança.' },
};
