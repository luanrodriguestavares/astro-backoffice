import Link, { type LinkProps } from 'next/link';
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'unstyled' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';

const variants: Record<ButtonVariant, string> = {
    unstyled: '',
    primary:
        'dashboard-primary-action glass-interactive group inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(to_right,var(--brand),var(--brand-strong))] px-5 text-[13px] font-semibold text-white transition duration-300 hover:-translate-y-0.5',
    secondary:
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-[var(--control-bg)] px-5 text-[13px] font-semibold text-muted hover:border-brand/24 hover:bg-surface-muted/55 hover:text-foreground',
    ghost: 'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[12px] font-semibold text-brand-strong hover:bg-brand-soft',
    danger: 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#f2cbd0] px-3 text-[12px] font-semibold text-danger hover:bg-[#fff0f2]',
    icon: 'inline-grid size-9 place-items-center rounded-full border border-border bg-[var(--control-bg)] text-muted hover:border-brand/24 hover:bg-surface-muted/55 hover:text-foreground',
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
