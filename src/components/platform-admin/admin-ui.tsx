import type { IconName } from '@/components/ui/icon';
import { Icon } from '@/components/ui/icon';

export function AdminMetric({
    label,
    value,
    detail,
    icon,
    tone = 'brand',
}: {
    label: string;
    value: string | number;
    detail: string;
    icon: IconName;
    tone?: 'brand' | 'success' | 'warning' | 'danger';
}) {
    const tones = {
        brand: 'bg-brand-soft text-brand-strong',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-danger/10 text-danger',
    };
    return (
        <article className="glass-panel rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-muted">{label}</p>
                    <p className="mt-2 text-[27px] font-semibold tracking-[-.055em]">{value}</p>
                </div>
                <span className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}>
                    <Icon name={icon} className="size-4" />
                </span>
            </div>
            <p className="mt-3 text-[11px] text-muted">{detail}</p>
        </article>
    );
}

export function AdminBadge({
    status,
    children,
}: {
    status: string;
    children?: React.ReactNode;
}) {
    const good = ['active', 'approved', 'published', 'trialing'].includes(status);
    const bad = ['blocked', 'suspended', 'closed', 'canceled'].includes(status);
    const warning = ['past_due', 'pending', 'invited'].includes(status);
    return (
        <span
            className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.06em] ${
                good
                    ? 'bg-success/10 text-success'
                    : bad
                      ? 'bg-danger/10 text-danger'
                      : warning
                        ? 'bg-warning/10 text-warning'
                        : 'bg-surface-muted text-muted'
            }`}
        >
            {children ?? statusLabel(status)}
        </span>
    );
}

export function AdminEmpty({ title, description }: { title: string; description: string }) {
    return (
        <div className="grid min-h-56 place-items-center p-8 text-center">
            <div>
                <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                    <Icon name="search" className="size-4" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-[12px] text-muted">{description}</p>
            </div>
        </div>
    );
}

export function formatAdminDate(value: string | null, withTime = false) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(new Date(value));
}

export function formatPlanName(code: string | null) {
    if (!code) return 'Sem plano';
    const labels: Record<string, string> = {
        essential: 'Essencial',
        pro: 'Pro',
        enterprise: 'Enterprise',
    };
    return labels[code] ?? code;
}

export function statusLabel(status: string) {
    const labels: Record<string, string> = {
        active: 'Ativo',
        suspended: 'Suspensa',
        blocked: 'Bloqueado',
        invited: 'Convidado',
        trialing: 'Em teste',
        past_due: 'Pagamento pendente',
        canceled: 'Cancelado',
        pending: 'Em análise',
        approved: 'Aprovado',
        archived: 'Arquivado',
    };
    return labels[status] ?? status.replaceAll('_', ' ');
}
