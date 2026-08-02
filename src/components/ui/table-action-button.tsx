'use client';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';

export function TableActionButton({
    label,
    icon,
    onClick,
}: {
    label: string;
    icon: IconName;
    onClick(): void;
}) {
    return (
        <span className="group/action relative inline-flex">
            <Button
                type="button"
                onClick={onClick}
                aria-label={label}
                className="inline-grid size-8 place-items-center rounded-xl text-muted transition hover:bg-brand-soft/70 hover:text-brand-strong"
            >
                <Icon name={icon} className="size-3.5" />
            </Button>
            <span
                role="tooltip"
                className="product-action-tooltip pointer-events-none absolute bottom-[calc(100%+7px)] right-0 z-20 whitespace-nowrap rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 backdrop-blur-xl transition duration-200 group-hover/action:-translate-y-0.5 group-hover/action:opacity-100 group-focus-within/action:-translate-y-0.5 group-focus-within/action:opacity-100"
            >
                {label}
                <span className="product-action-tooltip-arrow absolute -bottom-1 right-3 size-2 rotate-45" />
            </span>
        </span>
    );
}
