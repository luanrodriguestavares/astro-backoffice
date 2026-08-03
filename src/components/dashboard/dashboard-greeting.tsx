'use client';

import { useSyncExternalStore } from 'react';

const minute = 60_000;

function subscribe(onStoreChange: () => void) {
    const interval = window.setInterval(onStoreChange, minute);
    window.addEventListener('focus', onStoreChange);
    return () => {
        window.clearInterval(interval);
        window.removeEventListener('focus', onStoreChange);
    };
}

function clientHour() {
    return new Date().getHours();
}

export function DashboardGreeting({ name, initialHour }: { name: string; initialHour: number }) {
    const hour = useSyncExternalStore(subscribe, clientHour, () => initialHour);
    return <>{greeting(hour)}, {name}</>;
}

function greeting(hour: number) {
    if (hour < 5) return 'Boa madrugada';
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}
