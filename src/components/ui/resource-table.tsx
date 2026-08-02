import { Icon, type IconName } from '@/components/ui/icon';
import { ResourceTableControls } from '@/components/ui/resource-table-controls';

type ResourceValue = string | number | boolean | null | undefined;

export type ResourceColumn<T> = {
    label: string;
    value: (row: T) => ResourceValue;
    render?: (row: T) => React.ReactNode;
    mono?: boolean;
};

export function ResourceTable<T>({
    rows,
    columns,
    empty,
    title,
    description,
    searchable = true,
}: {
    rows: T[];
    columns: ResourceColumn<T>[];
    empty: string;
    title?: string;
    description?: string;
    searchable?: boolean;
}) {
    const tableId = `resource-${title?.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-') ?? 'table'}`;

    return (
        <section className="resource-table glass-panel overflow-hidden rounded-[28px]">
            {(title || description) && (
                <div className="flex items-center justify-between gap-4 border-b border-white/65 px-5 py-5 sm:px-6">
                    <div>
                        {title && (
                            <h2 className="text-sm font-semibold tracking-[-0.02em]">{title}</h2>
                        )}
                        {description && (
                            <p className="mt-1 text-[12px] text-muted">{description}</p>
                        )}
                    </div>
                    <span className="hidden rounded-full border border-white/80 bg-white/40 px-3 py-1.5 text-[12px] font-medium text-muted sm:inline-flex">
                        {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
                    </span>
                </div>
            )}
            {searchable && rows.length > 0 && (
                <ResourceTableControls tableId={tableId} total={rows.length} position="top" />
            )}
            {rows.length === 0 ? (
                <div className="px-5 py-14 text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft/75 text-brand">
                        <Icon name="search" className="size-4" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">Nenhum resultado</h3>
                    <p className="mt-1 text-[13px] text-muted">{empty}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table id={tableId} className="w-full min-w-[760px] text-left">
                        <thead className="bg-white/24 text-[12px] uppercase tracking-[0.09em] text-muted">
                            <tr>
                                {columns.map((column) => (
                                    <th key={column.label} className="px-6 py-3.5 font-semibold">
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/65">
                            {rows.map((row, index) => (
                                <tr
                                    key={String((row as { id?: string }).id ?? index)}
                                    data-resource-row
                                    data-search={columns
                                        .map((column) => String(column.value(row) ?? ''))
                                        .join(' ')
                                        .toLocaleLowerCase('pt-BR')}
                                    className="text-[13px] transition hover:bg-white/34"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.label}
                                            className={`px-6 py-4 ${column.mono ? 'font-mono text-xs' : ''}`}
                                        >
                                            {column.render
                                                ? column.render(row)
                                                : formatResourceValue(column.value(row))}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {rows.length > 0 && (
                <ResourceTableControls tableId={tableId} total={rows.length} position="bottom" />
            )}
        </section>
    );
}

export function SummaryCard({
    label,
    value,
    detail,
    icon,
}: {
    label: string;
    value: string;
    detail: string;
    icon: IconName;
}) {
    return (
        <article className="summary-card glass-panel relative min-h-[132px] rounded-[22px] p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="summary-card-label text-[12px] font-medium text-muted">{label}</p>
                    <p className="summary-card-value mt-2.5 truncate text-[25px] font-semibold tracking-[-0.05em] text-foreground">
                        {value}
                    </p>
                </div>
                <span className="summary-card-icon grid size-9 shrink-0 place-items-center rounded-full border border-white/80 bg-brand-soft/80 text-brand-strong shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                    <Icon name={icon} className="size-[17px]" />
                </span>
            </div>
            <p className="mt-3 truncate text-[12px] text-muted">{detail}</p>
        </article>
    );
}

export function money(value: number, currency = 'BRL') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

export function date(value: string | null | undefined) {
    return value
        ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
        : '—';
}

function formatResourceValue(value: ResourceValue) {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return String(value);
}
