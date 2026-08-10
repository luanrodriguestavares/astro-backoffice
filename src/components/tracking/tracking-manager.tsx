'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import type {
    Checkout,
    TrackingDelivery,
    TrackingDestination,
    TrackingEventName,
    TrackingProvider,
} from '@/lib/api/types';

type Props = {
    initialDestinations: TrackingDestination[];
    deliveries: TrackingDelivery[];
    checkouts: Checkout[];
    canManage: boolean;
};

const providers = [
    { value: 'meta', label: 'Meta Pixel' },
    { value: 'google', label: 'Google Analytics / Ads' },
    { value: 'tiktok', label: 'TikTok Pixel' },
];
const events: { value: TrackingEventName; label: string; help: string }[] = [
    {
        value: 'checkout.viewed',
        label: 'Visualização do checkout',
        help: 'Quando o comprador abre a página.',
    },
    {
        value: 'checkout.started',
        label: 'Checkout iniciado',
        help: 'Quando uma sessão de compra é criada.',
    },
    {
        value: 'payment.info_added',
        label: 'Dados de pagamento',
        help: 'Antes da tentativa de pagamento.',
    },
    {
        value: 'purchase.completed',
        label: 'Compra concluída',
        help: 'Quando o pagamento é aprovado.',
    },
];

export function TrackingManager({ initialDestinations, deliveries, checkouts, canManage }: Props) {
    const [destinations, setDestinations] = useState(initialDestinations);
    const [tab, setTab] = useState<'destinations' | 'history'>('destinations');
    const [editing, setEditing] = useState<TrackingDestination | null | undefined>(undefined);
    const [busy, setBusy] = useState(false);

    async function remove(destination: TrackingDestination) {
        if (!window.confirm(`Remover ${destination.name}? Os próximos eventos não serão enviados.`))
            return;
        setBusy(true);
        try {
            const response = await fetch(
                `/api/tracking/destinations/${encodeURIComponent(destination.id)}`,
                { method: 'DELETE' },
            );
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok)
                throw new Error(payload.detail ?? 'Não foi possível remover o pixel.');
            setDestinations((current) => current.filter((item) => item.id !== destination.id));
            showToast({ tone: 'success', description: 'Destino removido.' });
        } catch (error) {
            showToast({ tone: 'error', description: message(error) });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-5">
            <section data-tour="tracking-summary" className="glass-panel rounded-[28px] p-6 sm:p-7">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border bg-brand-soft text-brand-strong">
                            <Icon name="chart" className="size-[19px]" />
                        </span>
                        <div>
                            <h2 className="text-[17px] font-semibold tracking-[-0.02em]">
                                Mensuração própria, sem scripts personalizados
                            </h2>
                            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-muted">
                                Conecte Meta, Google ou TikTok. O navegador respeita o consentimento
                                e as compras também podem ser confirmadas pelo servidor.
                            </p>
                        </div>
                    </div>
                    {canManage && (
                        <Button
                            data-tour="tracking-create"
                            variant="primary"
                            onClick={() => setEditing(null)}
                        >
                            <Icon name="plus" className="size-4" /> Adicionar pixel
                        </Button>
                    )}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Summary
                        label="Destinos ativos"
                        value={destinations.filter((item) => item.status === 'active').length}
                    />
                    <Summary
                        label="Envios concluídos"
                        value={deliveries.filter((item) => item.status === 'delivered').length}
                    />
                    <Summary
                        label="Falhas recentes"
                        value={deliveries.filter((item) => item.status === 'failed').length}
                        tone="danger"
                    />
                </div>
            </section>

            <div
                data-tour="tracking-tabs"
                className="flex w-fit rounded-xl border border-border bg-[var(--control-bg)] p-1"
            >
                <Tab active={tab === 'destinations'} onClick={() => setTab('destinations')}>
                    Destinos
                </Tab>
                <Tab active={tab === 'history'} onClick={() => setTab('history')}>
                    Histórico de envios
                </Tab>
            </div>

            {tab === 'destinations' ? (
                <section data-tour="tracking-destinations" className="space-y-3">
                    {destinations.length === 0 ? (
                        <Empty
                            title="Nenhum pixel configurado"
                            description="Adicione um destino para começar a medir seus checkouts."
                        />
                    ) : (
                        destinations.map((destination) => (
                            <DestinationCard
                                key={destination.id}
                                destination={destination}
                                canManage={canManage && !busy}
                                onEdit={() => setEditing(destination)}
                                onRemove={() => void remove(destination)}
                            />
                        ))
                    )}
                </section>
            ) : (
                <DeliveryHistory deliveries={deliveries} />
            )}

            {editing !== undefined && (
                <DestinationModal
                    destination={editing}
                    checkouts={checkouts.filter((checkout) => checkout.status !== 'archived')}
                    onClose={() => setEditing(undefined)}
                    onSaved={(saved) => {
                        setDestinations((current) => {
                            const exists = current.some((item) => item.id === saved.id);
                            return exists
                                ? current.map((item) => (item.id === saved.id ? saved : item))
                                : [saved, ...current];
                        });
                        setEditing(undefined);
                    }}
                />
            )}
        </div>
    );
}

function DestinationModal({
    destination,
    checkouts,
    onClose,
    onSaved,
}: {
    destination: TrackingDestination | null;
    checkouts: Checkout[];
    onClose(): void;
    onSaved(value: TrackingDestination): void;
}) {
    const [provider, setProvider] = useState<TrackingProvider>(destination?.provider ?? 'meta');
    const [name, setName] = useState(destination?.name ?? '');
    const [externalId, setExternalId] = useState(destination?.externalId ?? '');
    const [credential, setCredential] = useState('');
    const [browserEnabled, setBrowserEnabled] = useState(destination?.browserEnabled ?? true);
    const [serverEnabled, setServerEnabled] = useState(destination?.serverEnabled ?? true);
    const [scope, setScope] = useState(destination?.checkoutScope ?? 'all_checkouts');
    const [checkoutIds, setCheckoutIds] = useState(destination?.checkoutIds ?? []);
    const [enabledEvents, setEnabledEvents] = useState<TrackingEventName[]>(
        destination?.enabledEvents ?? events.map((event) => event.value),
    );
    const [busy, setBusy] = useState(false);
    const credentialName =
        provider === 'google' ? 'API Secret do Measurement Protocol' : 'Token de acesso';

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!browserEnabled && !serverEnabled)
            return showToast({
                tone: 'warning',
                description: 'Ative o envio pelo navegador ou servidor.',
            });
        if (scope === 'selected_checkouts' && !checkoutIds.length)
            return showToast({ tone: 'warning', description: 'Selecione pelo menos um checkout.' });
        if (serverEnabled && !credential && !destination?.credentialsConfigured)
            return showToast({
                tone: 'warning',
                description: `Informe ${credentialName.toLocaleLowerCase('pt-BR')}.`,
            });
        setBusy(true);
        try {
            const payload = {
                name,
                provider,
                externalId,
                ...(credential
                    ? {
                          credentials:
                              provider === 'google'
                                  ? { apiSecret: credential }
                                  : { accessToken: credential },
                      }
                    : {}),
                browserEnabled,
                serverEnabled,
                checkoutScope: scope,
                checkoutIds: scope === 'selected_checkouts' ? checkoutIds : [],
                enabledEvents,
                configuration: destination?.configuration ?? {},
                status: destination?.status ?? 'active',
            };
            const response = await fetch(
                destination
                    ? `/api/tracking/destinations/${encodeURIComponent(destination.id)}`
                    : '/api/tracking/destinations',
                {
                    method: destination ? 'PATCH' : 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload),
                },
            );
            const body = (await response.json()) as { data?: TrackingDestination; detail?: string };
            if (!response.ok || !body.data)
                throw new Error(body.detail ?? 'Não foi possível salvar o destino.');
            onSaved(body.data);
            showToast({
                tone: 'success',
                description: destination ? 'Destino atualizado.' : 'Pixel adicionado.',
            });
        } catch (error) {
            showToast({ tone: 'error', description: message(error) });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open labelledBy="tracking-modal-title" onClose={onClose} maxWidth="max-w-3xl">
            <form onSubmit={submit}>
                <ModalHeader
                    titleId="tracking-modal-title"
                    eyebrow="Mensuração"
                    title={destination ? 'Editar destino' : 'Adicionar pixel'}
                    description="As credenciais ficam criptografadas e nunca são enviadas ao checkout."
                    onClose={onClose}
                />
                <ModalBody className="grid gap-5 sm:grid-cols-2">
                    <Field label="Provedor">
                        <CustomSelect
                            name="provider"
                            value={provider}
                            onValueChange={(value) => setProvider(value as TrackingProvider)}
                            options={providers}
                            disabled={busy}
                        />
                    </Field>
                    <Field label="Nome interno">
                        <Input
                            value={name}
                            onChange={setName}
                            placeholder="Ex.: Meta principal"
                            required
                        />
                    </Field>
                    <Field
                        label={
                            provider === 'meta'
                                ? 'ID do pixel'
                                : provider === 'google'
                                  ? 'Measurement ID (G-...)'
                                  : 'ID do pixel TikTok'
                        }
                    >
                        <Input
                            value={externalId}
                            onChange={setExternalId}
                            placeholder={
                                provider === 'meta'
                                    ? '123456789012345'
                                    : provider === 'google'
                                      ? 'G-XXXXXXXXXX'
                                      : 'XXXXXXXXXX'
                            }
                            required
                        />
                    </Field>
                    <Field
                        label={credentialName}
                        hint={
                            destination?.credentialsConfigured
                                ? 'Deixe em branco para manter a credencial atual.'
                                : 'Necessário para o envio pelo servidor.'
                        }
                    >
                        <Input
                            value={credential}
                            onChange={setCredential}
                            type="password"
                            placeholder={
                                destination?.credentialsConfigured
                                    ? 'Credencial já configurada'
                                    : 'Cole a credencial'
                            }
                        />
                    </Field>
                    <fieldset className="sm:col-span-2">
                        <legend className="text-[12px] font-semibold text-muted">
                            Canais de envio
                        </legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <Check
                                checked={browserEnabled}
                                onChange={setBrowserEnabled}
                                label="Navegador"
                                help="Dispara somente após o consentimento."
                            />
                            <Check
                                checked={serverEnabled}
                                onChange={setServerEnabled}
                                label="Servidor"
                                help="Confirma compras aprovadas com deduplicação."
                            />
                        </div>
                    </fieldset>
                    <Field label="Aplicar em">
                        <CustomSelect
                            name="scope"
                            value={scope}
                            onValueChange={(value) => setScope(value as typeof scope)}
                            options={[
                                { value: 'all_checkouts', label: 'Todos os checkouts' },
                                { value: 'selected_checkouts', label: 'Checkouts selecionados' },
                            ]}
                        />
                    </Field>
                    {scope === 'selected_checkouts' && (
                        <fieldset className="rounded-2xl border border-border p-4 sm:col-span-2">
                            <legend className="px-1 text-[12px] font-semibold text-muted">
                                Checkouts
                            </legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {checkouts.map((checkout) => (
                                    <Check
                                        key={checkout.id}
                                        checked={checkoutIds.includes(checkout.id)}
                                        onChange={(checked) =>
                                            setCheckoutIds((current) =>
                                                checked
                                                    ? [...current, checkout.id]
                                                    : current.filter((id) => id !== checkout.id),
                                            )
                                        }
                                        label={checkout.name}
                                    />
                                ))}
                            </div>
                        </fieldset>
                    )}
                    <fieldset className="sm:col-span-2">
                        <legend className="text-[12px] font-semibold text-muted">Eventos</legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {events.map((item) => (
                                <Check
                                    key={item.value}
                                    checked={enabledEvents.includes(item.value)}
                                    onChange={(checked) =>
                                        setEnabledEvents((current) =>
                                            checked
                                                ? [...current, item.value]
                                                : current.filter((value) => value !== item.value),
                                        )
                                    }
                                    label={item.label}
                                    help={item.help}
                                />
                            ))}
                        </div>
                    </fieldset>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={
                            busy || !name.trim() || !externalId.trim() || !enabledEvents.length
                        }
                    >
                        {busy ? 'Salvando...' : 'Salvar destino'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

function DestinationCard({
    destination,
    canManage,
    onEdit,
    onRemove,
}: {
    destination: TrackingDestination;
    canManage: boolean;
    onEdit(): void;
    onRemove(): void;
}) {
    return (
        <article className="glass-panel rounded-[24px] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] font-semibold">{destination.name}</h3>
                        <Badge tone={destination.status === 'active' ? 'success' : 'neutral'}>
                            {destination.status === 'active' ? 'Ativo' : 'Desativado'}
                        </Badge>
                        <Badge tone="neutral">{providerLabel(destination.provider)}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted">
                        {destination.externalId} · {destination.browserEnabled ? 'Navegador' : ''}
                        {destination.browserEnabled && destination.serverEnabled ? ' + ' : ''}
                        {destination.serverEnabled ? 'Servidor' : ''}
                    </p>
                    <p className="mt-2 text-[12px] text-muted">
                        {destination.checkoutScope === 'all_checkouts'
                            ? 'Todos os checkouts'
                            : `${destination.checkoutIds.length} checkout(s)`}{' '}
                        · {destination.enabledEvents.length} evento(s)
                    </p>
                    {destination.lastFailureReason && (
                        <p className="mt-2 line-clamp-2 text-[12px] text-danger">
                            Última falha: {destination.lastFailureReason}
                        </p>
                    )}
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onEdit}>
                            <Icon name="edit" className="size-3.5" /> Editar
                        </Button>
                        <Button variant="danger" onClick={onRemove}>
                            <Icon name="trash" className="size-3.5" /> Remover
                        </Button>
                    </div>
                )}
            </div>
        </article>
    );
}

function DeliveryHistory({ deliveries }: { deliveries: TrackingDelivery[] }) {
    return (
        <section
            data-tour="tracking-history"
            className="glass-panel overflow-hidden rounded-[24px]"
        >
            {deliveries.length === 0 ? (
                <Empty
                    title="Nenhum envio server-side"
                    description="As conversões aparecerão aqui após pagamentos aprovados."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                        <thead className="border-b border-border bg-surface-muted/35 text-muted">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Destino</th>
                                <th className="px-5 py-3 font-semibold">Evento</th>
                                <th className="px-5 py-3 font-semibold">Pedido</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 font-semibold">Tentativas</th>
                                <th className="px-5 py-3 font-semibold">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map((delivery) => (
                                <tr
                                    key={delivery.id}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <td className="px-5 py-4">
                                        <span className="font-semibold">
                                            {delivery.destinationName}
                                        </span>
                                        <span className="block text-muted">
                                            {providerLabel(delivery.provider)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">Compra concluída</td>
                                    <td className="px-5 py-4 font-mono">{delivery.eventId}</td>
                                    <td className="px-5 py-4">
                                        <Badge
                                            tone={
                                                delivery.status === 'delivered'
                                                    ? 'success'
                                                    : delivery.status === 'failed'
                                                      ? 'danger'
                                                      : 'neutral'
                                            }
                                        >
                                            {deliveryStatus(delivery.status)}
                                        </Badge>
                                        {delivery.errorMessage && (
                                            <span
                                                title={delivery.errorMessage}
                                                className="mt-1 block max-w-56 truncate text-danger"
                                            >
                                                {delivery.errorMessage}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">{delivery.attemptCount}</td>
                                    <td className="px-5 py-4 text-muted">
                                        {new Intl.DateTimeFormat('pt-BR', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        }).format(new Date(delivery.createdAt))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="border-t border-border px-5 py-3 text-[11px] text-muted">
                Exibindo até os 100 envios mais recentes.
            </p>
        </section>
    );
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
    return (
        <div className="rounded-2xl border border-border bg-surface-muted/30 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-muted">
                {label}
            </p>
            <p
                className={`mt-1 text-[22px] font-semibold ${tone === 'danger' && value ? 'text-danger' : ''}`}
            >
                {value}
            </p>
        </div>
    );
}
function Tab({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick(): void;
    children: React.ReactNode;
}) {
    return (
        <Button
            onClick={onClick}
            className={`rounded-lg px-4 py-2 text-[12px] font-semibold ${active ? 'bg-brand-soft text-brand-strong' : 'text-muted hover:text-foreground'}`}
        >
            {children}
        </Button>
    );
}
function Empty({ title, description }: { title: string; description: string }) {
    return (
        <div className="glass-panel rounded-[24px] px-6 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                <Icon name="chart" className="size-5" />
            </span>
            <h3 className="mt-4 text-[16px] font-semibold">{title}</h3>
            <p className="mt-1 text-[13px] text-muted">{description}</p>
        </div>
    );
}
function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid content-start gap-2 text-[12px] font-semibold text-muted">
            {label}
            {children}
            {hint && <span className="text-[11px] font-normal leading-4">{hint}</span>}
        </label>
    );
}
function Input({
    value,
    onChange,
    placeholder,
    type = 'text',
    required,
}: {
    value: string;
    onChange(value: string): void;
    placeholder: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type={type}
            required={required}
            className="h-11 rounded-xl border border-border bg-[var(--control-bg)] px-4 text-[13px] font-medium text-foreground outline-none placeholder:text-muted/60 focus:border-brand/45 focus:ring-4 focus:ring-brand/10"
        />
    );
}
function Check({
    checked,
    onChange,
    label,
    help,
}: {
    checked: boolean;
    onChange(value: boolean): void;
    label: string;
    help?: string;
}) {
    return (
        <label className="flex cursor-pointer gap-3 rounded-xl border border-border bg-[var(--control-bg)] p-3">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span>
                <span className="block text-[12px] font-semibold text-foreground">{label}</span>
                {help && (
                    <span className="mt-0.5 block text-[11px] leading-4 text-muted">{help}</span>
                )}
            </span>
        </label>
    );
}
function Badge({
    tone,
    children,
}: {
    tone: 'success' | 'danger' | 'neutral';
    children: React.ReactNode;
}) {
    const styles =
        tone === 'success'
            ? 'bg-success-soft text-success'
            : tone === 'danger'
              ? 'bg-[#fff0f2] text-danger'
              : 'bg-surface-muted text-muted';
    return (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles}`}>
            {children}
        </span>
    );
}
function providerLabel(provider: TrackingProvider) {
    return providers.find((item) => item.value === provider)?.label ?? provider;
}
function deliveryStatus(status: TrackingDelivery['status']) {
    return { pending: 'Pendente', delivering: 'Enviando', delivered: 'Entregue', failed: 'Falhou' }[
        status
    ];
}
function message(error: unknown) {
    return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
