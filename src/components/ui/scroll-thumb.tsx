'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Barra de rolagem flutuante da landing (landing-page/src/scripts/features/scroll-thumb.ts).
 * A nativa fica escondida para não ocupar largura; este traço fino flutua sobre a área,
 * aparece ao rolar ou ao levar o mouse à borda direita, pode ser arrastado e some parado.
 * Sem `target`, acompanha a página; com `target`, o contêiner que rola (o painel do shell).
 *
 * Desempenho: posição, altura e se a área rola são medidas só quando algo muda de tamanho,
 * num quadro de animação. Rolar e mover o mouse usam esses valores em cache e só escrevem
 * `transform`, sem forçar layout síncrono.
 */
export function ScrollThumb({ target }: { target?: RefObject<HTMLElement | null> }) {
    const thumb = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = thumb.current;
        const container = target?.current ?? null;
        const scroller = container ?? document.documentElement;
        const source: HTMLElement | Window = container ?? window;
        if (!element) return;

        const box = { top: 0, right: 0, height: 0, total: 0, size: 0, idle: true };
        let hideTimer = 0;
        let frame = 0;

        const measure = () => {
            if (container) {
                const rect = container.getBoundingClientRect();
                box.top = rect.top;
                box.right = rect.right;
                box.height = container.clientHeight;
            } else {
                box.top = 0;
                box.right = window.innerWidth;
                box.height = window.innerHeight;
            }
            box.total = scroller.scrollHeight;
            // Sem conteúdo além da altura visível, ou contêiner que não rola neste tamanho de tela.
            box.idle =
                box.total <= box.height + 1 ||
                (container !== null && getComputedStyle(container).overflowY === 'visible');
            box.size = Math.max(40, (box.height / box.total) * box.height);
            element.dataset.idle = String(box.idle);
            if (box.idle) element.classList.remove('is-visible');
            element.style.height = `${box.size}px`;
            element.style.right = `${window.innerWidth - box.right + 3}px`;
        };
        const position = () => {
            if (box.idle) return;
            const offset =
                (scroller.scrollTop / (box.total - box.height)) * (box.height - box.size);
            element.style.transform = `translateY(${box.top + offset}px)`;
        };
        const remeasure = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                measure();
                position();
            });
        };
        const show = () => {
            if (box.idle) return;
            element.classList.add('is-visible');
            window.clearTimeout(hideTimer);
            hideTimer = window.setTimeout(() => {
                if (!element.matches(':hover, .is-dragging'))
                    element.classList.remove('is-visible');
            }, 900);
        };
        const onScroll = () => {
            position();
            show();
        };
        const onPointerMove = (event: PointerEvent) => {
            if (
                box.right - event.clientX < 24 &&
                event.clientY >= box.top &&
                event.clientY <= box.top + box.height
            )
                show();
        };
        const onPointerDown = (event: PointerEvent) => {
            event.preventDefault();
            element.setPointerCapture(event.pointerId);
            element.classList.add('is-dragging');
            const startY = event.clientY;
            const startScroll = scroller.scrollTop;
            const ratio = (box.total - box.height) / (box.height - box.size);
            const move = (moveEvent: PointerEvent) => {
                scroller.scrollTop = startScroll + (moveEvent.clientY - startY) * ratio;
            };
            const end = () => {
                element.classList.remove('is-dragging');
                element.removeEventListener('pointermove', move);
                show();
            };
            element.addEventListener('pointermove', move);
            element.addEventListener('pointerup', end, { once: true });
            element.addEventListener('pointercancel', end, { once: true });
        };

        source.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', remeasure);
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        element.addEventListener('pointerdown', onPointerDown);
        // Só mudanças de altura interessam: ao recolher a sidebar o painel muda de largura a cada
        // quadro, e remedir ali forçava layout durante toda a transição.
        const heights = new WeakMap<Element, number>();
        const observer = new ResizeObserver((entries) => {
            let changed = false;
            for (const entry of entries) {
                const height = entry.contentRect.height;
                if (heights.get(entry.target) !== height) changed = true;
                heights.set(entry.target, height);
            }
            if (changed) remeasure();
        });
        observer.observe(container ?? document.body);
        for (const child of Array.from(container?.children ?? [])) observer.observe(child);
        measure();
        position();

        return () => {
            source.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', remeasure);
            window.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerdown', onPointerDown);
            observer.disconnect();
            window.clearTimeout(hideTimer);
            cancelAnimationFrame(frame);
        };
    }, [target]);

    return <div ref={thumb} className="scroll-thumb" aria-hidden="true" />;
}
