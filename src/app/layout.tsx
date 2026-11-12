import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';

import { GuidedTour } from '@/components/layout/guided-tour';
import { ScrollThumb } from '@/components/ui/scroll-thumb';
import { ToastViewport } from '@/components/ui/toast';

import 'driver.js/dist/driver.css';
import './globals.css';

// Fontes da landing: Sora nos títulos e Manrope no texto.
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

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
        <html
            lang="pt-BR"
            className={`h-full antialiased ${sora.variable} ${manrope.variable}`}
            suppressHydrationWarning
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
            </head>
            <body suppressHydrationWarning className="min-h-full">
                {children}
                <GuidedTour />
                <ToastViewport />
                <ScrollThumb />
            </body>
        </html>
    );
}

const themeInitializer = `(function(){try{var root=document.documentElement;var dark=localStorage.getItem('astro-dashboard-theme')!=='light';root.classList.toggle('dashboard-dark',dark);root.classList.toggle('astro-dark-portals',dark);root.dataset.astroThemeReady='true'}catch(_){}})()`;
