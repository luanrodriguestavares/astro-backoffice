'use client';

import { type FormEvent, type ReactNode, useState } from 'react';
import { flushSync } from 'react-dom';

import { Icon } from '@/components/ui/icon';

export function LoginForm({ action, children }: { action: string; children: ReactNode }) {
    const [pending, setPending] = useState(false);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;

        const form = event.currentTarget;
        flushSync(() => setPending(true));

        // O login usa um POST HTTP tradicional. Adiar a navegação para a próxima tarefa dá ao
        // navegador a oportunidade de pintar o feedback antes de começar a trocar de página.
        window.setTimeout(() => HTMLFormElement.prototype.submit.call(form), 0);
    }

    return (
        <form action={action} method="post" className="mt-7 space-y-4" onSubmit={submit}>
            <fieldset className="contents">
                {children}
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
            </fieldset>
        </form>
    );
}
