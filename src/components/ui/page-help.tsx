'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

export function PageHelp({
    title,
    children,
    trigger = '?',
    align = 'left',
    compact = false,
}: {
    title: string;
    children: React.ReactNode;
    trigger?: '?' | 'i';
    align?: 'left' | 'right';
    compact?: boolean;
}) {
    const root = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }

        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', escape);
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', escape);
        };
    }, []);

    return (
        <div ref={root} className="relative inline-flex">
            <Button
                type="button"
                aria-label={`Ajuda: ${title}`}
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen((current) => !current)}
                className={`glass-panel-soft grid place-items-center rounded-full font-bold text-brand transition hover:-translate-y-0.5 hover:text-brand-strong ${compact ? 'size-5 text-[11px]' : 'size-7 text-[13px]'}`}
            >
                {trigger}
            </Button>
            {open && (
                <section
                    role="dialog"
                    aria-label={title}
                    className={`glass-popover absolute top-[calc(100%+10px)] z-[80] w-[min(360px,calc(100vw-32px))] rounded-[20px] p-4 shadow-[0_22px_65px_rgba(39,33,82,.16)] ${align === 'right' ? 'right-0' : 'left-0'}`}
                >
                    <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
                    <div className="mt-2 text-[12px] leading-5 text-muted">{children}</div>
                </section>
            )}
        </div>
    );
}
