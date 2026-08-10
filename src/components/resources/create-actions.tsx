'use client';

import { Button } from '@/components/ui/button';

import { FormEvent, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CustomSelect, type SelectOption } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';

type ModalProps = {
    open: boolean;
    loading: boolean;
    title: string;
    eyebrow: string;
    description: string;
    submitLabel: string;
    close: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    children: ReactNode;
};

function ResourceModal(props: ModalProps) {
    return (
        <Modal
            open={props.open}
            onClose={props.loading ? () => undefined : props.close}
            labelledBy="resource-modal-title"
        >
            <form onSubmit={props.onSubmit}>
                <ModalHeader
                    eyebrow={props.eyebrow}
                    title={props.title}
                    description={props.description}
                    titleId="resource-modal-title"
                    onClose={props.loading ? () => undefined : props.close}
                />
                <ModalBody className="grid content-start gap-4 sm:grid-cols-2">
                    {props.children}
                </ModalBody>
                <ModalFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={props.loading}
                        onClick={props.close}
                    >
                        Cancelar
                    </Button>
                    <Button variant="primary" disabled={props.loading}>
                        {props.loading ? 'Salvando...' : props.submitLabel}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

function Trigger({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <Button type="button" variant="primary" onClick={onClick}>
            <Icon name="plus" className="size-3.5" />
            {label}
        </Button>
    );
}

function Field({
    label,
    wide,
    ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
    return (
        <label className={`text-[13px] font-semibold ${wide ? 'sm:col-span-2' : ''}`}>
            {label}
            <input
                {...input}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]"
            />
        </label>
    );
}

function SelectField({
    name,
    label,
    options,
    defaultValue,
}: {
    name: string;
    label: string;
    options: SelectOption[];
    defaultValue?: string;
}) {
    return (
        <label className="text-[13px] font-semibold">
            {label}
            <div className="mt-2">
                <CustomSelect name={name} defaultValue={defaultValue} options={options} />
            </div>
        </label>
    );
}

function useCreate(endpoint: string, after?: (body: Record<string, unknown>) => void) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function send(payload: unknown) {
        setLoading(true);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const body = (await response.json()) as Record<string, unknown> & { detail?: string };
        setLoading(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível concluir a operação.',
            });
            return false;
        }
        setOpen(false);
        after?.(body);
        showToast({
            tone: 'success',
            description: 'A operação foi concluída com sucesso.',
        });
        router.refresh();
        return true;
    }

    function close() {
        if (!loading) {
            setOpen(false);
        }
    }

    return { open, setOpen, loading, send, close };
}

export function FileUploadAction({ folderId }: { folderId?: string | null }) {
    const action = useCreate('/api/files');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const file = new FormData(event.currentTarget).get('file');
        if (!(file instanceof File) || !file.size) return;
        await action.send({
            originalName: file.name,
            contentType: fileContentType(file),
            contentBase64: await fileBase64(file),
            folderId: folderId ?? null,
        });
    }

    return (
        <>
            <Trigger label="Enviar arquivo" onClick={() => action.setOpen(true)} />
            <ResourceModal
                {...action}
                eyebrow="Conteúdo"
                title="Enviar arquivo"
                description="Adicione uma imagem ou documento de até 5 MB à biblioteca."
                submitLabel="Enviar arquivo"
                onSubmit={submit}
            >
                <label className="text-[13px] font-semibold sm:col-span-2">
                    Arquivo
                    <input
                        name="file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.txt,.csv,.tsv,.md,.json,.xml,.xsl,.rtf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp"
                        required
                        className="mt-2 block w-full rounded-xl border border-border bg-[var(--control-bg)] p-3 text-[12px] file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand-strong"
                    />
                </label>
            </ResourceModal>
        </>
    );
}

export function WebhookCreateAction() {
    const action = useCreate('/api/webhooks');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await action.send({
            name: form.get('name'),
            url: form.get('url'),
            subscribedEvents: form.getAll('subscribedEvents'),
        });
    }

    return (
        <>
            <Trigger label="Criar webhook" onClick={() => action.setOpen(true)} />
            <ResourceModal
                {...action}
                eyebrow="Integrações"
                title="Novo webhook"
                description="Cadastre um endpoint HTTPS e marque os eventos que ele receberá."
                submitLabel="Criar webhook"
                onSubmit={submit}
            >
                <Field name="name" label="Nome" placeholder="Ex.: Integração ERP" required />
                <Field
                    name="url"
                    label="URL do endpoint"
                    type="url"
                    placeholder="https://exemplo.com/webhooks"
                    required
                />
                <fieldset className="sm:col-span-2">
                    <legend className="text-[13px] font-semibold">Eventos</legend>
                    <div className="mt-2 grid gap-5">
                        {webhookEventGroups.map((group) => (
                            <section key={group.label}>
                                <p className="mb-2 text-[12px] font-semibold text-muted">
                                    {group.label}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {group.events.map((item) => (
                                        <CheckboxOption
                                            key={item.value}
                                            name="subscribedEvents"
                                            value={item.value}
                                            label={item.label}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                    <p className="mt-2 text-[11px] text-muted">Selecione pelo menos um evento.</p>
                </fieldset>
            </ResourceModal>
        </>
    );
}

const webhookEventGroups = [
    {
        label: 'Pagamentos',
        events: [
            { value: 'payment.approved', label: 'Pagamento aprovado' },
            { value: 'payment.failed', label: 'Pagamento falhou' },
            { value: 'payment.canceled', label: 'Pagamento cancelado' },
            { value: 'payment.refunded', label: 'Pagamento reembolsado' },
        ],
    },
    {
        label: 'Assinaturas',
        events: [
            { value: 'subscription.created', label: 'Assinatura criada' },
            { value: 'subscription.trial_started', label: 'Período de teste iniciado' },
            { value: 'subscription.activated', label: 'Assinatura ativada' },
            { value: 'subscription.renewed', label: 'Assinatura renovada' },
            { value: 'subscription.recovered', label: 'Assinatura recuperada' },
            { value: 'subscription.past_due', label: 'Pagamento da assinatura atrasado' },
            { value: 'subscription.unpaid', label: 'Assinatura não paga' },
            { value: 'subscription.paused', label: 'Assinatura pausada' },
            { value: 'subscription.resumed', label: 'Assinatura retomada' },
            { value: 'subscription.cancel_scheduled', label: 'Cancelamento agendado' },
            { value: 'subscription.canceled', label: 'Assinatura cancelada' },
            { value: 'subscription.expired', label: 'Assinatura expirada' },
            { value: 'subscription.plan_changed', label: 'Plano alterado' },
        ],
    },
    {
        label: 'Faturas',
        events: [
            { value: 'invoice.paid', label: 'Fatura paga' },
            { value: 'invoice.payment_failed', label: 'Pagamento da fatura falhou' },
        ],
    },
] as const;

export function ApiKeyCreateAction() {
    const [secret, setSecret] = useState<string>();
    const [selectedScopes, setSelectedScopes] = useState<string[]>([
        'analytics.read',
        'analytics.write',
    ]);
    const action = useCreate('/api/developer/api-keys', (body) =>
        setSecret(String((body.data as { secret?: string })?.secret ?? '')),
    );
    useEscapeClose(Boolean(secret), () => setSecret(undefined));

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (selectedScopes.length === 0) {
            showToast({ tone: 'warning', description: 'Selecione pelo menos um escopo.' });
            return;
        }
        const expiresInDays = Number(form.get('expiresInDays') ?? 0);
        await action.send({
            name: form.get('name'),
            scopes: selectedScopes,
            rateLimitPerMinute: Number(form.get('rateLimitPerMinute')),
            ...(expiresInDays > 0
                ? { expiresAt: new Date(Date.now() + expiresInDays * 86_400_000).toISOString() }
                : {}),
        });
    }

    return (
        <>
            <Trigger label="Criar chave" onClick={() => action.setOpen(true)} />
            <ResourceModal
                {...action}
                eyebrow="Desenvolvedores"
                title="Nova chave de API"
                description="Defina permissões mínimas, validade e limite de requisições da integração."
                submitLabel="Criar chave"
                onSubmit={submit}
            >
                <Field
                    name="name"
                    label="Nome"
                    placeholder="Ex.: Integração principal"
                    wide
                    required
                />
                <Field
                    name="rateLimitPerMinute"
                    label="Limite por minuto"
                    type="number"
                    min="1"
                    max="10000"
                    defaultValue="60"
                    required
                />
                <SelectField
                    name="expiresInDays"
                    label="Validade"
                    defaultValue="0"
                    options={[
                        { value: '0', label: 'Sem expiração' },
                        { value: '30', label: '30 dias' },
                        { value: '90', label: '90 dias' },
                        { value: '180', label: '180 dias' },
                        { value: '365', label: '1 ano' },
                    ]}
                />
                <fieldset className="sm:col-span-2">
                    <legend className="text-[13px] font-semibold">Escopos</legend>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-muted">Escolha as operações permitidas</p>
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    setSelectedScopes(
                                        apiKeyScopeGroups.flatMap((group) =>
                                            group.scopes.map((scope) => scope.value),
                                        ),
                                    )
                                }
                            >
                                Selecionar todos
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSelectedScopes([])}
                            >
                                Limpar
                            </Button>
                        </div>
                    </div>
                    <div className="mt-2 grid gap-5">
                        {apiKeyScopeGroups.map((group) => (
                            <section key={group.label}>
                                <p className="mb-2 text-[12px] font-semibold text-muted">
                                    {group.label}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {group.scopes.map((scope) => (
                                        <CheckboxOption
                                            key={scope.value}
                                            name="scopes"
                                            value={scope.value}
                                            label={scope.label}
                                            description={scope.description}
                                            checked={selectedScopes.includes(scope.value)}
                                            onChange={(checked) =>
                                                setSelectedScopes((current) =>
                                                    checked
                                                        ? [...new Set([...current, scope.value])]
                                                        : current.filter(
                                                              (item) => item !== scope.value,
                                                          ),
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-muted">
                        Conceda somente o necessário. A chave completa será exibida uma única vez.
                    </p>
                </fieldset>
            </ResourceModal>
            {secret &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setSecret(undefined);
                        }}
                        className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm"
                    >
                        <section className="modal-surface glass-panel my-6 w-full max-w-lg rounded-[26px] p-6">
                            <Icon name="check" className="size-5 text-success" />
                            <h2 className="mt-4 text-xl font-semibold">Chave criada</h2>
                            <p className="mt-2 text-[13px] text-muted">
                                Copie o segredo agora. Ele não será exibido novamente.
                            </p>
                            <code className="mt-4 block overflow-x-auto rounded-xl border border-border bg-[var(--control-bg)] p-3 text-xs">
                                {secret}
                            </code>
                            <div className="mt-6 flex justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="mr-2"
                                    onClick={() => {
                                        void navigator.clipboard.writeText(secret);
                                        showToast({
                                            tone: 'success',
                                            description: 'Chave copiada.',
                                        });
                                    }}
                                >
                                    <Icon name="copy" className="size-4" />
                                    Copiar chave
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => setSecret(undefined)}
                                >
                                    Concluir
                                </Button>
                            </div>
                        </section>
                    </div>,
                    document.body,
                )}
        </>
    );
}

const apiKeyScopeGroups = [
    {
        label: 'Analytics',
        scopes: [
            {
                value: 'analytics.read',
                label: 'Consultar analytics',
                description: 'Leitura de métricas e dados analíticos.',
            },
            {
                value: 'analytics.write',
                label: 'Enviar eventos',
                description: 'Ingestão idempotente de eventos analíticos.',
            },
        ],
    },
    {
        label: 'Uso da plataforma',
        scopes: [
            {
                value: 'usage.read',
                label: 'Consultar consumo',
                description: 'Leitura de uso e limites da organização.',
            },
            {
                value: 'usage.write',
                label: 'Registrar consumo',
                description: 'Registro idempotente de consumo por recurso.',
            },
        ],
    },
] as const;

function CheckboxOption({
    name,
    value,
    label,
    description,
    checked,
    onChange,
}: {
    name: string;
    value: string;
    label: string;
    description?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-start gap-3 rounded-xl border border-border bg-[var(--control-bg)] p-3 text-[12px] transition hover:border-brand/30">
            <input
                name={name}
                value={value}
                type="checkbox"
                checked={checked}
                onChange={
                    onChange === undefined ? undefined : (event) => onChange(event.target.checked)
                }
                className="mt-0.5 size-4 shrink-0 accent-brand"
            />
            <span>
                <span className="block font-semibold text-foreground">{label}</span>
                {description && (
                    <span className="mt-1 block leading-4 text-muted">{description}</span>
                )}
            </span>
        </label>
    );
}

export function ShippingCreateAction() {
    const [rateType, setRateType] = useState('fixed');
    const action = useCreate('/api/shipping-profiles');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await action.send({
            name: form.get('name'),
            zones: [
                {
                    name: form.get('zoneName'),
                    countryCode: 'BR',
                    stateCodes: String(form.get('states') ?? '')
                        .toUpperCase()
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    postalCodeRanges: [],
                    rates: [
                        {
                            name: form.get('rateName'),
                            type: rateType,
                            amountMinor:
                                rateType === 'fixed'
                                    ? Math.round(Number(form.get('amount')) * 100)
                                    : 0,
                            currency: 'BRL',
                            estimatedDaysMin: Number(form.get('daysMin')),
                            estimatedDaysMax: Number(form.get('daysMax')),
                        },
                    ],
                },
            ],
        });
    }

    return (
        <>
            <Trigger label="Criar perfil" onClick={() => action.setOpen(true)} />
            <ResourceModal
                {...action}
                eyebrow="Operação"
                title="Novo perfil de frete"
                description="Configure uma zona inicial e sua primeira tarifa de entrega."
                submitLabel="Criar perfil"
                onSubmit={submit}
            >
                <Field
                    name="name"
                    label="Nome do perfil"
                    placeholder="Ex.: Entregas nacionais"
                    required
                />
                <Field name="zoneName" label="Nome da zona" placeholder="Ex.: Brasil" required />
                <Field name="states" label="Estados (opcional)" placeholder="SP, RJ, MG" wide />
                <Field
                    name="rateName"
                    label="Nome da tarifa"
                    placeholder="Ex.: Entrega padrão"
                    required
                />
                <label className="text-[13px] font-semibold">
                    Tipo
                    <div className="mt-2">
                        <CustomSelect
                            name="rateType"
                            value={rateType}
                            onValueChange={setRateType}
                            options={[
                                { value: 'fixed', label: 'Valor fixo' },
                                { value: 'free', label: 'Grátis' },
                                { value: 'pickup', label: 'Retirada' },
                            ]}
                        />
                    </div>
                </label>
                {rateType === 'fixed' && (
                    <Field
                        name="amount"
                        label="Valor (R$)"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                    />
                )}
                <Field name="daysMin" label="Prazo mínimo (dias)" type="number" min="0" required />
                <Field name="daysMax" label="Prazo máximo (dias)" type="number" min="0" required />
            </ResourceModal>
        </>
    );
}

export type SubscriptionOption = { value: string; label: string };

export function SubscriptionCreateAction({
    customers,
    prices,
    gateways,
}: {
    customers: SubscriptionOption[];
    prices: SubscriptionOption[];
    gateways: SubscriptionOption[];
}) {
    const action = useCreate('/api/subscriptions');
    const unavailable = !customers.length || !prices.length || !gateways.length;

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await action.send({
            customerId: form.get('customerId'),
            priceId: form.get('priceId'),
            gatewayConnectionId: form.get('gatewayConnectionId'),
            trialDays: Number(form.get('trialDays') || 0),
            cancelAtPeriodEnd: false,
        });
    }

    return (
        <>
            <Trigger
                label="Criar assinatura"
                onClick={() => (unavailable ? action.setOpen(true) : action.setOpen(true))}
            />
            <ResourceModal
                {...action}
                eyebrow="Recorrência"
                title="Nova assinatura"
                description={
                    unavailable
                        ? 'Cadastre um cliente, um preço recorrente e conecte um gateway antes de continuar.'
                        : 'Vincule um cliente a um plano recorrente e gateway ativo.'
                }
                submitLabel="Criar assinatura"
                onSubmit={submit}
            >
                <SelectField name="customerId" label="Cliente" options={customers} />
                <SelectField name="priceId" label="Plano recorrente" options={prices} />
                <SelectField name="gatewayConnectionId" label="Gateway" options={gateways} />
                <Field
                    name="trialDays"
                    label="Teste grátis (dias)"
                    type="number"
                    min="0"
                    max="365"
                    defaultValue="0"
                />
            </ResourceModal>
        </>
    );
}

export function InventoryAdjustAction({
    id,
    version,
    product,
}: {
    id: string;
    version: number;
    product: string;
}) {
    const action = useCreate(`/api/inventory/${id}/adjustments`);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await action.send({
            quantityDelta: Number(form.get('quantityDelta')),
            reason: form.get('reason'),
            version,
        });
    }

    return (
        <>
            <Button type="button" variant="ghost" onClick={() => action.setOpen(true)}>
                Ajustar
            </Button>
            <ResourceModal
                {...action}
                eyebrow="Estoque"
                title="Ajustar saldo"
                description={`Informe a variação de estoque para ${product}. Use valores negativos para saída.`}
                submitLabel="Aplicar ajuste"
                onSubmit={submit}
            >
                <Field
                    name="quantityDelta"
                    label="Variação"
                    type="number"
                    step="0.01"
                    placeholder="Ex.: 10 ou -2"
                    required
                />
                <Field
                    name="reason"
                    label="Motivo"
                    placeholder="Ex.: Entrada de mercadoria"
                    required
                />
            </ResourceModal>
        </>
    );
}

async function fileBase64(file: File) {
    const buffer = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let index = 0; index < bytes.length; index += 1)
        binary += String.fromCharCode(bytes[index]);
    return btoa(binary);
}

function fileContentType(file: File) {
    const extension = file.name.split('.').at(-1)?.toLowerCase();
    return (
        (
            {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                webp: 'image/webp',
                gif: 'image/gif',
                avif: 'image/avif',
                txt: 'text/plain',
                csv: 'text/csv',
                tsv: 'text/tab-separated-values',
                md: 'text/markdown',
                json: 'application/json',
                xml: 'application/xml',
                xsl: 'application/xml',
                rtf: 'application/rtf',
                pdf: 'application/pdf',
                doc: 'application/msword',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ppt: 'application/vnd.ms-powerpoint',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                xls: 'application/vnd.ms-excel',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                odt: 'application/vnd.oasis.opendocument.text',
                ods: 'application/vnd.oasis.opendocument.spreadsheet',
                odp: 'application/vnd.oasis.opendocument.presentation',
            } as Record<string, string>
        )[extension ?? ''] ??
        (file.type || 'application/octet-stream')
    );
}
