import type { IconName } from '@/components/ui/icon';

export type NotificationTone = 'brand' | 'success' | 'warning';

export interface NotificationItem {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    href: string;
    icon: IconName;
    tone: NotificationTone;
}
