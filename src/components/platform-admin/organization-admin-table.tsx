'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import {
    AdminBadge,
    AdminEmpty,
    formatAdminDate,
    formatPlanName,
} from '@/components/platform-admin/admin-ui';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import type { PlatformAdminOrganization, PlatformAdminPlan } from '@/lib/api/types';

type Dialog =
    | { kind: 'status'; organization: PlatformAdminOrganization }
    | { kind: 'subscription'; organization: PlatformAdminOrganization }
    | null;

export function OrganizationAdminTable({
    organizations,
    plans,
}: {
    organizations: PlatformAdminOrganization[];
    plans: PlatformAdminPlan[];
}) {
    const router = useRouter();
    const [dialog, setDialog] = useState<Dialog>(null);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
        null,
    );

    async function submit(form: FormData) {
        if (!dialog) return;
        setPending(true);
        setMessage(null);
        const reason = String(form.get('reason') ?? '');
        try {
            const isStatus = dialog.kind === 'status';
            const endpoint = isStatus
                ? `/api/platform-admin/organizations/${encodeURIComponent(dialog.organization.id)}/status`
                : `/api/platform-admin/organizations/${encodeURIComponent(dialog.organization.id)}/subscription`;
            const body = isStatus
                ? {
                      reason,
                      status: dialog.organization.status === 'active' ? 'suspended' : 'active',
                  }
                : subscriptionInput(form, reason);
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok)
                throw new Error(payload.detail ?? 'Não foi possível atualizar a empresa.');
            setDialog(null);
            setMessage({
                tone: 'success',
                text: isStatus ? 'Status da empresa atualizado.' : 'Assinatura atualizada.',
            });
            router.refresh();
        } catch (error) {
            setMessage({
                tone: 'error',
                text: error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
            });
        } finally {
            setPending(false);
        }
    }

    if (organizations.length === 0)
        return (
            <section className="glass-panel rounded-[26px]">
                <AdminEmpty
                    title="Nenhuma empresa encontrada"
                    description="Tente ajustar a pesquisa ou o filtro de status."
                />
            </section>
        );

    return (
        <>
            <section className="glass-panel overflow-hidden rounded-[26px]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-left">
                        <thead className="border-b border-border bg-surface-muted/35 text-[10px] uppercase tracking-[.1em] text-muted">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold">Empresa</th>
                                <th className="px-5 py-3.5 font-semibold">Plano</th>
                                <th className="px-5 py-3.5 font-semibold">Assinatura</th>
                                <th className="px-5 py-3.5 font-semibold">Equipe</th>
                                <th className="px-5 py-3.5 font-semibold">Criada em</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {organizations.map((organization) => (
                                <tr
                                    key={organization.id}
                                    className="text-[12px] transition hover:bg-surface-muted/28"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-[11px] font-bold text-brand-strong">
                                                {organization.displayName.slice(0, 2).toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="max-w-56 truncate font-semibold">
                                                        {organization.displayName}
                                                    </p>
                                                    <AdminBadge status={organization.status} />
                                                </div>
                                                <p className="mt-1 text-[10px] text-muted">
                                                    /{organization.slug}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-medium">
                                        {formatPlanName(organization.planCode)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div>
                                            <AdminBadge
                                                status={organization.subscriptionStatus ?? 'unknown'}
                                            />
                                            <p className="mt-1.5 text-[10px] text-muted">
                                                Ciclo até {formatAdminDate(organization.periodEndsAt)}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">{organization.memberCount}</td>
                                    <td className="px-5 py-4 text-muted">
                                        {formatAdminDate(organization.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    setDialog({ kind: 'subscription', organization })
                                                }
                                            >
                                                Assinatura
                                            </Button>
                                            <Button
                                                variant={
                                                    organization.status === 'active'
                                                        ? 'danger'
                                                        : 'secondary'
                                                }
                                                className="h-9"
                                                onClick={() =>
                                                    setDialog({ kind: 'status', organization })
                                                }
                                            >
                                                {organization.status === 'active'
                                                    ? 'Suspender'
                                                    : 'Reativar'}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {dialog &&
                createPortal(
                    <OrganizationDialog
                        dialog={dialog}
                        plans={plans}
                        pending={pending}
                        onClose={() => !pending && setDialog(null)}
                        onSubmit={submit}
                    />,
                    document.body,
                )}
            {message &&
                createPortal(
                    <AdminToast message={message} onClose={() => setMessage(null)} />,
                    document.body,
                )}
        </>
    );
}

function OrganizationDialog({
    dialog,
    plans,
    pending,
    onClose,
    onSubmit,
}: {
    dialog: Exclude<Dialog, null>;
    plans: PlatformAdminPlan[];
    pending: boolean;
    onClose: () => void;
    onSubmit: (form: FormData) => void;
}) {
    const statusChange = dialog.kind === 'status';
    return (
        <div className="fixed inset-0 z-[150] grid place-items-center overflow-y-auto bg-[#11111d]/42 p-4 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-[540px] rounded-[28px] border border-border bg-surface p-6 shadow-[0_30px_90px_rgba(20,17,45,.28)]"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-brand-strong">
                            {statusChange ? 'Acesso da empresa' : 'Assinatura'}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-[-.04em]">
                            {statusChange
                                ? dialog.organization.status === 'active'
                                    ? 'Suspender empresa'
                                    : 'Reativar empresa'
                                : `Gerenciar ${dialog.organization.displayName}`}
                        </h2>
                        <p className="mt-1.5 text-[12px] leading-5 text-muted">
                            {statusChange
                                ? 'A mudança afeta o acesso da operação. Os dados não serão apagados.'
                                : 'Atualize plano, trial ou estado de cobrança sem editar dados diretamente.'}
                        </p>
                    </div>
                    <Button
                        aria-label="Fechar"
                        className="grid size-9 place-items-center rounded-xl bg-surface-muted text-muted"
                        onClick={onClose}
                    >
                        <Icon name="close" className="size-4" />
                    </Button>
                </div>

                <form action={onSubmit} className="mt-6 space-y-4">
                    {!statusChange && (
                        <>
                            <Field label="Plano">
                                <CustomSelect
                                    name="planCode"
                                    defaultValue={dialog.organization.planCode ?? ''}
                                    options={plans
                                        .filter((plan) => plan.status === 'active')
                                        .map((plan) => ({ value: plan.code, label: plan.name }))}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Status da assinatura">
                                    <CustomSelect
                                        name="subscriptionStatus"
                                        defaultValue={dialog.organization.subscriptionStatus ?? 'active'}
                                        options={[
                                            { value: 'trialing', label: 'Em teste' },
                                            { value: 'active', label: 'Ativa' },
                                            { value: 'past_due', label: 'Pagamento pendente' },
                                            { value: 'canceled', label: 'Cancelada' },
                                        ]}
                                    />
                                </Field>
                                <Field label="Estender trial">
                                    <div className="relative">
                                        <input
                                            name="extendTrialDays"
                                            type="number"
                                            min="1"
                                            max="365"
                                            placeholder="Ex.: 14"
                                            className="h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 pr-12 text-[13px] outline-none"
                                        />
                                        <span className="pointer-events-none absolute right-3.5 top-3.5 text-[10px] text-muted">
                                            dias
                                        </span>
                                    </div>
                                </Field>
                            </div>
                            <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/35 p-3.5 text-[11px]">
                                <input
                                    type="checkbox"
                                    name="cancelAtPeriodEnd"
                                    className="size-4 accent-[var(--brand)]"
                                />
                                Cancelar ao fim do período já pago
                            </label>
                        </>
                    )}
                    <Field label="Motivo da alteração">
                        <textarea
                            name="reason"
                            required
                            minLength={5}
                            rows={3}
                            placeholder="Registre o contexto desta decisão."
                            className="w-full resize-none rounded-xl border border-border bg-[var(--control-bg)] px-3.5 py-3 text-[13px] outline-none"
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant={statusChange && dialog.organization.status === 'active' ? 'danger' : 'primary'}
                            className="h-11 px-5"
                            disabled={pending}
                        >
                            {pending ? 'Salvando...' : 'Confirmar alteração'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function subscriptionInput(form: FormData, reason: string) {
    const extendTrialDays = String(form.get('extendTrialDays') ?? '').trim();
    return {
        reason,
        planCode: String(form.get('planCode') ?? ''),
        status: String(form.get('subscriptionStatus') ?? 'active'),
        ...(extendTrialDays ? { extendTrialDays: Number(extendTrialDays) } : {}),
        cancelAtPeriodEnd: form.get('cancelAtPeriodEnd') === 'on',
    };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-semibold">{label}</span>
            {children}
        </label>
    );
}

export function AdminToast({
    message,
    onClose,
}: {
    message: { tone: 'success' | 'error'; text: string };
    onClose: () => void;
}) {
    return (
        <div
            role={message.tone === 'success' ? 'status' : 'alert'}
            className="fixed right-5 top-5 z-[170] flex w-[min(380px,calc(100vw-2.5rem))] items-start gap-3 rounded-2xl border border-border bg-surface/96 p-4 shadow-[0_24px_70px_rgba(25,21,55,.24)] backdrop-blur-xl"
        >
            <span
                className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                    message.tone === 'success'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                }`}
            >
                <Icon name={message.tone === 'success' ? 'check' : 'close'} className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold">
                    {message.tone === 'success' ? 'Alteração salva' : 'Não foi possível concluir'}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-muted">{message.text}</p>
            </div>
            <Button
                aria-label="Fechar aviso"
                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-muted"
                onClick={onClose}
            >
                <Icon name="close" className="size-3.5" />
            </Button>
        </div>
    );
}
