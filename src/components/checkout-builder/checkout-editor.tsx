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
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactElement,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
    CHECKOUT_PAGE_ID,
    createPageId,
    navigationTarget,
    pageKindLabels,
    resolveCheckoutPages,
    type CheckoutNavigation,
    type CheckoutPageKind,
} from '@astro/checkout-renderer/funnel';

import {
    CheckoutBuilderMediaContext,
    CheckoutBuilderPreviewContext,
    CheckoutBuilderProductsContext,
    checkoutBuilderConfig,
    checkoutOnlyComponents,
    type BuilderData,
    type BuilderFunnelTrigger,
    type CheckoutPreviewScreen,
} from '@/components/checkout-builder/config';
import {
    EditorAppearanceButton,
    EditorViewportTracker,
} from '@/components/checkout-builder/appearance-dialog';
import { CheckoutSelectField } from '@/components/checkout-builder/checkout-select-field';
import {
    CheckoutFunnelCanvas,
    ENTRY_NODE_ID,
    type FunnelPagePlacement,
} from '@/components/checkout-builder/checkout-funnel-canvas';
import {
    FunnelPageLibrary,
    type FunnelPageTemplateId,
} from '@/components/checkout-builder/funnel-page-library';
import {
    PaymentFlowTab,
    presetGatewayIds,
    usePaymentSummary,
    type PaymentFlowResources,
} from '@/components/checkout-builder/payment-flow-tab';
import { DockPreview, type DockPreviewKind } from '@/components/checkout-builder/dock-preview';
import { CheckoutVersionHistory } from '@/components/checkout-builder/checkout-version-history';
import { PaymentGatewaySettings } from '@/components/checkout-builder/payment-gateway-settings';
import { PHONE_MOCKUP_DEVICE, PhoneMockupShell } from '@/components/checkout-builder/phone-mockup';
import { guidedTourStartEvent } from '@/components/layout/guided-tour-trigger';
import { Icon, type IconName } from '@/components/ui/icon';
import { CustomSelect, type SelectOption } from '@/components/ui/custom-select';
import { showToast } from '@/components/ui/toast';
import { documentToPuck, puckToDocument } from '@/lib/checkout/puck-data';
import {
    checkoutReadinessIssues,
    enabledPaymentMethods,
    presentRequiredComponents,
    type RequiredCheckoutComponent,
} from '@/lib/checkout/gateway-bindings';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
import { flowGatewayIds } from '@/lib/orchestration/flow';
import type {
    Checkout,
    CheckoutDocument,
    CheckoutDraft,
    CheckoutEnvironment,
    CheckoutPaymentMethod,
    CheckoutVersion,
    FlowGraph,
    FlowIssue,
    GatewayConnection,
    MediaFile,
} from '@/lib/api/types';

const useCheckoutPuck = createUsePuck<typeof checkoutBuilderConfig>();

/** Dados do editor que os overrides do Puck (componentes estáveis) precisam ler. */
const EditorChromeContext = createContext<{ publicUrl: string; checkoutId: string }>({
    publicUrl: '',
    checkoutId: '',
});

/**
 * Modo da prévia: "edit" (clique seleciona blocos) ou "interactive" (modo de teste, clique
 * navega como comprador). Usa o modo nativo do Puck, que também alterna com Ctrl/Cmd+I.
 */
function usePreviewMode() {
    const dispatch = useCheckoutPuck((puck) => puck.dispatch);
    const mode = useCheckoutPuck((puck) => puck.appState.ui.previewMode);
    const setMode = useCallback(
        (next: 'edit' | 'interactive') => dispatch({ type: 'setUi', ui: { previewMode: next } }),
        [dispatch],
    );
    return [mode, setMode] as const;
}

/** Tela da prévia (fora dos dados do Puck) e como trocá-la. */
function usePreviewScreen() {
    const preview = useContext(CheckoutBuilderPreviewContext);
    return [preview?.screen ?? 'checkout', preview?.navigate] as const;
}

const checkoutEditorPlugins = [
    {
        name: 'legacy-side-bar',
        render: () => (
            <div className="ce-library" data-tour="builder-components">
                <div className="ce-library-panel">
                    <Puck.Components />
                </div>
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
        height: PHONE_MOCKUP_DEVICE.height + PHONE_MOCKUP_DEVICE.bezel * 2,
        label: 'Celular',
        icon: 'Smartphone' as const,
    },
    { width: 768, height: 1024, label: 'Tablet', icon: 'Tablet' as const },
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
    payment_status: 'Status obrigatório das páginas de resultado',
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
    payment_status: 'check-circle',
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
    const [previewMode] = usePreviewMode();
    const testing = previewMode === 'interactive';

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
                    <Icon name={testing ? 'pointer' : 'grip'} className="size-3.5" />
                    {testing
                        ? 'Volte a editar para adicionar blocos'
                        : 'Arraste um bloco para a página'}
                </p>
            </div>
            <div className="ce-drawer-groups" data-disabled={testing || undefined} inert={testing}>
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
    const pageKind = useContext(CheckoutBuilderPreviewContext)?.pageKind ?? 'checkout';
    const checkoutOnly = checkoutOnlyComponents.has(name);
    const managed = name === 'payment_status';
    const unavailable =
        name === 'shipping_address' ||
        name === 'shipping_methods' ||
        (checkoutOnly && pageKind !== 'checkout') ||
        managed;
    const unavailableTitle = managed
        ? 'Bloco obrigatório gerenciado automaticamente nas páginas de resultado'
        : checkoutOnly
          ? 'Este bloco pertence à página de checkout'
          : 'Disponível em breve';
    return (
        <div
            className="ce-block"
            data-unavailable={unavailable}
            aria-disabled={unavailable}
            title={unavailable ? unavailableTitle : 'Arraste para a página'}
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
                <span className="ce-block-badge">
                    {managed ? 'Obrigatório' : checkoutOnly ? 'Só checkout' : 'Em breve'}
                </span>
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
    const [previewScreen] = usePreviewScreen();
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
                    group.id === 'results' &&
                    (previewScreen === 'success' || previewScreen === 'failure');
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
    const [previewMode] = usePreviewMode();
    const device =
        typeof width === 'number' && width <= 430
            ? 'phone'
            : typeof width === 'number' && width <= 900
              ? 'tablet'
              : 'desktop';
    return (
        <div
            ref={frameRef}
            className="ce-frame"
            data-device={device}
            data-preview-mode={previewMode}
        >
            <PuckZoomSelectEnhancer />
            <PuckScreenSelectEnhancer />
            {previewMode === 'interactive' && <PreviewTestBar />}
            {device === 'phone' ? (
                <PhoneMockupShell browser address={publicUrl.replace(/^https?:\/\//, '')}>
                    <div className="ce-frame-page">{children}</div>
                </PhoneMockupShell>
            ) : device === 'desktop' ? (
                <>
                    <CheckoutBrowserBar />
                    <div className="ce-frame-page">{children}</div>
                </>
            ) : (
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
                    <span className="ce-tablet-home-indicator" aria-hidden="true" />
                </div>
            )}
        </div>
    );
}

/**
 * Seletor da tela em edição dentro da pílula de dispositivo e zoom da prévia: troca entre
 * checkout, páginas e resultados (aprovado, recusado, Pix) em qualquer dispositivo.
 */
function PuckScreenSelectEnhancer() {
    const preview = useContext(CheckoutBuilderPreviewContext);
    if (!preview?.openPage) return null;
    const kinds = new Map(preview.pages.map((page) => [page.id, page.kind]));
    // Ícone por tipo de tela no lugar do selo: os nomes já dizem o tipo e cabem inteiros.
    const label = (option: SelectOption) => (
        <span className="ce-screen-option">
            <Icon name={screenIcons[kinds.get(option.value) ?? 'checkout']} className="size-3.5" />
            <span>{option.label}</span>
        </span>
    );
    return (
        <BottomDockPortal>
            <span className="ce-toolbar-divider" aria-hidden="true" />
            <div className="ce-toolbar-screen" title="Tela em edição">
                <CustomSelect
                    name="preview-screen"
                    value={preview.screen}
                    options={preview.pages.map((page) => ({ value: page.id, label: page.name }))}
                    renderOption={label}
                    renderValue={label}
                    onValueChange={preview.openPage}
                />
            </div>
        </BottomDockPortal>
    );
}

const screenIcons: Record<CheckoutPageKind, IconName> = {
    checkout: 'cart',
    content: 'layout',
    success: 'check-circle',
    failure: 'x-circle',
    pix: 'clock',
    boleto: 'clock',
};

/** Coloca conteúdo dentro do dock branco de baixo (a barra de dispositivo e zoom do Puck). */
function BottomDockPortal({ children }: { children: ReactNode }) {
    const [dock, setDock] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const editor = document.querySelector('.astro-checkout-editor');
        if (!editor) return;
        const connect = () => {
            const element = editor.querySelector<HTMLElement>(
                "[class*='_ViewportControls-actionsInner_']",
            );
            if (!element) return false;
            setDock(element);
            return true;
        };
        if (connect()) return;
        const observer = new MutationObserver(() => {
            if (connect()) observer.disconnect();
        });
        observer.observe(editor, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return dock ? createPortal(children, dock) : null;
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
                    Object.getOwnPropertyDescriptor(
                        HTMLSelectElement.prototype,
                        'value',
                    )?.set?.call(nativeSelect, next);
                    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    setValue(next);
                }}
            />
        </div>,
        nativeSelect.parentElement,
    );
}

const previewModeOptions = [
    {
        value: 'edit' as const,
        label: 'Editar',
        icon: 'edit' as const,
        title: 'Editar: clique em um bloco para alterá-lo',
    },
    {
        value: 'interactive' as const,
        label: 'Testar',
        icon: 'play' as const,
        title: 'Testar como comprador: clique nos botões para navegar entre as telas (Ctrl+I)',
    },
];

/** Alterna entre editar blocos e testar a página como o comprador, sem sair do editor. */
function PreviewModeToggle() {
    const [mode, setMode] = usePreviewMode();
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);

    return (
        <div className="ce-mode-toggle" role="radiogroup" aria-label="Modo da prévia">
            {previewModeOptions.map((option, index) => {
                const checked = mode === option.value;
                return (
                    <button
                        key={option.value}
                        ref={(element) => {
                            buttons.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        className="ce-mode-option"
                        data-mode={option.value}
                        title={option.title}
                        onClick={() => setMode(option.value)}
                        onKeyDown={(event) => {
                            if (
                                !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                                    event.key,
                                )
                            )
                                return;
                            event.preventDefault();
                            const next = previewModeOptions[index === 0 ? 1 : 0];
                            setMode(next.value);
                            buttons.current[index === 0 ? 1 : 0]?.focus();
                        }}
                    >
                        <Icon name={option.icon} className="size-3.5" />
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/** Atalho da jornada que o comprador não consegue disparar sozinho na prévia. */
const testShortcuts: Record<
    CheckoutPreviewScreen,
    { label: string; title: string; icon: IconName; screen: CheckoutPreviewScreen }
> = {
    checkout: {
        label: 'Simular recusa',
        title: 'Mostra a tela de pagamento recusado',
        icon: 'x-circle',
        screen: 'failure',
    },
    pix: {
        label: 'Simular aprovação',
        title: 'Mostra a tela de pagamento aprovado',
        icon: 'check-circle',
        screen: 'success',
    },
    boleto: {
        label: 'Simular aprovação',
        title: 'Mostra a tela de pagamento aprovado',
        icon: 'check-circle',
        screen: 'success',
    },
    success: {
        label: 'Voltar ao checkout',
        title: 'Recomeça a compra pela página do checkout',
        icon: 'undo',
        screen: 'checkout',
    },
    failure: {
        label: 'Voltar ao checkout',
        title: 'Recomeça a compra pela página do checkout',
        icon: 'undo',
        screen: 'checkout',
    },
};

/*
 * Aviso fixo do modo de teste, sobre o canvas e fora da escala do zoom. Deixa claro por que o
 * clique não seleciona blocos e oferece a saída (também por Esc) e o atalho da tela atual.
 */
function PreviewTestBar() {
    const [, setMode] = usePreviewMode();
    const [screen, navigate] = usePreviewScreen();
    const preview = useContext(CheckoutBuilderPreviewContext);
    const shortcut = testShortcuts[screen] ?? {
        label: 'Próxima etapa',
        title: 'Avança pelo fluxo configurado',
        icon: 'arrow-right' as IconName,
        screen: navigationTarget({ pages: documentPages(preview) }, screen, { kind: 'next' }),
    };
    const screenLabel = preview?.pages.find((item) => item.id === screen)?.name ?? 'Checkout';
    // Só aparece depois de uma ação no navegador (o modo de teste nunca vem do servidor).
    const host =
        typeof document === 'undefined'
            ? null
            : document.querySelector<HTMLElement>('.astro-checkout-editor');

    if (!host) return null;
    return createPortal(
        <div className="ce-test-bar" role="region" aria-label="Modo de teste">
            <span className="ce-test-bar-dot" aria-hidden="true" />
            <div className="ce-test-bar-text">
                <strong>Modo de teste</strong>
                <span aria-live="polite">
                    Clique na página para navegar como comprador · Tela: {screenLabel}
                </span>
            </div>
            {navigate && (
                <button
                    type="button"
                    className="ce-test-bar-action"
                    title={shortcut.title}
                    onClick={() => navigate(shortcut.screen)}
                >
                    <Icon name={shortcut.icon} className="size-3.5" />
                    <span>{shortcut.label}</span>
                </button>
            )}
            <button
                type="button"
                className="ce-test-bar-exit"
                title="Volta a editar a tela atual (Esc)"
                onClick={() => setMode('edit')}
            >
                <Icon name="edit" className="size-3.5" />
                <span>Voltar a editar</span>
                <kbd>Esc</kbd>
            </button>
        </div>,
        host,
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
            left: Math.max(
                8,
                Math.min(x, ownerDocument.documentElement.clientWidth - rect.width - 8),
            ),
            top: Math.max(
                8,
                Math.min(y, ownerDocument.documentElement.clientHeight - rect.height - 8),
            ),
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

const viewportLabels: Record<number, string> = { 414: 'Celular', 768: 'Tablet', 1440: 'Desktop' };

/** Blocos da página de checkout no formato do Puck (prontidão e formas de pagamento). */
function checkoutContentOf(value: CheckoutDocument) {
    return value.sections.map((section) => ({
        type: section.type,
        props: { ...section.props, id: section.id },
    })) as BuilderData['content'];
}

function documentPagesOf(value: CheckoutDocument): NonNullable<CheckoutDocument['pages']> {
    return resolveCheckoutPages(value) as NonNullable<CheckoutDocument['pages']>;
}

function funnelPositionsOf(value: CheckoutDocument) {
    const saved = value.settings.funnelPositions;
    if (typeof saved !== 'object' || saved === null) return {};
    return Object.fromEntries(
        Object.entries(saved).flatMap(([id, position]) => {
            if (typeof position !== 'object' || position === null) return [];
            const candidate = position as { x?: unknown; y?: unknown };
            return typeof candidate.x === 'number' && typeof candidate.y === 'number'
                ? [[id, { x: candidate.x, y: candidate.y }]]
                : [];
        }),
    );
}

/** O funil de conteúdo é linear: a ordem visual define o próximo passo. */
function chainContentPages(
    pages: NonNullable<CheckoutDocument['pages']>,
): NonNullable<CheckoutDocument['pages']> {
    const content = pages.filter((page) => page.kind === 'content');
    const results = pages.filter((page) => page.kind !== 'content');
    return [
        ...content.map((page, index) => ({
            ...page,
            next: content[index + 1]?.id ?? CHECKOUT_PAGE_ID,
        })),
        ...results,
    ];
}

function funnelTriggersOf(
    page: NonNullable<CheckoutDocument['pages']>[number],
): BuilderFunnelTrigger[] {
    if (page.kind !== 'content') return [];
    return page.sections.flatMap<BuilderFunnelTrigger>((section) => {
        const props = section.props;
        if (section.type === 'cta_button') {
            const label =
                typeof props.label === 'string' && props.label.trim()
                    ? props.label.trim()
                    : 'Botão de avanço';
            const target = funnelTriggerTarget(props.action, props.pageId, page.next);
            return [
                {
                    id: `button:${section.id}`,
                    label: `Botão · ${label}`,
                    kind: 'button' as const,
                    active: target !== null,
                    target,
                },
            ];
        }
        if (section.type !== 'video') return [];
        const title =
            typeof props.title === 'string' && props.title.trim() ? props.title.trim() : 'Vídeo';
        const ctaTarget = funnelTriggerTarget(props.ctaAction, props.ctaPageId, page.next);
        const endTarget =
            props.endAction === 'next'
                ? typeof props.endPageId === 'string' && props.endPageId
                    ? props.endPageId
                    : (page.next ?? CHECKOUT_PAGE_ID)
                : null;
        return [
            {
                id: `video-cta:${section.id}`,
                label: `Botão do vídeo · ${title}`,
                kind: 'video-cta' as const,
                active: props.ctaEnabled === true && ctaTarget !== null,
                target: props.ctaEnabled === true ? ctaTarget : null,
            },
            {
                id: `video-end:${section.id}`,
                label: `Fim do vídeo · ${title}`,
                kind: 'video-end' as const,
                active: endTarget !== null,
                target: endTarget,
            },
        ];
    });
}

function funnelTriggerTarget(
    action: unknown,
    pageId: unknown,
    fallback: string | null | undefined,
) {
    if (action === 'none') return null;
    if (action === 'checkout') return CHECKOUT_PAGE_ID;
    if (action === 'page' && typeof pageId === 'string' && pageId) return pageId;
    return fallback === null ? null : (fallback ?? CHECKOUT_PAGE_ID);
}

/** Aponta um gatilho (botão, botão do vídeo ou fim do vídeo) da página para outro destino. */
function pageWithTriggerTarget(
    page: NonNullable<CheckoutDocument['pages']>[number],
    triggerId: string,
    target: string | null,
): NonNullable<CheckoutDocument['pages']>[number] {
    if (page.kind !== 'content') return page;
    return {
        ...page,
        sections: page.sections.map((section) => {
            const selectedId = triggerId.slice(triggerId.indexOf(':') + 1);
            if (section.type === 'cta_button') {
                if (!triggerId.startsWith('button:') || section.id !== selectedId) return section;
                return {
                    ...section,
                    props: {
                        ...section.props,
                        action:
                            target === null
                                ? 'none'
                                : target === CHECKOUT_PAGE_ID
                                  ? 'checkout'
                                  : 'page',
                        pageId: target && target !== CHECKOUT_PAGE_ID ? target : '',
                    },
                };
            }
            if (section.type !== 'video') return section;
            const videoCta = triggerId.startsWith('video-cta:') && section.id === selectedId;
            const videoEnd = triggerId.startsWith('video-end:') && section.id === selectedId;
            if (!videoCta && !videoEnd) return section;
            return {
                ...section,
                props: {
                    ...section.props,
                    ...(videoCta
                        ? {
                              ctaEnabled: true,
                              ctaAction:
                                  target === null
                                      ? 'none'
                                      : target === CHECKOUT_PAGE_ID
                                        ? 'checkout'
                                        : 'page',
                              ctaPageId: target && target !== CHECKOUT_PAGE_ID ? target : '',
                          }
                        : {}),
                    ...(videoEnd
                        ? {
                              endAction: target === null ? 'none' : 'next',
                              endPageId: target ?? '',
                          }
                        : {}),
                },
            };
        }),
    };
}

function documentPages(preview: React.ContextType<typeof CheckoutBuilderPreviewContext>) {
    return (preview?.pages ?? [])
        .filter((page) => page.kind !== 'checkout')
        .map((page) => ({ ...page, sections: [] }));
}

/*
 * Tela mostrada na prévia. É estado do editor, não do documento: trocar de tela (aqui ou
 * navegando no modo de teste) não entra no histórico nem marca alterações não salvas.
 */
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
[data-puck-component][data-checkout-logo-after-banner='true']:has(
  [data-checkout-logo][data-overlap='true']
) {
  --checkout-editor-logo-gutter: clamp(16px, 4vw, 36px);
}
[data-puck-component]:has([data-checkout-logo][data-overlap='true']) [data-checkout-logo] {
  margin-top: 0;
  padding-inline: 0;
}
[data-puck-component][data-checkout-logo-after-banner='true'] [data-checkout-logo][data-overlap='true'] {
  margin-top: var(--checkout-logo-overlap-margin);
  padding-inline: clamp(16px, 4vw, 36px);
}
[data-puck-component]:has([data-checkout-logo][data-alignment='left']) { justify-self: start; }
[data-puck-component]:has([data-checkout-logo][data-alignment='right']) { justify-self: end; }
[data-puck-component]:has([data-checkout-logo][data-size='xs']) { --checkout-editor-logo-size: 72px; }
[data-puck-component]:has([data-checkout-logo][data-size='sm']) { --checkout-editor-logo-size: 104px; }
[data-puck-component]:has([data-checkout-logo][data-size='md']) { --checkout-editor-logo-size: 144px; }
[data-puck-component]:has([data-checkout-logo][data-size='lg']) { --checkout-editor-logo-size: 192px; }
[data-puck-component]:has([data-checkout-logo][data-size='xl']) { --checkout-editor-logo-size: 256px; }
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
    const [previewMode, setPreviewMode] = usePreviewMode();
    const interactive = previewMode === 'interactive';
    const outerPreview = useContext(CheckoutBuilderPreviewContext);
    const preview = useMemo(
        () => (outerPreview ? { ...outerPreview, interactive } : null),
        [outerPreview, interactive],
    );
    const screen = outerPreview?.screen;
    const [menu, setMenu] = useState<{
        x: number;
        y: number;
        ownerDocument: Document;
        componentId?: string;
    }>();

    useEffect(() => {
        if (!frameDocument) return;
        const view = frameDocument.defaultView;
        let frame = 0;
        const annotateLogoPositions = () => {
            for (const logo of frameDocument.querySelectorAll('[data-checkout-logo]')) {
                const owner = logo.closest<HTMLElement>('[data-puck-component]');
                if (!owner) continue;
                let previous = owner.previousElementSibling;
                while (previous && !previous.hasAttribute('data-puck-component')) {
                    previous = previous.previousElementSibling;
                }
                const followsBanner = Boolean(
                    previous?.matches('[data-checkout-banner]') ||
                    previous?.querySelector('[data-checkout-banner]'),
                );
                owner.setAttribute(
                    'data-checkout-logo-after-banner',
                    followsBanner ? 'true' : 'false',
                );
            }
        };
        const scheduleAnnotation = () => {
            if (frame) view?.cancelAnimationFrame(frame);
            frame = view?.requestAnimationFrame(annotateLogoPositions) ?? 0;
        };
        scheduleAnnotation();
        const observer = new MutationObserver(scheduleAnnotation);
        observer.observe(frameDocument.body, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            if (frame) view?.cancelAnimationFrame(frame);
        };
    }, [frameDocument]);

    // Ao trocar de tela, a nova começa do topo, como no checkout publicado.
    const lastScreen = useRef(screen);
    useEffect(() => {
        if (!frameDocument || lastScreen.current === screen) return;
        lastScreen.current = screen;
        frameDocument.defaultView?.scrollTo({ top: 0 });
        const frameElement = frameDocument.defaultView?.frameElement;
        for (let element = frameElement?.parentElement; element; element = element.parentElement) {
            if (element.classList.contains('astro-checkout-editor')) break;
            if (element.scrollTop) element.scrollTo({ top: 0 });
        }
    }, [frameDocument, screen]);

    // Modo de teste: nada fica selecionado, para Delete/Backspace digitados na página nunca
    // apagarem um bloco (o atalho do Puck não reconhece campos dentro do iframe).
    useEffect(() => {
        if (interactive) dispatch({ type: 'setUi', ui: { itemSelector: null } });
    }, [dispatch, interactive]);

    useEffect(() => {
        if (!frameDocument || !interactive) return;
        const parentDocument = frameDocument.defaultView?.frameElement?.ownerDocument;
        const exitOnEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            const target = event.target as Element | null;
            // Esc em menus, listas e diálogos abertos (ou digitando no painel) fecha só eles.
            if (
                target?.closest?.(
                    "[role='dialog'], [role='listbox'], [role='menu'], [aria-expanded='true']",
                ) ||
                (target?.ownerDocument === parentDocument &&
                    target?.closest?.('input, textarea, select, [contenteditable]'))
            )
                return;
            setPreviewMode('edit');
        };
        // A prévia vive dentro do editor: links não podem trocar a página do iframe.
        const guardLinks = (event: MouseEvent) => {
            const anchor = (event.target as Element | null)?.closest?.('a[href]');
            if (!anchor) return;
            event.preventDefault();
            const href = anchor.getAttribute('href') ?? '';
            if (href.startsWith('#')) {
                const id = decodeURIComponent(href.slice(1));
                const target = id ? frameDocument.getElementById(id) : null;
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                else if (id === 'checkout-top' || !id)
                    frameDocument.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            if (/^https?:\/\//i.test(href)) window.open(href, '_blank', 'noopener,noreferrer');
        };
        const blockSubmit = (event: Event) => event.preventDefault();
        frameDocument.addEventListener('keydown', exitOnEscape);
        parentDocument?.addEventListener('keydown', exitOnEscape);
        frameDocument.addEventListener('click', guardLinks, true);
        frameDocument.addEventListener('submit', blockSubmit, true);
        return () => {
            frameDocument.removeEventListener('keydown', exitOnEscape);
            parentDocument?.removeEventListener('keydown', exitOnEscape);
            frameDocument.removeEventListener('click', guardLinks, true);
            frameDocument.removeEventListener('submit', blockSubmit, true);
        };
    }, [frameDocument, interactive, setPreviewMode]);

    useEffect(() => {
        // No modo de teste vale o menu do navegador, como para o comprador.
        if (!frameDocument || interactive) return;
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
    }, [dispatch, frameDocument, getSelectorForId, interactive]);

    const item = menu?.componentId ? getItemById(menu.componentId) : undefined;
    const selector = menu?.componentId ? getSelectorForId(menu.componentId) : undefined;
    const componentType = item?.type as string | undefined;
    const componentLabel = componentType
        ? ((config.components as Record<string, { label?: string }>)[componentType]?.label ??
          componentType)
        : 'Página do checkout';
    const protectedStatus = componentType === 'payment_status';
    const entries: CheckoutContextMenuEntry[] = selector
        ? [
              {
                  label: 'Editar bloco',
                  icon: 'edit',
                  onSelect: () => dispatch({ type: 'setUi', ui: { itemSelector: selector } }),
              },
              ...(!protectedStatus
                  ? [
                        {
                            label: 'Duplicar bloco',
                            icon: 'copy' as IconName,
                            onSelect: () =>
                                dispatch({
                                    type: 'duplicate',
                                    sourceIndex: selector.index,
                                    sourceZone: selector.zone,
                                }),
                        },
                        {
                            label: 'Excluir bloco',
                            icon: 'trash' as IconName,
                            danger: true,
                            onSelect: () =>
                                dispatch({
                                    type: 'remove',
                                    index: selector.index,
                                    zone: selector.zone,
                                }),
                        },
                    ]
                  : []),
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
            <CheckoutBuilderPreviewContext.Provider value={preview}>
                {children}
            </CheckoutBuilderPreviewContext.Provider>
            {menu && !interactive && (
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

function ComponentLibraryToggle() {
    const dispatch = useCheckoutPuck((puck) => puck.dispatch);
    const visible = useCheckoutPuck((puck) => puck.appState.ui.leftSideBarVisible);
    const wasCompact = useRef(false);

    useEffect(() => {
        const wideEditor = window.matchMedia('(min-width: 638px)');
        const restoreAfterCompactLayout = () => {
            if (!wideEditor.matches) {
                wasCompact.current = true;
                return;
            }
            if (!wasCompact.current) return;
            wasCompact.current = false;
            dispatch({
                type: 'setUi',
                ui: {
                    leftSideBarVisible: true,
                    plugin: { current: 'legacy-side-bar' },
                },
            });
        };

        restoreAfterCompactLayout();
        wideEditor.addEventListener('change', restoreAfterCompactLayout);
        return () => wideEditor.removeEventListener('change', restoreAfterCompactLayout);
    }, [dispatch]);

    return (
        <button
            type="button"
            className="ce-icon-button ce-library-toggle"
            data-active={visible || undefined}
            aria-label={visible ? 'Fechar componentes' : 'Abrir componentes'}
            aria-pressed={visible}
            title={visible ? 'Fechar componentes' : 'Abrir componentes'}
            onClick={() =>
                dispatch({
                    type: 'setUi',
                    ui: {
                        leftSideBarVisible: !visible,
                        plugin: { current: 'legacy-side-bar' },
                    },
                })
            }
        >
            <Icon name="layers" className="size-4" />
        </button>
    );
}

function EditorMoreMenu({
    open,
    onOpenChange,
    attention,
    dock = false,
    children,
}: {
    open: boolean;
    onOpenChange(open: boolean): void;
    attention: boolean;
    /** No dock: botão redondo com prévia no hover. */
    dock?: boolean;
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
                className={dock ? 'ce-dock-item' : 'ce-button ce-button--icon'}
                aria-label="Mais ações"
                data-tip={dock && !open ? 'Mais ações' : undefined}
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

/**
 * Aba do workspace do checkout. Funil e a página Checkout ficam sempre visíveis; as páginas
 * abertas a partir do funil ganham uma aba com o builder delas. O pagamento não é aba: vive
 * no inspector do nó Pagamento, e o editor de nós abre por cima, em tela cheia.
 */
type WorkspaceTab = 'funnel' | `page:${string}`;
const CHECKOUT_WORKSPACE_TAB: WorkspaceTab = `page:${CHECKOUT_PAGE_ID}`;

/**
 * Guarda a largura real do nome em --label-w: o hover anima o max-width até ela, em pixels,
 * o que é mais leve e previsível que animar a grade.
 */
function measureDockLabel(element: HTMLSpanElement | null) {
    const text = element?.firstElementChild;
    if (!element || !text) return;
    const measure = () =>
        element.style.setProperty('--label-w', `${String(Math.ceil(text.scrollWidth) + 2)}px`);
    measure();
    // A fonte da interface pode chegar depois: mede de novo para não cortar a última letra.
    void document.fonts.ready.then(measure);
}

/**
 * Esquerda da barra de cada área (funil, página no construtor, pagamento): o mesmo ícone,
 * nome e uma linha curta, para as três telas terem um cabeçalho só.
 */
function AreaIdentity({
    icon,
    title,
    subtitle,
}: {
    icon: IconName;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="ce-header-identity">
            <span className="ce-page-toolbar-icon">
                <Icon name={icon} className="size-4" />
            </span>
            <div className="ce-page-toolbar-title">
                <strong title={title}>{title}</strong>
                {subtitle && <small title={subtitle}>{subtitle}</small>}
            </div>
        </div>
    );
}

function tabPreviewKind(tab: WorkspaceTab): DockPreviewKind | null {
    const page = tabPage(tab);
    if (page === null) return 'funnel';
    return page === CHECKOUT_PAGE_ID ? 'checkout' : null;
}

function tabPage(tab: WorkspaceTab) {
    return tab.startsWith('page:') ? tab.slice('page:'.length) : null;
}

function initialWorkspaceTab(value: string | undefined, document: CheckoutDocument): WorkspaceTab {
    const page = value?.startsWith('page:') ? value.slice('page:'.length) : null;
    if (page === CHECKOUT_PAGE_ID || documentPagesOf(document).some((item) => item.id === page))
        return `page:${page ?? CHECKOUT_PAGE_ID}`;
    return 'funnel';
}

function funnelPageFromTemplate(
    template: FunnelPageTemplateId,
    id: string,
    index: number,
    next: string | null,
): NonNullable<CheckoutDocument['pages']>[number] {
    type FunnelPage = NonNullable<CheckoutDocument['pages']>[number];
    type FunnelSection = FunnelPage['sections'][number];
    const section = (
        suffix: string,
        type: FunnelSection['type'],
        props: Record<string, unknown>,
    ): FunnelSection => ({ id: `${id}-${suffix}`, type, visible: true, props });
    const button = (label: string) =>
        section('avancar', 'cta_button', {
            label,
            sublabel: '',
            alignment: 'stretch',
            variant: 'primary',
            delaySeconds: 0,
            action: 'next',
            pageId: '',
        });
    const page = (name: string, sections: FunnelPage['sections']): FunnelPage => ({
        id,
        kind: 'content',
        name,
        next,
        sections,
    });

    if (template === 'video')
        return page(`Vídeo ${index}`, [
            section('titulo', 'heading_text', {
                text: 'Assista ao vídeo',
                alignment: 'center',
                size: 'lg',
            }),
            section('video', 'video', {
                url: '',
                title: 'Seu vídeo',
                caption: '',
                posterUrl: '',
                format: 'landscape',
                autoplay: false,
                controls: true,
                resume: true,
                ctaEnabled: true,
                ctaLabel: 'Continuar',
                ctaSublabel: '',
                ctaReveal: 'start',
                ctaSeconds: 0,
                ctaAction: 'next',
                ctaPageId: '',
                ctaUrl: '',
                ctaNewTab: false,
                endAction: 'none',
                endPageId: '',
            }),
        ]);

    if (template === 'vsl')
        return page(`VSL ${index}`, [
            section('titulo', 'heading_text', {
                text: 'Assista até o fim para liberar esta oferta',
                alignment: 'center',
                size: 'lg',
            }),
            section('video', 'video', {
                url: '',
                title: 'Apresentação da oferta',
                caption: '',
                posterUrl: '',
                format: 'landscape',
                autoplay: true,
                controls: false,
                resume: true,
                ctaEnabled: true,
                ctaLabel: 'Quero aproveitar a oferta',
                ctaSublabel: 'Acesso imediato',
                ctaReveal: 'time',
                ctaSeconds: 60,
                ctaAction: 'next',
                ctaPageId: '',
                ctaUrl: '',
                ctaNewTab: false,
                endAction: 'none',
                endPageId: '',
            }),
            section('seguranca', 'security_badges', {
                layout: 'pills',
                title: '',
                showEncryption: true,
                showGuarantee: true,
                showPrivacy: true,
            }),
        ]);

    if (template === 'offer')
        return page(`Oferta ${index}`, [
            section('titulo', 'heading_text', {
                text: 'Uma oferta feita para você',
                alignment: 'center',
                size: 'xl',
            }),
            section('descricao', 'paragraph_text', {
                content: 'Apresente aqui a transformação e o principal motivo para avançar.',
                alignment: 'center',
                size: 'md',
            }),
            section('beneficios', 'benefits', {
                layout: 'cards',
                title: 'O que você recebe',
                items: [
                    {
                        icon: 'rocket',
                        title: 'Resultado prático',
                        description: 'Mostre o benefício mais importante da sua oferta.',
                    },
                    {
                        icon: 'shield',
                        title: 'Compra segura',
                        description: 'Reforce a confiança para seguir ao checkout.',
                    },
                    {
                        icon: 'bolt',
                        title: 'Acesso imediato',
                        description: 'Explique quando e como o cliente recebe o produto.',
                    },
                ],
            }),
            button('Ver oferta'),
        ]);

    if (template === 'bridge')
        return page(`Página ponte ${index}`, [
            section('titulo', 'heading_text', {
                text: 'Antes de continuar…',
                alignment: 'center',
                size: 'lg',
            }),
            section('descricao', 'paragraph_text', {
                content:
                    'Use esta página para preparar o visitante, resumir o próximo passo ou apresentar uma condição importante.',
                alignment: 'center',
                size: 'md',
            }),
            button('Ir para o checkout'),
        ]);

    return page(`Página ${index}`, [
        section('titulo', 'heading_text', {
            text: 'Sua próxima etapa',
            alignment: 'center',
            size: 'lg',
        }),
        button('Continuar'),
    ]);
}

type FunnelSnapshot = {
    pages: NonNullable<CheckoutDocument['pages']>;
    startPageId: string;
    positions: ReturnType<typeof funnelPositionsOf>;
};

function funnelSnapshotOf(value: CheckoutDocument): FunnelSnapshot {
    return {
        pages: structuredClone(documentPagesOf(value)),
        startPageId:
            typeof value.settings.startPageId === 'string'
                ? value.settings.startPageId
                : CHECKOUT_PAGE_ID,
        positions: structuredClone(funnelPositionsOf(value)),
    };
}

export function CheckoutEditor({
    checkout,
    draft,
    gatewayConnections,
    mediaFiles,
    mediaApiUrl,
    flowResources,
    canManageGateways,
    initialTab,
    initialPaymentSettingsOpen = false,
}: {
    checkout: Checkout;
    draft: CheckoutDraft;
    gatewayConnections: GatewayConnection[];
    mediaFiles: MediaFile[];
    mediaApiUrl: string;
    flowResources: PaymentFlowResources;
    canManageGateways: boolean;
    initialTab?: string;
    initialPaymentSettingsOpen?: boolean;
}) {
    const publicUrl = checkoutPublicUrl(checkout.slug);
    const [tab, setTab] = useState<WorkspaceTab>(() =>
        initialWorkspaceTab(initialTab, draft.document),
    );
    // `?tab=payment` é o link direto para o editor avançado do pagamento.
    const [paymentAdvancedOpen, setPaymentAdvancedOpen] = useState(initialTab === 'payment');
    const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>(() => {
        const fixed: WorkspaceTab[] = ['funnel', CHECKOUT_WORKSPACE_TAB];
        return tab === 'funnel' || tab === CHECKOUT_WORKSPACE_TAB ? fixed : [...fixed, tab];
    });
    const [draggedTab, setDraggedTab] = useState<WorkspaceTab | null>(null);
    const [tabDropTarget, setTabDropTarget] = useState<WorkspaceTab | null>(null);
    const [funnelLibraryOpen, setFunnelLibraryOpen] = useState(true);
    const funnelPast = useRef<FunnelSnapshot[]>([]);
    const funnelFuture = useRef<FunnelSnapshot[]>([]);
    const funnelHistoryAction = useRef<{ key: string; at: number } | null>(null);
    const [funnelHistoryAvailability, setFunnelHistoryAvailability] = useState({
        undo: 0,
        redo: 0,
    });
    const [paymentFlow, setPaymentFlow] = useState<FlowGraph | undefined>(
        draft.document.settings.paymentFlow,
    );
    const [paymentIssues, setPaymentIssues] = useState<FlowIssue[]>([]);
    const [editorData, setEditorData] = useState<BuilderData>(() =>
        documentToPuck(draft.document, tabPage(tab) ?? CHECKOUT_PAGE_ID),
    );
    const [editorGeneration, setEditorGeneration] = useState(0);
    const current = useRef<BuilderData>(editorData);
    const revision = useRef(draft.revision);
    const document = useRef<CheckoutDocument>(draft.document);
    const saving = useRef(false);
    const mobileViewport = useRef(false);
    const trackViewport = useCallback((mobile: boolean) => {
        mobileViewport.current = mobile;
    }, []);
    // Tela da prévia: estado do editor, fora do documento (não vai para histórico nem publicação).
    const [previewScreen, setPreviewScreen] = useState<CheckoutPreviewScreen>(
        tabPage(tab) ?? CHECKOUT_PAGE_ID,
    );
    const [funnelPages, setFunnelPages] = useState(() => documentPagesOf(draft.document));
    const [funnelActions, setFunnelActions] = useState<HTMLDivElement | null>(null);
    const [funnelFullscreen, setFunnelFullscreen] = useState(false);
    // Mesmo comportamento do orquestrador: tela cheia do navegador e o quadro cobrindo a janela.
    const funnelFullscreenRef = useRef(false);
    const toggleFunnelFullscreen = useCallback(() => {
        const next = !funnelFullscreenRef.current;
        funnelFullscreenRef.current = next;
        try {
            if (next && !window.document.fullscreenElement)
                void window.document.documentElement.requestFullscreen().catch(() => undefined);
            if (!next && window.document.fullscreenElement)
                void window.document.exitFullscreen().catch(() => undefined);
        } catch {
            // Sem a API, o quadro ainda ocupa a janela inteira.
        }
        setFunnelFullscreen(next);
    }, []);
    useEffect(() => {
        function sync() {
            if (window.document.fullscreenElement) return;
            funnelFullscreenRef.current = false;
            setFunnelFullscreen(false);
        }

        window.document.addEventListener('fullscreenchange', sync);
        return () => window.document.removeEventListener('fullscreenchange', sync);
    }, []);
    const [funnelPositions, setFunnelPositions] = useState(() => funnelPositionsOf(draft.document));
    const [funnelStartPage, setFunnelStartPage] = useState(
        typeof draft.document.settings.startPageId === 'string'
            ? draft.document.settings.startPageId
            : CHECKOUT_PAGE_ID,
    );
    const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(initialPaymentSettingsOpen);
    const [publicationError, setPublicationError] = useState<string | null>(null);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    // Nas barras de cada área, o texto de cada botão vira o balão que aparece no hover quando
    // a barra fica compacta (só ícones). Os botões vêm de vários componentes, então o editor
    // copia o texto deles para data-area-tip e acompanha as mudanças.
    useEffect(() => {
        const root = dockRef.current?.closest<HTMLElement>('.astro-checkout-editor');
        if (!root) return;
        const label = () => {
            for (const button of root.querySelectorAll<HTMLElement>(
                ':is(.ce-area-actions, .flow-embedded-actions, .ce-header-actions) :is(button, a)',
            )) {
                const text = button.textContent?.replace(/\s+/g, ' ').trim() ?? '';
                if (text && button.dataset.areaTip !== text) button.dataset.areaTip = text;
            }
        };
        label();
        // O quadro muda muito enquanto se arrasta: no máximo uma passada por quadro.
        let frame = 0;
        const observer = new MutationObserver(() => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                label();
            });
        });
        observer.observe(root, { subtree: true, childList: true, characterData: true });
        return () => {
            observer.disconnect();
            window.cancelAnimationFrame(frame);
        };
    }, []);
    // A largura do dock vira variável CSS: as barras de cada área reservam o centro para ele.
    const dockRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const dock = dockRef.current;
        const root = dock?.closest<HTMLElement>('.astro-checkout-editor');
        if (!dock || !root) return;
        // Os itens crescem no hover: só mede o dock em repouso, para as barras não tremerem.
        const measure = () => {
            if (dock.matches(':hover, :focus-within')) return;
            root.style.setProperty(
                '--ce-dock-width',
                `${String(Math.ceil(dock.getBoundingClientRect().width))}px`,
            );
        };
        const observer = new ResizeObserver(measure);
        observer.observe(dock);
        // Ao sair, espera os itens recolherem antes de medir.
        const settle = () => window.setTimeout(measure, 320);
        dock.addEventListener('pointerleave', settle);
        dock.addEventListener('focusout', settle);
        return () => {
            observer.disconnect();
            dock.removeEventListener('pointerleave', settle);
            dock.removeEventListener('focusout', settle);
        };
    }, []);
    const [pageMenuOpen, setPageMenuOpen] = useState(false);
    const [environment, setEnvironment] = useState<CheckoutEnvironment>(
        draft.document.settings.environment ?? 'sandbox',
    );
    const [enabledMethods, setEnabledMethods] = useState<CheckoutPaymentMethod[]>(() =>
        enabledPaymentMethods(editorData.content),
    );
    const [builderContent, setBuilderContent] = useState(editorData.content);
    const [presentComponents, setPresentComponents] = useState<RequiredCheckoutComponent[]>(() =>
        presentRequiredComponents(editorData.content),
    );
    const [state, setState] = useState<'saved' | 'changed' | 'saving' | 'published' | 'error'>(
        'saved',
    );

    const rememberFunnelState = useCallback((key = '') => {
        const now = Date.now();
        const previous = funnelHistoryAction.current;
        // Renomear dispara a cada tecla; uma sequência de digitação é uma única ação.
        if (key && previous?.key === key && now - previous.at < 900) {
            funnelHistoryAction.current = { key, at: now };
            funnelFuture.current = [];
            setFunnelHistoryAvailability({ undo: funnelPast.current.length, redo: 0 });
            return;
        }
        funnelPast.current = [...funnelPast.current.slice(-49), funnelSnapshotOf(document.current)];
        funnelFuture.current = [];
        funnelHistoryAction.current = key ? { key, at: now } : null;
        setFunnelHistoryAvailability({ undo: funnelPast.current.length, redo: 0 });
    }, []);

    const restoreFunnelSnapshot = useCallback(
        (snapshot: FunnelSnapshot) => {
            document.current = {
                ...document.current,
                pages: structuredClone(snapshot.pages),
                settings: {
                    ...document.current.settings,
                    startPageId: snapshot.startPageId,
                    funnelPositions: structuredClone(snapshot.positions),
                },
            };
            const pages = documentPagesOf(document.current);
            const pageIds = new Set([CHECKOUT_PAGE_ID, ...pages.map((page) => page.id)]);
            const nextScreen = pageIds.has(previewScreen) ? previewScreen : CHECKOUT_PAGE_ID;
            const nextData = documentToPuck(document.current, nextScreen);
            current.current = nextData;
            setEditorData(nextData);
            setEditorGeneration((generation) => generation + 1);
            setPreviewScreen(nextScreen);
            setFunnelPages(pages);
            setFunnelPositions(structuredClone(snapshot.positions));
            setFunnelStartPage(snapshot.startPageId);
            setWorkspaceTabs((tabs) =>
                tabs.filter((item) => {
                    const pageId = tabPage(item);
                    return pageId === null || pageIds.has(pageId);
                }),
            );
            setState('changed');
        },
        [previewScreen],
    );

    const undoFunnel = useCallback(() => {
        const snapshot = funnelPast.current.pop();
        if (!snapshot) return;
        funnelFuture.current.push(funnelSnapshotOf(document.current));
        funnelHistoryAction.current = null;
        restoreFunnelSnapshot(snapshot);
        setFunnelHistoryAvailability({
            undo: funnelPast.current.length,
            redo: funnelFuture.current.length,
        });
    }, [restoreFunnelSnapshot]);

    const redoFunnel = useCallback(() => {
        const snapshot = funnelFuture.current.pop();
        if (!snapshot) return;
        funnelPast.current.push(funnelSnapshotOf(document.current));
        funnelHistoryAction.current = null;
        restoreFunnelSnapshot(snapshot);
        setFunnelHistoryAvailability({
            undo: funnelPast.current.length,
            redo: funnelFuture.current.length,
        });
    }, [restoreFunnelSnapshot]);

    const navigatePreview = useCallback(
        (next: string) => {
            if (next === previewScreen) return;
            document.current = puckToDocument(current.current, document.current, previewScreen);
            const nextData = documentToPuck(document.current, next);
            current.current = nextData;
            setEditorData(nextData);
            setEditorGeneration((generation) => generation + 1);
            setPreviewScreen(next);
            setBuilderContent(checkoutContentOf(document.current));
            // Navegar pela prévia (modo Testar) leva junto a aba da página.
            if (tabPage(tab) !== null) {
                const nextTab: WorkspaceTab = `page:${next}`;
                setTab(nextTab);
                setWorkspaceTabs((tabs) => (tabs.includes(nextTab) ? tabs : [...tabs, nextTab]));
            }
        },
        [previewScreen, tab],
    );

    const addFunnelPage = useCallback(
        (template: FunnelPageTemplateId = 'blank', placement: FunnelPagePlacement = {}) => {
            document.current = puckToDocument(current.current, document.current, previewScreen);
            rememberFunnelState();
            const currentDocumentPages = documentPagesOf(document.current);
            const existing = [CHECKOUT_PAGE_ID, ...currentDocumentPages.map((page) => page.id)];
            const id = createPageId(existing);
            const contentById = new Map(
                currentDocumentPages
                    .filter((item) => item.kind === 'content')
                    .map((item) => [item.id, item]),
            );
            const visited = new Set<string>();
            let cursor: string | null | undefined =
                typeof document.current.settings.startPageId === 'string'
                    ? document.current.settings.startPageId
                    : CHECKOUT_PAGE_ID;
            let insertAfter: (typeof currentDocumentPages)[number] | undefined;
            while (cursor && contentById.has(cursor) && !visited.has(cursor)) {
                visited.add(cursor);
                insertAfter = contentById.get(cursor);
                cursor = insertAfter?.next ?? CHECKOUT_PAGE_ID;
            }
            const contentCount =
                currentDocumentPages.filter((item) => item.kind === 'content').length + 1;
            const startPageId =
                typeof document.current.settings.startPageId === 'string'
                    ? document.current.settings.startPageId
                    : CHECKOUT_PAGE_ID;
            const source =
                placement.after === undefined ? undefined : contentById.get(placement.after);
            let pages: NonNullable<CheckoutDocument['pages']>;
            let start = startPageId;
            if (placement.after === ENTRY_NODE_ID) {
                // Pela Entrada: a nova página vira a primeira tela e leva à antiga primeira.
                pages = [
                    ...currentDocumentPages,
                    funnelPageFromTemplate(template, id, contentCount, startPageId),
                ];
                start = id;
            } else if (source) {
                // Depois de uma página: entra no meio, herdando o destino que ela tinha.
                const triggers = funnelTriggersOf(source);
                const active = triggers.filter((trigger) => trigger.active);
                const previous = active[0]?.target ?? source.next ?? CHECKOUT_PAGE_ID;
                const retarget = active.length
                    ? active.filter((trigger) => trigger.target === previous)
                    : triggers.slice(0, 1);
                const linked = retarget.reduce(
                    (page, trigger) => pageWithTriggerTarget(page, trigger.id, id),
                    source,
                );
                pages = [
                    ...currentDocumentPages.map((item) => (item.id === source.id ? linked : item)),
                    funnelPageFromTemplate(template, id, contentCount, previous),
                ];
            } else {
                pages = [
                    ...currentDocumentPages.map((item) =>
                        item.id === insertAfter?.id ? { ...item, next: id } : item,
                    ),
                    funnelPageFromTemplate(
                        template,
                        id,
                        contentCount,
                        insertAfter ? (insertAfter.next ?? CHECKOUT_PAGE_ID) : CHECKOUT_PAGE_ID,
                    ),
                ];
                if (!insertAfter) start = id;
            }
            const positions = placement.position
                ? {
                      ...funnelPositionsOf(document.current),
                      [id]: placement.position,
                  }
                : undefined;
            document.current = {
                ...document.current,
                pages,
                settings: {
                    ...document.current.settings,
                    startPageId: start,
                    ...(positions ? { funnelPositions: positions } : {}),
                },
            };
            if (positions) setFunnelPositions(positions);
            setFunnelPages(documentPagesOf(document.current));
            setFunnelStartPage(start);
            setState('changed');
            const nextData = documentToPuck(document.current, id);
            current.current = nextData;
            setEditorData(nextData);
            setEditorGeneration((generation) => generation + 1);
            setPreviewScreen(id);
        },
        [previewScreen, rememberFunnelState],
    );

    const removeFunnelPage = useCallback(
        (pageId: string) => {
            const page = documentPagesOf(document.current).find((item) => item.id === pageId);
            if (!page || page.kind !== 'content') return;
            document.current = puckToDocument(current.current, document.current, previewScreen);
            rememberFunnelState();
            document.current = {
                ...document.current,
                pages: documentPagesOf(document.current)
                    .filter((item) => item.id !== pageId)
                    .map((item) => {
                        if (item.kind !== 'content') return item;
                        return {
                            ...item,
                            ...(item.next === pageId ? { next: null } : {}),
                            sections: item.sections.map((section) => {
                                const props = section.props;
                                if (
                                    section.type === 'cta_button' &&
                                    props.action === 'page' &&
                                    props.pageId === pageId
                                )
                                    return {
                                        ...section,
                                        props: { ...props, action: 'none', pageId: '' },
                                    };
                                if (section.type !== 'video') return section;
                                return {
                                    ...section,
                                    props: {
                                        ...props,
                                        ...(props.ctaAction === 'page' && props.ctaPageId === pageId
                                            ? { ctaAction: 'none', ctaPageId: '' }
                                            : {}),
                                        ...(props.endPageId === pageId
                                            ? { endAction: 'none', endPageId: '' }
                                            : {}),
                                    },
                                };
                            }),
                        };
                    }),
                settings: {
                    ...document.current.settings,
                    ...(document.current.settings.startPageId === pageId
                        ? { startPageId: CHECKOUT_PAGE_ID }
                        : {}),
                },
            };
            setFunnelPages(documentPagesOf(document.current));
            setWorkspaceTabs((tabs) => tabs.filter((item) => item !== `page:${pageId}`));
            if (document.current.settings.startPageId === CHECKOUT_PAGE_ID)
                setFunnelStartPage(CHECKOUT_PAGE_ID);
            setState('changed');
            const nextData = documentToPuck(document.current, CHECKOUT_PAGE_ID);
            current.current = nextData;
            setEditorData(nextData);
            setEditorGeneration((generation) => generation + 1);
            setPreviewScreen(CHECKOUT_PAGE_ID);
        },
        [previewScreen, rememberFunnelState],
    );

    const updateFunnelPage = useCallback(
        (pageId: string, changes: { name?: string; next?: string | null }) => {
            document.current = puckToDocument(current.current, document.current, previewScreen);
            rememberFunnelState(changes.name !== undefined ? `rename:${pageId}` : '');
            document.current = {
                ...document.current,
                pages: documentPagesOf(document.current).map((page) =>
                    page.id === pageId
                        ? {
                              ...page,
                              ...(changes.name !== undefined
                                  ? { name: changes.name.slice(0, 60) }
                                  : {}),
                              ...('next' in changes ? { next: changes.next } : {}),
                          }
                        : page,
                ),
            };
            setFunnelPages(documentPagesOf(document.current));
            setState('changed');
        },
        [previewScreen, rememberFunnelState],
    );

    const setFunnelPageTriggerTarget = useCallback(
        (pageId: string, triggerId: string, target: string | null) => {
            document.current = puckToDocument(current.current, document.current, previewScreen);
            rememberFunnelState();
            document.current = {
                ...document.current,
                pages: documentPagesOf(document.current).map((page) =>
                    page.id === pageId ? pageWithTriggerTarget(page, triggerId, target) : page,
                ),
            };
            setFunnelPages(documentPagesOf(document.current));
            if (pageId === previewScreen) {
                const nextData = documentToPuck(document.current, previewScreen);
                current.current = nextData;
                setEditorData(nextData);
                setEditorGeneration((generation) => generation + 1);
            }
            setState('changed');
        },
        [previewScreen, rememberFunnelState],
    );

    const openTab = useCallback(
        (next: WorkspaceTab) => {
            const page = tabPage(next);
            if (page !== null) navigatePreview(page);
            else if (tabPage(tab) !== null) {
                // Saindo do builder: o que foi editado na página entra no documento.
                document.current = puckToDocument(current.current, document.current, previewScreen);
                setFunnelPages(documentPagesOf(document.current));
                setBuilderContent(checkoutContentOf(document.current));
            }
            if (next !== 'funnel')
                setWorkspaceTabs((tabs) => (tabs.includes(next) ? tabs : [...tabs, next]));
            setTab(next);
        },
        [navigatePreview, previewScreen, tab],
    );

    const closeTab = useCallback(
        (closing: WorkspaceTab) => {
            if (closing === CHECKOUT_WORKSPACE_TAB) return;
            setWorkspaceTabs((tabs) => tabs.filter((item) => item !== closing));
            if (closing === tab) openTab('funnel');
        },
        [openTab, tab],
    );

    // A aba fica na URL: recarregar ou compartilhar o link volta ao mesmo lugar.
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', paymentAdvancedOpen ? 'payment' : tab);
        window.history.replaceState(window.history.state, '', url);
    }, [paymentAdvancedOpen, tab]);

    const openPaymentAdvanced = useCallback(() => {
        openTab('funnel');
        setPaymentAdvancedOpen(true);
    }, [openTab]);
    useEffect(() => {
        if (!paymentAdvancedOpen) return;

        function close(event: KeyboardEvent) {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            setPaymentAdvancedOpen(false);
        }

        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [paymentAdvancedOpen]);
    const changePaymentFlow = useCallback((next: FlowGraph | undefined) => {
        setPaymentFlow(next);
        if (next === undefined) setPaymentIssues([]);
        setState('changed');
    }, []);
    const paymentGatewayIds = useMemo(() => {
        // Sem fluxo próprio vale o preset: o primeiro gateway ativo que aceita cada forma.
        if (!paymentFlow) return presetGatewayIds(gatewayConnections);
        // Por forma: um gateway pode ter a forma desabilitada no nó do fluxo.
        return Object.fromEntries(
            (['card', 'pix', 'boleto'] as const).map((method) => [
                method,
                flowGatewayIds(paymentFlow, method),
            ]),
        ) as Record<CheckoutPaymentMethod, string[]>;
    }, [gatewayConnections, paymentFlow]);
    // Estável: o Puck reescreve o histórico quando props como esta mudam de referência.
    const builderMetadata = useMemo(
        () => ({ checkoutPrices: checkout.products ?? [] }),
        [checkout.products],
    );
    const readinessIssues = checkoutReadinessIssues({
        content: builderContent,
        environment,
        flowGatewayIds: paymentGatewayIds,
        connections: gatewayConnections,
    });
    const paymentErrors = paymentIssues.filter((issue) => issue.severity === 'error').length;
    const usableGatewayCount = gatewayConnections.filter(
        (connection) => connection.status !== 'disabled',
    ).length;
    // Itens do checklist de publicação: componentes, gateways por forma e o fluxo de pagamento.
    const pendingCount =
        readinessIssues.length + (paymentErrors > 0 ? 1 : 0) + (publicationError !== null ? 1 : 0);
    const paymentSummary = usePaymentSummary({
        own: paymentFlow,
        connections: gatewayConnections,
        errors: paymentErrors,
        onOpen: openPaymentAdvanced,
    });

    const setStartPage = useCallback(
        (pageId: string) => {
            rememberFunnelState();
            document.current = {
                ...document.current,
                settings: { ...document.current.settings, startPageId: pageId },
            };
            setFunnelStartPage(pageId);
            setState('changed');
        },
        [rememberFunnelState],
    );

    const updateFunnelPosition = useCallback(
        (pageId: string, position: { x: number; y: number }) => {
            rememberFunnelState('position');
            setFunnelPositions((currentPositions) => {
                const next = { ...currentPositions, [pageId]: position };
                document.current = {
                    ...document.current,
                    settings: { ...document.current.settings, funnelPositions: next },
                };
                return next;
            });
            setState('changed');
        },
        [rememberFunnelState],
    );

    const reorderFunnelPages = useCallback(
        (orderedPageIds: string[]) => {
            document.current = puckToDocument(current.current, document.current, previewScreen);
            rememberFunnelState();
            const pages = documentPagesOf(document.current);
            const contentById = new Map(
                pages.filter((page) => page.kind === 'content').map((page) => [page.id, page]),
            );
            const orderedContent = orderedPageIds.flatMap((id) => {
                const page = contentById.get(id);
                if (!page) return [];
                contentById.delete(id);
                return [page];
            });
            document.current = {
                ...document.current,
                pages: chainContentPages([
                    ...orderedContent,
                    ...contentById.values(),
                    ...pages.filter((page) => page.kind !== 'content'),
                ]),
            };
            setFunnelPages(documentPagesOf(document.current));
            setState('changed');
        },
        [previewScreen, rememberFunnelState],
    );

    const pageKind: CheckoutPageKind =
        previewScreen === CHECKOUT_PAGE_ID
            ? 'checkout'
            : (funnelPages.find((page) => page.id === previewScreen)?.kind ?? 'content');
    // Páginas do funil na ordem do workspace: conteúdo, checkout e resultados.
    const workspacePages = useMemo(
        () => [
            ...funnelPages
                .filter((page) => page.kind === 'content')
                .map((page) => ({
                    id: page.id,
                    name: page.name,
                    kind: page.kind,
                    next: page.next,
                    triggers: funnelTriggersOf(page),
                })),
            { id: CHECKOUT_PAGE_ID, name: pageKindLabels.checkout, kind: 'checkout' as const },
            ...funnelPages
                .filter((page) => page.kind !== 'content')
                .map((page) => ({
                    id: page.id,
                    name: page.name,
                    kind: page.kind,
                    next: page.next,
                    triggers: funnelTriggersOf(page),
                })),
        ],
        [funnelPages],
    );
    // O funil só mostra as rotas das formas habilitadas no bloco Formas de pagamento.
    const funnelCanvasPages = useMemo(
        () =>
            workspacePages.filter(
                (page) =>
                    (page.kind !== 'pix' || enabledMethods.includes('pix')) &&
                    (page.kind !== 'boleto' || enabledMethods.includes('boleto')),
            ),
        [enabledMethods, workspacePages],
    );
    const previewContext = useMemo(
        () => ({
            screen: previewScreen,
            pageKind,
            pages: workspacePages,
            interactive: false,
            navigate: navigatePreview,
            follow: (navigation: CheckoutNavigation) =>
                navigatePreview(navigationTarget(document.current, previewScreen, navigation)),
            addPage: addFunnelPage,
            removePage: removeFunnelPage,
            reorderPages: reorderFunnelPages,
            startPageId: funnelStartPage,
            updatePage: updateFunnelPage,
            setPageTriggerTarget: setFunnelPageTriggerTarget,
            positions: funnelPositions,
            updatePosition: updateFunnelPosition,
            setStartPage,
            flowOpen: tab === 'funnel',
            setFlowOpen: (open: boolean) => openTab(open ? 'funnel' : `page:${previewScreen}`),
            openPage: (pageId: string) => openTab(`page:${pageId}`),
        }),
        [
            addFunnelPage,
            openTab,
            workspacePages,
            funnelPositions,
            funnelStartPage,
            tab,
            navigatePreview,
            pageKind,
            previewScreen,
            removeFunnelPage,
            reorderFunnelPages,
            setStartPage,
            setFunnelPageTriggerTarget,
            updateFunnelPage,
            updateFunnelPosition,
        ],
    );

    async function save(data: BuilderData = current.current, notify = true) {
        if (saving.current) return false;
        saving.current = true;
        setState('saving');
        const nextDocument = puckToDocument(data, document.current, previewScreen);
        const settings = { ...nextDocument.settings };
        delete settings.paymentFlow;
        nextDocument.settings = {
            ...settings,
            environment,
            ...(paymentFlow === undefined ? {} : { paymentFlow }),
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
        setFunnelPages(documentPagesOf(body.data.document));
        setFunnelPositions(funnelPositionsOf(body.data.document));
        setFunnelStartPage(
            typeof body.data.document.settings.startPageId === 'string'
                ? body.data.document.settings.startPageId
                : CHECKOUT_PAGE_ID,
        );
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
        setPublicationError(null);
        setEnvironment(next);
        setState('changed');
    }

    function restoreVersion(restoredDraft: CheckoutDraft, version: CheckoutVersion) {
        const restoredData = documentToPuck(restoredDraft.document);
        const restoredEnvironment = restoredDraft.document.settings.environment ?? 'sandbox';
        current.current = restoredData;
        revision.current = restoredDraft.revision;
        document.current = restoredDraft.document;
        setPreviewScreen(CHECKOUT_PAGE_ID);
        setFunnelPages(documentPagesOf(restoredDraft.document));
        setFunnelPositions(funnelPositionsOf(restoredDraft.document));
        setFunnelStartPage(
            typeof restoredDraft.document.settings.startPageId === 'string'
                ? restoredDraft.document.settings.startPageId
                : CHECKOUT_PAGE_ID,
        );
        setEditorData(restoredData);
        setEditorGeneration((generation) => generation + 1);
        setEnvironment(restoredEnvironment);
        setPaymentFlow(restoredDraft.document.settings.paymentFlow);
        setPaymentIssues([]);
        funnelPast.current = [];
        funnelFuture.current = [];
        funnelHistoryAction.current = null;
        setFunnelHistoryAvailability({ undo: 0, redo: 0 });
        setWorkspaceTabs(['funnel', CHECKOUT_WORKSPACE_TAB]);
        setTab('funnel');
        setBuilderContent(restoredData.content);
        setEnabledMethods(enabledPaymentMethods(restoredData.content));
        setPresentComponents(presentRequiredComponents(restoredData.content));
        setPublicationError(null);
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
        document.current = puckToDocument(data, document.current, previewScreen);
        const checkoutData = documentToPuck(document.current, CHECKOUT_PAGE_ID);
        setBuilderContent(checkoutData.content);
        setEnabledMethods(enabledPaymentMethods(checkoutData.content));
        setPresentComponents(presentRequiredComponents(checkoutData.content));
        setPublicationError(null);
        const issues = checkoutReadinessIssues({
            content: checkoutData.content,
            environment,
            flowGatewayIds: paymentGatewayIds,
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
            const message = publishErrorMessage(body.code, body.detail);
            setState('error');
            // Fluxo de pagamento com erro: o problema aparece no próprio editor de nós.
            if (body.code === 'CHECKOUT_PAYMENT_FLOW_INVALID') openPaymentAdvanced();
            else {
                setPublicationError(message);
                setPaymentSettingsOpen(true);
            }
            showToast({
                tone: 'error',
                title: 'Não foi possível publicar',
                description: message,
                duration: 7_000,
            });
            return;
        }
        setState('published');
        setPublicationError(null);
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
    const currentData = () => current.current;
    const showPublicLinks = checkout.status === 'published' || state === 'published';

    const activePage = tabPage(tab);
    const pageOf = (id: string) => workspacePages.find((page) => page.id === id);
    const moveWorkspaceTab = (moving: WorkspaceTab, target: WorkspaceTab) => {
        if (moving === target) return;
        setWorkspaceTabs((items) => {
            const from = items.indexOf(moving);
            const to = items.indexOf(target);
            if (from < 0 || to < 0) return items;
            const next = [...items];
            next.splice(from, 1);
            next.splice(to, 0, moving);
            return next;
        });
    };
    const moveWorkspaceTabBy = (moving: WorkspaceTab, offset: -1 | 1) => {
        setWorkspaceTabs((items) => {
            const from = items.indexOf(moving);
            const to = from + offset;
            if (from < 0 || to < 0 || to >= items.length) return items;
            const next = [...items];
            [next[from], next[to]] = [next[to]!, next[from]!];
            return next;
        });
    };
    const tabLabel = (item: WorkspaceTab) => {
        const page = tabPage(item);
        if (page !== null) return pageOf(page)?.name ?? 'Página';
        return 'Funil';
    };
    const tabIcon = (item: WorkspaceTab): IconName => {
        const page = tabPage(item);
        if (page === null) return 'route';
        const kind = pageOf(page)?.kind;
        return kind === 'checkout'
            ? 'cart'
            : kind === 'content'
              ? 'layout'
              : kind === 'failure'
                ? 'x-circle'
                : kind === 'success'
                  ? 'check-circle'
                  : 'clock';
    };

    return (
        <div
            className="astro-checkout-editor astro-light-scope"
            data-tab={activePage === null ? tab : 'page'}
        >
            <header className="ce-bar" data-tour="builder-header">
                {/*
                 * Dock central: identidade, áreas do checkout, ferramentas e publicação em
                 * grupos. Ícones com rótulo no hover/foco; a área ativa mostra o nome.
                 */}
                <div
                    ref={dockRef}
                    className="ce-dock"
                    role="toolbar"
                    aria-label="Editor do checkout"
                >
                    <div className="ce-dock-group">
                        <Link
                            href="/checkouts"
                            className="ce-dock-item"
                            aria-label="Voltar para checkouts"
                            data-tip="Voltar para checkouts"
                        >
                            <Icon name="arrow-right" className="size-4 rotate-180" />
                        </Link>
                        <div className="ce-dock-title">
                            <h1 title={checkout.name}>{checkout.name}</h1>
                            <span
                                className="ce-status"
                                data-state={state}
                                role="status"
                                aria-live="polite"
                            >
                                <span className="ce-status-dot" aria-hidden="true" />
                                {statusLabel(state)}
                            </span>
                        </div>
                    </div>
                    <span className="ce-dock-sep" aria-hidden="true" />
                    <nav
                        className="ce-dock-group ce-tabs"
                        role="tablist"
                        aria-label="Workspace do checkout"
                        data-tour="builder-workspace-tabs"
                    >
                        {workspaceTabs.map((item) => {
                            const selected = item === tab && !paymentAdvancedOpen;
                            const page = tabPage(item);
                            const closable = page !== null && page !== CHECKOUT_PAGE_ID;
                            const previewKind = tabPreviewKind(item);
                            return (
                                <div
                                    key={item}
                                    className="ce-tab"
                                    data-selected={selected || undefined}
                                    data-kind={closable ? 'open' : 'fixed'}
                                    data-dragging={draggedTab === item || undefined}
                                    data-drop-target={tabDropTarget === item || undefined}
                                    draggable
                                    onDragStart={(event) => {
                                        setDraggedTab(item);
                                        event.dataTransfer.effectAllowed = 'move';
                                        event.dataTransfer.setData('text/plain', item);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        event.dataTransfer.dropEffect = 'move';
                                        setTabDropTarget(item);
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        const moving = event.dataTransfer.getData(
                                            'text/plain',
                                        ) as WorkspaceTab;
                                        if (workspaceTabs.includes(moving))
                                            moveWorkspaceTab(moving, item);
                                        setDraggedTab(null);
                                        setTabDropTarget(null);
                                    }}
                                    onDragEnd={() => {
                                        setDraggedTab(null);
                                        setTabDropTarget(null);
                                    }}
                                >
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        aria-label={tabLabel(item)}
                                        onClick={() => {
                                            setPaymentAdvancedOpen(false);
                                            openTab(item);
                                        }}
                                        onKeyDown={(event) => {
                                            if (!event.altKey) return;
                                            if (event.key === 'ArrowLeft') {
                                                event.preventDefault();
                                                moveWorkspaceTabBy(item, -1);
                                            }
                                            if (event.key === 'ArrowRight') {
                                                event.preventDefault();
                                                moveWorkspaceTabBy(item, 1);
                                            }
                                        }}
                                    >
                                        <Icon name={tabIcon(item)} className="size-4" />
                                        <span className="ce-dock-label" ref={measureDockLabel}>
                                            <span>{tabLabel(item)}</span>
                                        </span>
                                    </button>
                                    {!selected && previewKind && (
                                        <DockPreview kind={previewKind} title={tabLabel(item)} />
                                    )}
                                    {closable && (
                                        <button
                                            type="button"
                                            className="ce-tab-close"
                                            aria-label={`Fechar ${tabLabel(item)}`}
                                            onClick={() => closeTab(item)}
                                        >
                                            <Icon name="close" className="size-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {/* Pagamento é uma área do checkout: abre direto o orquestrador. */}
                        <div
                            className="ce-tab"
                            data-kind="fixed"
                            data-selected={paymentAdvancedOpen || undefined}
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={paymentAdvancedOpen}
                                aria-label="Pagamento"
                                data-tour="builder-payment"
                                onClick={openPaymentAdvanced}
                            >
                                <Icon name="bolt" className="size-4" />
                                <span className="ce-dock-label" ref={measureDockLabel}>
                                    <span>Pagamento</span>
                                </span>
                                {(paymentErrors > 0 || usableGatewayCount === 0) && (
                                    <i className="ce-tab-alert" aria-label="Pagamento pendente" />
                                )}
                            </button>
                            {!paymentAdvancedOpen && <DockPreview kind="payment" />}
                        </div>
                    </nav>
                    <span className="ce-dock-sep" aria-hidden="true" />
                    <div className="ce-dock-group">
                        <span className="ce-dock-slot">
                            <button
                                type="button"
                                className="ce-dock-item"
                                aria-label="Tutorial desta página"
                                data-tip="Tutorial"
                                onClick={() =>
                                    window.dispatchEvent(new Event(guidedTourStartEvent))
                                }
                            >
                                <Icon name="help" className="size-4" />
                            </button>
                        </span>
                        <span className="ce-dock-slot">
                            <button
                                type="button"
                                className="ce-dock-item"
                                data-tour="builder-preview"
                                aria-label="Visualizar em nova janela"
                                data-tip="Visualizar"
                                disabled={busy}
                                onClick={() => void openPreview()}
                            >
                                <Icon name="eye" className="size-4" />
                            </button>
                        </span>
                        <span className="ce-dock-slot">
                            <button
                                type="button"
                                className="ce-dock-item"
                                data-tour="builder-save"
                                aria-label="Salvar rascunho"
                                data-tip="Salvar rascunho"
                                disabled={busy}
                                onClick={() => void save(currentData())}
                            >
                                <Icon name="check" className="size-4" />
                            </button>
                        </span>
                        <EditorMoreMenu
                            dock
                            open={headerMenuOpen}
                            onOpenChange={setHeaderMenuOpen}
                            attention={readinessIssues.length > 0 || publicationError !== null}
                        >
                            <button
                                type="button"
                                role="menuitem"
                                className="ce-menu-item"
                                onClick={() => {
                                    setHeaderMenuOpen(false);
                                    setPaymentSettingsOpen(true);
                                }}
                            >
                                <Icon
                                    name={pendingCount === 0 ? 'check-circle' : 'alert'}
                                    className="size-4"
                                />
                                Prontidão e gateways
                                {pendingCount > 0 && (
                                    <span className="ce-menu-badge">{pendingCount}</span>
                                )}
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="ce-menu-item"
                                disabled={busy}
                                onClick={() => {
                                    setHeaderMenuOpen(false);
                                    setVersionHistoryOpen(true);
                                }}
                            >
                                <Icon name="clock" className="size-4" /> Histórico de versões
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
                                            void navigator.clipboard.writeText(publicUrl);
                                            setHeaderMenuOpen(false);
                                            showToast({
                                                tone: 'success',
                                                title: 'Link copiado',
                                                description:
                                                    'O link público do checkout foi copiado.',
                                            });
                                        }}
                                    >
                                        <Icon name="link" className="size-4" /> Copiar link
                                    </button>
                                    <a
                                        href={publicUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        role="menuitem"
                                        className="ce-menu-item"
                                        data-tour="builder-open-checkout"
                                    >
                                        <Icon name="arrow-right" className="size-4 -rotate-45" />{' '}
                                        Abrir checkout
                                    </a>
                                </>
                            )}
                        </EditorMoreMenu>
                    </div>
                    <span className="ce-dock-sep" aria-hidden="true" />
                    <div className="ce-dock-group">
                        <span className="ce-dock-slot">
                            <button
                                type="button"
                                className="ce-readiness"
                                data-tour="builder-readiness"
                                data-ready={pendingCount === 0 || undefined}
                                aria-label={
                                    pendingCount === 0
                                        ? 'Pronto para publicar'
                                        : `${String(pendingCount)} pendências para publicar`
                                }
                                data-tip={
                                    pendingCount === 0
                                        ? 'Pronto para publicar'
                                        : 'O que falta publicar'
                                }
                                onClick={() => setPaymentSettingsOpen(true)}
                            >
                                <Icon
                                    name={pendingCount === 0 ? 'check-circle' : 'alert'}
                                    className="size-4"
                                />
                                {pendingCount > 0 && <span>{pendingCount}</span>}
                            </button>
                        </span>
                        <span className="ce-dock-slot">
                            <button
                                type="button"
                                className="ce-dock-publish"
                                data-tour="builder-publish"
                                disabled={busy}
                                onClick={() => void publish(currentData())}
                            >
                                <span>Publicar</span>
                                <Icon name="arrow-right" className="size-4" />
                            </button>
                        </span>
                    </div>
                </div>
            </header>
            <div className="ce-stage">
                <EditorChromeContext.Provider value={{ publicUrl, checkoutId: checkout.id }}>
                    <CheckoutBuilderMediaContext.Provider
                        value={{ files: mediaFiles, apiUrl: mediaApiUrl }}
                    >
                        <CheckoutBuilderProductsContext.Provider value={checkout.products ?? []}>
                            <CheckoutBuilderPreviewContext.Provider value={previewContext}>
                                {activePage !== null && (
                                    <Puck
                                        key={editorGeneration}
                                        config={checkoutBuilderConfig}
                                        metadata={builderMetadata}
                                        data={editorData}
                                        height="100%"
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
                                            setPublicationError(null);
                                            if (previewScreen === CHECKOUT_PAGE_ID) {
                                                setBuilderContent(data.content);
                                                setEnabledMethods(
                                                    enabledPaymentMethods(data.content),
                                                );
                                                setPresentComponents(
                                                    presentRequiredComponents(data.content),
                                                );
                                            }
                                            setState('changed');
                                        }}
                                        onPublish={publish}
                                        // Sem cabeçalho: o dock escuro fica em cima e os controles
                                        // da página vão para o dock branco de baixo.
                                        renderHeader={({ children }) => (
                                            <header className="ce-header ce-page-toolbar">
                                                {children}
                                            </header>
                                        )}
                                        renderHeaderActions={() => (
                                            <>
                                                <EditorViewportTracker onChange={trackViewport} />
                                                <BottomDockPortal>
                                                    <span className="ce-dock-lead">
                                                        <ComponentLibraryToggle />
                                                        <span
                                                            className="ce-toolbar-divider"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                    <span
                                                        className="ce-toolbar-divider"
                                                        aria-hidden="true"
                                                    />
                                                    <HistoryControls />
                                                    <span
                                                        className="ce-toolbar-divider"
                                                        aria-hidden="true"
                                                    />
                                                    <PreviewModeToggle />
                                                    <EditorMoreMenu
                                                        open={pageMenuOpen}
                                                        onOpenChange={setPageMenuOpen}
                                                        attention={false}
                                                    >
                                                        <EditorAppearanceButton />
                                                    </EditorMoreMenu>
                                                </BottomDockPortal>
                                            </>
                                        )}
                                    />
                                )}
                                {tab === 'funnel' && (
                                    <section
                                        className="ce-board"
                                        aria-label="Funil do checkout"
                                        data-tour="builder-funnel"
                                        data-fullscreen={funnelFullscreen || undefined}
                                    >
                                        <div className="ce-board-head ce-area-bar">
                                            <AreaIdentity
                                                icon="route"
                                                title="Funil"
                                                subtitle={`${String(funnelCanvasPages.length)} páginas · clique num card para configurar`}
                                            />
                                            <div
                                                ref={setFunnelActions}
                                                className="ce-area-actions flex shrink-0 items-center gap-2"
                                            />
                                        </div>
                                        <div className="ce-funnel-workspace">
                                            <div
                                                className="ce-funnel-library-shell"
                                                data-tour="builder-funnel-library"
                                                data-open={funnelLibraryOpen || undefined}
                                                aria-hidden={!funnelLibraryOpen}
                                                inert={!funnelLibraryOpen}
                                            >
                                                <FunnelPageLibrary onAdd={addFunnelPage} />
                                            </div>
                                            <CheckoutFunnelCanvas
                                                key={`${funnelStartPage}:${funnelCanvasPages.map((page) => page.id).join('|')}`}
                                                pages={funnelCanvasPages}
                                                startPageId={funnelStartPage}
                                                positions={funnelPositions}
                                                onEdit={(pageId) => openTab(`page:${pageId}`)}
                                                onRemove={removeFunnelPage}
                                                onRename={(pageId, name) =>
                                                    updateFunnelPage(pageId, { name })
                                                }
                                                onStart={setStartPage}
                                                onSetTriggerTarget={setFunnelPageTriggerTarget}
                                                onPosition={updateFunnelPosition}
                                                onAdd={addFunnelPage}
                                                actionsSlot={funnelActions}
                                                fullscreen={funnelFullscreen}
                                                onToggleFullscreen={toggleFunnelFullscreen}
                                                payment={paymentSummary}
                                                libraryOpen={funnelLibraryOpen}
                                                onToggleLibrary={() =>
                                                    setFunnelLibraryOpen((open) => !open)
                                                }
                                                canUndo={funnelHistoryAvailability.undo > 0}
                                                canRedo={funnelHistoryAvailability.redo > 0}
                                                onUndo={undoFunnel}
                                                onRedo={redoFunnel}
                                            />
                                        </div>
                                    </section>
                                )}
                            </CheckoutBuilderPreviewContext.Provider>
                        </CheckoutBuilderProductsContext.Provider>
                    </CheckoutBuilderMediaContext.Provider>
                </EditorChromeContext.Provider>
                {paymentAdvancedOpen && (
                    <div
                        className="ce-payment-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Editor avançado do pagamento"
                    >
                        <PaymentFlowTab
                            leading={
                                <div className="ce-area-leading">
                                    <AreaIdentity
                                        icon="bolt"
                                        title="Pagamento"
                                        subtitle={
                                            paymentFlow
                                                ? 'Orquestrador · configurado neste checkout'
                                                : 'Orquestrador · usando o padrão'
                                        }
                                    />
                                </div>
                            }
                            flow={paymentFlow}
                            connections={gatewayConnections}
                            resources={flowResources}
                            canManageGateways={canManageGateways}
                            onChange={changePaymentFlow}
                            onIssues={setPaymentIssues}
                        />
                    </div>
                )}
            </div>
            <PaymentGatewaySettings
                open={paymentSettingsOpen}
                environment={environment}
                enabledMethods={enabledMethods}
                presentComponents={presentComponents}
                connections={gatewayConnections}
                publicationError={publicationError}
                onEnvironmentChange={changeEnvironment}
                flowGatewayIds={paymentGatewayIds}
                paymentFlowErrors={paymentErrors}
                onOpenPaymentFlow={() => {
                    setPaymentSettingsOpen(false);
                    openPaymentAdvanced();
                }}
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
    if (code === 'CHECKOUT_PAYMENT_FLOW_INVALID')
        return `O fluxo de pagamento tem um problema: ${detail ?? 'revise os nós destacados.'}`;
    if (code === 'CHECKOUT_NOT_PUBLISHABLE')
        return 'Todos os produtos e preços deste checkout precisam estar ativos antes da publicação.';
    return detail ?? 'Revise a configuração do checkout e tente publicar novamente.';
}

function joinLabels(labels: string[]) {
    if (labels.length === 0) return 'os componentes obrigatórios';
    if (labels.length === 1) return `“${labels[0]}”`;
    return `${labels
        .slice(0, -1)
        .map((label) => `“${label}”`)
        .join(', ')} e “${labels.at(-1)}”`;
}
