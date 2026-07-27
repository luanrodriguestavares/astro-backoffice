'use client';

import { useSyncExternalStore } from 'react';

import {
    accentThemes,
    setAccentTheme,
    useAccentTheme,
} from '@/components/layout/accent-theme-controller';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';

type DashboardTheme = 'light' | 'dark';

const themeStorageKey = 'astro-dashboard-theme';
const themeChangeEvent = 'astro-dashboard-theme-change';

export function AppearancePreferences() {
    const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => 'dark');
    const accent = useAccentTheme();

    function chooseTheme(next: DashboardTheme) {
        window.localStorage.setItem(themeStorageKey, next);
        window.dispatchEvent(new Event(themeChangeEvent));
        showToast({
            tone: 'success',
            title: 'Tema atualizado',
            description: `O painel agora usa o tema ${next === 'dark' ? 'escuro' : 'claro'}.`,
        });
    }

    function chooseAccent(next: (typeof accentThemes)[number]['value']) {
        setAccentTheme(next);
        const selected = accentThemes.find((item) => item.value === next);
        showToast({
            tone: 'success',
            title: 'Cor de destaque atualizada',
            description: `${selected?.label ?? 'A nova cor'} foi aplicada ao painel.`,
        });
    }

    return (
        <section className="glass-panel rounded-[28px] p-6 xl:col-span-2">
            <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[13px] border border-white/80 bg-brand-soft/75 text-brand">
                    <Icon name="sun" className="size-4" />
                </span>
                <div>
                    <h2 className="text-sm font-semibold tracking-[-0.02em]">Aparência</h2>
                    <p className="mt-1 text-[12px] text-muted">
                        Escolha como o Astro deve aparecer para você neste dispositivo
                    </p>
                </div>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div>
                    <p className="text-[12px] font-semibold">Tema do painel</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                            { value: 'light' as const, label: 'Claro', icon: 'sun' as const },
                            { value: 'dark' as const, label: 'Escuro', icon: 'moon' as const },
                        ].map((option) => (
                            <Button
                                key={option.value}
                                type="button"
                                aria-pressed={theme === option.value}
                                onClick={() => chooseTheme(option.value)}
                                className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-[12px] font-semibold transition ${
                                    theme === option.value
                                        ? 'border-brand/35 bg-brand-soft text-brand-strong shadow-[0_0_0_2px_color-mix(in_srgb,var(--brand)_8%,transparent)]'
                                        : 'border-border bg-[var(--control-bg)] text-muted hover:border-brand/20 hover:text-foreground'
                                }`}
                            >
                                <Icon name={option.icon} className="size-3.5" />
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[12px] font-semibold">Cor de destaque</p>
                    <p className="mt-1 text-[10px] text-muted">
                        A cor altera botões, links, seleções e elementos ativos.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {accentThemes.map((option) => (
                            <Button
                                key={option.value}
                                type="button"
                                aria-pressed={accent === option.value}
                                onClick={() => chooseAccent(option.value)}
                                className={`flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                    accent === option.value
                                        ? 'border-brand/35 bg-brand-soft/65 shadow-[0_0_0_2px_color-mix(in_srgb,var(--brand)_8%,transparent)]'
                                        : 'border-border bg-[var(--control-bg)] hover:border-brand/20'
                                }`}
                            >
                                <span
                                    className="grid size-8 shrink-0 place-items-center rounded-xl shadow-[inset_0_0_0_1px_rgb(255_255_255_/_22%)]"
                                    style={{ backgroundColor: option.color }}
                                >
                                    {accent === option.value && (
                                        <Icon name="check" className="size-3.5 text-white" />
                                    )}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[11px] font-semibold">
                                        {option.label}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[9px] text-muted">
                                        {option.description}
                                    </span>
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function subscribeTheme(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener(themeChangeEvent, onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(themeChangeEvent, onChange);
    };
}

function currentTheme(): DashboardTheme {
    return window.localStorage.getItem(themeStorageKey) === 'light' ? 'light' : 'dark';
}
