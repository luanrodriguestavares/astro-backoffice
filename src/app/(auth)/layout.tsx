import { Inter, Manrope } from 'next/font/google';

// Títulos em Manrope e textos em Inter, só nas telas de autenticação.
const display = Manrope({
    subsets: ['latin'],
    weight: ['600', '700', '800'],
    variable: '--font-auth-display',
});
const text = Inter({ subsets: ['latin'], variable: '--font-auth-text' });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main
            className={`astro-light-scope auth-typography min-h-screen bg-background ${display.variable} ${text.variable}`}
        >
            {children}
        </main>
    );
}
