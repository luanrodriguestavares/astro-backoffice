import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'unstyled' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';

const variants: Record<ButtonVariant, string> = {
    unstyled: '',
    primary:
        'glass-interactive inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] hover:-translate-y-0.5 hover:bg-brand-strong',
    secondary:
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d9d7e8] bg-white/70 px-5 text-[13px] font-semibold text-muted hover:bg-white hover:text-foreground',
    ghost: 'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[12px] font-semibold text-brand-strong hover:bg-brand-soft',
    danger: 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#f2cbd0] px-3 text-[12px] font-semibold text-danger hover:bg-[#fff0f2]',
    icon: 'inline-grid size-9 place-items-center rounded-full border border-[#dedbea] bg-white text-muted hover:bg-white hover:text-foreground',
};

export const Button = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ variant = 'unstyled', className = '', ...props }, ref) {
    return (
        <button
            ref={ref}
            data-variant={variant}
            className={`ui-button ${variants[variant]} ${className}`}
            {...props}
        />
    );
});
