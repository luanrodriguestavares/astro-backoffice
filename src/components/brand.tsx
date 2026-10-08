import Image from 'next/image';
import Link from 'next/link';

export function Brand({
    compact = false,
    href = '/dashboard',
}: {
    compact?: boolean;
    href?: string;
}) {
    return (
        <Link href={href} className="inline-flex items-center" aria-label="Astro">
            {/* No modo compacto, recorta só o ícone (a estrela ocupa o quadrado inicial do SVG). */}
            <span className={`block h-10 overflow-hidden ${compact ? 'w-10' : 'w-[119px]'}`}>
                <Image
                    src="/logo_black.svg"
                    alt="Astro"
                    width={1089}
                    height={366}
                    priority
                    className="h-10 w-auto max-w-none"
                />
            </span>
        </Link>
    );
}
