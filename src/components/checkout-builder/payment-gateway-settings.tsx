'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import {
    fallbackCandidates,
    maxGatewayFallbacks,
    paymentMethods,
    requiredCheckoutComponents,
    selectableConnections,
    type GatewayCascades,
    type RequiredCheckoutComponent,
} from '@/lib/checkout/gateway-bindings';
import type {
    CheckoutEnvironment,
    CheckoutPaymentMethod,
    GatewayConnection,
} from '@/lib/api/types';

const methodLabels: Record<CheckoutPaymentMethod, string> = {
    card: 'Cartão',
    pix: 'Pix',
    boleto: 'Boleto',
};

const componentCopy: Record<RequiredCheckoutComponent, { label: string; description: string }> = {
    product_summary: {
        label: 'Carrinho e finalização',
        description: 'Reúne itens, composição financeira, total e ação final.',
    },
    checkout_form: {
        label: 'Dados pessoais',
        description: 'Coleta nome, e-mail e os campos necessários do comprador.',
    },
    payment_methods: {
        label: 'Formas de pagamento',
        description: 'Permite ao comprador escolher cartão, Pix ou boleto.',
    },
};

interface PaymentGatewaySettingsProps {
    open: boolean;
    environment: CheckoutEnvironment;
    bindings: GatewayCascades;
    enabledMethods: readonly CheckoutPaymentMethod[];
    presentComponents: readonly RequiredCheckoutComponent[];
    connections: readonly GatewayConnection[];
    onEnvironmentChange(environment: CheckoutEnvironment): void;
    onBindingChange(method: CheckoutPaymentMethod, connectionIds: string[]): void;
    onClose(): void;
}

export function PaymentGatewaySettings({
    open,
    environment,
    bindings,
    enabledMethods,
    presentComponents,
    connections,
    onEnvironmentChange,
    onBindingChange,
    onClose,
}: PaymentGatewaySettingsProps) {
    const missingComponents = requiredCheckoutComponents.filter(
        (type) => !presentComponents.includes(type),
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            labelledBy="checkout-readiness-title"
            maxWidth="max-w-3xl"
        >
            <ModalHeader
                eyebrow="Prontidão do checkout"
                title="O que falta para publicar?"
                titleId="checkout-readiness-title"
                description="Complete os blocos obrigatórios e defina como cada pagamento será processado."
                onClose={onClose}
            />

            <ModalBody>
                <section>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-[14px] font-semibold">Componentes obrigatórios</h3>
                            <p className="mt-1 text-[12px] text-muted">
                                Adicione os blocos ausentes pela categoria Checkout na barra
                                lateral. Eles podem ficar dentro ou fora de um grid.
                            </p>
                        </div>
                        <StatusBadge tone={missingComponents.length === 0 ? 'ready' : 'pending'}>
                            {missingComponents.length === 0
                                ? 'Completo'
                                : `${missingComponents.length} pendente${missingComponents.length > 1 ? 's' : ''}`}
                        </StatusBadge>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {requiredCheckoutComponents.map((type) => {
                            const present = presentComponents.includes(type);
                            const copy = componentCopy[type];
                            return (
                                <article
                                    key={type}
                                    className={`flex gap-3 rounded-2xl border p-4 ${
                                        present
                                            ? 'border-success/20 bg-success/5'
                                            : 'border-warning/25 bg-[#fffaf0]'
                                    }`}
                                >
                                    <span
                                        className={`grid size-8 shrink-0 place-items-center rounded-full ${
                                            present
                                                ? 'bg-success/12 text-success'
                                                : 'bg-warning/15 text-[#8a6500]'
                                        }`}
                                    >
                                        <Icon
                                            name={present ? 'check' : 'plus'}
                                            className="size-3.5"
                                        />
                                    </span>
                                    <div>
                                        <h4 className="text-[12px] font-semibold">{copy.label}</h4>
                                        <p className="mt-1 text-[11px] leading-4 text-muted">
                                            {copy.description}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <div className="my-7 h-px bg-border" />

                <section>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h3 className="text-[14px] font-semibold">
                                Processamento de pagamentos
                            </h3>
                            <p className="mt-1 text-[12px] text-muted">
                                Os métodos habilitados vêm do bloco Formas de pagamento.
                            </p>
                        </div>
                        <label className="w-full text-[12px] font-semibold sm:w-64">
                            Ambiente
                            <div className="mt-2">
                                <CustomSelect
                                    name="checkoutEnvironment"
                                    value={environment}
                                    options={[
                                        { value: 'sandbox', label: 'Sandbox', badge: 'Teste' },
                                        { value: 'production', label: 'Produção', badge: 'Real' },
                                    ]}
                                    onValueChange={(value) =>
                                        onEnvironmentChange(value as CheckoutEnvironment)
                                    }
                                />
                            </div>
                        </label>
                    </div>

                    <div className="mt-4 space-y-3">
                        {paymentMethods.map((method) => {
                            const options = selectableConnections(connections, method, environment);
                            const enabled = enabledMethods.includes(method);
                            const cascade = bindings[method] ?? [];
                            const [selected, ...fallbacks] = cascade;
                            const fallbackOptions = fallbackCandidates(
                                connections,
                                method,
                                environment,
                                selected,
                            );
                            const invalidFallback = fallbacks.some(
                                (id) => !fallbackOptions.some((connection) => connection.id === id),
                            );
                            const requiresBinding = environment === 'production' && enabled;
                            const ready =
                                !enabled ||
                                (!invalidFallback &&
                                    (requiresBinding
                                        ? selected !== undefined &&
                                          options.some(({ id }) => id === selected)
                                        : options.length > 0));
                            const unusedFallbacks = fallbackOptions.filter(
                                ({ id }) => !fallbacks.includes(id),
                            );
                            return (
                                <article
                                    key={method}
                                    className="grid gap-3 rounded-2xl border border-border bg-[var(--control-bg)] p-4 sm:grid-cols-[1fr_1.35fr] sm:items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`grid size-9 place-items-center rounded-xl ${
                                                enabled
                                                    ? 'bg-brand-soft text-brand'
                                                    : 'bg-surface-muted text-muted'
                                            }`}
                                        >
                                            <Icon
                                                name={method === 'pix' ? 'bolt' : 'card'}
                                                className="size-4"
                                            />
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[12px] font-semibold">
                                                    {methodLabels[method]}
                                                </h4>
                                                <StatusBadge
                                                    tone={
                                                        !enabled
                                                            ? 'neutral'
                                                            : ready
                                                              ? 'ready'
                                                              : 'pending'
                                                    }
                                                >
                                                    {!enabled
                                                        ? 'Desabilitado'
                                                        : ready
                                                          ? 'Pronto'
                                                          : 'Pendente'}
                                                </StatusBadge>
                                            </div>
                                            <p className="mt-1 text-[11px] text-muted">
                                                {enabled
                                                    ? requiresBinding
                                                        ? 'Escolha a conexão que receberá cobranças reais.'
                                                        : 'Em sandbox, a API pode selecionar uma conexão compatível.'
                                                    : 'Ative este método no bloco Formas de pagamento.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <CustomSelect
                                            name={`gatewayBinding_${method}`}
                                            value={selected ?? ''}
                                            placeholder={
                                                enabled
                                                    ? 'Selecione uma conexão'
                                                    : 'Método desabilitado'
                                            }
                                            disabled={!enabled}
                                            options={options.map((connection) => ({
                                                value: connection.id,
                                                label: connection.name,
                                                badge: providerLabel(connection.provider),
                                            }))}
                                            onValueChange={(value) =>
                                                // Trocar o principal pode tornar as contingências
                                                // incompatíveis, então a cascata recomeça.
                                                onBindingChange(method, value ? [value] : [])
                                            }
                                        />
                                        {enabled && options.length === 0 && (
                                            <p className="mt-2 text-[11px] text-danger">
                                                Nenhuma conexão ativa e compatível neste ambiente.
                                            </p>
                                        )}
                                    </div>
                                    {enabled && selected !== undefined && (
                                        <FallbackCascade
                                            method={method}
                                            fallbacks={fallbacks}
                                            options={fallbackOptions}
                                            unused={unusedFallbacks}
                                            connections={connections}
                                            onChange={(next) =>
                                                onBindingChange(method, [selected, ...next])
                                            }
                                        />
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    {enabledMethods.length === 0 && (
                        <div className="mt-3 rounded-2xl border border-warning/25 bg-[#fffaf0] px-4 py-3 text-[12px] leading-5 text-[#78590b]">
                            Ative ao menos uma forma de pagamento no bloco Formas de pagamento.
                        </div>
                    )}
                    {environment === 'production' && (
                        <p className="mt-3 rounded-2xl bg-brand-soft/55 px-4 py-3 text-[11px] leading-5 text-brand-strong">
                            A API ainda verificará teste recente, credenciais, capacidades e webhook
                            de cada conexão antes de publicar.
                        </p>
                    )}
                </section>
            </ModalBody>

            <ModalFooter>
                <ButtonLink href="/gateways" variant="secondary">
                    <Icon name="plug" className="size-3.5" />
                    Gerenciar gateways
                </ButtonLink>
                <Button type="button" variant="primary" onClick={onClose}>
                    Voltar ao editor
                </Button>
            </ModalFooter>
        </Modal>
    );
}

function FallbackCascade({
    method,
    fallbacks,
    options,
    unused,
    connections,
    onChange,
}: {
    method: CheckoutPaymentMethod;
    fallbacks: string[];
    options: readonly GatewayConnection[];
    unused: readonly GatewayConnection[];
    connections: readonly GatewayConnection[];
    onChange(fallbacks: string[]): void;
}) {
    const canAdd = fallbacks.length < maxGatewayFallbacks && unused.length > 0;
    return (
        <div className="border-t border-border pt-3 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h5 className="text-[11px] font-semibold">Contingência</h5>
                    <p className="mt-0.5 text-[11px] text-muted">
                        Se o gateway principal falhar ao criar a cobrança, tentamos os próximos na
                        ordem, sem o comprador perceber.
                    </p>
                </div>
                {canAdd && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-8"
                        onClick={() => {
                            const next = unused[0];
                            if (next) onChange([...fallbacks, next.id]);
                        }}
                    >
                        <Icon name="plus" className="size-3" />
                        Adicionar contingência
                    </Button>
                )}
            </div>
            {fallbacks.length > 0 && (
                <ol className="mt-3 space-y-2">
                    {fallbacks.map((id, position) => {
                        const known = options.some((connection) => connection.id === id);
                        const current = connections.find((connection) => connection.id === id);
                        const choices = [
                            ...(known || current === undefined ? [] : [current]),
                            ...options.filter(
                                (connection) =>
                                    connection.id === id || !fallbacks.includes(connection.id),
                            ),
                        ];
                        return (
                            <li key={`${method}-${id}`} className="flex items-center gap-2">
                                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-muted text-[10px] font-semibold text-muted">
                                    {position + 2}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <CustomSelect
                                        name={`gatewayFallback_${method}_${String(position)}`}
                                        value={id}
                                        options={choices.map((connection) => ({
                                            value: connection.id,
                                            label: connection.name,
                                            badge: providerLabel(connection.provider),
                                        }))}
                                        onValueChange={(value) =>
                                            onChange(
                                                fallbacks.map((item, index) =>
                                                    index === position ? value : item,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="icon"
                                    aria-label="Subir na ordem"
                                    disabled={position === 0}
                                    onClick={() => onChange(moveItem(fallbacks, position, -1))}
                                >
                                    <Icon name="arrow-up" className="size-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="icon"
                                    aria-label="Remover contingência"
                                    onClick={() =>
                                        onChange(fallbacks.filter((_, index) => index !== position))
                                    }
                                >
                                    <Icon name="close" className="size-3.5" />
                                </Button>
                                {!known && (
                                    <span className="text-[11px] text-danger">Incompatível</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
            {fallbacks.length === 0 && !canAdd && (
                <p className="mt-2 text-[11px] text-muted">
                    Nenhum outro gateway compatível com a mesma experiência de pagamento neste
                    ambiente.
                </p>
            )}
        </div>
    );
}

function moveItem<T>(items: readonly T[], index: number, offset: number) {
    const next = [...items];
    const target = index + offset;
    if (target < 0 || target >= next.length) return next;
    [next[index], next[target]] = [next[target] as T, next[index] as T];
    return next;
}

function StatusBadge({
    tone,
    children,
}: {
    tone: 'ready' | 'pending' | 'neutral';
    children: React.ReactNode;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] ${
                tone === 'ready'
                    ? 'bg-success/10 text-success'
                    : tone === 'pending'
                      ? 'bg-warning/15 text-[#78590b]'
                      : 'bg-surface-muted text-muted'
            }`}
        >
            {children}
        </span>
    );
}

function providerLabel(provider: GatewayConnection['provider']) {
    return {
        stripe: 'Stripe',
        mercado_pago: 'Mercado Pago',
        abacate_pay: 'AbacatePay',
        mock: 'Mock',
    }[provider];
}
