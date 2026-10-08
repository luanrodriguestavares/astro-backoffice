'use client';

import { createContext, useContext, useState } from 'react';

import { CustomSelect } from '@/components/ui/custom-select';

export type DashboardPeriod = '24H' | '7D' | '30D' | '90D' | '12M';

export const dashboardPeriods: { value: DashboardPeriod; label: string; short: string }[] = [
    { value: '24H', label: 'Últimas 24 horas', short: 'Últimas 24h' },
    { value: '7D', label: 'Últimos 7 dias', short: 'Últimos 7d' },
    { value: '30D', label: 'Últimos 30 dias', short: 'Últimos 30d' },
    { value: '90D', label: 'Últimos 90 dias', short: 'Últimos 90d' },
    { value: '12M', label: 'Últimos 12 meses', short: 'Últimos 12m' },
];

const DashboardPeriodContext = createContext<{
    period: DashboardPeriod;
    setPeriod: (period: DashboardPeriod) => void;
}>({ period: '30D', setPeriod: () => undefined });

export function DashboardPeriodProvider({ children }: { children: React.ReactNode }) {
    const [period, setPeriod] = useState<DashboardPeriod>('30D');

    return (
        <DashboardPeriodContext.Provider value={{ period, setPeriod }}>
            {children}
        </DashboardPeriodContext.Provider>
    );
}

export function useDashboardPeriod() {
    return useContext(DashboardPeriodContext);
}

export function dashboardPeriodLabel(period: DashboardPeriod) {
    return dashboardPeriods.find((option) => option.value === period)?.label ?? '';
}

export function DashboardPeriodSelect() {
    const { period, setPeriod } = useDashboardPeriod();

    return (
        <div className="w-[142px]">
            <CustomSelect
                name="dashboard-period"
                value={period}
                options={dashboardPeriods.map(({ value, short }) => ({ value, label: short }))}
                onValueChange={(value) => setPeriod(value as DashboardPeriod)}
            />
        </div>
    );
}
