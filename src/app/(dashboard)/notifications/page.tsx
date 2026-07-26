import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { getRecentNotifications } from '@/lib/notifications/server';
import type { NotificationTone } from '@/lib/notifications/types';

const toneClasses: Record<NotificationTone, string> = {
    brand: 'bg-brand-soft text-brand',
    success: 'bg-[#e8f7f1] text-success',
    warning: 'bg-[#fff5e9] text-warning',
};

export default async function NotificationsPage() {
    const notifications = await getRecentNotifications(50);

    return (
        <>
            <PageHeader
                eyebrow="Atividade"
                title="Notificações"
                description="Acompanhe as atualizações recentes da sua operação."
            />
            <section className="glass-panel overflow-hidden rounded-[28px]">
                {notifications.length ? (
                    <div className="grid gap-1 p-3 sm:p-4">
                        {notifications.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-start gap-3 rounded-2xl px-3 py-4 transition hover:bg-white/40"
                            >
                                <span
                                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClasses[item.tone]}`}
                                >
                                    <Icon name={item.icon} className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[13px] font-semibold">
                                        {item.title}
                                    </span>
                                    <span className="mt-1 block text-[12px] text-muted">
                                        {item.description}
                                    </span>
                                </span>
                                <time
                                    dateTime={item.createdAt}
                                    className="shrink-0 text-[11px] text-muted"
                                >
                                    {formatDate(item.createdAt)}
                                </time>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="px-5 py-16 text-center">
                        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/70 text-brand">
                            <Icon name="bell" className="size-5" />
                        </span>
                        <h2 className="mt-4 text-sm font-semibold">Nenhuma notificação recente</h2>
                        <p className="mt-1 text-[12px] text-muted">
                            Pagamentos, checkouts e outras atualizações aparecerão aqui.
                        </p>
                    </div>
                )}
            </section>
        </>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
