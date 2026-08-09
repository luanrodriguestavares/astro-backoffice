'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function Modal({
    open,
    onClose,
    children,
    labelledBy,
    maxWidth = 'max-w-2xl',
}: {
    open: boolean;
    onClose(): void;
    children: ReactNode;
    labelledBy: string;
    maxWidth?: string;
}) {
    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose, open]);

    if (!open) return null;
    return createPortal(
        <div
            className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                className={`theme-modal modal-surface glass-panel flex max-h-[min(720px,calc(100dvh-2rem))] w-full flex-col overflow-hidden rounded-[24px] shadow-[0_32px_100px_rgba(37,31,76,.22)] ${maxWidth}`}
            >
                {children}
            </section>
        </div>,
        document.body,
    );
}

export function ModalHeader({
    eyebrow,
    title,
    description,
    titleId,
    onClose,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    titleId: string;
    onClose(): void;
}) {
    return (
        <div className="shrink-0 flex items-start justify-between gap-5 border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
                {eyebrow && (
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                        {eyebrow}
                    </p>
                )}
                <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1.5 text-[13px] leading-5 text-muted">{description}</p>
                )}
            </div>
            <Button type="button" variant="icon" aria-label="Fechar" onClick={onClose}>
                <Icon name="close" className="size-4" />
            </Button>
        </div>
    );
}

export function ModalBody({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 ${className}`}>
            {children}
        </div>
    );
}

export function ModalFooter({ children }: { children: ReactNode }) {
    return (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border/70 px-5 py-4 sm:px-6">
            {children}
        </div>
    );
}
