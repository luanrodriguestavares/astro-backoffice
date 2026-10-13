'use client';

import '@puckeditor/core/puck.css';
import './checkout-editor.css';

import { createUsePuck, Puck } from '@puckeditor/core';
import Link from 'next/link';
import {
    Children,
    createContext,
    isValidElement,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactElement,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import {
    CheckoutBuilderMediaContext,
    CheckoutBuilderProductsContext,
    checkoutBuilderConfig,
    type BuilderData,
} from '@/components/checkout-builder/config';
import {
    EditorAppearanceButton,
    EditorViewportTracker,
} from '@/components/checkout-builder/appearance-dialog';
import { CheckoutSelectField } from '@/components/checkout-builder/checkout-select-field';
import { CheckoutVersionHistory } from '@/components/checkout-builder/checkout-version-history';
import { PaymentGatewaySettings } from '@/components/checkout-builder/payment-gateway-settings';
import {
    PHONE_MOCKUP_DEVICE,
    PhoneMockupShell,
} from '@/components/checkout-builder/phone-mockup';
import { Brand } from '@/components/brand';
import { GuidedTourTrigger } from '@/components/layout/guided-tour-trigger';
import { Icon, type IconName } from '@/components/ui/icon';
import { CustomSelect, type SelectOption } from '@/components/ui/custom-select';
import { showToast } from '@/components/ui/toast';
import { documentToPuck, puckToDocument } from '@/lib/checkout/puck-data';
import {
    checkoutReadinessIssues,
    enabledPaymentMethods,
    normalizeBindings,
    presentRequiredComponents,
    type GatewayCascades,
    type RequiredCheckoutComponent,
} from '@/lib/checkout/gateway-bindings';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
import type {
    Checkout,
    CheckoutDocument,
    CheckoutDraft,
    CheckoutEnvironment,
    CheckoutPaymentMethod,
    CheckoutVersion,
    GatewayConnection,
    MediaFile,
} from '@/lib/api/types';

const useCheckoutPuck = createUsePuck<typeof checkoutBuilderConfig>();

/** Dados do editor que os overrides do Puck (componentes estáveis) precisam ler. */
const EditorChromeContext = createContext<{ publicUrl: string }>({ publicUrl: '' });

const checkoutEditorPlugins = [
    {
        name: 'legacy-side-bar',
        render: () => (
            <div className="ce-library" data-tour="builder-components">
                <div className="ce-library-brand">
                    <Brand href="/dashboard" />
                </div>
                <Puck.Components />
            </div>
        ),
    },
];

/*
 * Props do Puck com identidade estável. O Canvas do Puck reescreve o primeiro item do
 * histórico sempre que `viewports` ou `iframe` mudam de referência; como literais inline,
 * cada alteração recriava esses objetos e a primeira edição deixava de poder ser desfeita.
 */
const checkoutEditorViewports = [
    {
        width: PHONE_MOCKUP_DEVICE.width + PHONE_MOCKUP_DEVICE.bezel * 2,
        height: 'auto' as const,
        label: 'Celular',
        icon: 'Smartphone' as const,
    },
    { width: 768, height: 'auto' as const, label: 'Tablet', icon: 'Tablet' as const },
    { width: 1440, height: 'auto' as const, label: 'Desktop', icon: 'Monitor' as const },
];
const checkoutEditorIframe = { enabled: true, syncHostStyles: false };
const checkoutEditorUi = { plugin: { current: 'legacy-side-bar' } };

const componentDescriptions: Record<string, string> = {
    hero: 'Destaque principal da página',
    logo: 'Sua marca no checkout',
    banner: 'Imagem promocional',
    heading_text: 'Títulos e subtítulos',
    paragraph_text: 'Parágrafos e descrições',
    text: 'Conteúdo em texto livre',
    image: 'Imagens e ilustrações',
    video: 'Player de vídeo',
    benefits: 'Vantagens da oferta',
    testimonials: 'Prova social de clientes',
    faq: 'Perguntas frequentes',
    guarantee: 'Garantia da compra',
    countdown: 'Contagem regressiva',
    plan_comparison: 'Compare opções da oferta',
    data_table: 'Dados organizados em tabela',
    stats: 'Métricas em destaque',
    before_after: 'Comparativo visual',
    client_logos: 'Marcas e clientes',
    floating_cta: 'Ação sempre visível',
    spacer_divider: 'Altura livre ou separador visual',
    product_summary: 'Itens e valores do pedido',
    order_bump: 'Oferta complementar',
    checkout_form: 'Dados do comprador',
    coupon_field: 'Cupom de desconto',
    payment_methods: 'Escolha da forma de pagamento',
    card_payment: 'Campos do cartão',
    pix_payment: 'Pagamento via Pix',
    boleto_payment: 'Pagamento via boleto',
    security_badges: 'Selos de confiança',
    grid: 'Organize blocos em colunas',
    footer: 'Rodapé da página',
};

const categoryMeta: Record<string, { icon: IconName; description: string }> = {
    content: { icon: 'layers', description: 'Textos, mídia e apresentação' },
    conversion: { icon: 'bolt', description: 'Argumentos e chamadas para ação' },
    checkout: { icon: 'cart', description: 'Dados e resumo do pedido' },
    payment: { icon: 'card', description: 'Métodos e dados de pagamento' },
    trust: { icon: 'shield', description: 'Segurança e credibilidade' },
    structure: { icon: 'layout', description: 'Organização da página' },
};

const componentIcons: Record<string, IconName> = {
    hero: 'star',
    logo: 'image',
    banner: 'image',
    heading_text: 'type',
    paragraph_text: 'align-left',
    text: 'note',
    image: 'image',
    video: 'play',
    benefits: 'check-circle',
    testimonials: 'message',
    faq: 'help',
    guarantee: 'shield',
    countdown: 'clock',
    plan_comparison: 'columns',
    data_table: 'table',
    stats: 'chart',
    before_after: 'split',
    client_logos: 'users',
    floating_cta: 'pointer',
    spacer_divider: 'minus',
    product_summary: 'cart',
    order_bump: 'gift',
    checkout_form: 'user',
    order_summary: 'cart',
    coupon_field: 'percent',
    payment_methods: 'card',
    card_payment: 'card',
    pix_payment: 'qr',
    boleto_payment: 'barcode',
    shipping_address: 'home',
    shipping_methods: 'route',
    security_badges: 'shield',
    grid: 'grid',
    footer: 'panel-bottom',
};

type DrawerCategoryNode = ReactElement<{
    id: string;
    title: string;
    children?: ReactNode;
}>;

type DrawerComponentNode = ReactElement<{
    label?: string;
    name: string;
}>;

/*
 * Biblioteca de blocos: uma categoria aberta por vez para a lista nunca virar uma rolagem
 * gigante; a busca procura em todas as categorias e abre os resultados.
 */
function CheckoutDrawer({ children }: { children: ReactNode }) {
    const searchRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState<string | null>('content');

    useEffect(() => {
        function focusSearch(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                searchRef.current?.focus();
            }
        }

        window.addEventListener('keydown', focusSearch);
        return () => window.removeEventListener('keydown', focusSearch);
    }, []);

    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const categories = Children.toArray(children).filter(isValidElement) as DrawerCategoryNode[];
    const visibleCategories = categories.flatMap((category) => {
        const items = Children.toArray(category.props.children).filter(
            isValidElement,
        ) as DrawerComponentNode[];
        const visibleItems = items.filter((item) => {
            if (!normalizedQuery) return true;
            const searchText = [
                item.props.label,
                item.props.name,
                componentDescriptions[item.props.name],
                category.props.title,
            ]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase('pt-BR');
            return searchText.includes(normalizedQuery);
        });
        return visibleItems.length > 0 ? [{ category, visibleItems }] : [];
    });

    const sections = visibleCategories.map(({ category, visibleItems }) => {
        const categoryId = category.props.id;
        const meta = categoryMeta[categoryId] ?? {
            icon: 'box' as IconName,
            description: 'Blocos do checkout',
        };
        const isExpanded = normalizedQuery.length > 0 || expanded === categoryId;

        return (
            <section className="ce-category" data-expanded={isExpanded} key={categoryId}>
                <button
                    type="button"
                    className="ce-category-trigger"
                    aria-expanded={isExpanded}
                    title={meta.description}
                    onClick={() =>
                        setExpanded((current) => (current === categoryId ? null : categoryId))
                    }
                >
                    <Icon name={meta.icon} className="ce-category-icon size-4" />
                    <span className="ce-category-title">{category.props.title}</span>
                    <span className="ce-category-count">{visibleItems.length}</span>
                    <Icon name="chevron-down" className="ce-category-chevron size-3.5" />
                </button>
                <div className="ce-category-items" aria-hidden={!isExpanded} inert={!isExpanded}>
                    <div className="ce-category-items-inner">{visibleItems}</div>
                </div>
            </section>
        );
    });

    return (
        <div className="ce-drawer">
            <div className="ce-drawer-top">
                <label className="ce-search">
                    <Icon name="search" className="size-4" />
                    <input
                        ref={searchRef}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') setQuery('');
                        }}
                        placeholder="Buscar blocos..."
                        aria-label="Buscar blocos"
                    />
                    {query ? (
                        <button
                            type="button"
                            className="ce-search-clear"
                            aria-label="Limpar busca"
                            onClick={() => {
                                setQuery('');
                                searchRef.current?.focus();
                            }}
                        >
                            <Icon name="close" className="size-3" />
                        </button>
                    ) : (
                        <kbd>⌘K</kbd>
                    )}
                </label>
                <p className="ce-drawer-hint">
                    <Icon name="grip" className="size-3.5" />
                    Arraste um bloco para a página
                </p>
            </div>
            <div className="ce-drawer-groups">
                {sections}
                {normalizedQuery && visibleCategories.length === 0 && (
                    <div className="ce-drawer-empty">
                        <strong>Nenhum bloco encontrado</strong>
                        <span>Tente outro termo, como “pagamento” ou “texto”.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function CheckoutDrawerItem({ children, name }: { children: React.ReactNode; name: string }) {
    const unavailable = name === 'shipping_address' || name === 'shipping_methods';
    return (
        <div
            className="ce-block"
            data-unavailable={unavailable}
            aria-disabled={unavailable}
            title={unavailable ? 'Disponível em breve' : 'Arraste para a página'}
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
            <span className="ce-block-icon">
                <Icon name={componentIcons[name] ?? 'box'} className="size-4" />
            </span>
            <div className="ce-block-content">
                {children}
                <span>{componentDescriptions[name] ?? 'Bloco do checkout'}</span>
            </div>
            {unavailable ? (
                <span className="ce-block-badge">Em breve</span>
            ) : (
                <Icon name="grip" className="ce-block-grip size-4" />
            )}
        </div>
    );
}

/*
 * Propriedades da página agrupadas por assunto. Os campos continuam sendo os do Puck; aqui
 * só muda a ordem e quais grupos começam recolhidos. Campo novo sem grupo vai para "Outros".
 */
const rootFieldGroups: {
    id: string;
    title: string;
    fields: string[];
    defaultOpen: boolean;
}[] = [
    {
        id: 'identity',
        title: 'Identidade visual',
        fields: ['brandPreset', 'accentColor', 'themeMode'],
        defaultOpen: true,
    },
    {
        id: 'page',
        title: 'Configurações da página',
        fields: [
            'previewScreen',
            'blockStyle',
            'density',
            'radius',
            'maxWidth',
            'componentGap',
            'motion',
        ],
        defaultOpen: true,
    },
    {
        id: 'colors',
        title: 'Cores',
        fields: ['backgroundColor', 'surfaceColor', 'textColor', 'grayTone'],
        defaultOpen: false,
    },
    {
        id: 'typography',
        title: 'Tipografia',
        fields: ['fontFamily', 'headingFontFamily', 'headingFontWeight', 'bodyFontWeight'],
        defaultOpen: false,
    },
    {
        id: 'button',
        title: 'Botão principal',
        fields: ['buttonStyle', 'buttonShape'],
        defaultOpen: false,
    },
    {
        id: 'surfaces',
        title: 'Blocos e superfícies',
        fields: [
            'componentBackgroundStyle',
            'componentBorderStyle',
            'componentShadowMode',
            'shadow',
            'pagePadding',
            'inputGroupStyle',
        ],
        defaultOpen: false,
    },
    {
        id: 'results',
        title: 'Telas de resultado',
        fields: ['successScreen', 'failureScreen'],
        defaultOpen: false,
    },
];

const fieldGroupsStorageKey = 'astro-checkout-builder-field-groups';

function subscribeStorage(onChange: () => void) {
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
}

function readSavedGroups() {
    try {
        return window.localStorage.getItem(fieldGroupsStorageKey);
    } catch {
        return null;
    }
}

function parseSavedGroups(raw: string | null): Record<string, boolean> {
    if (!raw) return {};
    try {
        const parsed: unknown = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
    } catch {
        return {};
    }
}

function CheckoutFieldsPanel({ children }: { children: ReactNode }) {
    const dispatch = useCheckoutPuck((puck) => puck.dispatch);
    const itemSelector = useCheckoutPuck((puck) => puck.appState.ui.itemSelector);
    const selectedItem = useCheckoutPuck((puck) => puck.selectedItem);
    const blockSelected = itemSelector !== null && selectedItem !== null;
    // "Bloco" sem nada selecionado mostra uma orientação; qualquer nova seleção a substitui.
    const [blockHint, setBlockHint] = useState(false);
    const [previousSelector, setPreviousSelector] = useState(itemSelector);
    if (previousSelector !== itemSelector) {
        setPreviousSelector(itemSelector);
        setBlockHint(false);
    }
    const tab = blockSelected || blockHint ? 'block' : 'page';

    return (
        <div className="ce-props">
            <div className="ce-props-tabs" role="tablist" aria-label="Propriedades">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'page'}
                    data-active={tab === 'page'}
                    onClick={() => {
                        setBlockHint(false);
                        dispatch({ type: 'setUi', ui: { itemSelector: null } });
                    }}
                >
                    Página
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'block'}
                    data-active={tab === 'block'}
                    onClick={() => {
                        if (!blockSelected) setBlockHint(true);
                    }}
                >
                    Bloco
                </button>
            </div>
            {blockSelected ? (
                <>
                    <BlockContext />
                    <div className="ce-props-content ce-props-content--block">{children}</div>
                </>
            ) : tab === 'block' ? (
                <div className="ce-props-empty">
                    <span className="ce-props-empty-icon">
                        <Icon name="pointer" className="size-5" />
                    </span>
                    <strong>Nenhum bloco selecionado</strong>
                    <p>Clique em um bloco no canvas para editar textos, layout e comportamento.</p>
                </div>
            ) : (
                <RootFieldGroups>{children}</RootFieldGroups>
            )}
        </div>
    );
}

function BlockContext() {
    const dispatch = useCheckoutPuck((puck) => puck.dispatch);
    const selectedItem = useCheckoutPuck((puck) => puck.selectedItem);
    const config = useCheckoutPuck((puck) => puck.config);
    const getParentById = useCheckoutPuck((puck) => puck.getParentById);
    const getSelectorForId = useCheckoutPuck((puck) => puck.getSelectorForId);
    if (!selectedItem) return null;

    const labelFor = (type: string) =>
        (config.components as Record<string, { label?: string }>)[type]?.label ?? type;
    const ancestors: { id: string; type: string }[] = [];
    let currentId = selectedItem.props.id;
    for (let depth = 0; depth < 6; depth++) {
        const parent = getParentById(currentId);
        if (!parent || parent.props.id === 'root' || (parent.type as string) === 'root') break;
        ancestors.unshift({ id: parent.props.id, type: parent.type as string });
        currentId = parent.props.id;
    }
    const type = selectedItem.type as string;

    return (
        <div className="ce-props-context">
            <nav className="ce-props-crumbs" aria-label="Hierarquia do bloco">
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'setUi', ui: { itemSelector: null } })}
                >
                    Página
                </button>
                {ancestors.map((ancestor) => (
                    <span key={ancestor.id} className="ce-props-crumb">
                        <Icon name="chevron-down" className="size-3 -rotate-90" />
                        <button
                            type="button"
                            onClick={() => {
                                const selector = getSelectorForId(ancestor.id);
                                if (selector)
                                    dispatch({ type: 'setUi', ui: { itemSelector: selector } });
                            }}
                        >
                            {labelFor(ancestor.type)}
                        </button>
                    </span>
                ))}
            </nav>
            <div className="ce-props-heading">
                <span className="ce-props-heading-icon">
                    <Icon name={componentIcons[type] ?? 'box'} className="size-4" />
                </span>
                <div>
                    <h2>{labelFor(type)}</h2>
                    <p>{componentDescriptions[type] ?? 'Bloco do checkout'}</p>
                </div>
            </div>
        </div>
    );
}

function RootFieldGroups({ children }: { children: ReactNode }) {
    const previewScreen = useCheckoutPuck(
        (puck) =>
            (puck.appState.data.root.props as { previewScreen?: string } | undefined)
                ?.previewScreen,
    );
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    // Preferência salva no navegador; no servidor (e sem storage) vale o padrão de cada grupo.
    const savedGroupsRaw = useSyncExternalStore(subscribeStorage, readSavedGroups, () => null);
    const savedGroups = parseSavedGroups(savedGroupsRaw);

    function toggle(id: string, open: boolean) {
        const next = { ...savedGroups, ...openGroups, [id]: !open };
        setOpenGroups(next);
        try {
            window.localStorage.setItem(fieldGroupsStorageKey, JSON.stringify(next));
        } catch {
            // Sem storage a escolha vale só nesta sessão.
        }
    }

    const fields = new Map<string, ReactNode>();
    for (const child of Children.toArray(children)) {
        if (isValidElement(child)) fields.set(String(child.key).replace(/^\.\$/, ''), child);
    }
    const grouped = new Set(rootFieldGroups.flatMap((group) => group.fields));
    const others = [...fields.keys()].filter((name) => !grouped.has(name));
    const groups = [
        ...rootFieldGroups,
        ...(others.length > 0
            ? [{ id: 'others', title: 'Outros ajustes', fields: others, defaultOpen: true }]
            : []),
    ];

    return (
        <div className="ce-props-content">
            <div className="ce-props-context">
                <div className="ce-props-heading">
                    <span className="ce-props-heading-icon">
                        <Icon name="layout" className="size-4" />
                    </span>
                    <div>
                        <h2>Página</h2>
                        <p>Tema, cores e estrutura de todo o checkout</p>
                    </div>
                </div>
            </div>
            {groups.map((group) => {
                const items = group.fields.flatMap((name) => {
                    const field = fields.get(name);
                    return field ? [field] : [];
                });
                if (items.length === 0) return null;
                const forced =
                    group.id === 'results' && previewScreen && previewScreen !== 'checkout';
                const open =
                    Boolean(forced) ||
                    (openGroups[group.id] ?? savedGroups[group.id] ?? group.defaultOpen);
                return (
                    <section key={group.id} className="ce-group" data-open={open}>
                        <button
                            type="button"
                            className="ce-group-trigger"
                            aria-expanded={open}
                            onClick={() => toggle(group.id, open)}
                        >
                            <span>{group.title}</span>
                            <Icon name="chevron-down" className="ce-group-chevron size-3.5" />
                        </button>
                        <div className="ce-group-body" data-open={open} aria-hidden={!open}>
                            <div className="ce-group-body-inner">{items}</div>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

/*
 * Moldura do canvas: barra de navegador real (fora do iframe) acima da página do cliente.
 * A moldura escala junto do viewport para preservar suas proporções em qualquer zoom.
 */
function CheckoutPreviewFrame({ children }: { children: ReactNode }) {
    const frameRef = useRef<HTMLDivElement>(null);
    const { publicUrl } = useContext(EditorChromeContext);
    const width = useCheckoutPuck((puck) => puck.appState.ui.viewports.current.width);
    const device =
        typeof width === 'number' && width <= 430
            ? 'phone'
            : typeof width === 'number' && width <= 900
              ? 'tablet'
              : 'desktop';

    return (
        <div ref={frameRef} className="ce-frame" data-device={device}>
            <PuckZoomSelectEnhancer />
            <PuckScreenSelectEnhancer />
            {device === 'phone' ? (
                <div className="ce-phone-fit">
                    <PhoneMockupShell browser address={publicUrl.replace(/^https?:\/\//, '')}>
                        <div className="ce-frame-page">{children}</div>
                    </PhoneMockupShell>
                </div>
            ) : device === 'desktop' ? (
                <>
                    <CheckoutBrowserBar />
                    <div className="ce-frame-page">{children}</div>
                </>
            ) : (
                <div className="ce-tablet-fit">
                    <div className="ce-tablet-shell" aria-label="Mockup de tablet">
                        <div className="ce-tablet-status" aria-hidden="true">
                            <span>9:41</span>
                            <span className="ce-device-camera" />
                            <span className="ce-tablet-indicators">
                                <i />
                                <i />
                                <i />
                                <b />
                            </span>
                        </div>
                        <div className="ce-tablet-browser" aria-label="Endereço da prévia">
                            <Icon name="arrow-right" className="size-4 rotate-180" />
                            <div className="ce-tablet-url" title={publicUrl}>
                                <Icon name="lock" className="size-3" />
                                <span>{publicUrl.replace(/^https?:\/\//, '')}</span>
                            </div>
                            <span className="ce-tablet-browser-menu" aria-hidden="true">
                                <i />
                                <i />
                                <i />
                            </span>
                        </div>
                        <div className="ce-frame-page">{children}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PuckZoomSelectEnhancer() {
    const [nativeSelect, setNativeSelect] = useState<HTMLSelectElement | null>(null);
    const [value, setValue] = useState('');

    useEffect(() => {
        const editor = document.querySelector('.astro-checkout-editor');
        if (!editor) return;
        const connect = () => {
            const select = editor.querySelector<HTMLSelectElement>(
                "select[class*='_ViewportControls-zoomSelect_']",
            );
            if (!select) return false;
            select.classList.add('ce-native-select-enhanced');
            setNativeSelect(select);
            setValue(select.value);
            return true;
        };
        if (connect()) return;
        const observer = new MutationObserver(() => {
            if (connect()) observer.disconnect();
        });
        observer.observe(editor, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!nativeSelect) return;
        const sync = () => setValue(nativeSelect.value);
        const syncAfterInteraction = () => requestAnimationFrame(sync);
        nativeSelect.addEventListener('change', sync);
        window.addEventListener('pointerup', syncAfterInteraction);
        const observer = new MutationObserver(sync);
        observer.observe(nativeSelect, { attributes: true, childList: true, subtree: true });
        return () => {
            nativeSelect.classList.remove('ce-native-select-enhanced');
            nativeSelect.removeEventListener('change', sync);
            window.removeEventListener('pointerup', syncAfterInteraction);
            observer.disconnect();
        };
    }, [nativeSelect]);

    if (!nativeSelect?.parentElement) return null;
    const options: SelectOption[] = [...nativeSelect.options].map((option) => ({
        value: option.value,
        label: option.label,
    }));

    return createPortal(
        <div className="ce-zoom-select" onClick={(event) => event.stopPropagation()}>
            <CustomSelect
                name="builder-zoom"
                value={value}
                options={options}
                onValueChange={(next) => {
                    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(
                        nativeSelect,
                        next,
                    );
                    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    setValue(next);
                }}
            />
        </div>,
        nativeSelect.parentElement,
    );
}

function PuckScreenSelectEnhancer() {
    const [toolbar, setToolbar] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const editor = document.querySelector('.astro-checkout-editor');
        if (!editor) return;
        const connect = () => {
            const element = editor.querySelector<HTMLElement>(
                "[class*='_ViewportControls-actionsInner_']",
            );
            if (!element) return false;
            setToolbar(element);
            return true;
        };
        if (connect()) return;
        const observer = new MutationObserver(() => {
            if (connect()) observer.disconnect();
        });
        observer.observe(editor, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    if (!toolbar) return null;
    return createPortal(
        <>
            <span className="ce-toolbar-divider" aria-hidden="true" />
            <PreviewScreenSelect />
        </>,
        toolbar,
    );
}

type CheckoutContextMenuEntry = {
    label: string;
    icon: IconName;
    danger?: boolean;
    onSelect(): void;
};

function CheckoutContextMenu({
    x,
    y,
    title,
    entries,
    ownerDocument,
    onClose,
}: {
    x: number;
    y: number;
    title: string;
    entries: CheckoutContextMenuEntry[];
    ownerDocument: Document;
    onClose(): void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ left: x, top: y });

    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const rect = menu.getBoundingClientRect();
        setPosition({
            left: Math.max(8, Math.min(x, ownerDocument.documentElement.clientWidth - rect.width - 8)),
            top: Math.max(8, Math.min(y, ownerDocument.documentElement.clientHeight - rect.height - 8)),
        });
        const close = (event: Event) => {
            if (event instanceof PointerEvent && menu.contains(event.target as Node)) return;
            onClose();
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        const parentDocument = ownerDocument.defaultView?.frameElement?.ownerDocument;
        const frameWindow = ownerDocument.defaultView;
        ownerDocument.addEventListener('pointerdown', close);
        ownerDocument.addEventListener('scroll', close, true);
        ownerDocument.addEventListener('keydown', escape);
        parentDocument?.addEventListener('pointerdown', close);
        parentDocument?.addEventListener('scroll', close, true);
        frameWindow?.addEventListener('blur', onClose);
        menu.querySelector<HTMLButtonElement>('button')?.focus();
        return () => {
            ownerDocument.removeEventListener('pointerdown', close);
            ownerDocument.removeEventListener('scroll', close, true);
            ownerDocument.removeEventListener('keydown', escape);
            parentDocument?.removeEventListener('pointerdown', close);
            parentDocument?.removeEventListener('scroll', close, true);
            frameWindow?.removeEventListener('blur', onClose);
        };
    }, [ownerDocument, onClose, x, y]);

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            aria-label={title}
            className="ce-context-menu"
            style={position}
            onContextMenu={(event) => event.preventDefault()}
        >
            <p>{title}</p>
            {entries.map((entry) => (
                <button
                    key={entry.label}
                    type="button"
                    role="menuitem"
                    data-danger={entry.danger || undefined}
                    onClick={() => {
                        entry.onSelect();
                        onClose();
                    }}
                >
                    <Icon name={entry.icon} className="size-3.5" />
                    <span>{entry.label}</span>
                </button>
            ))}
        </div>,
        ownerDocument.body,
    );
}

const previewScreens = [
    { value: 'checkout', label: 'Checkout' },
    { value: 'success', label: 'Sucesso' },
    { value: 'failure', label: 'Erro' },
];

const viewportLabels: Record<number, string> = { 414: 'Celular', 768: 'Tablet', 1440: 'Desktop' };

function PreviewScreenSelect() {
    const dispatch = useCheckoutPuck((puck) => puck.dispatch);
    const root = useCheckoutPuck((puck) => puck.appState.data.root);
    const rootProps = (root.props ?? {}) as { previewScreen?: string };
    const screen = rootProps.previewScreen ?? 'checkout';

    return (
        <div className="ce-toolbar-screen" title="Tela em edição">
            <CustomSelect
                name="preview-screen"
                value={screen}
                options={previewScreens}
                onValueChange={(next) =>
                    dispatch({
                        type: 'replaceRoot',
                        root: {
                            ...root,
                            props: { ...root.props, previewScreen: next },
                        } as typeof root,
                    })
                }
            />
        </div>
    );
}

function CheckoutBrowserBar() {
    const { publicUrl } = useContext(EditorChromeContext);
    const width = useCheckoutPuck((puck) => puck.appState.ui.viewports.current.width);
    const displayUrl = publicUrl.replace(/^https?:\/\//, '');

    return (
        <div className="ce-browser">
            <span className="ce-browser-dots" aria-hidden="true">
                <i />
                <i />
                <i />
            </span>
            <div className="ce-browser-url" title={publicUrl}>
                <Icon name="lock" className="size-3" />
                <span>{displayUrl}</span>
            </div>
            {typeof width === 'number' && (
                <span className="ce-browser-size">
                    {viewportLabels[width] ? `${viewportLabels[width]} · ` : ''}
                    {width}px
                </span>
            )}
        </div>
    );
}

/*
 * Estilos injetados só no iframe do editor. Eles mudam a seleção do Puck e desligam a entrada
 * por rolagem: dentro do canvas a animação ficava parada no meio, deixando blocos apagados.
 * Os componentes do cliente não recebem nenhuma outra regra.
 */
const editorFrameStyles = `
:root {
  --puck-color-selection-border: #7fc21a;
  --puck-color-selection-bg: transparent;
  --puck-slot-color-border: #7fc21a;
  --puck-slot-color-bg: transparent;
  --puck-slot-component-color-border-dragging: #7fc21a;
  --puck-slot-component-color-overlay-border: rgb(127 194 26 / 60%);
  --puck-slot-component-color-border-selected: #7fc21a;
  --puck-slot-component-color-placeholder: #a3e635;
  --puck-actionbar-color-bg: #121514;
  --puck-actionbar-color-text: #ffffff;
  --puck-actionbar-color-separator: rgb(255 255 255 / 14%);
  --puck-actionbar-radius: 10px;
  --puck-actionbar-font-size: 12px;
  --puck-actionbar-space-x: 6px;
  --puck-actionbar-space-y: 4px;
  --puck-actionbar-opacity-text: 1;
}
@media (max-width: 900px) {
  html,
  body {
    scrollbar-width: none !important;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    display: none !important;
  }
}
html {
  scrollbar-color: rgb(17 20 19 / 24%) transparent;
  scrollbar-width: thin;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
html::-webkit-scrollbar-track,
body::-webkit-scrollbar-track { background: transparent; }
html::-webkit-scrollbar-thumb,
body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgb(17 20 19 / 22%);
}
html::-webkit-scrollbar-thumb:hover,
body::-webkit-scrollbar-thumb:hover { background: rgb(17 20 19 / 36%); }
[data-checkout-page] [data-checkout-card],
[data-checkout-page] [data-checkout-reveal] {
  animation: none !important;
}
/*
 * A logo usa toda a largura apenas para se alinhar na página. Para o Puck, a caixa
 * arrastável deve medir somente a marca visível; assim o contorno e a barra de ações
 * ficam junto da logo, inclusive quando ela sobrepõe o banner.
 */
[data-puck-component]:has([data-checkout-logo]) {
  --checkout-editor-logo-gutter: 0px;
  width: min(100%, calc(var(--checkout-editor-logo-size) + 2 * var(--checkout-editor-logo-gutter)));
  justify-self: center;
}
[data-puck-component]:has([data-checkout-logo][data-overlap='true']) {
  --checkout-editor-logo-gutter: clamp(16px, 4vw, 36px);
}
[data-puck-component]:has([data-checkout-logo][data-alignment='left']) { justify-self: start; }
[data-puck-component]:has([data-checkout-logo][data-alignment='right']) { justify-self: end; }
[data-puck-component]:has([data-checkout-logo][data-size='xs']) { --checkout-editor-logo-size: 72px; }
[data-puck-component]:has([data-checkout-logo][data-size='sm']) { --checkout-editor-logo-size: 104px; }
[data-puck-component]:has([data-checkout-logo][data-size='md']) { --checkout-editor-logo-size: 144px; }
[data-puck-component]:has([data-checkout-logo][data-size='lg']) { --checkout-editor-logo-size: 192px; }
[data-puck-component]:has([data-checkout-logo][data-size='xl']) { --checkout-editor-logo-size: 256px; }
@media (max-width: 640px) {
  [data-puck-component]:has([data-checkout-logo][data-size='xs']),
  [data-puck-component]:has([data-checkout-logo][data-size='sm']) { --checkout-editor-logo-size: 64px; }
  [data-puck-component]:has([data-checkout-logo][data-size='md']) { --checkout-editor-logo-size: 89px; }
  [data-puck-component]:has([data-checkout-logo][data-size='lg']) { --checkout-editor-logo-size: 119px; }
  [data-puck-component]:has([data-checkout-logo][data-size='xl']) { --checkout-editor-logo-size: 159px; }
}
/* Bloco da biblioteca sendo arrastado sobre a página: vira uma etiqueta compacta. */
[data-dnd-dragging] [data-puck-drawer-item] {
  display: inline-flex;
  max-width: 300px;
  border: 1px solid rgb(163 230 53 / 60%);
  border-radius: 10px;
  background: #161a18;
  padding: 6px 14px 6px 6px;
  color: #f1f4f2;
  font: 600 13px/1.3 system-ui, -apple-system, 'Segoe UI', sans-serif;
  box-shadow: 0 16px 36px rgb(0 0 0 / 28%);
  cursor: grabbing;
}
[data-dnd-dragging] [data-puck-drawer-item] [class*='_DrawerItem-draggable'] {
  border: 0 !important;
  background: transparent !important;
  padding: 0 !important;
  color: inherit !important;
  box-shadow: none !important;
}
[data-dnd-dragging][data-puck-component]:has([data-puck-drawer-item]) {
  outline-color: transparent !important;
}
[data-dnd-dragging] .ce-block { display: flex; align-items: center; gap: 10px; }
[data-dnd-dragging] .ce-block-icon {
  display: grid; width: 30px; height: 30px; flex: none; place-items: center;
  border-radius: 8px; background: #1f2422; color: #a3e635;
}
[data-dnd-dragging] .ce-block-icon svg { width: 16px; height: 16px; }
[data-dnd-dragging] .ce-block-content > span {
  display: block; margin-top: 1px; color: #939c98; font-size: 11.5px; font-weight: 400;
}
[data-dnd-dragging] :is(.ce-block-grip, .ce-block-badge, [class*='_DragIcon_']) { display: none; }
[data-checkout-page],
[data-checkout-page] :is(section, article, button, input, textarea, select) {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 280ms;
  transition-timing-function: cubic-bezier(.22, 1, .36, 1);
}
.ce-context-menu {
  position: fixed; z-index: 300; width: 218px; border: 1px solid rgb(17 20 19 / 10%);
  border-radius: 12px; background: rgb(255 255 255 / 96%); padding: 5px; color: #111413;
  box-shadow: 0 18px 48px rgb(16 18 20 / 18%); backdrop-filter: blur(16px);
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
}
.ce-context-menu p {
  overflow: hidden; margin: 0; padding: 7px 9px 5px; color: #737b77; font-size: 10.5px;
  font-weight: 600; letter-spacing: .09em; text-overflow: ellipsis; text-transform: uppercase;
  white-space: nowrap;
}
.ce-context-menu button {
  display: flex; width: 100%; height: 36px; align-items: center; gap: 10px; border: 0;
  border-radius: 8px; background: transparent; padding: 0 9px; color: inherit; font: inherit;
  font-size: 13.5px; font-weight: 500; line-height: 1.2; text-align: left; cursor: pointer;
}
.ce-context-menu button:hover, .ce-context-menu button:focus-visible { background: #f3f5f4; }
.ce-context-menu button svg { width: 15px; height: 15px; color: #737b77; }
.ce-context-menu button[data-danger='true'] { color: #c0392b; }
.ce-context-menu button[data-danger='true'] svg { color: currentColor; }
`;

function CheckoutEditorFrame({
    children,
    document: frameDocument,
}: {
    children: ReactNode;
    document?: Document;
}) {
    const dispatch = useCheckoutPuck((puck) => puck.dispatch);
    const back = useCheckoutPuck((puck) => puck.history.back);
    const forward = useCheckoutPuck((puck) => puck.history.forward);
    const config = useCheckoutPuck((puck) => puck.config);
    const getItemById = useCheckoutPuck((puck) => puck.getItemById);
    const getSelectorForId = useCheckoutPuck((puck) => puck.getSelectorForId);
    const [menu, setMenu] = useState<{
        x: number;
        y: number;
        ownerDocument: Document;
        componentId?: string;
    }>();

    useEffect(() => {
        if (!frameDocument) return;
        const open = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const componentId = (event.target as Element | null)
                ?.closest?.('[data-puck-component]')
                ?.getAttribute('data-puck-component');
            const selector = componentId ? getSelectorForId(componentId) : undefined;
            dispatch({ type: 'setUi', ui: { itemSelector: selector ?? null } });
            setMenu({
                x: event.clientX,
                y: event.clientY,
                ownerDocument: frameDocument,
                componentId: componentId ?? undefined,
            });
        };
        frameDocument.addEventListener('contextmenu', open, true);
        return () => frameDocument.removeEventListener('contextmenu', open, true);
    }, [dispatch, frameDocument, getSelectorForId]);

    const item = menu?.componentId ? getItemById(menu.componentId) : undefined;
    const selector = menu?.componentId ? getSelectorForId(menu.componentId) : undefined;
    const componentType = item?.type as string | undefined;
    const componentLabel = componentType
        ? ((config.components as Record<string, { label?: string }>)[componentType]?.label ??
          componentType)
        : 'Página do checkout';
    const entries: CheckoutContextMenuEntry[] = selector
        ? [
              {
                  label: 'Editar bloco',
                  icon: 'edit',
                  onSelect: () => dispatch({ type: 'setUi', ui: { itemSelector: selector } }),
              },
              {
                  label: 'Duplicar bloco',
                  icon: 'copy',
                  onSelect: () =>
                      dispatch({
                          type: 'duplicate',
                          sourceIndex: selector.index,
                          sourceZone: selector.zone,
                      }),
              },
              {
                  label: 'Excluir bloco',
                  icon: 'trash',
                  danger: true,
                  onSelect: () =>
                      dispatch({ type: 'remove', index: selector.index, zone: selector.zone }),
              },
          ]
        : [
              {
                  label: 'Editar página',
                  icon: 'settings',
                  onSelect: () => dispatch({ type: 'setUi', ui: { itemSelector: null } }),
              },
              { label: 'Desfazer', icon: 'undo', onSelect: back },
              { label: 'Refazer', icon: 'redo', onSelect: forward },
          ];

    return (
        <>
            <style data-astro-editor-frame>{editorFrameStyles}</style>
            {children}
            {menu && (
                <CheckoutContextMenu
                    {...menu}
                    title={componentLabel}
                    onClose={() => setMenu(undefined)}
                    entries={entries}
                />
            )}
        </>
    );
}

function HistoryControls() {
    const back = useCheckoutPuck((puck) => puck.history.back);
    const forward = useCheckoutPuck((puck) => puck.history.forward);
    const hasPast = useCheckoutPuck((puck) => puck.history.hasPast);
    const hasFuture = useCheckoutPuck((puck) => puck.history.hasFuture);
    return (
        <div className="ce-segment" role="group" aria-label="Histórico de edição">
            <button
                type="button"
                className="ce-icon-button"
                aria-label="Desfazer"
                title="Desfazer (Ctrl+Z)"
                disabled={!hasPast}
                onClick={() => back()}
            >
                <Icon name="undo" className="size-4" />
            </button>
            <button
                type="button"
                className="ce-icon-button"
                aria-label="Refazer"
                title="Refazer (Ctrl+Shift+Z)"
                disabled={!hasFuture}
                onClick={() => forward()}
            >
                <Icon name="redo" className="size-4" />
            </button>
        </div>
    );
}

function EditorMoreMenu({
    open,
    onOpenChange,
    attention,
    children,
}: {
    open: boolean;
    onOpenChange(open: boolean): void;
    attention: boolean;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function close(event: PointerEvent | KeyboardEvent) {
            if (event instanceof KeyboardEvent) {
                if (event.key === 'Escape') onOpenChange(false);
                return;
            }
            if (!ref.current?.contains(event.target as Node)) onOpenChange(false);
        }
        // Cliques no canvas acontecem dentro do iframe e só chegam aqui como `blur`.
        const closeOnBlur = () => onOpenChange(false);
        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', close);
        window.addEventListener('blur', closeOnBlur);
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', close);
            window.removeEventListener('blur', closeOnBlur);
        };
    }, [open, onOpenChange]);

    return (
        <div className="ce-more" ref={ref}>
            <button
                type="button"
                className="ce-button ce-button--icon"
                aria-label="Mais ações"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => onOpenChange(!open)}
            >
                <Icon name="dots" className="size-4" />
                {attention && <span className="ce-attention-dot" aria-hidden="true" />}
            </button>
            {open && (
                <div className="ce-menu" role="menu">
                    {children}
                </div>
            )}
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
    const [editorData, setEditorData] = useState<BuilderData>(() => documentToPuck(draft.document));
    const [editorGeneration, setEditorGeneration] = useState(0);
    const current = useRef<BuilderData>(editorData);
    const revision = useRef(draft.revision);
    const document = useRef<CheckoutDocument>(draft.document);
    const saving = useRef(false);
    const mobileViewport = useRef(false);
    const trackViewport = useCallback((mobile: boolean) => {
        mobileViewport.current = mobile;
    }, []);
    const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(false);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const [environment, setEnvironment] = useState<CheckoutEnvironment>(
        draft.document.settings.environment ?? 'sandbox',
    );
    const [bindings, setBindings] = useState<GatewayCascades>(() =>
        normalizeBindings(draft.document.settings.paymentGatewayBindings),
    );
    const [enabledMethods, setEnabledMethods] = useState<CheckoutPaymentMethod[]>(() =>
        enabledPaymentMethods(editorData.content),
    );
    const [builderContent, setBuilderContent] = useState(editorData.content);
    const [presentComponents, setPresentComponents] = useState<RequiredCheckoutComponent[]>(() =>
        presentRequiredComponents(editorData.content),
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

    function changeBinding(method: CheckoutPaymentMethod, connectionIds: string[]) {
        setBindings((currentBindings) => {
            const next = { ...currentBindings };
            if (connectionIds.length === 0) delete next[method];
            else next[method] = connectionIds;
            return next;
        });
        setState('changed');
    }

    function restoreVersion(restoredDraft: CheckoutDraft, version: CheckoutVersion) {
        const restoredData = documentToPuck(restoredDraft.document);
        const restoredEnvironment = restoredDraft.document.settings.environment ?? 'sandbox';
        const restoredBindings = normalizeBindings(
            restoredDraft.document.settings.paymentGatewayBindings,
        );
        current.current = restoredData;
        revision.current = restoredDraft.revision;
        document.current = restoredDraft.document;
        setEditorData(restoredData);
        setEditorGeneration((generation) => generation + 1);
        setEnvironment(restoredEnvironment);
        setBindings(restoredBindings);
        setBuilderContent(restoredData.content);
        setEnabledMethods(enabledPaymentMethods(restoredData.content));
        setPresentComponents(presentRequiredComponents(restoredData.content));
        setState('saved');
        setVersionHistoryOpen(false);
        showToast({
            tone: 'success',
            title: `Versão ${version.versionNumber} restaurada`,
            description: 'A versão foi carregada como rascunho no editor.',
        });
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
        // Na visualização Celular do editor, o preview abre direto no mockup do celular.
        preview.location.href = `/checkouts/${checkout.id}/preview?device=${mobileViewport.current ? 'mobile' : 'desktop'}`;
    }

    const busy = state === 'saving';
    const showPublicLinks = checkout.status === 'published' || state === 'published';

    return (
        <div className="astro-checkout-editor astro-light-scope">
            <EditorChromeContext.Provider value={{ publicUrl }}>
                <CheckoutBuilderMediaContext.Provider
                    value={{ files: mediaFiles, apiUrl: mediaApiUrl }}
                >
                    <CheckoutBuilderProductsContext.Provider value={checkout.products ?? []}>
                        <Puck
                            key={editorGeneration}
                            config={checkoutBuilderConfig}
                            data={editorData}
                            height="100dvh"
                            overrides={{
                                fieldTypes: { select: CheckoutSelectField },
                                drawer: CheckoutDrawer,
                                drawerItem: CheckoutDrawerItem,
                                fields: CheckoutFieldsPanel,
                                preview: CheckoutPreviewFrame,
                                iframe: CheckoutEditorFrame,
                            }}
                            plugins={checkoutEditorPlugins}
                            ui={checkoutEditorUi}
                            viewports={checkoutEditorViewports}
                            iframe={checkoutEditorIframe}
                            onChange={(data) => {
                                current.current = data as BuilderData;
                                setBuilderContent(data.content);
                                setEnabledMethods(enabledPaymentMethods(data.content));
                                setPresentComponents(presentRequiredComponents(data.content));
                                setState('changed');
                            }}
                            onPublish={publish}
                            renderHeader={({ children }) => (
                                <header className="ce-header" data-tour="builder-header">
                                    <div className="ce-header-brand">
                                        <Brand href="/dashboard" />
                                    </div>
                                    <div className="ce-header-identity">
                                        <Link
                                            href="/checkouts"
                                            className="ce-icon-button ce-back"
                                            aria-label="Voltar para checkouts"
                                            title="Voltar para checkouts"
                                        >
                                            <Icon
                                                name="arrow-right"
                                                className="size-4 rotate-180"
                                            />
                                        </Link>
                                        <nav className="ce-crumbs" aria-label="Navegação">
                                            <Link href="/checkouts">Checkouts</Link>
                                            <Icon
                                                name="chevron-down"
                                                className="size-3 -rotate-90"
                                            />
                                            <h1 title={checkout.name}>{checkout.name}</h1>
                                        </nav>
                                        <span
                                            className="ce-status"
                                            data-state={state}
                                            role="status"
                                            aria-live="polite"
                                        >
                                            <span className="ce-status-dot" aria-hidden="true" />
                                            {statusLabel(state)}
                                        </span>
                                        <span className="ce-tour">
                                            <GuidedTourTrigger />
                                        </span>
                                    </div>
                                    <div className="ce-header-actions">{children}</div>
                                </header>
                            )}
                            renderHeaderActions={() => (
                                <div className="ce-actions">
                                    <EditorViewportTracker onChange={trackViewport} />
                                    <HistoryControls />
                                    <span className="ce-divider" aria-hidden="true" />
                                    <EditorMoreMenu
                                        open={headerMenuOpen}
                                        onOpenChange={setHeaderMenuOpen}
                                        attention={readinessIssues.length > 0}
                                    >
                                        <EditorAppearanceButton />
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="ce-menu-item"
                                            data-tour="builder-history"
                                            disabled={busy}
                                            onClick={() => {
                                                setHeaderMenuOpen(false);
                                                setVersionHistoryOpen(true);
                                            }}
                                        >
                                            <Icon name="clock" className="size-4" /> Histórico de
                                            versões
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="ce-menu-item"
                                            data-tour="builder-readiness"
                                            onClick={() => {
                                                setHeaderMenuOpen(false);
                                                setPaymentSettingsOpen(true);
                                            }}
                                        >
                                            <Icon
                                                name={
                                                    readinessIssues.length === 0
                                                        ? 'check-circle'
                                                        : 'alert'
                                                }
                                                className="size-4"
                                            />
                                            Prontidão para publicar
                                            {readinessIssues.length > 0 && (
                                                <span className="ce-menu-badge">
                                                    {readinessIssues.length}
                                                </span>
                                            )}
                                        </button>
                                        {showPublicLinks && (
                                            <>
                                                <span className="ce-menu-separator" />
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    className="ce-menu-item"
                                                    data-tour="builder-public-link"
                                                    onClick={() => {
                                                        void navigator.clipboard.writeText(
                                                            publicUrl,
                                                        );
                                                        setHeaderMenuOpen(false);
                                                        showToast({
                                                            tone: 'success',
                                                            title: 'Link copiado',
                                                            description:
                                                                'O link público do checkout foi copiado.',
                                                        });
                                                    }}
                                                >
                                                    <Icon name="link" className="size-4" />
                                                    Copiar link
                                                </button>
                                                <a
                                                    href={publicUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    role="menuitem"
                                                    className="ce-menu-item"
                                                    data-tour="builder-open-checkout"
                                                >
                                                    <Icon
                                                        name="arrow-right"
                                                        className="size-4 -rotate-45"
                                                    />
                                                    Abrir checkout
                                                </a>
                                            </>
                                        )}
                                    </EditorMoreMenu>
                                    <button
                                        type="button"
                                        className="ce-button"
                                        data-tour="builder-preview"
                                        title="Visualizar em nova janela"
                                        disabled={busy}
                                        onClick={() => void openPreview()}
                                    >
                                        <Icon name="eye" className="size-4" />
                                        <span>Visualizar</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="ce-button"
                                        data-tour="builder-save"
                                        title="Salvar rascunho"
                                        disabled={busy}
                                        onClick={() => void save()}
                                    >
                                        <Icon name="check" className="size-4" />
                                        <span>Salvar</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="ce-button ce-button--primary"
                                        data-tour="builder-publish"
                                        disabled={busy}
                                        onClick={() => void publish(current.current)}
                                    >
                                        <span>Publicar</span>
                                        <Icon name="arrow-right" className="size-4" />
                                    </button>
                                </div>
                            )}
                        />
                    </CheckoutBuilderProductsContext.Provider>
                </CheckoutBuilderMediaContext.Provider>
            </EditorChromeContext.Provider>
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
            {versionHistoryOpen && (
                <CheckoutVersionHistory
                    checkoutId={checkout.id}
                    hasUnsavedChanges={state === 'changed'}
                    onClose={() => setVersionHistoryOpen(false)}
                    onRestored={restoreVersion}
                />
            )}
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
