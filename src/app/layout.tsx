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
        <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
            </head>
            <body suppressHydrationWarning className="min-h-full">
                {children}
                <GuidedTour />
                <AccentThemeController />
                <ToastViewport />
            </body>
        </html>
    );
}

const themeInitializer = `(function(){try{var root=document.documentElement;var dark=localStorage.getItem('astro-dashboard-theme')!=='light';var accent=localStorage.getItem('astro-accent-theme');var accents=['astro','blue','violet','yellow','orange','green','rose'];root.classList.toggle('dashboard-dark',dark);root.classList.toggle('astro-dark-portals',dark);root.dataset.astroAccent=accents.indexOf(accent)>-1?accent:'astro';root.dataset.astroThemeReady='true'}catch(_){}})()`;
