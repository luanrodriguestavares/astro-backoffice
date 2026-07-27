'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { GatewayMark } from '@/components/gateways/gateway-mark';
import {
    GatewayEditModal,
    type GatewayDefinition,
} from '@/components/gateways/gateway-connect-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import type { GatewayConnection } from '@/lib/api/types';

export function ConnectedGatewayCard({
    connection,
    metrics,
}: {
    connection: GatewayConnection;
    metrics?: { volume: number; transactions: number; currency: string };
}) {
    const router = useRouter();
    const menu = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState<'test' | 'delete'>();
    useEffect(() => {
        function close(event: PointerEvent) {
            if (!menu.current?.contains(event.target as Node)) setOpen(false);
        }

        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, []);

    async function act(action: 'test' | 'delete') {
        if (action === 'delete' && !window.confirm(`Desabilitar ${connection.name}?`)) return;
        setOpen(false);
        setBusy(action);
        const response = await fetch(
            `/api/gateways/${connection.id}${action === 'test' ? '/test' : ''}`,
            { method: action === 'test' ? 'POST' : 'DELETE' },
        );
        const body = (await response.json()) as { detail?: string };
        setBusy(undefined);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível concluir a operação.',
            });
            return;
        }
        showToast({
            tone: 'success',
            title: action === 'test' ? 'Conexão validada' : 'Gateway desabilitado',
            description:
                action === 'test'
                    ? 'As credenciais do gateway estão funcionando.'
                    : 'O gateway não receberá novos pagamentos.',
        });
        router.refresh();
    }

    const presentation = provider(connection.provider);
    const status = statusPresentation(connection);
    const gateway = gatewayDefinition(connection.provider);
    return (
        <>
            <article
                className={`gateway-hover-card glass-panel group relative rounded-[20px] px-4 py-4 sm:px-5 ${open ? 'z-[80]' : 'z-0 hover:shadow-[0_18px_45px_rgba(66,57,128,.08)]'}`}
            >
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(230px,1.35fr)_minmax(130px,.65fr)_minmax(115px,.5fr)_minmax(155px,.72fr)_auto]">
                    <div className="flex min-w-0 items-center gap-3.5">
                        <GatewayMark
                            initials={presentation.initials}
                            color={presentation.color}
                            logo={presentation.logo}
                            logoFill={presentation.logoFill}
                        />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-[13px] font-semibold">
                                    {connection.name || presentation.name}
                                </h3>
                                {connection.publicConfiguration.default === true && (
                                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-semibold text-brand-strong">
                                        Padrão
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 truncate text-[11px] text-muted">
                                {presentation.methods} ·{' '}
                                {connection.environment === 'production' ? 'Produção' : 'Sandbox'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                        >
                            {status.label}
                        </span>
                        <p className="mt-1 text-[10px] text-muted">{status.detail}</p>
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold">Sob consulta</p>
                        <p className="mt-1 text-[10px] text-muted">Taxa contratada</p>
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold tabular-nums">
                            {money(metrics?.volume ?? 0, metrics?.currency ?? 'BRL')}
                        </p>
                        <p className="mt-1 text-[10px] text-muted">
                            {metrics?.transactions ?? 0} transações em 30 dias
                        </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={Boolean(busy)}
                            onClick={() => setEditing(true)}
                            className="h-9 px-3.5"
                        >
                            Configurar
                        </Button>
                        <div ref={menu} className="relative">
                            <Button
                                type="button"
                                aria-label={`Ações de ${connection.name}`}
                                onClick={() => setOpen((value) => !value)}
                                className="grid size-9 place-items-center rounded-xl border border-[#d9d7e8] bg-white/60 text-muted hover:bg-white hover:text-foreground"
                            >
                                <Icon name="dots" className="size-4" />
                            </Button>
                            {open && (
                                <div
                                    className="gateway-action-menu glass-popover absolute right-0 top-11 z-[100] w-44 rounded-xl p-1.5"
                                    style={{
                                        boxShadow:
                                            '0 12px 32px rgba(42, 36, 88, 0.14), 0 2px 8px rgba(42, 36, 88, 0.06)',
                                    }}
                                >
                                    <Button
                                        type="button"
                                        onClick={() => act('test')}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium hover:bg-brand-soft"
                                    >
                                        <Icon name="check" className="size-3.5" />
                                        Testar conexão
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => act('delete')}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-danger hover:bg-[#fff0f2]"
                                    >
                                        <Icon name="trash" className="size-3.5" />
                                        Desabilitar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </article>
            <GatewayEditModal
                gateway={gateway}
                connection={connection}
                open={editing}
                close={() => setEditing(false)}
            />
        </>
    );
}

function provider(value: GatewayConnection['provider']) {
    return {
        stripe: {
            name: 'Stripe',
            initials: 'S',
            color: 'bg-[#635bff]',
            logo: '/gateways/stripe.png',
            logoFill: true,
            methods: 'Cartões, Pix e recorrência',
        },
        mercado_pago: {
            name: 'Mercado Pago',
            initials: 'MP',
            color: 'bg-[#009ee3]',
            logo: '/gateways/mercado-pago.png',
            logoFill: false,
            methods: 'Cartões, boleto, Pix e carteira',
        },
        abacate_pay: {
            name: 'AbacatePay',
            initials: 'A',
            color: 'bg-[#79b943]',
            logo: '/gateways/abacate-pay.png',
            logoFill: false,
            methods: 'Pix, cartões e boleto',
        },
        mock: {
            name: 'Ambiente de testes',
            initials: 'M',
            color: 'bg-[#55576b]',
            logo: '/gateways/astro-mock.png',
            logoFill: true,
            methods: 'Simulações e sandbox',
        },
    }[value];
}

function gatewayDefinition(value: GatewayConnection['provider']): GatewayDefinition {
    const item = provider(value);
    return {
        provider: value,
        name: item.name,
        description: item.methods,
        initials: item.initials,
        color: item.color,
        logo: item.logo,
        logoFill: item.logoFill,
        methods: item.methods.split(', '),
    };
}

function statusPresentation(connection: GatewayConnection) {
    if (connection.failureReason)
        return {
            label: 'Erro de autenticação',
            detail: 'Requer atenção',
            className: 'bg-[#fff0f2] text-danger',
        };
    if (connection.status === 'active')
        return {
            label: 'Conectado',
            detail: 'Recebendo pagamentos',
            className: 'bg-[#e8f7f1] text-success',
        };
    if (connection.status === 'disabled')
        return {
            label: 'Desabilitado',
            detail: 'Processamento pausado',
            className: 'bg-[#f0f0f4] text-muted',
        };
    return {
        label: 'Requer atualização',
        detail: 'Revise a configuração',
        className: 'bg-[#fff5e9] text-warning',
    };
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}
