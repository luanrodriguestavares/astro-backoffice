'use client';

import { Render } from '@puckeditor/core';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import {
    CheckoutBuilderProductsContext,
    CheckoutBuilderStaticContext,
    checkoutBuilderConfig,
} from '@/components/checkout-builder/config';
import { PhoneMockup } from '@/components/checkout-builder/phone-mockup';
import { documentToPuck } from '@/lib/checkout/puck-data';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
import type { Checkout, CheckoutDraft } from '@/lib/api/types';

export function CheckoutPreview({
    checkout,
    draft,
    embedded = false,
    staticMode = false,
    device: initialDevice,
}: {
    checkout: Checkout;
    draft: CheckoutDraft;
    embedded?: boolean;
    /** Miniatura: sem animações, transições nem timers. */
    staticMode?: boolean;
    /** Abre direto no mockup de celular (ex.: editor estava na visualização Celular). */
    device?: PreviewDevice;
}) {
    const [device, setDevice] = useState<PreviewDevice>(initialDevice ?? 'desktop');

    function changeDevice(next: PreviewDevice) {
        setDevice(next);
        const url = new URL(window.location.href);
        url.searchParams.set('device', next);
        window.history.replaceState(null, '', url);
    }

    if (!embedded && device === 'mobile') {
        const address = checkoutPublicUrl(checkout.slug).replace(/^https?:\/\//, '');
        return (
            <div className="relative grid h-dvh grid-rows-[auto_minmax(0,1fr)] bg-[#eceef2] dark:bg-[#0d0e11]">
                <PreviewToolbar name={checkout.name} device={device} onChange={changeDevice} />
                <div className="min-h-0 px-4 pb-6 pt-2">
                    <PhoneMockup
                        src={`/checkouts/${encodeURIComponent(checkout.id)}/preview?embed=1`}
                        address={address}
                        title={`Preview de ${checkout.name} no celular`}
                    />
                </div>
            </div>
        );
    }

    return (
        <DesktopPreview
            checkout={checkout}
            draft={draft}
            embedded={embedded}
            staticMode={staticMode}
            device={device}
            onDeviceChange={changeDevice}
        />
    );
}

export type PreviewDevice = 'desktop' | 'mobile';

function DesktopPreview({
    checkout,
    draft,
    embedded,
    staticMode,
    device,
    onDeviceChange,
}: {
    checkout: Checkout;
    draft: CheckoutDraft;
    embedded: boolean;
    staticMode: boolean;
    device: PreviewDevice;
    onDeviceChange(next: PreviewDevice): void;
}) {
    const [previewRoot, setPreviewRoot] = useState<ShadowRoot | null>(null);
    const mountPreview = useCallback((host: HTMLDivElement | null) => {
        if (!host) return;

        const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
        setPreviewRoot((current) => (current === root ? current : root));
    }, []);

    return (
        <div className="relative min-h-dvh bg-white">
            <div ref={mountPreview} className="min-h-dvh" />
            {previewRoot &&
                createPortal(
                    <CheckoutBuilderStaticContext.Provider value={staticMode}>
                        {/* Produtos reais: nome e preço no resumo, como no checkout publicado. */}
                        <CheckoutBuilderProductsContext.Provider value={checkout.products ?? []}>
                            <Render
                                config={checkoutBuilderConfig}
                                data={documentToPuck(draft.document)}
                            />
                        </CheckoutBuilderProductsContext.Provider>
                    </CheckoutBuilderStaticContext.Provider>,
                    previewRoot,
                )}
            {!embedded && (
                <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center [&>*]:pointer-events-auto">
                    <PreviewToolbar
                        name={checkout.name}
                        device={device}
                        onChange={onDeviceChange}
                    />
                </div>
            )}
        </div>
    );
}

/** Barra flutuante do preview: nome do checkout e troca entre computador e celular. */
function PreviewToolbar({
    name,
    device,
    onChange,
}: {
    name: string;
    device: PreviewDevice;
    onChange(next: PreviewDevice): void;
}) {
    return (
        <div className="mx-auto mt-3 flex w-fit items-center gap-3 rounded-full border border-white/15 bg-[#1d1d2a]/85 py-1 pl-4 pr-1 text-white shadow-lg backdrop-blur-md">
            <span className="max-w-[220px] truncate text-[11px] font-semibold">
                Preview · {name}
            </span>
            <span
                className="flex rounded-full bg-white/10 p-0.5"
                role="group"
                aria-label="Dispositivo"
            >
                {(
                    [
                        { value: 'desktop', label: 'Computador' },
                        { value: 'mobile', label: 'Celular' },
                    ] as const
                ).map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={device === option.value}
                        onClick={() => onChange(option.value)}
                        className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition ${device === option.value ? 'bg-white text-[#1d1d2a]' : 'text-white/75 hover:text-white'}`}
                    >
                        <DeviceIcon device={option.value} />
                        {option.label}
                    </button>
                ))}
            </span>
        </div>
    );
}

function DeviceIcon({ device }: { device: PreviewDevice }) {
    return device === 'mobile' ? (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <rect x="6" y="2" width="12" height="20" rx="3" />
            <path d="M11 18h2" />
        </svg>
    ) : (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <rect x="2" y="4" width="20" height="13" rx="2" />
            <path d="M8 21h8M12 17v4" />
        </svg>
    );
}
