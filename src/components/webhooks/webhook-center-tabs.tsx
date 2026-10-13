import Link from 'next/link';

import { Icon, type IconName } from '@/components/ui/icon';

export type WebhookView = 'configuration' | 'sent' | 'received';

const tabs: { view: WebhookView; label: string; icon: IconName }[] = [
    { view: 'configuration', label: 'Endpoints', icon: 'settings' },
    { view: 'sent', label: 'Envios', icon: 'arrow-up' },
    { view: 'received', label: 'Recebimentos', icon: 'download' },
];

export function WebhookCenterTabs({ active }: { active: WebhookView }) {
    return (
        <nav
            role="tablist"
            aria-label="Central de webhooks"
            className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
        >
            {tabs.map((tab) => (
                <Link
                    key={tab.view}
                    role="tab"
                    aria-selected={tab.view === active}
                    href={`/webhooks?view=${tab.view}`}
                    className={`relative flex shrink-0 items-center gap-2 px-3 py-3 text-[13px] font-semibold transition ${tab.view === active ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
                >
                    <Icon name={tab.icon} className="size-3.5" />
                    {tab.label}
                    {tab.view === active && (
                        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />
                    )}
                </Link>
            ))}
        </nav>
    );
}
