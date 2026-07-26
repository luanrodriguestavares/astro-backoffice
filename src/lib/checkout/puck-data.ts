import type { BuilderData, BuilderRootProps } from '@/components/checkout-builder/config';
import type { CheckoutDocument, CheckoutSectionType } from '@/lib/api/types';

const supported = new Set<CheckoutSectionType>([
    'hero',
    'logo',
    'banner',
    'grid',
    'image',
    'video',
    'text',
    'benefits',
    'testimonials',
    'faq',
    'guarantee',
    'countdown',
    'product_summary',
    'checkout_form',
    'order_summary',
    'payment_methods',
    'card_payment',
    'pix_payment',
    'boleto_payment',
    'shipping_address',
    'shipping_methods',
    'coupon_field',
    'security_badges',
    'footer',
]);

export function documentToPuck(document: CheckoutDocument): BuilderData {
    const theme = document.theme;
    const layout = document.layout;
    return {
        root: {
            props: {
                themeMode: themeModeValue(theme.themeMode ?? theme.themePreset),
                grayTone: grayToneValue(theme.grayTone ?? theme.themePreset),
                fontFamily: fontValue(theme.fontFamily),
                backgroundColor: stringValue(theme.backgroundColor, '#f7f7fb'),
                surfaceColor: stringValue(theme.surfaceColor, '#ffffff'),
                textColor: stringValue(theme.textColor, '#202235'),
                accentColor: stringValue(theme.accentColor, '#7065e8'),
                radius: sizeValue(theme.radius),
                shadow: shadowValue(theme.shadow),
                maxWidth: widthValue(layout.maxWidth),
                componentGap: sizeValue(layout.componentGap),
                pagePadding: sizeValue(layout.pagePadding, 'lg'),
                inputGroupStyle: inputGroupStyleValue(layout.inputGroupStyle),
            },
        },
        content: document.sections
            .filter((section) => section.visible && supported.has(section.type))
            .map((section) => ({
                type: section.type,
                props: { ...migrateDefaultTitles(section.type, section.props), id: section.id },
            })),
    } as BuilderData;
}

export function puckToDocument(data: BuilderData, previous: CheckoutDocument): CheckoutDocument {
    const rootContainer = data.root as {
        props?: Partial<BuilderRootProps>;
    } & Partial<BuilderRootProps>;
    const root = rootContainer.props ?? rootContainer;
    return {
        schemaVersion: 1,
        theme: {
            themeMode: themeModeValue(root.themeMode),
            grayTone: grayToneValue(root.grayTone),
            fontFamily: fontValue(root.fontFamily),
            backgroundColor: safeColor(root.backgroundColor, '#f7f7fb'),
            surfaceColor: safeColor(root.surfaceColor, '#ffffff'),
            textColor: safeColor(root.textColor, '#202235'),
            accentColor: safeColor(root.accentColor, '#7065e8'),
            radius: sizeValue(root.radius),
            shadow: shadowValue(root.shadow),
        },
        layout: {
            ...previous.layout,
            maxWidth: widthValue(root.maxWidth),
            componentGap: sizeValue(root.componentGap),
            pagePadding: sizeValue(root.pagePadding, 'lg'),
            inputGroupStyle: inputGroupStyleValue(root.inputGroupStyle),
        },
        sections: data.content
            .filter((component) => supported.has(component.type as CheckoutSectionType))
            .slice(0, 50)
            .map((component, index) => {
                const props = { ...component.props } as Record<string, unknown>;
                const id =
                    typeof props.id === 'string' ? props.id : `${component.type}-${index + 1}`;
                delete props.id;
                return { id, type: component.type as CheckoutSectionType, visible: true, props };
            }),
        settings: previous.settings,
        seo: previous.seo,
    };
}

function stringValue(value: unknown, fallback: string) {
    return typeof value === 'string' ? value : fallback;
}

function themeModeValue(value: unknown): BuilderRootProps['themeMode'] {
    if (value === 'dark' || value === 'dark-zinc') return 'dark';
    if (value === 'system') return 'system';
    return 'light';
}

function grayToneValue(value: unknown): BuilderRootProps['grayTone'] {
    if (['gray', 'zinc', 'slate'].includes(String(value)))
        return value as BuilderRootProps['grayTone'];
    if (value === 'dark-zinc') return 'zinc';
    return 'neutral';
}

function fontValue(value: unknown): BuilderRootProps['fontFamily'] {
    return [
        'system',
        'geist',
        'inter',
        'montserrat',
        'poppins',
        'roboto',
        'open-sans',
        'lato',
        'arial',
        'georgia',
        'serif',
        'mono',
    ].includes(String(value))
        ? (value as BuilderRootProps['fontFamily'])
        : 'system';
}

function sizeValue(
    value: unknown,
    fallback: BuilderRootProps['radius'] = 'md',
): BuilderRootProps['radius'] {
    if (['xs', 'sm', 'md', 'lg', 'xl'].includes(String(value)))
        return value as BuilderRootProps['radius'];
    if (typeof value === 'number')
        return value <= 6
            ? 'xs'
            : value <= 10
              ? 'sm'
              : value <= 16
                ? 'md'
                : value <= 24
                  ? 'lg'
                  : 'xl';
    return fallback;
}

function shadowValue(value: unknown): BuilderRootProps['shadow'] {
    return ['none', 'xs', 'sm', 'md', 'lg'].includes(String(value))
        ? (value as BuilderRootProps['shadow'])
        : 'sm';
}

function widthValue(value: unknown): BuilderRootProps['maxWidth'] {
    if (['sm', 'md', 'lg', 'xl', 'full'].includes(String(value)))
        return value as BuilderRootProps['maxWidth'];
    if (typeof value === 'number')
        return value <= 800
            ? 'sm'
            : value <= 1000
              ? 'md'
              : value <= 1200
                ? 'lg'
                : value <= 1360
                  ? 'xl'
                  : 'full';
    return 'lg';
}

function inputGroupStyleValue(value: unknown): BuilderRootProps['inputGroupStyle'] {
    return value === 'outlined' ? 'outlined' : 'filled';
}

function safeColor(value: unknown, fallback: string) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function migrateDefaultTitles(type: CheckoutSectionType, props: Record<string, unknown>) {
    const title = props.title;
    const replacements: Partial<Record<CheckoutSectionType, Record<string, string>>> = {
        product_summary: { 'Resumo da sua compra': 'Itens do carrinho' },
        checkout_form: { 'Seus dados': 'Dados pessoais' },
        order_summary: { 'Total do pedido': 'Resumo do pedido' },
        payment_methods: { 'Como você quer pagar?': 'Formas de pagamento' },
        card_payment: { 'Dados do cartão': 'Dados de pagamento' },
        shipping_address: { 'Endereço de entrega': 'Dados de entrega' },
        shipping_methods: { 'Escolha a entrega': 'Frete' },
    };
    const replacement = typeof title === 'string' ? replacements[type]?.[title] : undefined;
    return replacement ? { ...props, title: replacement } : props;
}
