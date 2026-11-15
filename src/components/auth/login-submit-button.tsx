'use client';

import { useFormStatus } from 'react-dom';

import { Icon } from '@/components/ui/icon';

export function LoginSubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            className="auth-cta !mt-6 disabled:cursor-wait disabled:opacity-80"
            disabled={pending}
            aria-busy={pending}
        >
            {pending ? (
                <>
                    <span
                        aria-hidden="true"
                        className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent"
                    />
                    <span aria-live="polite">Entrando...</span>
                </>
            ) : (
                <>
                    Entrar no Astro
                    <Icon name="arrow-right" className="size-[18px]" />
                </>
            )}
        </button>
    );
}
