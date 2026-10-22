'use client';

import { useState, type ReactNode } from 'react';

import {
    CheckoutCardPayment,
    CheckoutCartSummary,
    CheckoutCustomerForm,
    CheckoutOrderHeader,
    CheckoutPaymentMethodNotice,
    CheckoutPaymentMethods,
    type CustomerValues,
} from '@astro/checkout-renderer/components';
import { checkoutDesignSystemStyles } from '@astro/checkout-renderer/design-system';
import {
    appearanceToTheme,
    checkoutAccentSwatches,
    checkoutFontsHref,
    checkoutGoogleFontsUrl,
    checkoutPageAttributes,
    checkoutThemeVariables,
    fontStack,
    radiusValue,
    resolveCheckoutPalette,
    type CheckoutAppearance,
} from '@astro/checkout-renderer/theme';
import type { FontWeight, SizePreset } from '@astro/checkout-renderer/types';

import { ColorPickerControl } from '@/components/checkout-builder/color-picker-field';
import { PhoneMockup } from '@/components/checkout-builder/phone-mockup';
import { Icon } from '@/components/ui/icon';

export type AppearancePreviewProduct = {
    name: string;
    price: string;
    recurringLabel?: string;
};

const fontChoices = [
    { value: 'inter', label: 'Inter' },
    { value: 'geist', label: 'Geist' },
    { value: 'dm-sans', label: 'DM Sans' },
    { value: 'manrope', label: 'Manrope' },
    { value: 'plus-jakarta', label: 'Jakarta' },
    { value: 'outfit', label: 'Outfit' },
    { value: 'poppins', label: 'Poppins' },
    { value: 'montserrat', label: 'Montserrat' },
    { value: 'sora', label: 'Sora' },
    { value: 'playfair', label: 'Playfair' },
] as const;

const headingWeights: { value: FontWeight; label: string }[] = [
    { value: '500', label: 'Médio' },
    { value: '600', label: 'Semi' },
    { value: '700', label: 'Negrito' },
    { value: '800', label: 'Extra' },
];

const bodyWeights: { value: FontWeight; label: string }[] = [
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Médio' },
];

const radiusChoices: { value: SizePreset; label: string }[] = [
    { value: 'xs', label: 'Reto' },
    { value: 'sm', label: 'Suave' },
    { value: 'md', label: 'Médio' },
    { value: 'lg', label: 'Redondo' },
    { value: 'xl', label: 'Bem redondo' },
];

const motionChoices: { value: CheckoutAppearance['motion']; label: string; hint: string }[] = [
    {
        value: 'full',
        label: 'Completas',
        hint: 'Entradas suaves, brilho no botão e efeitos ao passar o mouse',
    },
    { value: 'subtle', label: 'Sutis', hint: 'Somente respostas a cliques e seleções' },
    { value: 'none', label: 'Desativadas', hint: 'Página totalmente estática' },
];

const shadowChoices: { value: CheckoutAppearance['shadow']; label: string }[] = [
    { value: 'none', label: 'Nenhuma' },
    { value: 'xs', label: 'Leve' },
    { value: 'sm', label: 'Média' },
    { value: 'md', label: 'Forte' },
];

const buttonStyleChoices: { value: CheckoutAppearance['buttonStyle']; label: string }[] = [
    { value: 'solid', label: 'Sólido' },
    { value: 'gradient', label: 'Degradê' },
    { value: 'glow', label: 'Brilho' },
    { value: 'outline', label: 'Contorno' },
];

const buttonShapeChoices: { value: CheckoutAppearance['buttonShape']; label: string }[] = [
    { value: 'rounded', label: 'Acompanha os blocos' },
    { value: 'pill', label: 'Pílula' },
    { value: 'square', label: 'Reto' },
];

/**
 * Assistente de aparência: as configurações básicas de identidade visual do checkout, com
 * prévia ao vivo no celular. Usado ao criar um checkout e, depois, no editor ("Aparência").
 * Conteúdo, blocos e textos continuam sendo montados no editor.
 */
export function CheckoutAppearanceStudio({
    value,
    onChange,
    product,
}: {
    value: CheckoutAppearance;
    onChange(next: CheckoutAppearance): void;
    product: AppearancePreviewProduct;
}) {
    const [caption, setCaption] = useState<{ id: number; text: string }>();
    const palette = resolveCheckoutPalette(appearanceToTheme(value).theme);
    const swatch = checkoutAccentSwatches.find(
        (item) => item.value.toLowerCase() === value.accentColor.toLowerCase(),
    );

    function update<K extends keyof CheckoutAppearance>(
        field: K,
        next: CheckoutAppearance[K],
        text: string,
    ) {
        if (value[field] === next) return;
        onChange({ ...value, [field]: next });
        setCaption((current) => ({ id: (current?.id ?? 0) + 1, text }));
    }

    return (
        <div className="grid gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[minmax(0,1fr)]">
            {/* Fontes do seletor ("Aa" em cada família). */}
            <link rel="stylesheet" href={checkoutGoogleFontsUrl} />
            <style>{studioStyles}</style>
            <div className="studio-scroll grid content-start gap-7 lg:min-h-0 lg:overflow-y-auto lg:pb-1 lg:pl-1 lg:pr-4">
                <p className="flex items-start gap-2.5 rounded-[14px] border border-border bg-surface-muted px-3.5 py-3 text-[12px] leading-5 text-muted">
                    <Icon name="layers" className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <span>
                        <strong className="font-semibold text-foreground">
                            Configurações básicas de aparência.
                        </strong>{' '}
                        Na próxima tela, o editor abre com o modelo escolhido para você ajustar
                        blocos, textos, imagens, formas de pagamento e as telas de confirmação.
                    </span>
                </p>

                <Section title="Identidade">
                    <Group title="Cor principal" hint="Aplicada a botões, seleções e destaques.">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {checkoutAccentSwatches.map((item) => {
                                const selected = swatch?.value === item.value;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        title={item.label}
                                        aria-label={item.label}
                                        aria-pressed={selected}
                                        onClick={() =>
                                            update('accentColor', item.value, `Cor: ${item.label}`)
                                        }
                                        className="studio-swatch grid size-9 place-items-center rounded-full"
                                        style={{
                                            background: item.value,
                                            outline: selected
                                                ? `2px solid ${item.value}`
                                                : undefined,
                                            outlineOffset: 2,
                                        }}
                                    >
                                        {selected && (
                                            <Icon name="check" className="size-4 text-white" />
                                        )}
                                    </button>
                                );
                            })}
                            <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-border" />
                            <ColorPickerControl
                                variant="swatch"
                                name="accentColor"
                                label="Cor principal"
                                active={!swatch}
                                value={value.accentColor}
                                onChange={(next) =>
                                    update('accentColor', next, 'Cor personalizada')
                                }
                            />
                        </div>
                        <p className="text-[11.5px] text-muted">
                            {swatch ? swatch.label : 'Personalizada'} ·{' '}
                            <span className="font-mono uppercase">{value.accentColor}</span>
                        </p>
                    </Group>

                    <Group title="Tema">
                        <Segmented
                            value={value.themeMode}
                            options={[
                                { value: 'light', label: 'Claro', icon: 'sun' },
                                { value: 'dark', label: 'Escuro', icon: 'moon' },
                            ]}
                            onChange={(next) =>
                                update(
                                    'themeMode',
                                    next,
                                    next === 'dark' ? 'Tema escuro' : 'Tema claro',
                                )
                            }
                        />
                    </Group>
                </Section>

                <Section title="Tipografia">
                    <Group title="Fonte">
                        <div className="grid grid-cols-5 gap-1.5">
                            {fontChoices.map((font) => (
                                <button
                                    key={font.value}
                                    type="button"
                                    aria-pressed={value.fontFamily === font.value}
                                    onClick={() =>
                                        update('fontFamily', font.value, `Fonte: ${font.label}`)
                                    }
                                    className={`studio-choice grid justify-items-center gap-0.5 rounded-[12px] border px-1 py-2 ${choiceTone(value.fontFamily === font.value)}`}
                                >
                                    <span
                                        className="text-[19px] leading-6"
                                        style={{
                                            fontFamily: fontStack(font.value),
                                            fontWeight: 600,
                                        }}
                                    >
                                        Aa
                                    </span>
                                    <span className="truncate text-[10.5px] text-muted">
                                        {font.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Group>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Group title="Peso dos títulos">
                            <Segmented
                                value={value.headingFontWeight}
                                options={headingWeights}
                                onChange={(next) =>
                                    update(
                                        'headingFontWeight',
                                        next,
                                        `Títulos: ${headingWeights.find((item) => item.value === next)?.label}`,
                                    )
                                }
                                renderLabel={(option) => (
                                    <span style={{ fontWeight: Number(option.value) }}>
                                        {option.label}
                                    </span>
                                )}
                            />
                        </Group>
                        <Group title="Peso do texto">
                            <Segmented
                                value={value.bodyFontWeight}
                                options={bodyWeights}
                                onChange={(next) =>
                                    update(
                                        'bodyFontWeight',
                                        next,
                                        `Texto: ${bodyWeights.find((item) => item.value === next)?.label}`,
                                    )
                                }
                                renderLabel={(option) => (
                                    <span style={{ fontWeight: Number(option.value) }}>
                                        {option.label}
                                    </span>
                                )}
                            />
                        </Group>
                    </div>
                </Section>

                <Section title="Blocos">
                    <Group
                        title="Nível de detalhe"
                        hint="Pode ser alterado no editor a qualquer momento."
                    >
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Choice
                                selected={value.blockStyle === 'compact'}
                                onClick={() => update('blockStyle', 'compact', 'Estilo compacto')}
                            >
                                <span className="flex items-center justify-between gap-2">
                                    <strong className="text-[13px]">Compacto</strong>
                                    <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success">
                                        Recomendado para celular
                                    </span>
                                </span>
                                <BlockSketch compact />
                                <span className="text-[11.5px] leading-4 text-muted">
                                    Apenas título e campos. O comprador chega mais rápido ao botão
                                    de pagamento.
                                </span>
                            </Choice>
                            <Choice
                                selected={value.blockStyle === 'rich'}
                                onClick={() => update('blockStyle', 'rich', 'Estilo completo')}
                            >
                                <strong className="text-[13px]">Completo</strong>
                                <BlockSketch />
                                <span className="text-[11.5px] leading-4 text-muted">
                                    Ícones, subtítulos e notas de segurança, com mais espaçamento.
                                </span>
                            </Choice>
                        </div>
                    </Group>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Group title="Fundo dos blocos">
                            <Segmented
                                value={value.cardBackground}
                                options={[
                                    { value: 'filled', label: 'Com fundo' },
                                    { value: 'transparent', label: 'Transparente' },
                                ]}
                                onChange={(next) =>
                                    update(
                                        'cardBackground',
                                        next,
                                        next === 'transparent'
                                            ? 'Blocos sem fundo'
                                            : 'Blocos com fundo',
                                    )
                                }
                            />
                        </Group>
                        <Group title="Bordas">
                            <Segmented
                                value={value.borders}
                                options={[
                                    { value: 'visible', label: 'Visíveis' },
                                    { value: 'hidden', label: 'Ocultas' },
                                ]}
                                onChange={(next) =>
                                    update(
                                        'borders',
                                        next,
                                        next === 'hidden' ? 'Sem bordas' : 'Com bordas',
                                    )
                                }
                            />
                        </Group>
                    </div>
                    <Group
                        title="Sombra"
                        hint={
                            value.cardBackground === 'transparent'
                                ? 'Blocos transparentes não exibem sombra.'
                                : undefined
                        }
                    >
                        <Segmented
                            value={value.shadow}
                            options={shadowChoices}
                            disabled={value.cardBackground === 'transparent'}
                            onChange={(next) =>
                                update(
                                    'shadow',
                                    next,
                                    `Sombra: ${shadowChoices.find((item) => item.value === next)?.label}`,
                                )
                            }
                        />
                    </Group>
                    <Group title="Arredondamento" hint="Vale para blocos, campos e botões.">
                        <div className="grid grid-cols-5 gap-1.5">
                            {radiusChoices.map((radius) => (
                                <button
                                    key={radius.value}
                                    type="button"
                                    aria-pressed={value.radius === radius.value}
                                    onClick={() =>
                                        update(
                                            'radius',
                                            radius.value,
                                            `Arredondamento: ${radius.label}`,
                                        )
                                    }
                                    className={`studio-choice grid justify-items-center gap-1.5 rounded-[12px] border px-1 pb-2 pt-2.5 ${choiceTone(value.radius === radius.value)}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="block size-7 border-l-2 border-t-2 border-current opacity-70"
                                        style={{ borderTopLeftRadius: radiusValue(radius.value) }}
                                    />
                                    <span className="truncate text-[10.5px] text-muted">
                                        {radius.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Group>
                </Section>

                <Section title="Botão principal">
                    <Group title="Estilo">
                        <Segmented
                            value={value.buttonStyle}
                            options={buttonStyleChoices}
                            onChange={(next) =>
                                update(
                                    'buttonStyle',
                                    next,
                                    `Botão: ${buttonStyleChoices.find((item) => item.value === next)?.label}`,
                                )
                            }
                        />
                    </Group>
                    <Group title="Formato">
                        <Segmented
                            value={value.buttonShape}
                            options={buttonShapeChoices}
                            onChange={(next) =>
                                update(
                                    'buttonShape',
                                    next,
                                    `Formato: ${buttonShapeChoices.find((item) => item.value === next)?.label}`,
                                )
                            }
                        />
                    </Group>
                </Section>

                <Section title="Movimento">
                    <Group
                        title="Animações"
                        hint="Visitantes com a opção de reduzir movimento ativada no dispositivo sempre veem a página sem animações."
                    >
                        <div className="grid gap-1.5 sm:grid-cols-3">
                            {motionChoices.map((motion) => (
                                <Choice
                                    key={motion.value}
                                    selected={value.motion === motion.value}
                                    onClick={() =>
                                        update('motion', motion.value, `Animações: ${motion.label}`)
                                    }
                                >
                                    <strong className="text-[12.5px]">{motion.label}</strong>
                                    <span className="text-[11px] leading-4 text-muted">
                                        {motion.hint}
                                    </span>
                                </Choice>
                            ))}
                        </div>
                    </Group>
                </Section>
            </div>

            <div className="relative mx-auto flex w-full min-w-[260px] flex-col lg:min-h-0">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Prévia ilustrativa
                    </p>
                    <p className="text-[11px] text-muted">Selecione uma forma de pagamento</p>
                </div>
                {caption && (
                    <span
                        key={caption.id}
                        className="studio-caption pointer-events-none absolute left-1/2 top-[84px] z-20 whitespace-nowrap rounded-full bg-[#101214]/88 px-3 py-1.5 text-[11.5px] font-medium text-white shadow-lg"
                    >
                        {caption.text}
                    </span>
                )}
                {/* Abaixo de lg a altura é fixa; acima, o celular ocupa a altura que sobrar. */}
                <div className="h-[600px] min-h-0 lg:h-auto lg:flex-1">
                    <PhoneMockup
                        maxScale={0.8}
                        background={palette.background}
                        foreground={palette.text}
                        title="Prévia do checkout no celular"
                    >
                        <CheckoutPreview appearance={value} product={product} />
                    </PhoneMockup>
                </div>
                <p className="mt-3 text-center text-[11px] leading-4 text-muted">
                    O conteúdo final é montado no editor, a partir do modelo escolhido.
                </p>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="grid gap-4">
            <h3 className="border-b border-border pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {title}
            </h3>
            {children}
        </section>
    );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <section className="grid gap-2.5">
            <div>
                <h4 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h4>
                {hint && <p className="mt-0.5 text-[11.5px] leading-4 text-muted">{hint}</p>}
            </div>
            {children}
        </section>
    );
}

function choiceTone(selected: boolean) {
    return selected
        ? 'border-brand/45 bg-brand-soft/60 shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_10%,transparent)]'
        : 'border-border bg-[var(--control-bg)] hover:border-brand/25';
}

function Choice({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick(): void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`studio-choice grid content-start gap-1.5 rounded-[14px] border p-3 text-left ${choiceTone(selected)}`}
        >
            {children}
        </button>
    );
}

function Segmented<T extends string>({
    value,
    options,
    onChange,
    renderLabel,
    disabled = false,
}: {
    value: T;
    options: { value: T; label: string; icon?: 'sun' | 'moon' }[];
    onChange(next: T): void;
    renderLabel?(option: { value: T; label: string }): ReactNode;
    disabled?: boolean;
}) {
    return (
        <div
            aria-disabled={disabled || undefined}
            className={`flex gap-1 rounded-[13px] border border-border bg-surface-muted p-1 ${disabled ? 'pointer-events-none opacity-45' : ''}`}
        >
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange(option.value)}
                        className={`studio-choice flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 text-[12px] ${selected ? 'bg-surface font-semibold text-foreground shadow-[0_1px_2px_rgba(16,18,20,.08),0_2px_8px_rgba(16,18,20,.06)]' : 'text-muted hover:text-foreground'}`}
                    >
                        {option.icon && <Icon name={option.icon} className="size-3.5" />}
                        <span className="truncate">
                            {renderLabel ? renderLabel(option) : option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

/** Miniatura do bloco: com ícone e subtítulo (completo) ou só título e campos (compacto). */
function BlockSketch({ compact = false }: { compact?: boolean }) {
    return (
        <span
            aria-hidden="true"
            className="my-1 grid gap-1.5 rounded-[10px] border border-border bg-surface p-2.5"
        >
            <span className="flex items-center gap-2">
                {!compact && <span className="size-5 rounded-md bg-surface-muted" />}
                <span className="grid flex-1 gap-1">
                    <span className="h-1.5 w-1/2 rounded-full bg-foreground/55" />
                    {!compact && <span className="h-1 w-3/4 rounded-full bg-foreground/15" />}
                </span>
            </span>
            <span className="h-3.5 rounded-[5px] border border-border" />
            <span className="h-3.5 rounded-[5px] border border-border" />
            {!compact && <span className="h-1 w-2/3 rounded-full bg-foreground/15" />}
        </span>
    );
}

/** O checkout de verdade (componentes do renderer) com a aparência escolhida. */
function CheckoutPreview({
    appearance,
    product,
}: {
    appearance: CheckoutAppearance;
    product: AppearancePreviewProduct;
}) {
    const [method, setMethod] = useState('card');
    const [customer, setCustomer] = useState<CustomerValues>({
        name: '',
        email: '',
        phone: '',
        document: '',
    });
    const { theme, layout } = appearanceToTheme(appearance);
    const palette = resolveCheckoutPalette(theme);
    const fontsHref = checkoutFontsHref(theme);
    const row = {
        name: product.name,
        quantity: 'Qtd: 1',
        price: product.price,
        recurringLabel: product.recurringLabel,
    };
    return (
        <div
            data-checkout-page
            {...checkoutPageAttributes(theme)}
            data-theme={theme.themeMode}
            style={{
                ...(checkoutThemeVariables(theme, layout) as React.CSSProperties),
                colorScheme: theme.themeMode === 'dark' ? 'dark' : 'light',
                // O iframe usa zoom: 100vh precisa ser compensado pela escala.
                minHeight: 'calc(100vh / var(--phone-zoom, 1))',
                boxSizing: 'border-box',
                // Respiro para o indicador de início, que fica por cima do conteúdo.
                padding: '14px 14px 40px',
                background: palette.background,
                color: palette.text,
            }}
        >
            {fontsHref && <link rel="stylesheet" href={fontsHref} />}
            <style>{checkoutDesignSystemStyles}</style>
            <style>{previewStyles}</style>
            <main style={{ display: 'grid', gap: 'var(--checkout-component-gap)' }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px 4px' }}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 'calc(var(--checkout-radius) * .6)',
                            background: 'var(--checkout-accent-gradient)',
                        }}
                    />
                    <strong style={{ fontSize: 14 }}>Sua marca</strong>
                </div>
                <CheckoutOrderHeader product={row} />
                <CheckoutCustomerForm
                    title="Dados pessoais"
                    description="Para enviar o acesso e o comprovante."
                    showPhone={false}
                    showDocument={false}
                    values={customer}
                    onChange={(field, next) =>
                        setCustomer((current) => ({ ...current, [field]: next }))
                    }
                />
                <CheckoutPaymentMethods
                    layout="list"
                    title="Pagamento"
                    description="Escolha como prefere pagar."
                    options={[
                        {
                            id: 'card',
                            kind: 'card',
                            title: 'Cartão de crédito',
                            description: 'Em até 12x',
                        },
                        {
                            id: 'pix',
                            kind: 'pix',
                            title: 'Pix',
                            description: 'Aprovação na hora',
                        },
                    ]}
                    selectedId={method}
                    onSelect={setMethod}
                    detail={
                        method === 'card' ? (
                            <CheckoutCardPayment
                                embedded
                                secureElement={
                                    <div style={{ display: 'grid', gap: 10 }}>
                                        <PreviewField
                                            label="Número do cartão"
                                            placeholder="0000 0000 0000 0000"
                                        />
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 10,
                                            }}
                                        >
                                            <PreviewField label="Validade" placeholder="MM/AA" />
                                            <PreviewField label="CVV" placeholder="123" />
                                        </div>
                                    </div>
                                }
                            />
                        ) : (
                            <CheckoutPaymentMethodNotice kind="pix" />
                        )
                    }
                />
                <CheckoutCartSummary
                    layout="compact"
                    title="Resumo do pedido"
                    product={row}
                    lines={[{ label: 'Subtotal', value: product.price }]}
                    total={product.price}
                    buttonLabel={method === 'pix' ? 'Pagar com Pix' : 'Finalizar compra'}
                    onSubmit={() => undefined}
                />
            </main>
        </div>
    );
}

/** Campo ilustrativo; o design system estiliza label e input pelo data-checkout-field. */
function PreviewField({ label, placeholder }: { label: string; placeholder: string }) {
    return (
        <label data-checkout-field style={{ fontSize: 'var(--checkout-label-size)' }}>
            <span style={{ fontWeight: 'var(--checkout-strong-weight)' as never }}>{label}</span>
            <input
                readOnly
                tabIndex={-1}
                placeholder={placeholder}
                style={{ width: '100%', padding: '0 14px' }}
            />
        </label>
    );
}

/** Trocas de aparência deslizam em vez de pular (exceto com animações desligadas). */
const previewStyles = `
html { scrollbar-width: none; }
html::-webkit-scrollbar { display: none; }
[data-checkout-page]:not([data-motion="none"]) :is(section, button, input, select, [data-payment-option], [data-checkout-block-header] h2) {
  transition: background-color .45s ease, border-color .45s ease, border-radius .45s ease,
    box-shadow .45s ease, color .45s ease, padding .35s ease, min-height .35s ease,
    font-weight .3s ease !important;
}
`;

const studioStyles = `
.studio-scroll { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, currentColor 18%, transparent) transparent; }
.studio-scroll::-webkit-scrollbar { width: 6px; }
.studio-scroll::-webkit-scrollbar-thumb { border-radius: 999px; background: color-mix(in srgb, currentColor 18%, transparent); }

.studio-choice, .studio-swatch { transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease, transform .2s cubic-bezier(.2,.8,.2,1), color .2s ease; }
.studio-choice:active, .studio-swatch:active { transform: scale(.97); }
.studio-swatch:hover { transform: scale(1.08); }
.studio-caption { animation: studio-caption 1.6s cubic-bezier(.2,.8,.2,1) both; transform: translateX(-50%); }
@keyframes studio-caption {
  0% { opacity: 0; transform: translate(-50%, 6px) scale(.96); }
  14%, 72% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -4px) scale(.98); }
}
@media (prefers-reduced-motion: reduce) {
  .studio-choice, .studio-swatch { transition: none; }
  .studio-caption { animation-duration: .01ms; opacity: 0; }
}
`;
