import Link from 'next/link';

export function Brand({ compact = false, href = '/dashboard' }: { compact?: boolean; href?: string }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Astro">
            <span className="grid size-9 place-items-center text-brand drop-shadow-[0_6px_12px_rgba(109,93,244,.22)]">
                <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 fill-current">
                    <path d="M16 1.8c.7 8.8 5.4 13.5 14.2 14.2C21.4 16.7 16.7 21.4 16 30.2 15.3 21.4 10.6 16.7 1.8 16 10.6 15.3 15.3 10.6 16 1.8Z" />
                </svg>
            </span>
            {!compact && (
                <span className="text-xl font-bold tracking-[-0.055em] text-[#17182f]">Astro</span>
            )}
        </Link>
    );
}
