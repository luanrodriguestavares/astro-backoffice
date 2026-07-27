'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import type { Organization } from '@/lib/api/types';

export function WorkspaceSwitcher({
    current,
    organizations,
    collapsed,
}: {
    current: Organization;
    organizations: Organization[];
    collapsed: boolean;
}) {
    const root = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState<string>();
    const currentName = organizationName(current);

    useEffect(() => {
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }

        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', escape);
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', escape);
        };
    }, []);

    async function switchWorkspace(organization: Organization) {
        if (organization.id === current.id || switching) {
            setOpen(false);
            return;
        }

        setSwitching(organization.id);
        const response = await fetch('/api/auth/switch-organization', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ organizationId: organization.id }),
        });
        const payload = (await response.json()) as { detail?: string };

        if (!response.ok) {
            setSwitching(undefined);
            showToast({
                tone: 'error',
                description: payload.detail ?? 'Não foi possível trocar de workspace.',
            });
            return;
        }

        window.location.reload();
    }

    return (
        <div
            ref={root}
            className={`organization-card relative mt-7 rounded-[20px] transition-all duration-300 ${collapsed ? 'lg:p-1.5' : 'p-2'}`}
        >
            <Button
                type="button"
                title={collapsed ? currentName : undefined}
                aria-label={`Workspace atual: ${currentName}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={`flex w-full items-center gap-2.5 rounded-xl text-left ${collapsed ? 'lg:justify-center lg:gap-0' : 'px-1 py-0.5'}`}
            >
                <WorkspaceAvatar name={currentName} />
                <span className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                    <span className="shell-organization-name block truncate text-xs font-semibold text-[#24253c]">
                        {currentName}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted">
                        {current.status === 'active'
                            ? 'Workspace ativo'
                            : (current.status ?? 'Conta Astro')}
                    </span>
                </span>
                <Icon
                    name="chevron-down"
                    className={`mr-1 size-3.5 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''} ${collapsed ? 'lg:hidden' : ''}`}
                />
            </Button>

            {open && (
                <div
                    role="menu"
                    aria-label="Trocar workspace"
                    className={`workspace-popover glass-popover absolute z-50 min-w-[248px] overflow-hidden rounded-[20px] border p-2 shadow-[0_24px_70px_rgba(42,35,88,.18)] ${
                        collapsed
                            ? 'left-0 top-[calc(100%+8px)] lg:left-[calc(100%+10px)] lg:top-0'
                            : 'left-0 right-0 top-[calc(100%+8px)]'
                    }`}
                >
                    <div className="px-2 pb-2 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                            Seus workspaces
                        </p>
                    </div>
                    <div className="space-y-1">
                        {organizations.map((organization) => {
                            const active = organization.id === current.id;
                            const loading = switching === organization.id;
                            const name = organizationName(organization);
                            return (
                                <Button
                                    key={organization.id}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={active}
                                    disabled={Boolean(switching)}
                                    onClick={() => switchWorkspace(organization)}
                                    className="workspace-option flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/55 disabled:cursor-wait disabled:opacity-65"
                                >
                                    <WorkspaceAvatar name={name} compact />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[11px] font-semibold">
                                            {name}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[9px] text-muted">
                                            {organization.slug
                                                ? `/${organization.slug}`
                                                : 'Workspace Astro'}
                                        </span>
                                    </span>
                                    {loading ? (
                                        <span className="size-3.5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
                                    ) : active ? (
                                        <span className="grid size-5 place-items-center rounded-full bg-brand-soft text-brand">
                                            <Icon name="check" className="size-3" />
                                        </span>
                                    ) : null}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function WorkspaceAvatar({ name, compact = false }: { name: string; compact?: boolean }) {
    return (
        <span
            className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#292744] to-[#17172b] font-bold text-white shadow-[0_8px_18px_rgba(31,29,57,.16)] ${compact ? 'size-8 text-[9px]' : 'size-9 text-[10px]'}`}
        >
            {initials(name)}
        </span>
    );
}

function organizationName(organization: Organization) {
    return organization.displayName ?? organization.legalName ?? 'Organização';
}

function initials(value: string) {
    return (
        value
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'A'
    );
}
