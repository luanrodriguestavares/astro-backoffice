'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

import { providerPresentation } from '@/components/gateways/connected-gateway-card';
import { GatewayMark } from '@/components/gateways/gateway-mark';
import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import type { FeeEntry, GatewayConnection, GatewayFeeSchedule } from '@/lib/api/types';

const methods = [
    { value: 'card', label: 'Cartão' },
    { value: 'pix', label: 'Pix' },
    { value: 'boleto', label: 'Boleto' },
] as const;

type Method = (typeof methods)[number]['value'];
type Draft = Record<Method, { percent: string; fixed: string }>;

/** Venda usada nos exemplos: um valor redondo que qualquer pessoa entende. */
const exampleSaleMinor = 10_000;

export function GatewayCosts({
    connections,
    costRules,
}: {
    connections: GatewayConnection[];
    costRules: number;
}) {
    const [editing, setEditing] = useState<GatewayConnection | null>(null);
    // O modal usa portal no document: só pode existir depois de montar no navegador.
    const mounted = useSyncExternalStore(
        noSubscription,
        () => true,
        () => false,
    );

    if (connections.length === 0)
        return (
            <section className="glass-panel rounded-[24px] p-6 text-[13px] text-muted">
                Nenhum gateway conectado ainda.{' '}
                <Link href="/gateways" className="font-semibold text-foreground underline">
                    Conectar gateway
                </Link>
            </section>
        );

    return (
        <div className="space-y-3">
            {connections.map((connection) => (
                <GatewayFeeCard
                    key={connection.id}
                    connection={connection}
                    onEdit={() => setEditing(connection)}
                />
            ))}

            {costRules === 0 && (
                <p className="px-1 pt-2 text-[13px] text-muted">
                    As taxas servem para a regra &ldquo;o mais barato primeiro&rdquo; escolher o
                    gateway.{' '}
                    <Link
                        href="/orchestration/rules?new=1"
                        className="font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                        Criar essa regra
                    </Link>
                </p>
            )}

            {mounted && editing && (
                <FeeModal key={editing.id} connection={editing} onClose={() => setEditing(null)} />
            )}
        </div>
    );
}

function GatewayFeeCard({ connection, onEdit }: { connection: GatewayConnection; onEdit(): void }) {
    const presentation = providerPresentation(connection.provider);
    const accepted = acceptedMethods(connection);
    const informed = accepted.filter((method) => connection.feeSchedule?.[method] !== undefined);
    return (
        <article className="glass-panel flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <GatewayMark
                    initials={presentation.initials}
                    color={presentation.color}
                    logo={presentation.logo}
                    logoFill={presentation.logoFill}
                />
                <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em]">
                        {connection.name}
                    </h2>
                    {informed.length === 0 ? (
                        <p className="mt-0.5 text-[13px] text-muted">Taxas ainda não informadas</p>
                    ) : (
                        <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                            {accepted.map((method) => {
                                const fee = connection.feeSchedule?.[method];
                                return (
                                    <span key={method}>
                                        <span className="text-muted">{methodLabel(method)} </span>
                                        <span className={fee ? 'font-semibold' : 'text-muted'}>
                                            {fee ? feeText(fee) : '—'}
                                        </span>
                                    </span>
                                );
                            })}
                        </p>
                    )}
                </div>
            </div>
            <Button
                type="button"
                variant={informed.length === 0 ? 'primary' : 'secondary'}
                onClick={onEdit}
                className="shrink-0"
            >
                {informed.length === 0 ? 'Informar taxas' : 'Editar taxas'}
            </Button>
        </article>
    );
}

function FeeModal({ connection, onClose }: { connection: GatewayConnection; onClose(): void }) {
    const router = useRouter();
    const accepted = acceptedMethods(connection);
    const [draft, setDraft] = useState<Draft>(() => toDraft(connection.feeSchedule));
    const [saving, setSaving] = useState(false);

    function change(method: Method, field: 'percent' | 'fixed', value: string) {
        setDraft((current) => ({ ...current, [method]: { ...current[method], [field]: value } }));
    }

    async function save() {
        const feeSchedule: GatewayFeeSchedule = {};
        for (const method of accepted) {
            const percent = parseDecimal(draft[method].percent);
            const fixed = parseDecimal(draft[method].fixed);
            if (percent === undefined && fixed === undefined) continue;
            if ((percent ?? 0) > 100) {
                showToast({ tone: 'error', description: 'A porcentagem não pode passar de 100%.' });
                return;
            }
            feeSchedule[method] = {
                percentBps: Math.round((percent ?? 0) * 100),
                fixedMinor: Math.round((fixed ?? 0) * 100),
            };
        }
        setSaving(true);
        const response = await fetch(`/api/gateways/${encodeURIComponent(connection.id)}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ feeSchedule }),
        });
        const body = (await response.json()) as { detail?: string };
        setSaving(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível salvar as taxas.',
            });
            return;
        }
        showToast({ tone: 'success', description: `Taxas de ${connection.name} salvas.` });
        onClose();
        router.refresh();
    }

    return (
        <Modal open onClose={onClose} labelledBy="fees-title" maxWidth="max-w-lg">
            <ModalHeader
                eyebrow={connection.name}
                title="Quanto este gateway cobra?"
                titleId="fees-title"
                description="Use os valores do seu contrato. Se não souber algum, deixe em branco."
                onClose={onClose}
            />
            <ModalBody>
                <div className="space-y-5">
                    {accepted.map((method) => {
                        const example = estimate(draft[method], exampleSaleMinor);
                        return (
                            <fieldset key={method}>
                                <legend className="text-[14px] font-semibold">
                                    {methodLabel(method)}
                                </legend>
                                <div className="mt-2 flex items-center gap-2">
                                    <AffixInput
                                        label={`${methodLabel(method)}: porcentagem por venda`}
                                        suffix="%"
                                        value={draft[method].percent}
                                        onChange={(value) => change(method, 'percent', value)}
                                    />
                                    <span className="text-[13px] text-muted">+</span>
                                    <AffixInput
                                        label={`${methodLabel(method)}: valor fixo por venda`}
                                        prefix="R$"
                                        value={draft[method].fixed}
                                        onChange={(value) => change(method, 'fixed', value)}
                                    />
                                </div>
                                <p className="mt-1.5 text-[12px] text-muted">
                                    {example === undefined ? (
                                        'Ex.: 3,99% + R$ 0,50 por venda'
                                    ) : (
                                        <>
                                            Numa venda de {money(exampleSaleMinor)}, você paga{' '}
                                            <span className="font-semibold text-foreground">
                                                {money(example)}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </fieldset>
                        );
                    })}
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
                    {saving ? 'Salvando...' : 'Salvar taxas'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}

/** Um único input com o afixo sobreposto: o estilo global de inputs desenharia outra caixa. */
function AffixInput({
    label,
    prefix,
    suffix,
    value,
    onChange,
}: {
    label: string;
    prefix?: string;
    suffix?: string;
    value: string;
    onChange(value: string): void;
}) {
    return (
        <label className="relative block min-w-0 flex-1">
            {prefix && (
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                    {prefix}
                </span>
            )}
            <input
                value={value}
                inputMode="decimal"
                aria-label={label}
                placeholder="0,00"
                onChange={(event) => onChange(event.target.value)}
                className={`block h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] text-[14px] tabular-nums outline-none transition focus:border-brand/70 ${prefix ? 'pl-10' : 'pl-3.5'} ${suffix ? 'pr-8' : 'pr-3.5'}`}
            />
            {suffix && (
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                    {suffix}
                </span>
            )}
        </label>
    );
}

function acceptedMethods(connection: GatewayConnection): Method[] {
    const payments = connection.capabilities.payments as
        { methods?: Record<string, unknown> } | undefined;
    return methods
        .map(({ value }) => value)
        .filter((method) => payments?.methods?.[method] !== undefined);
}

function methodLabel(method: Method) {
    return methods.find((item) => item.value === method)?.label ?? method;
}

function toDraft(schedule: GatewayFeeSchedule | undefined): Draft {
    const entry = (fee: FeeEntry | undefined) => ({
        percent: fee && fee.percentBps > 0 ? decimal(fee.percentBps / 100) : '',
        fixed: fee && fee.fixedMinor > 0 ? decimal(fee.fixedMinor / 100) : '',
    });
    return {
        card: entry(schedule?.card),
        pix: entry(schedule?.pix),
        boleto: entry(schedule?.boleto),
    };
}

function feeText(fee: FeeEntry) {
    const percent = `${(fee.percentBps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
    if (fee.fixedMinor === 0) return percent;
    if (fee.percentBps === 0) return money(fee.fixedMinor);
    return `${percent} + ${money(fee.fixedMinor)}`;
}

function estimate(entry: { percent: string; fixed: string }, amountMinor: number) {
    const percent = parseDecimal(entry.percent);
    const fixed = parseDecimal(entry.fixed);
    if (percent === undefined && fixed === undefined) return undefined;
    return Math.round((amountMinor * (percent ?? 0)) / 100) + Math.round((fixed ?? 0) * 100);
}

function parseDecimal(value: string) {
    const normalized = value.trim().replace(/\./g, '').replace(',', '.');
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function decimal(value: number) {
    return value.toFixed(2).replace('.', ',');
}

function money(minor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        minor / 100,
    );
}

function noSubscription() {
    return () => undefined;
}
