import Link, { type LinkProps } from 'next/link';
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'unstyled' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';

const variants: Record<ButtonVariant, string> = {
    unstyled: '',
    primary:
        'dashboard-primary-action glass-interactive group inline-flex h-11 transform-gpu items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-brand-contrast transition duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.99]',
    secondary:
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-[var(--control-bg)] px-5 text-[13px] font-semibold text-muted hover:bg-surface-muted hover:text-foreground',
    ghost: 'inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-[12px] font-semibold text-muted hover:bg-surface-muted hover:text-foreground',
    danger: 'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#f2cbd0] px-3 text-[12px] font-semibold text-danger hover:bg-[#fff0f2]',
    icon: 'inline-grid size-9 place-items-center rounded-full border border-border bg-[var(--control-bg)] text-muted hover:bg-surface-muted hover:text-foreground',
};

export function buttonClassName(variant: ButtonVariant = 'unstyled', className = '') {
    return `ui-button ${variants[variant]} ${className}`;
}

export const Button = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ variant = 'unstyled', className = '', ...props }, ref) {
    return (
        <button
            ref={ref}
            data-variant={variant}
            className={buttonClassName(variant, className)}
            {...props}
        />
    );
});

export function ButtonLink({
    variant = 'primary',
    className = '',
    ...props
}: LinkProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
        variant?: ButtonVariant;
    }) {
    return (
        <Link data-variant={variant} className={buttonClassName(variant, className)} {...props} />
    );
}
