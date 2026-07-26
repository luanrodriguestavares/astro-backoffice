import Link from 'next/link';

import { MetricChart } from '@/components/dashboard/dashboard-charts';
import { Icon, type IconName } from '@/components/ui/icon';

type Tone = 'brand' | 'success' | 'warning';

const tones: Record<Tone, { icon: string; line: string }> = {
    brand: {
        icon: 'bg-[#eeeaff]/80 text-brand-strong',
        line: '#7563f4',
    },
    success: {
        icon: 'bg-[#eaf8f3]/80 text-success',
        line: '#35a782',
    },
    warning: {
        icon: 'bg-[#fff5e9]/80 text-warning',
        line: '#d18b39',
    },
};

export function StatCard({
    label,
    value,
    detail,
    icon,
    href,
    sparkline,
    change,
    chartType = 'line',
    tone = 'brand',
}: {
    label: string;
    value: string;
    detail: string;
    icon: IconName;
    href: string;
    sparkline?: number[];
    change?: number | null;
    chartType?: 'line' | 'bar';
    tone?: Tone;
}) {
    const palette = tones[tone];

    return (
        <Link
            href={href}
            className="dashboard-stat-card glass-panel group relative min-h-[142px] rounded-[22px] p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(66,57,128,.1)]"
        >
            <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="dashboard-stat-label text-[11px] font-medium text-[#5f6078]">
                        {label}
                    </p>
                    <p className="dashboard-stat-value mt-2.5 truncate text-[25px] font-semibold tracking-[-0.05em] text-[#17182f]">
                        {value}
                    </p>
                </div>
                <span
                    className={`dashboard-stat-icon grid size-9 shrink-0 place-items-center rounded-full border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] ${palette.icon}`}
                >
                    <Icon name={icon} className="size-[17px]" />
                </span>
            </div>

            <div className="relative mt-3.5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                    {change !== undefined && change !== null && (
                        <p
                            className={`text-[10px] font-semibold ${change >= 0 ? 'text-success' : 'text-danger'}`}
                        >
                            {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
                            <span className="ml-1 font-normal text-muted">
                                vs. período anterior
                            </span>
                        </p>
                    )}
                    <p
                        className={`${change !== undefined && change !== null ? 'mt-1' : ''} truncate text-[10px] text-muted`}
                    >
                        {detail}
                    </p>
                </div>
                {sparkline && sparkline.length > 1 ? (
                    <MetricChart values={sparkline} color={palette.line} type={chartType} />
                ) : (
                    <span className="dashboard-stat-arrow grid size-7 shrink-0 place-items-center rounded-full bg-white/60 text-[#aaa7bc] transition group-hover:text-brand">
                        <Icon name="arrow-right" className="size-3.5" />
                    </span>
                )}
            </div>
        </Link>
    );
}
