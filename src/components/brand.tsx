import Link from 'next/link';

/*
 * Logo do Astro (public/astro-logo.svg): letras claras para fundo escuro, como a sidebar.
 * Em fundo claro (login, cadastro), `tone="dark"` usa a versão com letras escuras.
 * No modo compacto aparece só a estrela (public/astro-star.svg, o mesmo desenho do logo).
 */
const files = { light: '/astro-logo.svg', dark: '/astro-logo-dark.svg' };

export function Brand({
    compact = false,
    href = '/dashboard',
    tone = 'light',
}: {
    compact?: boolean;
    href?: string;
    /** "light": letras claras (fundo escuro); "dark": letras escuras (fundo claro). */
    tone?: 'light' | 'dark';
}) {
    const src = files[tone];
    return (
        <Link href={href} className="inline-flex items-center" aria-label="Astro">
            {compact ? (
                // eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem otimização
                <img src="/astro-star.svg" alt="Astro" width={28} height={28} className="size-7" />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem otimização
                <img src={src} alt="Astro" width={120} height={28} className="h-7 w-auto" />
            )}
        </Link>
    );
}
