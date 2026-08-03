'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function AuthToast({
    message,
    tone = 'error',
}: {
    message?: string;
    tone?: 'error' | 'info';
}) {
    const [visible, setVisible] = useState(Boolean(message));

    useEffect(() => {
        if (!message) return;
        const timeout = window.setTimeout(() => {
            setVisible(false);
            clearAuthFeedbackFromUrl();
        }, 4_500);
        return () => window.clearTimeout(timeout);
    }, [message]);

    function close() {
        setVisible(false);
        clearAuthFeedbackFromUrl();
    }

    if (!message || !visible) return null;
    const error = tone === 'error';
    return (
        <div
            role={error ? 'alert' : 'status'}
            aria-live={error ? 'assertive' : 'polite'}
            className="roadmap-toast fixed right-4 top-4 z-[170] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e7e5ef] bg-white/96 shadow-[0_22px_65px_rgba(31,27,60,.18)] backdrop-blur-xl sm:right-6 sm:top-6"
        >
            <div className="flex items-start gap-3.5 p-4 pr-3">
                <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                        error ? 'bg-danger/10 text-danger' : 'bg-brand-soft text-brand-strong'
                    }`}
                >
                    <Icon name={error ? 'close' : 'clock'} className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[12px] font-semibold text-[#24253c]">
                        {error ? 'Não foi possível continuar' : 'Tudo certo'}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-[#74758a]">{message}</p>
                </div>
                <Button
                    type="button"
                    aria-label="Fechar aviso"
                    onClick={close}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-[#74758a] transition hover:bg-[#f1f1f7] hover:text-[#24253c]"
                >
                    <Icon name="close" className="size-3.5" />
                </Button>
            </div>
            <span
                className={`roadmap-toast-progress block h-0.5 origin-left ${
                    error ? 'bg-danger' : 'bg-brand'
                }`}
            />
        </div>
    );
}

function clearAuthFeedbackFromUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    url.searchParams.delete('expired');
    url.searchParams.delete('message');
    window.history.replaceState(window.history.state, '', url);
}
