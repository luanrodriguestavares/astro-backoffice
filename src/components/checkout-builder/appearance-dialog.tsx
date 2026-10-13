'use client';

import { Button } from '@/components/ui/button';

import { createUsePuck } from '@puckeditor/core';
import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
    appearanceToTheme,
    themeToAppearance,
    type CheckoutAppearance,
} from '@astro/checkout-renderer/theme';

import { CheckoutAppearanceStudio } from '@/components/checkout-builder/appearance-studio';
import {
    CheckoutBuilderProductsContext,
    type BuilderRootProps,
    type checkoutBuilderConfig,
} from '@/components/checkout-builder/config';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';

const usePuck = createUsePuck<typeof checkoutBuilderConfig>();

/**
 * "Aparência" no editor: reabre o assistente da criação com o tema atual e aplica tudo de
 * uma vez na raiz da página. Fica dentro do Puck para usar o histórico (desfazer funciona).
 */
export function EditorAppearanceButton() {
    const dispatch = usePuck((state) => state.dispatch);
    const root = usePuck((state) => state.appState.data.root);
    const products = useContext(CheckoutBuilderProductsContext);
    const [draft, setDraft] = useState<CheckoutAppearance>();
    const main = products.find((item) => item.isDefault) ?? products[0];

    useEscapeClose(Boolean(draft), () => setDraft(undefined));

    function open() {
        const props = (root.props ?? root) as Partial<BuilderRootProps>;
        setDraft(themeToAppearance(props, props));
    }

    function apply() {
        if (!draft) return;
        const { theme, layout } = appearanceToTheme(draft);
        dispatch({
            type: 'replaceRoot',
            root: {
                ...root,
                props: {
                    ...(root.props ?? {}),
                    ...theme,
                    ...layout,
                    // A aparência sob medida substitui qualquer identidade pronta escolhida antes.
                    brandPreset: '',
                },
            } as never,
        });
        setDraft(undefined);
        showToast({
            tone: 'success',
            title: 'Aparência aplicada',
            description: 'Use desfazer no editor se quiser voltar ao visual anterior.',
        });
    }

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                data-tour="builder-appearance"
                className="h-9 rounded-xl px-3 text-[11px]"
                onClick={open}
            >
                <Icon name="layers" className="size-3.5" />
                Aparência
            </Button>
            {draft &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setDraft(undefined);
                        }}
                        className="fixed inset-0 z-[100] grid place-items-center bg-[#17172c]/20 p-4 backdrop-blur-sm"
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="appearance-dialog-title"
                            className="theme-modal modal-surface glass-panel flex h-[min(calc(100dvh-2rem),920px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(16,18,20,.18)] sm:p-7"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-5">
                                <div>
                                    <h2
                                        id="appearance-dialog-title"
                                        className="text-2xl font-semibold tracking-[-0.04em]"
                                    >
                                        Aparência do checkout
                                    </h2>
                                    <p className="mt-1.5 text-[13px] leading-5 text-muted">
                                        Aplica a identidade visual a todo o checkout. Ajustes finos
                                        continuam disponíveis no painel Página.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="icon"
                                    aria-label="Fechar"
                                    onClick={() => setDraft(undefined)}
                                    className="size-9"
                                >
                                    <Icon name="close" className="size-4" />
                                </Button>
                            </div>
                            <div className="mt-5 min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
                                <CheckoutAppearanceStudio
                                    value={draft}
                                    onChange={setDraft}
                                    product={{
                                        name: main?.productName ?? 'Seu produto',
                                        price: main
                                            ? new Intl.NumberFormat('pt-BR', {
                                                  style: 'currency',
                                                  currency: main.currency,
                                              }).format(main.amountMinor / 100)
                                            : 'R$ 97,00',
                                    }}
                                />
                            </div>
                            <div className="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setDraft(undefined)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={apply}
                                    className="px-6"
                                >
                                    Aplicar aparência
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}

/**
 * Informa ao editor se a visualização atual do Puck é de celular, para o Preview abrir
 * direto no mockup do celular.
 */
export function EditorViewportTracker({ onChange }: { onChange(mobile: boolean): void }) {
    const width = usePuck((state) => state.appState.ui.viewports.current.width);
    const mobile = typeof width === 'number' && width < 600;
    useEffect(() => onChange(mobile), [mobile, onChange]);
    return null;
}
