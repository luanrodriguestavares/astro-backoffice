import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function AdminPagination({
    pathname,
    params,
    page,
    pageSize,
    total,
}: {
    pathname: string;
    params: Record<string, string>;
    page: number;
    pageSize: number;
    total: number;
}) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, pages);
    const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);

    return (
        <footer className="flex flex-col gap-3 border-t border-border px-5 py-4 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
                Exibindo {start}–{end} de {total}
            </span>
            <div className="flex items-center gap-2">
                <PaginationButton
                    href={pageHref(pathname, params, Math.max(1, currentPage - 1), pageSize)}
                    label="Página anterior"
                    disabled={currentPage <= 1}
                    iconClassName="rotate-180"
                />
                <span className="min-w-24 text-center">
                    Página {currentPage} de {pages}
                </span>
                <PaginationButton
                    href={pageHref(pathname, params, Math.min(pages, currentPage + 1), pageSize)}
                    label="Próxima página"
                    disabled={currentPage >= pages}
                />
            </div>
        </footer>
    );
}

function PaginationButton({
    href,
    label,
    disabled,
    iconClassName = '',
}: {
    href: string;
    label: string;
    disabled: boolean;
    iconClassName?: string;
}) {
    if (disabled)
        return (
            <span
                aria-label={label}
                aria-disabled="true"
                className="inline-grid size-9 place-items-center rounded-full border border-border bg-[var(--control-bg)] opacity-45"
            >
                <Icon name="arrow-right" className={`size-3.5 ${iconClassName}`} />
            </span>
        );
    return (
        <ButtonLink href={href} variant="icon" aria-label={label} scroll={false}>
            <Icon name="arrow-right" className={`size-3.5 ${iconClassName}`} />
        </ButtonLink>
    );
}

function pageHref(
    pathname: string,
    params: Record<string, string>,
    page: number,
    pageSize: number,
) {
    const query = new URLSearchParams(params);
    query.set('page', String(page));
    query.set('limit', String(pageSize));
    return `${pathname}?${query.toString()}`;
}
