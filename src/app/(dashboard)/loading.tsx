/**
 * Esqueleto das telas do painel enquanto os dados chegam da API: o clique responde na hora e o
 * layout (menu, cabeçalho) continua montado. Só aparece se a tela demorar (ver .page-skeleton).
 */
export default function DashboardLoading() {
    return (
        <div className="page-skeleton" role="status" aria-label="Carregando">
            <div className="mb-7 flex items-center justify-between gap-5">
                <div className="space-y-3">
                    <span className="skeleton-block block h-3 w-28 rounded-full" />
                    <span className="skeleton-block block h-8 w-64 rounded-xl" />
                    <span className="skeleton-block block h-3 w-80 max-w-[70vw] rounded-full" />
                </div>
                <span className="skeleton-block hidden h-11 w-40 rounded-full sm:block" />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="space-y-3 rounded-[22px] border border-border bg-surface p-5"
                    >
                        <span className="skeleton-block block h-3 w-20 rounded-full" />
                        <span className="skeleton-block block h-7 w-28 rounded-lg" />
                    </div>
                ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-[22px] border border-border bg-surface">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                    <div
                        key={row}
                        className="flex items-center gap-4 border-b border-border/70 px-5 py-4 last:border-b-0"
                    >
                        <span className="skeleton-block size-9 shrink-0 rounded-xl" />
                        <span className="flex-1 space-y-2">
                            <span className="skeleton-block block h-3 w-1/3 rounded-full" />
                            <span className="skeleton-block block h-2.5 w-1/2 rounded-full" />
                        </span>
                        <span className="skeleton-block hidden h-3 w-20 rounded-full sm:block" />
                    </div>
                ))}
            </div>
        </div>
    );
}
