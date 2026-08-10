'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

import { AdminBadge } from '@/components/platform-admin/admin-ui';
import { AdminToast } from '@/components/platform-admin/organization-admin-table';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import type { PlatformAdminEntitlement, PlatformAdminPlan } from '@/lib/api/types';

const featureLabels: Record<string, string> = {
    'catalog.active_products': 'Produtos ativos',
    'checkout.published': 'Checkouts publicados',
    'commerce.orders': 'Pedidos por mês',
    'subscriptions.active': 'Assinaturas ativas',
    'gateways.connected': 'Gateways conectados',
    'domains.custom': 'Domínios personalizados',
    'workspace.members': 'Usuários no workspace',
    'media.storage_bytes': 'Armazenamento de mídia',
    api_keys: 'Chaves de API',
    analytics_events: 'Eventos de analytics',
    'analytics.events': 'Eventos de API por mês',
    'checkout.remove_branding': 'Remoção da marca Astro',
    'reports.advanced': 'Relatórios avançados',
    'webhooks.custom': 'Webhooks personalizados',
    'marketing.pixels': 'Pixels e conversões server-side',
    'checkout.abandoned_recovery': 'Recuperação de checkout abandonado',
    'gateways.routing_rules': 'Regras de gateway por checkout',
    'workspace.permissions': 'Permissões da equipe',
    'support.priority': 'Suporte prioritário',
    'notifications.sale_email': 'E-mail a cada venda aprovada',
};

const quotaFeatures = new Set([
    'catalog.active_products',
    'checkout.published',
    'commerce.orders',
    'subscriptions.active',
    'gateways.connected',
    'domains.custom',
    'workspace.members',
    'media.storage_bytes',
    'api_keys',
    'analytics.events',
    'marketing.pixels',
]);

export function PlanAdminManager({ initialPlans }: { initialPlans: PlatformAdminPlan[] }) {
    const [plans, setPlans] = useState(initialPlans);
    const [editing, setEditing] = useState<PlatformAdminPlan | null>(null);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
        null,
    );

    async function saveGeneral(form: FormData) {
        if (!editing) return;
        setPending(true);
        try {
            const response = await fetch(
                `/api/platform-admin/plans/${encodeURIComponent(editing.id)}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: String(form.get('name') ?? ''),
                        description: nullable(form.get('description')),
                        audience: nullable(form.get('audience')),
                        pricingType: String(form.get('pricingType') ?? 'fixed'),
                        priceMinor: Math.round(Number(form.get('price') ?? 0) * 100),
                        status: String(form.get('status') ?? 'active'),
                        sortOrder: Number(form.get('sortOrder') ?? 0),
                        version: editing.version,
                        reason: String(form.get('reason') ?? ''),
                    }),
                },
            );
            const payload = (await response.json()) as {
                data?: PlatformAdminPlan;
                detail?: string;
            };
            if (!response.ok || !payload.data)
                throw new Error(payload.detail ?? 'Não foi possível atualizar o plano.');
            updatePlan(payload.data);
            setEditing(null);
            setMessage({ tone: 'success', text: 'Dados comerciais do plano atualizados.' });
        } catch (error) {
            setMessage({
                tone: 'error',
                text: error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
            });
        } finally {
            setPending(false);
        }
    }

    async function saveEntitlements(entitlements: PlatformAdminEntitlement[], reason: string) {
        if (!editing) return;
        setPending(true);
        try {
            const response = await fetch(
                `/api/platform-admin/plans/${encodeURIComponent(editing.id)}/entitlements`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, entitlements }),
                },
            );
            const payload = (await response.json()) as {
                data?: PlatformAdminPlan;
                detail?: string;
            };
            if (!response.ok || !payload.data)
                throw new Error(payload.detail ?? 'Não foi possível atualizar os limites.');
            updatePlan(payload.data);
            setEditing(null);
            setMessage({ tone: 'success', text: 'Recursos e limites do plano atualizados.' });
        } catch (error) {
            setMessage({
                tone: 'error',
                text: error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
            });
        } finally {
            setPending(false);
        }
    }

    function updatePlan(plan: PlatformAdminPlan) {
        setPlans((current) => current.map((item) => (item.id === plan.id ? plan : item)));
    }

    return (
        <>
            <section className="grid gap-4 xl:grid-cols-3">
                {plans.map((plan) => (
                    <article
                        key={plan.id}
                        className={`glass-panel flex min-h-[420px] flex-col rounded-[26px] p-5 sm:p-6 ${
                            plan.code === 'pro'
                                ? 'ring-1 ring-brand/18 shadow-[0_22px_65px_rgba(93,75,210,.11)]'
                                : ''
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-brand-strong">
                                        {plan.code}
                                    </p>
                                    {plan.code === 'pro' && (
                                        <span className="rounded-full bg-brand-soft px-2 py-1 text-[8px] font-bold uppercase tracking-[.07em] text-brand-strong">
                                            Principal
                                        </span>
                                    )}
                                </div>
                                <h2 className="mt-2 text-xl font-semibold tracking-[-.045em]">
                                    {plan.name}
                                </h2>
                            </div>
                            <AdminBadge status={plan.status} />
                        </div>
                        <p className="mt-3 min-h-10 text-[11px] leading-5 text-muted">
                            {plan.audience ?? plan.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[9px] font-medium text-muted">
                                {plan.entitlements.filter((item) => item.enabled).length} recursos
                                ativos
                            </span>
                            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[9px] font-medium text-muted">
                                {
                                    plan.entitlements.filter((item) =>
                                        quotaFeatures.has(item.feature),
                                    ).length
                                }{' '}
                                limites operacionais
                            </span>
                        </div>
                        <p className="mt-5">
                            <span className="text-[27px] font-semibold tracking-[-.055em]">
                                {plan.pricingType === 'custom'
                                    ? 'Sob consulta'
                                    : money(plan.priceMinor, plan.currency)}
                            </span>
                            {plan.pricingType === 'fixed' && (
                                <span className="ml-1 text-[11px] text-muted">/ mês</span>
                            )}
                        </p>
                        <div className="my-5 h-px bg-border" />
                        <div className="space-y-2.5">
                            {primaryEntitlements(plan.entitlements).map((item) => (
                                <div key={item.feature} className="flex items-center gap-2.5">
                                    <span
                                        className={`grid size-5 place-items-center rounded-full ${
                                            item.enabled
                                                ? 'bg-success/10 text-success'
                                                : 'bg-surface-muted text-muted'
                                        }`}
                                    >
                                        <Icon
                                            name={item.enabled ? 'check' : 'close'}
                                            className="size-3"
                                        />
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-[11px]">
                                        {featureLabel(item)}
                                    </span>
                                    <span className="text-[10px] font-semibold text-muted">
                                        {formatLimit(item)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="secondary"
                            className="mt-auto w-full"
                            onClick={() => setEditing(plan)}
                        >
                            <Icon name="edit" className="size-3.5" />
                            Editar plano e limites
                        </Button>
                    </article>
                ))}
            </section>

            {editing &&
                createPortal(
                    <PlanEditor
                        plan={editing}
                        pending={pending}
                        onClose={() => !pending && setEditing(null)}
                        onSaveGeneral={saveGeneral}
                        onSaveEntitlements={saveEntitlements}
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

function PlanEditor({
    plan,
    pending,
    onClose,
    onSaveGeneral,
    onSaveEntitlements,
}: {
    plan: PlatformAdminPlan;
    pending: boolean;
    onClose: () => void;
    onSaveGeneral: (form: FormData) => void;
    onSaveEntitlements: (items: PlatformAdminEntitlement[], reason: string) => void;
}) {
    const [tab, setTab] = useState<'general' | 'limits'>('general');
    const [entitlements, setEntitlements] = useState(() =>
        ensureBrandingEntitlement(plan.entitlements),
    );
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 z-[150] grid place-items-center overflow-hidden bg-[#11111d]/45 p-3 backdrop-blur-sm sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[820px] flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_32px_100px_rgba(20,17,45,.3)] sm:max-h-[calc(100dvh-2rem)]"
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-brand-strong">
                            Plano {plan.code}
                        </p>
                        <h2 className="mt-1.5 text-xl font-semibold tracking-[-.04em]">
                            {plan.name}
                        </h2>
                    </div>
                    <Button
                        aria-label="Fechar"
                        className="grid size-9 place-items-center rounded-xl bg-surface-muted text-muted"
                        onClick={onClose}
                    >
                        <Icon name="close" className="size-4" />
                    </Button>
                </header>

                <div className="shrink-0 border-b border-border px-5 pt-3 sm:px-6">
                    <div className="flex gap-5">
                        {[
                            ['general', 'Dados do plano'],
                            ['limits', `Recursos e limites (${entitlements.length})`],
                        ].map(([value, label]) => (
                            <Button
                                key={value}
                                className={`relative h-10 text-[11px] font-semibold ${
                                    tab === value ? 'text-brand-strong' : 'text-muted'
                                }`}
                                onClick={() => setTab(value as 'general' | 'limits')}
                            >
                                {label}
                                {tab === value && (
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />
                                )}
                            </Button>
                        ))}
                    </div>
                </div>

                {tab === 'general' ? (
                    <form action={onSaveGeneral} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Nome">
                                    <input
                                        name="name"
                                        required
                                        defaultValue={plan.name}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Preço mensal">
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-3.5 text-[11px] font-semibold text-muted">
                                            R$
                                        </span>
                                        <input
                                            name="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            defaultValue={(plan.priceMinor / 100).toFixed(2)}
                                            className={`${inputClass} pl-10`}
                                        />
                                    </div>
                                </Field>
                            </div>
                            <Field label="Descrição">
                                <textarea
                                    name="description"
                                    rows={3}
                                    defaultValue={plan.description ?? ''}
                                    className={`${inputClass} h-auto resize-none py-3`}
                                />
                            </Field>
                            <Field label="Público">
                                <textarea
                                    name="audience"
                                    rows={2}
                                    defaultValue={plan.audience ?? ''}
                                    className={`${inputClass} h-auto resize-none py-3`}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="Cobrança">
                                    <CustomSelect
                                        name="pricingType"
                                        defaultValue={plan.pricingType}
                                        options={[
                                            { value: 'fixed', label: 'Preço fixo' },
                                            { value: 'custom', label: 'Sob consulta' },
                                        ]}
                                    />
                                </Field>
                                <Field label="Status">
                                    <CustomSelect
                                        name="status"
                                        defaultValue={plan.status}
                                        options={[
                                            { value: 'active', label: 'Ativo' },
                                            { value: 'archived', label: 'Arquivado' },
                                        ]}
                                    />
                                </Field>
                                <Field label="Ordem">
                                    <input
                                        name="sortOrder"
                                        type="number"
                                        min="0"
                                        defaultValue={plan.sortOrder}
                                        className={inputClass}
                                    />
                                </Field>
                            </div>
                            <Field label="Motivo da alteração">
                                <textarea
                                    name="reason"
                                    required
                                    minLength={5}
                                    rows={2}
                                    placeholder="Por que estes dados comerciais estão mudando?"
                                    className={`${inputClass} h-auto resize-none py-3`}
                                />
                            </Field>
                        </div>
                        <div className="shrink-0 border-t border-border bg-surface px-5 py-4 sm:px-6">
                            <Footer pending={pending} onClose={onClose} />
                        </div>
                    </form>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
                        <div className="mb-4 shrink-0 rounded-2xl border border-brand/12 bg-brand-soft/40 p-4">
                            <p className="text-[11px] font-semibold text-brand-strong">
                                Como essas configurações funcionam
                            </p>
                            <p className="mt-1 text-[10px] leading-5 text-muted">
                                Limites controlam volume e bloqueios. Recursos apenas definem se uma
                                funcionalidade faz parte do plano. Alterações afetam todos os
                                workspaces desse plano.
                            </p>
                        </div>
                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                            <BrandingControl
                                item={entitlements.find(
                                    (item) => item.feature === 'checkout.remove_branding',
                                )!}
                                onChange={(next) =>
                                    setEntitlements((current) =>
                                        current.map((candidate) =>
                                            candidate.feature === next.feature ? next : candidate,
                                        ),
                                    )
                                }
                            />
                            <EntitlementSection
                                title="Limites de uso"
                                description="Quantidades máximas permitidas antes de alertar ou impedir novas ações."
                                items={entitlements.filter((item) =>
                                    quotaFeatures.has(item.feature),
                                )}
                                onChange={(next) =>
                                    setEntitlements((current) =>
                                        current.map((candidate) =>
                                            candidate.feature === next.feature ? next : candidate,
                                        ),
                                    )
                                }
                            />
                            <EntitlementSection
                                title="Recursos incluídos"
                                description="Funcionalidades disponíveis ou indisponíveis para quem assina o plano."
                                items={entitlements.filter(
                                    (item) =>
                                        !quotaFeatures.has(item.feature) &&
                                        item.feature !== 'checkout.remove_branding',
                                )}
                                onChange={(next) =>
                                    setEntitlements((current) =>
                                        current.map((candidate) =>
                                            candidate.feature === next.feature ? next : candidate,
                                        ),
                                    )
                                }
                            />
                        </div>
                        <div className="mt-4 shrink-0 border-t border-border pt-4">
                            <Field label="Motivo da alteração">
                                <textarea
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    required
                                    minLength={5}
                                    rows={2}
                                    placeholder="Por que os recursos ou limites estão mudando?"
                                    className={`${inputClass} h-auto resize-none py-3`}
                                />
                            </Field>
                        </div>
                        <div className="mt-4 flex shrink-0 justify-end gap-2">
                            <Button variant="secondary" disabled={pending} onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                disabled={pending || reason.trim().length < 5}
                                onClick={() => onSaveEntitlements(entitlements, reason)}
                            >
                                {pending ? 'Salvando...' : 'Salvar recursos e limites'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function BrandingControl({
    item,
    onChange,
}: {
    item: PlatformAdminEntitlement;
    onChange: (item: PlatformAdminEntitlement) => void;
}) {
    const showPoweredBy = !item.enabled;
    return (
        <section>
            <div className="mb-2.5">
                <h3 className="text-[12px] font-semibold">Marca Astro no checkout</h3>
                <p className="mt-0.5 text-[9px] leading-4 text-muted">
                    Define se os checkouts publicados por este plano exibem “Powered by Astro”.
                </p>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/25 p-3.5 transition hover:bg-surface-muted/40">
                <input
                    type="checkbox"
                    checked={showPoweredBy}
                    onChange={(event) => onChange({ ...item, enabled: !event.target.checked })}
                    className="size-4 accent-[var(--brand)]"
                />
                <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold">
                        Exibir “Powered by Astro”
                    </span>
                    <span className="mt-0.5 block text-[9px] leading-4 text-muted">
                        {showPoweredBy
                            ? 'A marca será obrigatória em todas as páginas de checkout.'
                            : 'Os checkouts deste plano serão exibidos sem a marca Astro.'}
                    </span>
                </span>
                <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                        showPoweredBy
                            ? 'bg-brand-soft text-brand-strong'
                            : 'bg-surface-muted text-muted'
                    }`}
                >
                    {showPoweredBy ? 'Visível' : 'Oculta'}
                </span>
            </label>
        </section>
    );
}

function EntitlementRow({
    item,
    onChange,
}: {
    item: PlatformAdminEntitlement;
    onChange: (item: PlatformAdminEntitlement) => void;
}) {
    const quota = quotaFeatures.has(item.feature);
    const storage = item.feature === 'media.storage_bytes';
    const displayLimit =
        item.limit === null ? '' : storage ? Math.round(item.limit / 1024 ** 3) : item.limit;
    if (!quota)
        return (
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/25 p-3.5 transition hover:bg-surface-muted/40">
                <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) => onChange({ ...item, enabled: event.target.checked })}
                    className="size-4 accent-[var(--brand)]"
                />
                <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold">{featureLabel(item)}</span>
                    <span className="mt-0.5 block text-[9px] leading-4 text-muted">
                        {item.enabled ? 'Incluído neste plano' : 'Não disponível para este plano'}
                    </span>
                </span>
                <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                        item.enabled ? 'bg-success/10 text-success' : 'bg-surface-muted text-muted'
                    }`}
                >
                    {item.enabled ? 'Ativo' : 'Inativo'}
                </span>
            </label>
        );
    return (
        <div className="rounded-2xl border border-border bg-surface-muted/25 p-3.5">
            <div className="grid items-center gap-3 sm:grid-cols-[minmax(190px,1fr)_130px_150px]">
                <label className="flex min-w-0 items-center gap-3">
                    <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(event) => onChange({ ...item, enabled: event.target.checked })}
                        className="size-4 accent-[var(--brand)]"
                    />
                    <span className="min-w-0">
                        <span className="block truncate text-[11px] font-semibold">
                            {featureLabel(item)}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[9px] text-muted">
                            {item.feature}
                        </span>
                    </span>
                </label>
                <label className="relative">
                    <input
                        type="number"
                        min="0"
                        value={displayLimit}
                        disabled={!item.enabled}
                        placeholder={isCustom(item) ? 'Personalizado' : 'Sem limite'}
                        onChange={(event) =>
                            onChange({
                                ...item,
                                limit:
                                    event.target.value === ''
                                        ? null
                                        : Number(event.target.value) * (storage ? 1024 ** 3 : 1),
                            })
                        }
                        className="h-9 w-full rounded-lg border border-border bg-[var(--control-bg)] px-3 text-[11px] outline-none disabled:opacity-50"
                    />
                    {storage && (
                        <span className="pointer-events-none absolute right-2.5 top-2.5 text-[9px] text-muted">
                            GB
                        </span>
                    )}
                </label>
                <CustomSelect
                    name={`reset-${item.feature}`}
                    value={item.resetPeriod}
                    disabled={!item.enabled}
                    onValueChange={(resetPeriod) => onChange({ ...item, resetPeriod })}
                    options={[
                        { value: 'none', label: 'Sem renovação' },
                        { value: 'day', label: 'Por dia' },
                        { value: 'month', label: 'Por mês' },
                    ]}
                />
            </div>
            <p className="mt-2 border-t border-border/70 pt-2 text-[9px] leading-4 text-muted">
                {limitExplanation(item)}
            </p>
        </div>
    );
}

function EntitlementSection({
    title,
    description,
    items,
    onChange,
}: {
    title: string;
    description: string;
    items: PlatformAdminEntitlement[];
    onChange: (item: PlatformAdminEntitlement) => void;
}) {
    return (
        <section>
            <div className="mb-2.5">
                <h3 className="text-[12px] font-semibold">{title}</h3>
                <p className="mt-0.5 text-[9px] leading-4 text-muted">{description}</p>
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <EntitlementRow key={item.feature} item={item} onChange={onChange} />
                ))}
            </div>
        </section>
    );
}

function Footer({ pending, onClose }: { pending: boolean; onClose: () => void }) {
    return (
        <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
                Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
                {pending ? 'Salvando...' : 'Salvar dados do plano'}
            </Button>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-semibold">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 text-[13px] outline-none';

function primaryEntitlements(items: PlatformAdminEntitlement[]) {
    const priorities = [
        'catalog.active_products',
        'checkout.published',
        'commerce.orders',
        'workspace.members',
        'media.storage_bytes',
    ];
    return priorities
        .map((feature) => items.find((item) => item.feature === feature))
        .filter((item): item is PlatformAdminEntitlement => item !== undefined);
}

function ensureBrandingEntitlement(items: PlatformAdminEntitlement[]) {
    if (items.some((item) => item.feature === 'checkout.remove_branding')) return items;
    return [
        ...items,
        {
            feature: 'checkout.remove_branding',
            enabled: false,
            limit: null,
            resetPeriod: 'none',
            metadata: { label: 'Remoção da marca Astro' },
        },
    ];
}

function formatLimit(item: PlatformAdminEntitlement) {
    if (!item.enabled) return 'Não incluso';
    if (item.limit === null) return isCustom(item) ? 'Personalizado' : 'Sem limite';
    if (item.feature === 'media.storage_bytes') return `${Math.round(item.limit / 1024 ** 3)} GB`;
    return new Intl.NumberFormat('pt-BR').format(item.limit);
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value / 100);
}

function humanize(value: string) {
    return value
        .replaceAll('_', ' ')
        .replaceAll('.', ' · ')
        .replace(/^./, (letter) => letter.toUpperCase());
}

function featureLabel(item: PlatformAdminEntitlement) {
    const metadataLabel = item.metadata.label;
    return typeof metadataLabel === 'string'
        ? metadataLabel
        : (featureLabels[item.feature] ?? humanize(item.feature));
}

function isCustom(item: PlatformAdminEntitlement) {
    return item.metadata.custom === true;
}

function limitExplanation(item: PlatformAdminEntitlement) {
    if (!item.enabled) return 'Este consumo fica indisponível para o plano.';
    const period =
        item.resetPeriod === 'month'
            ? ' O contador é renovado mensalmente.'
            : item.resetPeriod === 'day'
              ? ' O contador é renovado diariamente.'
              : '';
    if (item.limit === null)
        return `${isCustom(item) ? 'O valor será definido individualmente para cada contrato.' : 'Não existe um teto quantitativo configurado.'}${period}`;
    return `Ao atingir ${formatLimit(item)}, novas ações relacionadas a este limite poderão ser bloqueadas.${period}`;
}

function nullable(value: FormDataEntryValue | null) {
    const text = String(value ?? '').trim();
    return text === '' ? null : text;
}
