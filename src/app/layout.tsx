import type { Metadata } from 'next';

import { AccentThemeController } from '@/components/layout/accent-theme-controller';
import { GuidedTour } from '@/components/layout/guided-tour';
import { ToastViewport } from '@/components/ui/toast';

import 'driver.js/dist/driver.css';
import './globals.css';

export const metadata: Metadata = {
    title: {
        default: 'Astro — Painel',
        template: '%s — Astro',
    },
    description: 'Gerencie sua operação, checkouts e pagamentos no Astro.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="h-full antialiased">
            <body suppressHydrationWarning className="min-h-full">
                {children}
                <GuidedTour />
                <AccentThemeController />
                <ToastViewport />
            </body>
        </html>
    );
}
