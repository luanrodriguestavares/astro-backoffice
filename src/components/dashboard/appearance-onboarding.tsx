'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
    accentThemes,
    setAccentTheme,
    type AccentTheme,
} from '@/components/layout/accent-theme-controller';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import type { Organization } from '@/lib/api/types';

type DashboardTheme = 'light' | 'dark';

const themeStorageKey = 'astro-dashboard-theme';
const themeChangeEvent = 'astro-dashboard-theme-change';

export function AppearanceOnboarding({
    open,
    organization,
    verification,
}: {
    open: boolean;
    organization: Organization;
    verification: string | null;
}) {
    const router = useRouter();
    const [theme, setTheme] = useState<DashboardTheme>('dark');
    const [accent, setAccent] = useState<AccentTheme>(organization.accentTheme ?? 'astro');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    function chooseTheme(next: DashboardTheme) {
        setTheme(next);
        window.localStorage.setItem(themeStorageKey, next);
        window.dispatchEvent(new Event(themeChangeEvent));
    }

    function chooseAccent(next: AccentTheme) {
        setAccent(next);
        setAccentTheme(next);
    }

    async function complete() {
        setSaving(true);
        setError('');
        const response = await fetch('/api/settings/organization', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ accentTheme: accent, version: organization.version }),
        });
        setSaving(false);
        if (!response.ok) {
            const payload = (await response.json()) as { detail?: string };
            setError(payload.detail ?? 'Não foi possível salvar a aparência da workspace.');
            return;
        }
        router.replace('/dashboard');
        router.refresh();
    }

    return (
        <Modal open={open} onClose={() => undefined} labelledBy="appearance-onboarding-title">
            <div className="text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand shadow-[0_12px_30px_color-mix(in_srgb,var(--brand)_15%,transparent)]">
                    <Icon name="bolt" className="size-5" />
                </span>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-strong">
                    Sua estação está pronta
                </p>
                <h2
                    id="appearance-onboarding-title"
                    className="mt-2 text-2xl font-semibold tracking-[-0.045em]"
                >
                    Deixe o Astro com a cara da sua operação
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-[12px] leading-5 text-muted">
                    Escolha seu conforto visual e a cor que representará esta workspace.
                </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-[.8fr_1.2fr]">
                <div>
                    <p className="text-[11px] font-semibold">Seu tema</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted">
                        Esta escolha fica somente neste dispositivo.
                    </p>
                    <div className="mt-3 grid gap-2">
                        {(['light', 'dark'] as const).map((option) => (
                            <Button
                                key={option}
                                type="button"
                                aria-pressed={theme === option}
                                onClick={() => chooseTheme(option)}
                                className={`flex h-14 items-center gap-3 rounded-2xl border px-4 text-left transition ${
                                    theme === option
                                        ? 'border-brand/40 bg-brand-soft/70 text-brand-strong'
                                        : 'border-border bg-[var(--control-bg)] hover:border-brand/25'
                                }`}
                            >
                                <Icon
                                    name={option === 'light' ? 'sun' : 'moon'}
                                    className="size-4"
                                />
                                <span className="flex-1 text-[12px] font-semibold">
                                    {option === 'light' ? 'Claro' : 'Escuro'}
                                </span>
                                {theme === option && <Icon name="check" className="size-3.5" />}
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[11px] font-semibold">Cor da workspace</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted">
                        Administradores definem esta identidade para toda a equipe.
                    </p>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        {accentThemes.map((option) => (
                            <Button
                                key={option.value}
                                type="button"
                                title={option.label}
                                aria-label={`Usar cor ${option.label}`}
                                aria-pressed={accent === option.value}
                                onClick={() => chooseAccent(option.value)}
                                className={`group grid min-h-[72px] place-items-center rounded-2xl border p-2 transition ${
                                    accent === option.value
                                        ? 'border-brand/45 bg-brand-soft/65 shadow-[0_10px_24px_color-mix(in_srgb,var(--brand)_12%,transparent)]'
                                        : 'border-border bg-[var(--control-bg)] hover:border-brand/25'
                                }`}
                            >
                                <span
                                    className="grid size-8 place-items-center rounded-xl shadow-sm"
                                    style={{ backgroundColor: option.color }}
                                >
                                    {accent === option.value && (
                                        <Icon name="check" className="size-3.5 text-white" />
                                    )}
                                </span>
                                <span className="mt-1 text-[9px] font-semibold">
                                    {option.label}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {verification && (
                <p className="mt-5 rounded-xl bg-brand-soft/45 px-3 py-2.5 text-center text-[10px] leading-4 text-muted">
                    {verification === 'sent'
                        ? 'Enviamos um link para confirmar seu e-mail. Você pode continuar configurando sua operação.'
                        : 'Sua conta foi criada. Depois, reenvie a confirmação pela área da conta.'}
                </p>
            )}
            {error && <p className="mt-4 text-center text-[11px] text-danger">{error}</p>}

            <div className="mt-6 flex justify-center">
                <Button
                    type="button"
                    variant="primary"
                    disabled={saving}
                    onClick={complete}
                    className="min-w-56"
                >
                    {saving ? 'Preparando...' : 'Entrar na minha estação'}
                    {!saving && <Icon name="arrow-right" className="size-4" />}
                </Button>
            </div>
        </Modal>
    );
}
