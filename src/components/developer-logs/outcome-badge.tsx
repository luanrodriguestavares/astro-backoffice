import { outcomeLabels, outcomeTones } from '@/lib/developer-logs/format';
import type { LogOutcome } from '@/lib/developer-logs/types';

export function OutcomeBadge({ outcome, label }: { outcome: LogOutcome; label?: string }) {
    return (
        <span
            className={`inline-flex w-fit shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${outcomeTones[outcome]}`}
        >
            {label ?? outcomeLabels[outcome]}
        </span>
    );
}

/** Mapeia status de entrega/processamento para o mesmo vocabulário visual da timeline. */
export function statusOutcome(status: string): LogOutcome {
    if (['delivered', 'processed', 'approved', 'succeeded'].includes(status)) return 'success';
    if (['dead_letter', 'failed'].includes(status)) return 'failure';
    if (['pending', 'delivering'].includes(status)) return 'warning';
    return 'info';
}

export const statusLabels: Record<string, string> = {
    pending: 'Na fila',
    delivering: 'Enviando',
    delivered: 'Entregue',
    failed: 'Falhou; nova tentativa agendada',
    dead_letter: 'Falha definitiva',
    processed: 'Processado',
    ignored: 'Ignorado',
};
