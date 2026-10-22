import {
    captureCheckoutCustomPreset,
    checkoutMatchesBrandPreset,
    type BuilderData,
    type BuilderRootProps,
} from '@/components/checkout-builder/config';
import type { CheckoutDocument, CheckoutSectionType } from '@/lib/api/types';
import {
    CHECKOUT_PAGE_ID,
    defaultResultPage,
    resolveCheckoutPages,
    type CheckoutResultPageKind,
} from '@astro/checkout-renderer/funnel';
import {
    checkoutBlockStyle,
    checkoutFontPresets,
    checkoutMotion,
} from '@astro/checkout-renderer/theme';

const supported = new Set<CheckoutSectionType>([
    'hero',
    'logo',
    'banner',
    'grid',
    'image',
    'video',
    'heading_text',
    'paragraph_text',
    'text',
    'benefits',
    'testimonials',
    'faq',
    'guarantee',
    'countdown',
    'plan_comparison',
    'data_table',
    'stats',
    'before_after',
    'client_logos',
    'floating_cta',
    'spacer_divider',
    'order_bump',
    'product_summary',
    'checkout_form',
    'payment_methods',
    'shipping_address',
    'shipping_methods',
    'coupon_field',
    'security_badges',
    'cta_button',
    'payment_status',
    'footer',
]);

export function documentToPuck(
    document: CheckoutDocument,
    pageId: string = CHECKOUT_PAGE_ID,
): BuilderData {
    const theme = document.theme;
    const layout = document.layout;
    const brandPreset = stringValue(theme.brandPreset, '');
    const props: BuilderRootProps = {
        themeMode: themeModeValue(theme.themeMode ?? theme.themePreset),
        grayTone: grayToneValue(theme.grayTone ?? theme.themePreset),
        brandPreset,
        customPreset: captureCheckoutCustomPreset(recordValue(theme.customPreset)),
        fontFamily: fontValue(theme.fontFamily),
        headingFontFamily:
            theme.headingFontFamily === undefined || theme.headingFontFamily === 'inherit'
                ? 'inherit'
                : fontValue(theme.headingFontFamily),
        buttonStyle: buttonStyleValue(theme.buttonStyle),
        buttonShape: buttonShapeValue(theme.buttonShape),
        headingFontWeight: fontWeightValue(theme.headingFontWeight, '700'),
        bodyFontWeight: fontWeightValue(theme.bodyFontWeight, '400'),
        backgroundColor: stringValue(theme.backgroundColor, '#f5f6f7'),
        surfaceColor: stringValue(theme.surfaceColor, '#ffffff'),
        textColor: stringValue(theme.textColor, '#101214'),
        accentColor: stringValue(theme.accentColor, '#101214'),
        radius: sizeValue(theme.radius),
        shadow: shadowValue(theme.shadow),
        maxWidth: widthValue(layout.maxWidth),
        componentGap: sizeValue(layout.componentGap),
        pagePadding: sizeValue(layout.pagePadding, 'lg'),
        inputGroupStyle:
            componentBackgroundStyleValue(layout.componentBackgroundStyle) === 'transparent'
                ? 'outlined'
                : 'filled',
        componentBackgroundStyle: componentBackgroundStyleValue(layout.componentBackgroundStyle),
        componentBorderStyle: componentBorderStyleValue(layout.componentBorderStyle),
        componentShadowMode: componentShadowModeValue(layout.componentShadowMode),
        blockStyle: checkoutBlockStyle(theme.blockStyle),
        motion: checkoutMotion(theme.motion),
        density: densityValue(layout.density),
    };

    // Documentos anteriores guardavam o nome do preset mesmo depois de alterações manuais.
    // Ao detectar divergência, migra para a identidade personalizada sem perder o visual atual.
    if (brandPreset === 'custom' || !checkoutMatchesBrandPreset(props, brandPreset)) {
        props.brandPreset = 'custom';
        props.customPreset = captureCheckoutCustomPreset(props);
    }

    return {
        root: { props },
        content: pageSections(document, pageId)
            .filter(
                (section) =>
                    section.visible && supported.has(section.type as CheckoutSectionType),
            )
            .map((section) => ({
                type: section.type,
                props: {
                    ...migrateDefaultTitles(section.type as CheckoutSectionType, section.props),
                    id: section.id,
                },
            })),
    } as BuilderData;
}

export function puckToDocument(
    data: BuilderData,
    previous: CheckoutDocument,
    pageId: string = CHECKOUT_PAGE_ID,
): CheckoutDocument {
    const rootContainer = data.root as {
        props?: Partial<BuilderRootProps>;
    } & Partial<BuilderRootProps>;
    const root = rootContainer.props ?? rootContainer;
    const sections = data.content
        .filter((component) => supported.has(component.type as CheckoutSectionType))
        .slice(0, 50)
        .map((component, index) => {
            const props = { ...component.props } as Record<string, unknown>;
            const id = typeof props.id === 'string' ? props.id : `${component.type}-${index + 1}`;
            delete props.id;
            if (component.type === 'product_summary') {
                delete props.buttonAction;
                delete props.buttonUrl;
                delete props.buttonSectionId;
                delete props.buttonNewTab;
            }
            return { id, type: component.type as CheckoutSectionType, visible: true, props };
        });
    const currentPages = resolveCheckoutPages(previous) as NonNullable<CheckoutDocument['pages']>;
    const activePage = currentPages.find((page) => page.id === pageId);
    const nextPages =
        pageId === CHECKOUT_PAGE_ID || !activePage
            ? currentPages
            : currentPages.map((page) =>
                  page.id === pageId
                      ? {
                            ...page,
                            sections: ensurePaymentStatus(
                                page.kind as CheckoutResultPageKind | 'content',
                                sections,
                            ),
                        }
                      : page,
              );
    return {
        schemaVersion: 1,
        theme: {
            themeMode: themeModeValue(root.themeMode),
            grayTone: grayToneValue(root.grayTone),
            brandPreset: typeof root.brandPreset === 'string' ? root.brandPreset : '',
            customPreset: captureCheckoutCustomPreset(root.customPreset ?? {}),
            fontFamily: fontValue(root.fontFamily),
            headingFontFamily:
                root.headingFontFamily === undefined || root.headingFontFamily === 'inherit'
                    ? 'inherit'
                    : fontValue(root.headingFontFamily),
            buttonStyle: buttonStyleValue(root.buttonStyle),
            buttonShape: buttonShapeValue(root.buttonShape),
            headingFontWeight: fontWeightValue(root.headingFontWeight, '700'),
            bodyFontWeight: fontWeightValue(root.bodyFontWeight, '400'),
            backgroundColor: safeColor(root.backgroundColor, '#f5f6f7'),
            surfaceColor: safeColor(root.surfaceColor, '#ffffff'),
            textColor: safeColor(root.textColor, '#101214'),
            accentColor: safeColor(root.accentColor, '#101214'),
            radius: sizeValue(root.radius),
            shadow: shadowValue(root.shadow),
            blockStyle: checkoutBlockStyle(root.blockStyle),
            motion: checkoutMotion(root.motion),
        },
        layout: {
            ...previous.layout,
            density: densityValue(root.density),
            maxWidth: widthValue(root.maxWidth),
            componentGap: sizeValue(root.componentGap),
            pagePadding: sizeValue(root.pagePadding, 'lg'),
            inputGroupStyle:
                componentBackgroundStyleValue(root.componentBackgroundStyle) === 'transparent'
                    ? 'outlined'
                    : 'filled',
            componentBackgroundStyle: componentBackgroundStyleValue(root.componentBackgroundStyle),
            componentBorderStyle: componentBorderStyleValue(root.componentBorderStyle),
            componentShadowMode: componentShadowModeValue(root.componentShadowMode),
        },
        sections: pageId === CHECKOUT_PAGE_ID ? sections : previous.sections,
        pages: nextPages,
        settings: previous.settings,
        seo: previous.seo,
    };
}

function pageSections(document: CheckoutDocument, pageId: string) {
    if (pageId === CHECKOUT_PAGE_ID) return document.sections;
    return resolveCheckoutPages(document).find((page) => page.id === pageId)?.sections ?? [];
}

function ensurePaymentStatus(
    kind: CheckoutResultPageKind | 'content',
    sections: CheckoutDocument['sections'],
) {
    if (kind === 'content' || sections.some((section) => section.type === 'payment_status'))
        return sections;
    return [...defaultResultPage(kind).sections, ...sections] as CheckoutDocument['sections'];
}

function densityValue(value: unknown): BuilderRootProps['density'] {
    return value === 'compact' || value === 'spacious' ? value : 'comfortable';
}

function stringValue(value: unknown, fallback: string) {
    return typeof value === 'string' ? value : fallback;
}

function recordValue(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function fontWeightValue(
    value: unknown,
    fallback: BuilderRootProps['headingFontWeight'],
): BuilderRootProps['headingFontWeight'] {
    return value === '400' ||
        value === '500' ||
        value === '600' ||
        value === '700' ||
        value === '800' ||
        value === '900'
        ? value
        : fallback;
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
    return checkoutFontPresets.some((font) => font.value === value)
        ? (value as BuilderRootProps['fontFamily'])
        : 'system';
}

function buttonStyleValue(value: unknown): BuilderRootProps['buttonStyle'] {
    return value === 'gradient' || value === 'glow' || value === 'outline' ? value : 'solid';
}

function buttonShapeValue(value: unknown): BuilderRootProps['buttonShape'] {
    return value === 'pill' || value === 'square' ? value : 'rounded';
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

function componentBackgroundStyleValue(
    value: unknown,
): BuilderRootProps['componentBackgroundStyle'] {
    return value === 'transparent' ? 'transparent' : 'filled';
}

function componentBorderStyleValue(value: unknown): BuilderRootProps['componentBorderStyle'] {
    return value === 'hidden' ? 'hidden' : 'visible';
}

function componentShadowModeValue(value: unknown): BuilderRootProps['componentShadowMode'] {
    return value === 'visible' || value === 'hidden' ? value : 'auto';
}

function safeColor(value: unknown, fallback: string) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function migrateDefaultTitles(type: CheckoutSectionType, props: Record<string, unknown>) {
    const title = props.title;
    const replacements: Partial<Record<CheckoutSectionType, Record<string, string>>> = {
        product_summary: { 'Resumo da sua compra': 'Itens do carrinho' },
        checkout_form: { 'Seus dados': 'Dados pessoais' },
        payment_methods: { 'Como você quer pagar?': 'Formas de pagamento' },
        shipping_address: { 'Endereço de entrega': 'Dados de entrega' },
        shipping_methods: { 'Escolha a entrega': 'Frete' },
    };
    const replacement = typeof title === 'string' ? replacements[type]?.[title] : undefined;
    return replacement ? { ...props, title: replacement } : props;
}
