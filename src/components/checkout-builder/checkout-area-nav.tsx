import Link from 'next/link';

import { Icon, type IconName } from '@/components/ui/icon';

type CheckoutArea = 'checkouts' | 'templates' | 'analytics';

const areas: { id: CheckoutArea; href: string; label: string; icon: IconName }[] = [
    { id: 'checkouts', href: '/checkouts', label: 'Meus checkouts', icon: 'layout' },
    { id: 'templates', href: '/checkouts/templates', label: 'Templates de funil', icon: 'layers' },
    { id: 'analytics', href: '/checkouts/analytics', label: 'Analytics de funis', icon: 'chart' },
];

/** Uma área de Checkouts: lista, templates e analytics como abas da mesma tela. */
export function CheckoutAreaNav({
    active,
    canReadAnalytics = true,
}: {
    active: CheckoutArea;
    canReadAnalytics?: boolean;
}) {
    return (
        <nav className="mb-4 flex w-fit items-center gap-1 rounded-2xl border border-border bg-surface/80 p-1 shadow-sm" aria-label="Área de checkouts">
            {areas
                .filter((area) => area.id !== 'analytics' || canReadAnalytics)
                .map((area) => (
                    <Link
                        key={area.id}
                        href={area.href}
                        aria-current={active === area.id ? 'page' : undefined}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition ${active === area.id ? 'bg-foreground text-background shadow-sm' : 'text-muted hover:bg-surface-muted hover:text-foreground'}`}
                    >
                        <Icon name={area.icon} className="size-4" /> {area.label}
                    </Link>
                ))}
        </nav>
    );
}
