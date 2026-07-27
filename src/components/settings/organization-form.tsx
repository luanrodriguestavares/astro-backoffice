'use client';

import { Button } from '@/components/ui/button';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import type { Organization } from '@/lib/api/types';

export function OrganizationForm({ organization }: { organization: Organization }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);
        const response = await fetch('/api/settings/organization', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                displayName: form.get('displayName'),
                version: organization.version,
            }),
        });
        const body = (await response.json()) as { detail?: string };
        setLoading(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível salvar as configurações.',
            });
            return;
        }
        showToast({
            tone: 'success',
            title: 'Configurações atualizadas',
            description: 'Os dados da organização foram salvos com sucesso.',
        });
        router.refresh();
    }

    return (
        <form onSubmit={submit} className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[13px] border border-white/80 bg-brand-soft/75 text-brand">
                    <Icon name="settings" className="size-4" />
                </span>
                <div>
                    <h2 className="text-sm font-semibold tracking-[-0.02em]">Organização</h2>
                    <p className="mt-1 text-[12px] text-muted">
                        Identificação da sua empresa no Astro
                    </p>
                </div>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Field
                    name="displayName"
                    label="Nome de exibição"
                    defaultValue={organization.displayName}
                    required
                />
                <Field
                    name="slug"
                    label="Identificador"
                    defaultValue={organization.slug}
                    disabled
                />
            </div>
            <div className="mt-7 flex justify-end">
                <Button
                    disabled={loading}
                    className="glass-interactive h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : 'Salvar alterações'}
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="text-[13px] font-semibold">
            {label}
            <input
                {...input}
                className="mt-2 h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/70 px-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.16)] disabled:bg-white/35 disabled:text-muted"
            />
        </label>
    );
}
