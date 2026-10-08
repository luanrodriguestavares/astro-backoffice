'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import type {
    Checkout,
    GatewayConnection,
    GatewayRoutingRule,
    Product,
    RoutingPaymentMethod,
} from '@/lib/api/types';

type SelectableMethod = Exclude<RoutingPaymentMethod, 'bank_transfer'>;

const methodLabels: Record<SelectableMethod, string> = {
    card: 'Cartão',
    pix: 'Pix',
    boleto: 'Boleto',
};

const maxFallbacks = 3;

interface RuleForm {
    name: string;
    gatewayConnectionId: string;
    fallbackGatewayConnectionIds: string[];
    paymentMethods: RoutingPaymentMethod[];
    minAmount: string;
    maxAmount: string;
    checkoutIds: string[];
    productIds: string[];
    splitTraffic: boolean;
    trafficPercentage: number;
    strategy: 'priority' | 'lowest_cost';
}

export function RoutingRules({
    rules,
    connections,
    checkouts,
    products,
}: {
    rules: GatewayRoutingRule[];
    connections: GatewayConnection[];
    checkouts: Checkout[];
    products: Product[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    // "Nova regra" de outras páginas chega com ?new=1 e já abre o formulário.
    const [editing, setEditing] = useState<GatewayRoutingRule | 'new' | null>(() =>
        searchParams.get('new') === '1' ? 'new' : null,
    );
    // O modal usa portal no document: só pode existir depois de montar no navegador.
    const mounted = useSyncExternalStore(
        noSubscription,
        () => true,
        () => false,
    );
    const [busy, setBusy] = useState(false);
    const usable = connections.filter((connection) => connection.status !== 'disabled');
    const connectionName = (id: string) =>
        connections.find((connection) => connection.id === id)?.name ?? 'Gateway removido';

    async function send(url: string, init: RequestInit, success: string) {
        setBusy(true);
        const response = await fetch(url, {
            ...init,
            headers: { 'content-type': 'application/json' },
        });
        const body = (await response.json()) as { detail?: string };
        setBusy(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível atualizar as regras.',
            });
            return;
        }
        showToast({ tone: 'success', description: success });
        router.refresh();
    }

    function move(index: number, offset: -1 | 1) {
        const ids = rules.map(({ id }) => id);
        const target = index + offset;
        if (target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target] as string, ids[index] as string];
        void send(
            '/api/gateway-routing-rules/order',
            { method: 'PUT', body: JSON.stringify({ ruleIds: ids }) },
            'Ordem atualizada.',
        );
    }

    return (
        <section className="glass-panel rounded-[24px] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Suas regras</h2>
                    <p className="mt-1 max-w-xl text-[13px] leading-5 text-muted">
                        O Astro confere as regras de cima para baixo e usa a primeira que servir
                        para a venda.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="primary"
                    disabled={usable.length === 0}
                    onClick={() => setEditing('new')}
                >
                    <Icon name="plus" className="size-3.5" />
                    Nova regra
                </Button>
            </div>

            {rules.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-surface-muted/60 px-5 py-6">
                    <p className="text-[14px] font-semibold">Você ainda não precisa de regras</p>
                    <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted">
                        Sem regras, cada checkout cobra com o gateway escolhido nele. Crie uma regra
                        só quando quiser tratar vendas diferentes de jeitos diferentes, por exemplo:
                    </p>
                    <ul className="mt-3 space-y-1.5 text-[13px]">
                        <li>• Pix acima de R$ 500 no gateway com a menor taxa</li>
                        <li>• Vendas de um checkout específico sempre em um gateway</li>
                        <li>• Mandar parte das vendas para um gateway novo, para testar</li>
                    </ul>
                </div>
            ) : (
                <ol className="mt-5 divide-y divide-border/70 border-y border-border/70">
                    {rules.map((rule, index) => (
                        <li
                            key={rule.id}
                            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                        >
                            <span
                                className="w-7 shrink-0 text-[13px] font-semibold tabular-nums text-muted"
                                title="Ordem em que a regra é conferida"
                            >
                                {index + 1}º
                            </span>
                            <div
                                className={`min-w-0 flex-1 ${rule.status === 'inactive' ? 'opacity-55' : ''}`}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-[14px] font-semibold">{rule.name}</h3>
                                    {rule.status === 'inactive' && (
                                        <Badge tone="muted">Pausada</Badge>
                                    )}
                                </div>
                                <p className="mt-0.5 text-[13px] text-muted">
                                    {conditionsSentence(rule.conditions, checkouts, products)}
                                    {rule.trafficPercentage < 100 &&
                                        ` · só ${String(rule.trafficPercentage)}% delas`}
                                </p>
                                <p className="mt-1 text-[13px]">
                                    {rule.strategy === 'lowest_cost' ? (
                                        <>
                                            Cobra com o mais barato entre{' '}
                                            <strong className="font-semibold">
                                                {[
                                                    rule.gatewayConnectionId,
                                                    ...rule.fallbackGatewayConnectionIds,
                                                ]
                                                    .map(connectionName)
                                                    .join(', ')}
                                            </strong>
                                        </>
                                    ) : (
                                        <>
                                            Cobra com{' '}
                                            <strong className="font-semibold">
                                                {connectionName(rule.gatewayConnectionId)}
                                            </strong>
                                            {rule.fallbackGatewayConnectionIds.length > 0 && (
                                                <span className="text-muted">
                                                    {' '}
                                                    · reserva:{' '}
                                                    {rule.fallbackGatewayConnectionIds
                                                        .map(connectionName)
                                                        .join(', ')}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="h-9 px-4"
                                    onClick={() => setEditing(rule)}
                                >
                                    Editar
                                </Button>
                                <RuleMenu
                                    disabled={busy}
                                    items={[
                                        ...(index > 0
                                            ? [
                                                  {
                                                      label: 'Conferir antes',
                                                      onSelect: () => move(index, -1),
                                                  },
                                              ]
                                            : []),
                                        ...(index < rules.length - 1
                                            ? [
                                                  {
                                                      label: 'Conferir depois',
                                                      onSelect: () => move(index, 1),
                                                  },
                                              ]
                                            : []),
                                        {
                                            label: rule.status === 'active' ? 'Pausar' : 'Ativar',
                                            onSelect: () =>
                                                void send(
                                                    `/api/gateway-routing-rules/${encodeURIComponent(rule.id)}`,
                                                    {
                                                        method: 'PATCH',
                                                        body: JSON.stringify({
                                                            status:
                                                                rule.status === 'active'
                                                                    ? 'inactive'
                                                                    : 'active',
                                                        }),
                                                    },
                                                    rule.status === 'active'
                                                        ? 'Regra pausada.'
                                                        : 'Regra ativada.',
                                                ),
                                        },
                                        {
                                            label: 'Excluir',
                                            danger: true,
                                            onSelect: () => {
                                                if (
                                                    window.confirm(
                                                        `Excluir a regra "${rule.name}"?`,
                                                    )
                                                )
                                                    void send(
                                                        `/api/gateway-routing-rules/${encodeURIComponent(rule.id)}`,
                                                        { method: 'DELETE' },
                                                        'Regra excluída.',
                                                    );
                                            },
                                        },
                                    ]}
                                />
                            </div>
                        </li>
                    ))}
                    <li className="flex gap-3 py-4 text-[13px] text-muted">
                        <span className="w-7 shrink-0" />
                        <p>
                            <span className="font-semibold text-foreground">
                                Se nenhuma regra servir,
                            </span>{' '}
                            a venda é cobrada com o gateway escolhido no próprio checkout.
                        </p>
                    </li>
                </ol>
            )}

            {mounted && editing !== null && (
                <RoutingRuleModal
                    rule={editing === 'new' ? undefined : editing}
                    connections={usable}
                    checkouts={checkouts}
                    products={products}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        router.refresh();
                    }}
                />
            )}
        </section>
    );
}

function Badge({
    tone,
    children,
}: {
    tone: 'muted' | 'success' | 'brand';
    children: React.ReactNode;
}) {
    const tones = {
        muted: 'bg-surface-muted text-muted',
        success: 'bg-[#e8f7f1] text-success',
        brand: 'bg-brand-soft text-brand-strong',
    };
    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
            {children}
        </span>
    );
}

function RuleMenu({
    items,
    disabled,
}: {
    items: { label: string; danger?: boolean; onSelect(): void }[];
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        function close(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }
        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, [open]);
    return (
        <div ref={root} className="relative">
            <Button
                type="button"
                variant="icon"
                aria-label="Mais ações"
                aria-haspopup="menu"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((value) => !value)}
                className="rounded-xl"
            >
                <Icon name="dots" className="size-4" />
            </Button>
            {open && (
                <div
                    role="menu"
                    className="glass-popover absolute right-0 top-11 z-50 w-44 rounded-xl p-1.5 shadow-[0_12px_32px_rgba(16,18,20,0.14)]"
                >
                    {items.map((item) => (
                        <Button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            variant="unstyled"
                            onClick={() => {
                                setOpen(false);
                                item.onSelect();
                            }}
                            className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-[13px] transition hover:bg-surface-muted ${item.danger ? 'text-danger' : ''}`}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

function RoutingRuleModal({
    rule,
    connections,
    checkouts,
    products,
    onClose,
    onSaved,
}: {
    rule: GatewayRoutingRule | undefined;
    connections: GatewayConnection[];
    checkouts: Checkout[];
    products: Product[];
    onClose(): void;
    onSaved(): void;
}) {
    const [form, setForm] = useState<RuleForm>(() => initialForm(rule));
    const [saving, setSaving] = useState(false);
    const update = (patch: Partial<RuleForm>) => setForm((current) => ({ ...current, ...patch }));
    const primary = connections.find(({ id }) => id === form.gatewayConnectionId);
    // A API exige o mesmo ambiente em toda a cascata.
    const fallbackOptions = connections.filter(
        (connection) =>
            primary !== undefined &&
            connection.id !== primary.id &&
            connection.environment === primary.environment,
    );
    const unusedFallbacks = fallbackOptions.filter(
        ({ id }) => !form.fallbackGatewayConnectionIds.includes(id),
    );
    const minAmountMinor = toMinor(form.minAmount);
    const maxAmountMinor = toMinor(form.maxAmount);
    const conditions = {
        ...(form.paymentMethods.length ? { paymentMethods: form.paymentMethods } : {}),
        ...(minAmountMinor === undefined ? {} : { minAmountMinor }),
        ...(maxAmountMinor === undefined ? {} : { maxAmountMinor }),
        ...(form.checkoutIds.length ? { checkoutIds: form.checkoutIds } : {}),
        ...(form.productIds.length ? { productIds: form.productIds } : {}),
    };
    const connectionName = (id: string) =>
        connections.find((connection) => connection.id === id)?.name ?? '';
    const missingFees = [form.gatewayConnectionId, ...form.fallbackGatewayConnectionIds]
        .filter(Boolean)
        .filter((id) => {
            const fees = connections.find((connection) => connection.id === id)?.feeSchedule;
            return !fees || Object.keys(fees).length === 0;
        })
        .map(connectionName);

    async function save() {
        if (form.name.trim().length < 2) {
            showToast({ tone: 'error', description: 'Dê um nome para a regra.' });
            return;
        }
        if (!form.gatewayConnectionId) {
            showToast({
                tone: 'error',
                description: 'Escolha o gateway que será tentado primeiro.',
            });
            return;
        }
        if (
            minAmountMinor !== undefined &&
            maxAmountMinor !== undefined &&
            maxAmountMinor < minAmountMinor
        ) {
            showToast({
                tone: 'error',
                description: 'O valor máximo precisa ser maior que o mínimo.',
            });
            return;
        }
        setSaving(true);
        const response = await fetch(
            rule
                ? `/api/gateway-routing-rules/${encodeURIComponent(rule.id)}`
                : '/api/gateway-routing-rules',
            {
                method: rule ? 'PATCH' : 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    trafficPercentage: form.splitTraffic ? form.trafficPercentage : 100,
                    strategy: form.strategy,
                    gatewayConnectionId: form.gatewayConnectionId,
                    fallbackGatewayConnectionIds: form.fallbackGatewayConnectionIds,
                    conditions,
                }),
            },
        );
        const body = (await response.json()) as { detail?: string };
        setSaving(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível salvar a regra.',
            });
            return;
        }
        showToast({ tone: 'success', description: rule ? 'Regra atualizada.' : 'Regra criada.' });
        onSaved();
    }

    return (
        <Modal open onClose={onClose} labelledBy="routing-rule-title" maxWidth="max-w-5xl">
            <ModalHeader
                eyebrow="Regra"
                title={rule ? 'Editar regra' : 'Nova regra'}
                titleId="routing-rule-title"
                description="Escolha quais vendas esta regra vale e qual gateway vai cobrar."
                onClose={onClose}
            />
            <ModalBody>
                <label className="block text-[12px] font-semibold">
                    Nome da regra
                    <input
                        value={form.name}
                        maxLength={160}
                        onChange={(event) => update({ name: event.target.value })}
                        placeholder="Ex.: Pix de alto valor"
                        className={inputClass}
                    />
                </label>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <Step
                        number={1}
                        title="Quais vendas?"
                        description="Deixe em branco o que não importar."
                    >
                        <div className="space-y-4">
                            <ChipField
                                label="Forma de pagamento"
                                emptyLabel="Todas"
                                options={(Object.keys(methodLabels) as SelectableMethod[]).map(
                                    (method) => ({ value: method, label: methodLabels[method] }),
                                )}
                                selected={form.paymentMethods}
                                onChange={(paymentMethods) =>
                                    update({
                                        paymentMethods: paymentMethods as RoutingPaymentMethod[],
                                    })
                                }
                            />
                            <div>
                                <span className="block text-[12px] font-semibold">
                                    Valor da venda
                                </span>
                                <div className="mt-2 flex items-center gap-2">
                                    <MoneyInput
                                        label="Valor mínimo"
                                        value={form.minAmount}
                                        placeholder="Qualquer"
                                        onChange={(minAmount) => update({ minAmount })}
                                    />
                                    <span className="text-[11px] text-muted">até</span>
                                    <MoneyInput
                                        label="Valor máximo"
                                        value={form.maxAmount}
                                        placeholder="Sem limite"
                                        onChange={(maxAmount) => update({ maxAmount })}
                                    />
                                </div>
                            </div>
                            {checkouts.length > 0 && (
                                <ChipField
                                    label="Checkout"
                                    emptyLabel="Todos"
                                    options={checkouts.map(({ id, name }) => ({
                                        value: id,
                                        label: name,
                                    }))}
                                    selected={form.checkoutIds}
                                    onChange={(checkoutIds) => update({ checkoutIds })}
                                />
                            )}
                            {products.length > 0 && (
                                <ChipField
                                    label="Produto no pedido"
                                    emptyLabel="Todos"
                                    options={products.map(({ id, name }) => ({
                                        value: id,
                                        label: name,
                                    }))}
                                    selected={form.productIds}
                                    onChange={(productIds) => update({ productIds })}
                                />
                            )}
                        </div>
                    </Step>

                    <div className="space-y-6">
                        <Step
                            number={2}
                            title="Qual gateway cobra?"
                            description="Se ele falhar, a venda passa para o reserva sem o cliente perceber."
                        >
                            <ol>
                                <FlowItem
                                    label={
                                        form.strategy === 'lowest_cost'
                                            ? 'Gateway'
                                            : 'Gateway principal'
                                    }
                                    last={
                                        !form.fallbackGatewayConnectionIds.length &&
                                        !unusedFallbacks.length
                                    }
                                >
                                    <CustomSelect
                                        name="routingPrimary"
                                        value={form.gatewayConnectionId}
                                        placeholder="Escolha o gateway"
                                        options={connections.map(connectionOption)}
                                        onValueChange={(value) => {
                                            const environment = connections.find(
                                                (connection) => connection.id === value,
                                            )?.environment;
                                            update({
                                                gatewayConnectionId: value,
                                                fallbackGatewayConnectionIds:
                                                    form.fallbackGatewayConnectionIds.filter(
                                                        (id) =>
                                                            id !== value &&
                                                            connections.find(
                                                                (connection) =>
                                                                    connection.id === id,
                                                            )?.environment === environment,
                                                    ),
                                            });
                                        }}
                                    />
                                </FlowItem>
                                {form.fallbackGatewayConnectionIds.map((id, position) => (
                                    <FlowItem
                                        key={id}
                                        label={
                                            form.strategy === 'lowest_cost'
                                                ? 'Gateway'
                                                : 'Reserva, se o anterior falhar'
                                        }
                                        last={
                                            position ===
                                                form.fallbackGatewayConnectionIds.length - 1 &&
                                            (form.fallbackGatewayConnectionIds.length >=
                                                maxFallbacks ||
                                                !unusedFallbacks.length)
                                        }
                                        onRemove={() =>
                                            update({
                                                fallbackGatewayConnectionIds:
                                                    form.fallbackGatewayConnectionIds.filter(
                                                        (_, index) => index !== position,
                                                    ),
                                            })
                                        }
                                    >
                                        <CustomSelect
                                            name={`routingFallback_${String(position)}`}
                                            value={id}
                                            options={fallbackOptions
                                                .filter(
                                                    (connection) =>
                                                        connection.id === id ||
                                                        !form.fallbackGatewayConnectionIds.includes(
                                                            connection.id,
                                                        ),
                                                )
                                                .map(connectionOption)}
                                            onValueChange={(value) =>
                                                update({
                                                    fallbackGatewayConnectionIds:
                                                        form.fallbackGatewayConnectionIds.map(
                                                            (item, index) =>
                                                                index === position ? value : item,
                                                        ),
                                                })
                                            }
                                        />
                                    </FlowItem>
                                ))}
                                {primary !== undefined &&
                                    form.fallbackGatewayConnectionIds.length < maxFallbacks &&
                                    unusedFallbacks.length > 0 && (
                                        <li>
                                            <Button
                                                type="button"
                                                variant="unstyled"
                                                onClick={() => {
                                                    const next = unusedFallbacks[0];
                                                    if (next)
                                                        update({
                                                            fallbackGatewayConnectionIds: [
                                                                ...form.fallbackGatewayConnectionIds,
                                                                next.id,
                                                            ],
                                                        });
                                                }}
                                                className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-[11px] font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
                                            >
                                                <Icon name="plus" className="size-3" />
                                                Adicionar reserva
                                            </Button>
                                        </li>
                                    )}
                            </ol>
                            {form.fallbackGatewayConnectionIds.length > 0 && (
                                <div className="mt-5">
                                    <p className="mb-2 text-[12px] font-semibold">
                                        Qual usar primeiro?
                                    </p>
                                    <div
                                        role="radiogroup"
                                        aria-label="Ordem dos gateways"
                                        className="grid gap-2 sm:grid-cols-2"
                                    >
                                        {(
                                            [
                                                {
                                                    value: 'priority',
                                                    title: 'Sempre nesta ordem',
                                                    description:
                                                        'Principal primeiro; reservas se ele falhar.',
                                                },
                                                {
                                                    value: 'lowest_cost',
                                                    title: 'O mais barato primeiro',
                                                    description:
                                                        'A cada venda, pela menor taxa entre os que aprovam bem.',
                                                },
                                            ] as const
                                        ).map((option) => {
                                            const selected = form.strategy === option.value;
                                            return (
                                                <Button
                                                    key={option.value}
                                                    type="button"
                                                    variant="unstyled"
                                                    role="radio"
                                                    aria-checked={selected}
                                                    onClick={() =>
                                                        update({ strategy: option.value })
                                                    }
                                                    className={`rounded-2xl border p-3 text-left transition ${
                                                        selected
                                                            ? 'border-foreground bg-[var(--control-bg)] shadow-[inset_0_0_0_1px_var(--foreground)]'
                                                            : 'border-border hover:border-foreground/30'
                                                    }`}
                                                >
                                                    <span className="block text-[12px] font-semibold">
                                                        {option.title}
                                                    </span>
                                                    <span className="mt-0.5 block text-[11px] leading-4 text-muted">
                                                        {option.description}
                                                    </span>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    {form.strategy === 'lowest_cost' && missingFees.length > 0 && (
                                        <p className="mt-2 rounded-xl bg-[#fff5e9] px-3 py-2 text-[11px] leading-4 text-[#78590b]">
                                            Sem taxa cadastrada: {missingFees.join(', ')}. Esses
                                            gateways ficam depois dos que têm taxa. Informe em
                                            Orquestração › Taxas.
                                        </p>
                                    )}
                                </div>
                            )}
                            {primary !== undefined && fallbackOptions.length === 0 && (
                                <p className="mt-2 text-[11px] text-muted">
                                    Conecte outro gateway em{' '}
                                    {primary.environment === 'production' ? 'produção' : 'sandbox'}{' '}
                                    para ter um reserva.
                                </p>
                            )}
                        </Step>

                        <Step
                            number={3}
                            title="Dividir vendas"
                            description="Opcional. Mande só uma parte das vendas por esta regra para comparar gateways."
                            action={
                                <Toggle
                                    label="Dividir vendas"
                                    checked={form.splitTraffic}
                                    onChange={(splitTraffic) => update({ splitTraffic })}
                                />
                            }
                        >
                            {form.splitTraffic && (
                                <div className="rounded-2xl border border-border bg-[var(--control-bg)] p-4">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[22px] font-semibold tracking-[-0.03em]">
                                            {form.trafficPercentage}%
                                        </span>
                                        <span className="text-[11px] text-muted">
                                            {100 - form.trafficPercentage}% seguem para as regras
                                            abaixo
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={5}
                                        max={95}
                                        step={5}
                                        value={form.trafficPercentage}
                                        aria-label="Porcentagem das vendas"
                                        onChange={(event) =>
                                            update({
                                                trafficPercentage: Number(event.target.value),
                                            })
                                        }
                                        className="mt-3 w-full accent-[var(--brand)]"
                                    />
                                </div>
                            )}
                        </Step>
                    </div>
                </div>

                <div className="mt-6 flex gap-3 rounded-2xl bg-brand-soft/60 px-4 py-3.5">
                    <Icon name="bolt" className="mt-0.5 size-4 shrink-0 text-brand" />
                    <p className="text-[12px] leading-5">
                        <span className="font-semibold">Resumo: </span>
                        {form.splitTraffic
                            ? `${String(form.trafficPercentage)}% das vendas `
                            : 'Vendas '}
                        {conditionsSentence(conditions, checkouts, products, true)}
                        {!primary
                            ? ' — escolha o gateway que será tentado primeiro.'
                            : form.strategy === 'lowest_cost' &&
                                form.fallbackGatewayConnectionIds.length > 0
                              ? ` vão para o mais barato entre ${[primary.name, ...form.fallbackGatewayConnectionIds.map(connectionName)].join(', ')}; se ele falhar, para o próximo mais barato.`
                              : ` vão para ${primary.name}${form.fallbackGatewayConnectionIds
                                    .map((id) => `; se falhar, ${connectionName(id)}`)
                                    .join('')}.`}
                    </p>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
                    Cancelar
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    onClick={() => void save()}
                    disabled={saving}
                >
                    {saving ? 'Salvando...' : rule ? 'Salvar alterações' : 'Criar regra'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}

const inputBaseClass =
    'block h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] text-[13px] font-normal outline-none transition focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]';
const inputClass = `${inputBaseClass} mt-2 px-3.5`;

function Step({
    number,
    title,
    description,
    action,
    children,
}: {
    number: number;
    title: string;
    description: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                        {number}
                    </span>
                    <div>
                        <h3 className="text-[13px] font-semibold">{title}</h3>
                        <p className="mt-0.5 text-[11px] leading-4 text-muted">{description}</p>
                    </div>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function FlowItem({
    label,
    onRemove,
    children,
}: {
    label: string;
    last?: boolean;
    onRemove?: () => void;
    children: React.ReactNode;
}) {
    return (
        <li className="pb-3">
            <span className="block text-[12px] font-semibold">{label}</span>
            <div className="mt-1.5 flex items-center gap-2">
                <div className="min-w-0 flex-1">{children}</div>
                {onRemove && (
                    <Button
                        type="button"
                        variant="icon"
                        aria-label="Remover reserva"
                        onClick={onRemove}
                    >
                        <Icon name="close" className="size-3.5" />
                    </Button>
                )}
            </div>
        </li>
    );
}

function ChipField({
    label,
    emptyLabel,
    options,
    selected,
    onChange,
}: {
    label: string;
    emptyLabel: string;
    options: { value: string; label: string }[];
    selected: string[];
    onChange(selected: string[]): void;
}) {
    const chip = (active: boolean) =>
        `rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
            active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-[var(--control-bg)] text-muted hover:text-foreground'
        }`;
    return (
        // Grupo, não <label>: um label repassaria cliques no espaço vazio ao primeiro botão.
        <div role="group" aria-label={label}>
            <span className="block text-[12px] font-semibold">{label}</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
                <Button
                    type="button"
                    variant="unstyled"
                    aria-pressed={selected.length === 0}
                    onClick={() => onChange([])}
                    className={chip(selected.length === 0)}
                >
                    {emptyLabel}
                </Button>
                {options.map((option) => {
                    const active = selected.includes(option.value);
                    return (
                        <Button
                            key={option.value}
                            type="button"
                            variant="unstyled"
                            aria-pressed={active}
                            onClick={() =>
                                onChange(
                                    active
                                        ? selected.filter((value) => value !== option.value)
                                        : [...selected, option.value],
                                )
                            }
                            className={chip(active)}
                        >
                            {option.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

function MoneyInput({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    placeholder: string;
    onChange(value: string): void;
}) {
    // Um único input com o prefixo sobreposto: o estilo global de inputs do modal
    // desenharia uma segunda caixa se o input ficasse dentro de outra moldura.
    return (
        <label className="relative block min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-muted">
                R$
            </span>
            <input
                value={value}
                inputMode="decimal"
                aria-label={label}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className={`${inputBaseClass} pl-10 pr-3.5`}
            />
        </label>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange(checked: boolean): void;
}) {
    return (
        <Button
            type="button"
            variant="unstyled"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                checked ? 'bg-foreground' : 'bg-surface-muted ring-1 ring-inset ring-border'
            }`}
        >
            <span
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
                    checked ? 'translate-x-5' : ''
                }`}
            />
        </Button>
    );
}

function connectionOption(connection: GatewayConnection) {
    return {
        value: connection.id,
        label: connection.name,
        badge: connection.environment === 'production' ? 'Produção' : 'Sandbox',
    };
}

function initialForm(rule: GatewayRoutingRule | undefined): RuleForm {
    const trafficPercentage = rule?.trafficPercentage ?? 100;
    return {
        name: rule?.name ?? '',
        strategy: rule?.strategy ?? 'priority',
        gatewayConnectionId: rule?.gatewayConnectionId ?? '',
        fallbackGatewayConnectionIds: rule?.fallbackGatewayConnectionIds ?? [],
        paymentMethods: rule?.conditions.paymentMethods ?? [],
        minAmount: fromMinor(rule?.conditions.minAmountMinor),
        maxAmount: fromMinor(rule?.conditions.maxAmountMinor),
        checkoutIds: rule?.conditions.checkoutIds ?? [],
        productIds: rule?.conditions.productIds ?? [],
        splitTraffic: trafficPercentage < 100,
        trafficPercentage: trafficPercentage < 100 ? trafficPercentage : 50,
    };
}

/** Descreve as condições em português corrido, como o comerciante falaria. */
function conditionsSentence(
    conditions: GatewayRoutingRule['conditions'],
    checkouts: Checkout[],
    products: Product[],
    inline = false,
) {
    const parts: string[] = [];
    if (conditions.paymentMethods?.length)
        parts.push(
            `no ${joinOr(
                conditions.paymentMethods.map((method) =>
                    method === 'bank_transfer' ? 'transferência' : methodLabels[method],
                ),
            )}`,
        );
    if (conditions.minAmountMinor !== undefined && conditions.maxAmountMinor !== undefined)
        parts.push(
            `entre ${money(conditions.minAmountMinor)} e ${money(conditions.maxAmountMinor)}`,
        );
    else if (conditions.minAmountMinor !== undefined)
        parts.push(`a partir de ${money(conditions.minAmountMinor)}`);
    else if (conditions.maxAmountMinor !== undefined)
        parts.push(`até ${money(conditions.maxAmountMinor)}`);
    if (conditions.checkoutIds?.length)
        parts.push(`no checkout ${joinOr(names(conditions.checkoutIds, checkouts))}`);
    if (conditions.productIds?.length)
        parts.push(`com ${joinOr(names(conditions.productIds, products))}`);
    if (parts.length === 0) return inline ? 'de qualquer tipo' : 'Todas as vendas';
    const sentence = parts.join(', ');
    return inline ? sentence : `Vendas ${sentence}`;
}

function joinOr(items: string[]) {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} ou ${items.at(-1) ?? ''}`;
}

function names(ids: string[], items: { id: string; name: string }[]) {
    return ids.map((id) => items.find((item) => item.id === id)?.name ?? id);
}

function money(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        value / 100,
    );
}

function toMinor(value: string) {
    const normalized = value.trim().replace(/\./g, '').replace(',', '.');
    if (!normalized) return undefined;
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : undefined;
}

function fromMinor(value: number | undefined) {
    return value === undefined ? '' : (value / 100).toFixed(2).replace('.', ',');
}

function noSubscription() {
    return () => undefined;
}
