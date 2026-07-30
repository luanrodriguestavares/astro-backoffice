'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/modal';
import {
    paymentMethods,
    requiredCheckoutComponents,
    selectableConnections,
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

const componentCopy: Record<
    RequiredCheckoutComponent,
    { label: string; description: string }
> = {
    product_summary: {
        label: 'Itens do carrinho',
        description: 'Mostra o produto, quantidade e valor da oferta.',
    },
    checkout_form: {
        label: 'Dados pessoais',
        description: 'Coleta nome, e-mail e os campos necessários do comprador.',
    },
    order_summary: {
        label: 'Resumo do pedido',
        description: 'Confirma subtotal, descontos e total antes do pagamento.',
    },
    payment_methods: {
        label: 'Formas de pagamento',
        description: 'Permite ao comprador escolher cartão, Pix ou boleto.',
    },
};

interface PaymentGatewaySettingsProps {
    open: boolean;
    environment: CheckoutEnvironment;
    bindings: Partial<Record<CheckoutPaymentMethod, string>>;
    enabledMethods: readonly CheckoutPaymentMethod[];
    presentComponents: readonly RequiredCheckoutComponent[];
    connections: readonly GatewayConnection[];
    onEnvironmentChange(environment: CheckoutEnvironment): void;
    onBindingChange(method: CheckoutPaymentMethod, connectionId: string | undefined): void;
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

            <section className="mt-7">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[14px] font-semibold">Componentes obrigatórios</h3>
                        <p className="mt-1 text-[12px] text-muted">
                            Adicione os blocos ausentes pela categoria Checkout na barra lateral.
                            Eles podem ficar dentro ou fora de um grid.
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
                        <h3 className="text-[14px] font-semibold">Processamento de pagamentos</h3>
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
                        const selected = bindings[method];
                        const requiresBinding = environment === 'production' && enabled;
                        const ready =
                            !enabled ||
                            (requiresBinding
                                ? selected !== undefined &&
                                  options.some(({ id }) => id === selected)
                                : options.length > 0);
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
                                                tone={!enabled ? 'neutral' : ready ? 'ready' : 'pending'}
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
                                            onBindingChange(method, value || undefined)
                                        }
                                    />
                                    {enabled && options.length === 0 && (
                                        <p className="mt-2 text-[11px] text-danger">
                                            Nenhuma conexão ativa e compatível neste ambiente.
                                        </p>
                                    )}
                                </div>
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
                        A API ainda verificará teste recente, credenciais, capacidades e webhook de
                        cada conexão antes de publicar.
                    </p>
                )}
            </section>

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
