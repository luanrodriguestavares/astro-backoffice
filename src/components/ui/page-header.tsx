import { GuidedTourTrigger } from '@/components/layout/guided-tour-trigger';
import { ShellActions } from '@/components/layout/shell-actions';

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    filters,
    hero = false,
    prominentTitle = false,
}: {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    description: string;
    actions?: React.ReactNode;
    /** Controles que afetam o conteúdo da página, exibidos antes das ações globais. */
    filters?: React.ReactNode;
    hero?: boolean;
    prominentTitle?: boolean;
}) {
    return (
        <div
            data-tour="page-header"
            className={`${hero ? 'mb-9' : 'mb-7'} flex flex-col justify-between gap-5 sm:flex-row sm:items-center`}
        >
            <div>
                {eyebrow && (
                    <p
                        className={`${hero ? 'mb-1.5' : 'mb-1'} text-[11px] font-semibold uppercase tracking-[0.16em] text-muted`}
                    >
                        {eyebrow}
                    </p>
                )}
                <div className="flex items-center gap-2.5">
                    <h1
                        className={`${hero ? 'text-[32px] sm:text-[42px] lg:text-[48px]' : prominentTitle ? 'text-[30px] sm:text-[36px] lg:text-[40px]' : 'text-2xl sm:text-[28px]'} font-bold leading-[1.05] tracking-[-0.045em]`}
                    >
                        {title}
                    </h1>
                    <GuidedTourTrigger />
                </div>
                <p
                    className={`${hero ? 'mt-1.5 text-[15px]' : 'mt-1.5 text-sm'} max-w-2xl leading-6 text-muted`}
                >
                    {description}
                </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                {filters}
                <ShellActions />
                {actions && (
                    <div data-tour="page-actions" className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
