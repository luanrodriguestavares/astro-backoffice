'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type AccentTheme = 'astro' | 'blue' | 'violet' | 'yellow' | 'orange' | 'green' | 'rose';

export const accentThemes: {
    value: AccentTheme;
    label: string;
    description: string;
    color: string;
}[] = [
    {
        value: 'astro',
        label: 'Astro',
        description: 'Roxo azulado original',
        color: '#6d5df4',
    },
    { value: 'blue', label: 'Azul', description: 'Limpo e objetivo', color: '#286dcc' },
    { value: 'violet', label: 'Roxo', description: 'Criativo e profundo', color: '#7651d1' },
    { value: 'yellow', label: 'Amarelo', description: 'Quente e energético', color: '#d6a300' },
    { value: 'orange', label: 'Laranja', description: 'Próximo e expressivo', color: '#c4551c' },
    { value: 'green', label: 'Verde', description: 'Calmo e natural', color: '#16815f' },
    { value: 'rose', label: 'Rosa', description: 'Marcante e moderno', color: '#bd416b' },
];

const storageKey = 'astro-accent-theme';
const changeEvent = 'astro-accent-theme-change';

export function AccentThemeController() {
    const accent = useAccentTheme();

    useEffect(() => {
        document.documentElement.dataset.astroAccent = accent;
    }, [accent]);

    return null;
}

export function useAccentTheme(): AccentTheme {
    return useSyncExternalStore(subscribe, currentAccent, () => 'astro');
}

export function setAccentTheme(accent: AccentTheme) {
    window.localStorage.setItem(storageKey, accent);
    document.documentElement.dataset.astroAccent = accent;
    window.dispatchEvent(new Event(changeEvent));
}

function subscribe(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener(changeEvent, onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(changeEvent, onChange);
    };
}

function currentAccent(): AccentTheme {
    const saved = window.localStorage.getItem(storageKey);
    return accentThemes.some((accent) => accent.value === saved) ? (saved as AccentTheme) : 'astro';
}
