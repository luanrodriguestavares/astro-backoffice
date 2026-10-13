'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Tela de referência (iPhone 15), em pixels de layout. */
export const PHONE_MOCKUP_DEVICE = {
    width: 390,
    height: 844,
    radius: 55,
    bezel: 12,
    status: 54,
    browser: 52,
} as const;

/**
 * Celular com proporção real. O conteúdo roda num iframe com o layout de 390 px (as regras
 * de celular do checkout valem de verdade) e é reduzido por `zoom`, sem transform: iframes
 * transformados escapam do recorte arredondado em alguns navegadores.
 *
 * - `children`: renderiza dentro do iframe via portal (prévia do assistente);
 * - `src`: carrega uma página (preview do checkout), com a barra do navegador acima.
 *
 * A escala se ajusta à altura do elemento pai, até `maxScale`.
 */
export function PhoneMockup({
    children,
    src,
    address,
    background = '#ffffff',
    foreground = '#101214',
    maxScale = 1,
    title = 'Prévia no celular',
}: {
    children?: ReactNode;
    src?: string;
    /** Endereço exibido na barra do navegador (só com `src`). */
    address?: string;
    background?: string;
    foreground?: string;
    maxScale?: number;
    title?: string;
}) {
    const fit = useRef<HTMLDivElement>(null);
    const frame = useRef<HTMLIFrameElement>(null);
    const [body, setBody] = useState<HTMLElement | null>(null);
    const [scale, setScale] = useState(maxScale);
    const browser = Boolean(src);

    useEffect(() => {
        const element = fit.current;
        if (!element) return;
        const total = PHONE_MOCKUP_DEVICE.height + PHONE_MOCKUP_DEVICE.bezel * 2;
        const measure = () => {
            const available = element.clientHeight;
            if (available > 0) setScale(Math.max(0.42, Math.min(maxScale, available / total)));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [maxScale]);

    useEffect(() => {
        const element = frame.current;
        if (!element) return;
        const attach = () => {
            const document = element.contentDocument;
            if (!document?.documentElement) return;
            document.documentElement.style.zoom = String(scale);
            document.documentElement.style.setProperty('--phone-zoom', String(scale));
            if (!src && document.body) {
                document.body.style.margin = '0';
                setBody(document.body);
            }
        };
        element.addEventListener('load', attach);
        attach();
        return () => element.removeEventListener('load', attach);
    }, [scale, src]);

    const px = (value: number) => value * scale;
    const contentHeight =
        PHONE_MOCKUP_DEVICE.height -
        PHONE_MOCKUP_DEVICE.status -
        (browser ? PHONE_MOCKUP_DEVICE.browser : 0);

    return (
        <div ref={fit} className="flex h-full min-h-0 w-full items-center justify-center">
            <PhoneMockupShell
                scale={scale}
                background={background}
                foreground={foreground}
                browser={browser}
                address={address}
            >
                <iframe
                    ref={frame}
                    title={title}
                    src={src}
                    srcDoc={
                        src
                            ? undefined
                            : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'
                    }
                    className="block w-full"
                    style={{ height: px(contentHeight), border: 0, background }}
                />
            </PhoneMockupShell>
            {body && children && createPortal(children, body)}
        </div>
    );
}

/** Hardware compartilhado pelo preview e pelo canvas do builder. */
export function PhoneMockupShell({
    children,
    scale = 1,
    background = '#ffffff',
    foreground = '#101214',
    browser = false,
    address,
}: {
    children: ReactNode;
    scale?: number;
    background?: string;
    foreground?: string;
    browser?: boolean;
    address?: string;
}) {
    const px = (value: number) => value * scale;
    const device = PHONE_MOCKUP_DEVICE;
    return (
        <div
            className="phone-mockup-shell relative shrink-0"
            style={{
                width: px(device.width + device.bezel * 2),
                height: px(device.height + device.bezel * 2),
            }}
        >
            {[
                { side: 'left', top: 150, height: 32 },
                { side: 'left', top: 205, height: 58 },
                { side: 'left', top: 275, height: 58 },
                { side: 'right', top: 225, height: 90 },
            ].map((key, index) => (
                <span
                    key={index}
                    aria-hidden="true"
                    className="absolute rounded-[2px] bg-[#2c2e35]"
                    style={{
                        [key.side]: -px(3),
                        top: px(key.top),
                        width: Math.max(2, px(4)),
                        height: px(key.height),
                    }}
                />
            ))}
            <div
                className="relative h-full w-full bg-[#16171b] shadow-[0_0_0_1.5px_#2c2e35,0_28px_70px_rgba(16,18,20,.26)]"
                style={{ padding: px(device.bezel), borderRadius: px(device.radius + device.bezel) }}
            >
                <div
                    className="relative flex h-full w-full flex-col overflow-hidden"
                    style={{ borderRadius: px(device.radius), background }}
                >
                    <div
                        aria-hidden="true"
                        className="relative flex shrink-0 items-center justify-between font-semibold transition-colors duration-300"
                        style={{
                            height: px(device.status),
                            padding: `0 ${px(34)}px`,
                            paddingTop: px(6),
                            fontSize: px(15),
                            background: browser ? '#f6f6f8' : background,
                            color: browser ? '#101214' : foreground,
                        }}
                    >
                        <span>9:41</span>
                        <span
                            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
                            style={{ top: px(11), width: px(124), height: px(36) }}
                        />
                        <PhoneStatusIcons scale={scale} />
                    </div>
                    {browser && <PhoneBrowserBar scale={scale} address={address} />}
                    <div className="phone-mockup-content min-h-0 flex-1">{children}</div>
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
                        style={{
                            bottom: px(8),
                            width: px(134),
                            height: Math.max(3, px(5)),
                            background: foreground,
                            opacity: 0.8,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function PhoneStatusIcons({ scale }: { scale: number }) {
    const px = (value: number) => value * scale;
    return (
        <span className="flex items-center" style={{ gap: px(5) }}>
            <svg width={px(18)} height={px(12)} viewBox="0 0 15 10" fill="currentColor">
                <rect x="0" y="6" width="3" height="4" rx="1" />
                <rect x="4" y="4" width="3" height="6" rx="1" />
                <rect x="8" y="2" width="3" height="8" rx="1" />
                <rect x="12" y="0" width="3" height="10" rx="1" />
            </svg>
            <svg width={px(27)} height={px(13)} viewBox="0 0 22 11" fill="none">
                <rect x="0.5" y="0.5" width="18" height="10" rx="3" stroke="currentColor" opacity=".4" />
                <rect x="2" y="2" width="13" height="7" rx="1.6" fill="currentColor" />
                <rect x="19.5" y="3.5" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".4" />
            </svg>
        </span>
    );
}

function PhoneBrowserBar({
    scale,
    address,
}: {
    scale: number;
    address?: string;
}) {
    const px = (value: number) => value * scale;
    return (
        <div
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center border-b border-black/[0.06] bg-[#f6f6f8]"
            style={{ height: px(PHONE_MOCKUP_DEVICE.browser), padding: `0 ${px(14)}px` }}
        >
            <span
                className="flex w-full items-center justify-center truncate rounded-full bg-black/[0.06] text-[#3c3c43]"
                style={{ height: px(36), gap: px(6), fontSize: px(14) }}
            >
                <svg width={px(11)} height={px(13)} viewBox="0 0 11 13" fill="currentColor" opacity=".6">
                    <path d="M5.5 0A3.5 3.5 0 0 0 2 3.5V5H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H9V3.5A3.5 3.5 0 0 0 5.5 0Zm-2 3.5a2 2 0 1 1 4 0V5h-4V3.5Z" />
                </svg>
                <span className="truncate">{address ?? 'checkout'}</span>
            </span>
        </div>
    );
}
