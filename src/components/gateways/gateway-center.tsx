'use client';

import { useMemo, useState } from 'react';

import { ConnectedGatewayCard } from '@/components/gateways/connected-gateway-card';
import {
    GatewayConnectCard,
    type GatewayDefinition,
} from '@/components/gateways/gateway-connect-card';
import { GatewayMark } from '@/components/gateways/gateway-mark';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { GatewayConnection, Payment } from '@/lib/api/types';

type Filter = 'all' | 'connected' | 'available';

const catalog = [
    {
        name: 'PayPal',
        initials: 'P',
        color: 'bg-[#003087]',
        logo: '/gateways/paypal.png',
        description: 'Carteiras e pagamentos internacionais.',
    },
    {
        name: 'Pagar.me',
        initials: 'P',
        color: 'bg-[#54c7a0]',
        logo: '/gateways/pagar-me.png',
        logoFill: true,
        description: 'Cartões, Pix e boleto.',
    },
    {
        name: 'Asaas',
        initials: 'A',
        color: 'bg-[#1769e0]',
        logo: '/gateways/asaas.png',
        logoFill: true,
        description: 'Boleto, Pix e cartão.',
    },
    {
        name: 'Cielo',
        initials: 'C',
        color: 'bg-[#00a7d8]',
        logo: '/gateways/cielo.png',
        description: 'Adquirência para cartões.',
    },
    {
        name: 'Adyen',
        initials: 'A',
        color: 'bg-[#0abf53]',
        logo: '/gateways/adyen.png',
        logoFill: true,
        description: 'Pagamentos globais e omnichannel.',
    },
];

export function GatewayCenter({
    connections,
    payments,
    gateways,
}: {
    connections: GatewayConnection[];
    payments: Payment[];
    gateways: GatewayDefinition[];
}) {
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const metrics = useMemo(() => gatewayMetrics(payments), [payments]);
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    const visibleConnections = connections.filter(
        (item) =>
            filter !== 'available' &&
            (!normalized ||
                `${item.name} ${providerName(item.provider)}`
                    .toLocaleLowerCase('pt-BR')
                    .includes(normalized)),
    );
    const visibleGateways = gateways.filter(
        (item) =>
            filter !== 'connected' &&
            (!normalized ||
                `${item.name} ${item.description}`.toLocaleLowerCase('pt-BR').includes(normalized)),
    );
    const visibleCatalog = catalog.filter(
        (item) =>
            filter !== 'connected' &&
            (!normalized ||
                `${item.name} ${item.description}`.toLocaleLowerCase('pt-BR').includes(normalized)),
    );

    return (
        <div className="space-y-5">
            <section className="glass-panel rounded-[22px] p-2.5 sm:flex sm:items-center sm:justify-between">
                <div className="flex gap-1 overflow-x-auto">
                    {(
                        [
                            { value: 'all', label: 'Todos' },
                            { value: 'connected', label: 'Conectados' },
                            { value: 'available', label: 'Disponíveis' },
                        ] as const
                    ).map((item) => (
                        <Button
                            key={item.value}
                            type="button"
                            onClick={() => setFilter(item.value)}
                            className={`h-9 whitespace-nowrap rounded-xl px-5 text-[12px] font-semibold transition ${filter === item.value ? 'bg-brand-soft text-brand-strong shadow-[inset_0_0_0_1px_rgba(109,93,244,.08)]' : 'text-muted hover:bg-white/60 hover:text-foreground'}`}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
                <label className="gateway-search filter-control mt-2 flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#d9d7e8] bg-white/70 px-3.5 transition focus-within:border-brand/70 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(109,93,244,.16)] sm:mt-0 sm:max-w-[310px]">
                    <Icon name="search" className="size-3.5 shrink-0 text-muted" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar gateway..."
                        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
                    />
                </label>
            </section>

            {filter !== 'available' && (
                <section id="gateways-conectados">
                    <div className="mb-3 flex items-end justify-between px-1">
                        <div>
                            <h2 className="text-sm font-semibold">Gateways conectados</h2>
                            <p className="mt-1 text-[12px] text-muted">
                                Provedores configurados para processar pagamentos
                            </p>
                        </div>
                        <span className="rounded-full border border-brand/15 bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand-strong">
                            {visibleConnections.length}{' '}
                            {visibleConnections.length === 1 ? 'conexão' : 'conexões'}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {visibleConnections.map((connection) => (
                            <ConnectedGatewayCard
                                key={connection.id}
                                connection={connection}
                                metrics={metrics.get(connection.id)}
                            />
                        ))}
                        {visibleConnections.length === 0 && (
                            <div className="glass-panel rounded-[22px]">
                                <EmptyState
                                    text={
                                        normalized
                                            ? 'Nenhum gateway conectado corresponde à busca.'
                                            : 'Nenhum gateway conectado ainda.'
                                    }
                                />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {filter !== 'connected' && (
                <section
                    id="gateways-disponiveis"
                    className="glass-panel rounded-[24px] p-5 sm:p-6"
                >
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold">Gateways disponíveis</h2>
                        <p className="mt-1 text-[12px] text-muted">
                            Amplie suas opções de pagamento com novas integrações.
                        </p>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                        {visibleGateways.map((gateway) => (
                            <GatewayConnectCard key={gateway.provider} gateway={gateway} />
                        ))}
                        {visibleCatalog.map((item) => (
                            <article
                                key={item.name}
                                className="gateway-hover-card relative flex min-h-20 items-center gap-2.5 rounded-xl border border-white/80 bg-white/38 p-3 hover:shadow-[0_10px_26px_rgba(66,57,128,.06)]"
                            >
                                <GatewayMark
                                    initials={item.initials}
                                    color={item.color}
                                    logo={item.logo}
                                    logoFill={item.logoFill}
                                />
                                <div className="min-w-0 flex-1 pr-1">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="truncate text-[12px] font-semibold">
                                            {item.name}
                                        </h3>
                                        <span className="coming-soon-badge shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase">
                                            Em breve
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-muted">
                                        {item.description}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                    {!visibleGateways.length && !visibleCatalog.length && (
                        <EmptyState text="Nenhum gateway disponível corresponde à busca." />
                    )}
                </section>
            )}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="px-6 py-12 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-brand-soft/70 text-brand">
                <Icon name="plug" className="size-4" />
            </span>
            <p className="mt-3 text-[12px] text-muted">{text}</p>
        </div>
    );
}

function providerName(provider: GatewayConnection['provider']) {
    return {
        mock: 'Ambiente de testes',
        stripe: 'Stripe',
        mercado_pago: 'Mercado Pago',
        abacate_pay: 'AbacatePay',
    }[provider];
}

function gatewayMetrics(payments: Payment[]) {
    const cutoff = Date.now() - 30 * 86_400_000;
    const map = new Map<string, { volume: number; transactions: number; currency: string }>();
    for (const payment of payments) {
        if (new Date(payment.createdAt).getTime() < cutoff) continue;
        const current = map.get(payment.gatewayConnectionId) ?? {
            volume: 0,
            transactions: 0,
            currency: payment.currency,
        };
        current.transactions += 1;
        if (['approved', 'paid', 'captured', 'succeeded'].includes(payment.status))
            current.volume += payment.capturedMinor || payment.amountMinor;
        map.set(payment.gatewayConnectionId, current);
    }
    return map;
}
