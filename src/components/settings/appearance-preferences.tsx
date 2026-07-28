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

const themeOptions = [
    {
        value: 'light' as const,
        label: 'Claro',
        description: 'Superficies claras e leitura diurna.',
        icon: 'sun' as const,
    },
    {
        value: 'dark' as const,
        label: 'Escuro',
        description: 'Menos brilho e foco em ambientes escuros.',
        icon: 'moon' as const,
    },
];

export function AppearancePreferences() {
    const theme = useSyncExternalStore<DashboardTheme>(subscribeTheme, currentTheme, () => 'dark');
    const accent = useAccentTheme();
    const selectedAccent = accentThemes.find((item) => item.value === accent) ?? accentThemes[0];

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
        <section className="glass-panel overflow-hidden rounded-[28px] xl:col-span-2">
            <div className="flex flex-col gap-5 border-b border-white/60 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-brand/20 bg-brand-soft/75 text-brand shadow-[inset_0_1px_0_color-mix(in_srgb,var(--brand)_10%,transparent)]">
                        <Icon name={theme === 'dark' ? 'moon' : 'sun'} className="size-[18px]" />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold tracking-[-0.02em]">Aparencia</h2>
                        <p className="mt-1 text-[12px] text-muted">
                            Ajustes visuais deste dispositivo
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-white/75 bg-white/45 px-3 text-[11px] font-semibold text-muted">
                        <Icon name={theme === 'dark' ? 'moon' : 'sun'} className="size-3.5" />
                        {theme === 'dark' ? 'Escuro' : 'Claro'}
                    </span>
                    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-white/75 bg-white/45 px-3 text-[11px] font-semibold text-muted">
                        <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: selectedAccent.color }}
                        />
                        {selectedAccent.label}
                    </span>
                </div>
            </div>

            <div className="grid lg:grid-cols-[minmax(260px,.78fr)_minmax(0,1.22fr)]">
                <ThemePreview theme={theme} accentColor={selectedAccent.color} />

                <div className="space-y-6 p-5 sm:p-6">
                    <div>
                        <p className="text-[12px] font-semibold">Tema do painel</p>
                        <p className="mt-1 text-[11px] leading-4 text-muted">
                            Escolha contraste e luminosidade da interface.
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {themeOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={theme === option.value}
                                    onClick={() => chooseTheme(option.value)}
                                    className={`group flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition ${
                                        theme === option.value
                                            ? 'border-brand/40 bg-brand-soft/72 text-brand-strong shadow-[0_12px_30px_color-mix(in_srgb,var(--brand)_12%,transparent)]'
                                            : 'border-border bg-[var(--control-bg)] text-foreground hover:border-brand/24 hover:bg-surface-muted/55'
                                    }`}
                                >
                                    <span
                                        className={`grid size-10 shrink-0 place-items-center rounded-xl border ${
                                            theme === option.value
                                                ? 'border-brand/20 bg-white/55 text-brand-strong'
                                                : 'border-border bg-surface-muted/45 text-muted group-hover:text-brand'
                                        }`}
                                    >
                                        <Icon name={option.icon} className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                                            {option.label}
                                            {theme === option.value && (
                                                <Icon name="check" className="size-3.5" />
                                            )}
                                        </span>
                                        <span className="mt-1.5 block text-[11px] leading-4 text-muted">
                                            {option.description}
                                        </span>
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[12px] font-semibold">Cor de destaque</p>
                        <p className="mt-1 text-[11px] leading-4 text-muted">
                            Afeta botoes, links, selecao e estados ativos.
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {accentThemes.map((option) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    aria-label={`Usar cor ${option.label}`}
                                    aria-pressed={accent === option.value}
                                    onClick={() => chooseAccent(option.value)}
                                    className={`flex min-h-[74px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                        accent === option.value
                                            ? 'border-brand/42 bg-brand-soft/68 shadow-[0_10px_26px_color-mix(in_srgb,var(--brand)_10%,transparent)]'
                                            : 'border-border bg-[var(--control-bg)] hover:border-brand/24 hover:bg-surface-muted/55'
                                    }`}
                                >
                                    <span
                                        className="relative grid size-10 shrink-0 place-items-center rounded-2xl shadow-[inset_0_0_0_1px_rgb(255_255_255_/_25%),0_8px_18px_rgb(35_31_68_/_10%)]"
                                        style={{ backgroundColor: option.color }}
                                    >
                                        {accent === option.value && (
                                            <span className="grid size-5 place-items-center rounded-full bg-white text-[var(--brand)] shadow-sm">
                                                <Icon name="check" className="size-3" />
                                            </span>
                                        )}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[12px] font-semibold">
                                            {option.label}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[10px] text-muted">
                                            {option.description}
                                        </span>
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ThemePreview({ theme, accentColor }: { theme: DashboardTheme; accentColor: string }) {
    const dark = theme === 'dark';

    return (
        <div className="border-b border-white/60 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:border-white/60">
            <div
                className={`overflow-hidden rounded-[24px] border p-3 shadow-[0_22px_60px_rgba(34,30,70,.14)] ${
                    dark
                        ? 'border-white/10 bg-[#18191d] text-white'
                        : 'border-white/80 bg-[#f8f8fc] text-[#24253c]'
                }`}
            >
                <div
                    className={`flex items-center justify-between rounded-2xl px-3 py-2 ${
                        dark ? 'bg-white/[.06]' : 'bg-white/80'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: accentColor }}
                        />
                        <span className="text-[10px] font-semibold">Astro</span>
                    </div>
                    <span
                        className={`size-6 rounded-full ${dark ? 'bg-white/10' : 'bg-[#ececf6]'}`}
                    />
                </div>
                <div className="mt-3 grid grid-cols-[72px_1fr] gap-3">
                    <div
                        className={`space-y-2 rounded-2xl p-2 ${
                            dark ? 'bg-white/[.045]' : 'bg-white/70'
                        }`}
                    >
                        <span
                            className="block h-2 rounded-full"
                            style={{ backgroundColor: accentColor }}
                        />
                        <span
                            className={`block h-2 rounded-full ${
                                dark ? 'bg-white/18' : 'bg-[#deddee]'
                            }`}
                        />
                        <span
                            className={`block h-2 rounded-full ${
                                dark ? 'bg-white/10' : 'bg-[#e8e7f2]'
                            }`}
                        />
                        <span
                            className={`block h-2 rounded-full ${
                                dark ? 'bg-white/10' : 'bg-[#e8e7f2]'
                            }`}
                        />
                    </div>
                    <div className="space-y-3">
                        <div
                            className={`rounded-2xl p-3 ${
                                dark ? 'bg-white/[.055]' : 'bg-white/82'
                            }`}
                        >
                            <span
                                className={`block h-2 w-20 rounded-full ${
                                    dark ? 'bg-white/18' : 'bg-[#d9d7e8]'
                                }`}
                            />
                            <span
                                className="mt-3 block h-8 rounded-xl"
                                style={{ backgroundColor: accentColor }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span
                                className={`h-14 rounded-2xl ${
                                    dark ? 'bg-white/[.055]' : 'bg-white/82'
                                }`}
                            />
                            <span
                                className={`h-14 rounded-2xl ${
                                    dark ? 'bg-white/[.055]' : 'bg-white/82'
                                }`}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-muted">
                Previa aproximada da combinacao aplicada ao dashboard.
            </p>
        </div>
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
