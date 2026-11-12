import { Manrope, Sora } from 'next/font/google';

// Mesmas fontes da landing: títulos em Sora e textos em Manrope.
const display = Sora({
    subsets: ['latin'],
    weight: ['600', '700', '800'],
    variable: '--font-auth-display',
});
const text = Manrope({ subsets: ['latin'], variable: '--font-auth-text' });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main
            className={`astro-light-scope auth-typography min-h-screen bg-background ${display.variable} ${text.variable}`}
        >
            {children}
        </main>
    );
}
