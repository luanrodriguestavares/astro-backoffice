'use client';

import { useMemo, useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { showToast } from '@/components/ui/toast';
import type { Checkout, CustomDomain } from '@/lib/api/types';

type Props = {
    initialDomains: CustomDomain[];
    checkouts: Checkout[];
    canManage: boolean;
};

export function CustomDomainManager({ initialDomains, checkouts, canManage }: Props) {
    const [domains, setDomains] = useState(initialDomains);
    const [hostname, setHostname] = useState('');
    const [checkoutId, setCheckoutId] = useState(
        checkouts.find((checkout) => checkout.status !== 'archived')?.id ?? '',
    );
    const [busy, setBusy] = useState<string | null>(null);
    const selectableCheckouts = useMemo(
        () => checkouts.filter((checkout) => checkout.status !== 'archived'),
        [checkouts],
    );

    async function createDomain(event: React.FormEvent) {
        event.preventDefault();
        if (!hostname.trim() || !checkoutId) return;
        setBusy('create');
        try {
            const response = await fetch('/api/custom-domains', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ hostname: hostname.trim().toLowerCase(), checkoutId }),
            });
            const payload = (await response.json()) as { data?: CustomDomain; detail?: string };
            if (!response.ok || !payload.data)
                throw new Error(payload.detail ?? 'Não foi possível adicionar o domínio.');
            setDomains((current) => [payload.data!, ...current]);
            setHostname('');
            showToast({ tone: 'success', description: 'Domínio adicionado. Agora configure o CNAME.' });
        } catch (error) {
            showToast({
                tone: 'error',
                description: error instanceof Error ? error.message : 'Não foi possível adicionar o domínio.',
            });
        } finally {
            setBusy(null);
        }
    }

    async function verifyDomain(domain: CustomDomain) {
        setBusy(domain.id);
        try {
            const response = await fetch(`/api/custom-domains/${encodeURIComponent(domain.id)}/verify`, {
                method: 'POST',
            });
            const payload = (await response.json()) as { data?: CustomDomain; detail?: string };
            if (!response.ok || !payload.data)
                throw new Error(payload.detail ?? 'O DNS ainda não pôde ser verificado.');
            setDomains((current) =>
                current.map((item) => (item.id === domain.id ? payload.data! : item)),
            );
            showToast({ tone: 'success', description: 'Domínio verificado e SSL ativado.' });
        } catch (error) {
            showToast({
                tone: 'warning',
                description: error instanceof Error ? error.message : 'O DNS ainda não pôde ser verificado.',
            });
        } finally {
            setBusy(null);
        }
    }

    async function removeDomain(domain: CustomDomain) {
        if (!window.confirm(`Remover ${domain.hostname}? O checkout deixará de responder nesse endereço.`))
            return;
        setBusy(domain.id);
        try {
            const response = await fetch(`/api/custom-domains/${encodeURIComponent(domain.id)}`, {
                method: 'DELETE',
            });
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok) throw new Error(payload.detail ?? 'Não foi possível remover o domínio.');
            setDomains((current) => current.filter((item) => item.id !== domain.id));
            showToast({ tone: 'success', description: 'Domínio removido.' });
        } catch (error) {
            showToast({
                tone: 'error',
                description: error instanceof Error ? error.message : 'Não foi possível remover o domínio.',
            });
        } finally {
            setBusy(null);
        }
    }

    async function copy(value: string) {
        await navigator.clipboard.writeText(value);
        showToast({ tone: 'success', description: 'Copiado para a área de transferência.' });
    }

    return (
        <div className="space-y-5">
            <section className="glass-panel rounded-[28px] p-6 sm:p-7">
                <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <div>
                        <div className="flex items-start gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border bg-brand-soft text-brand-strong">
                                <Icon name="link" className="size-[19px]" />
                            </span>
                            <div>
                                <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">Seu checkout com a sua marca</h2>
                                <p className="mt-1 max-w-2xl text-[13px] leading-6 text-muted">
                                    Use um subdomínio como <strong className="font-semibold text-foreground">checkout.empresa.com</strong>. O Astro configura e renova o certificado SSL automaticamente.
                                </p>
                            </div>
                        </div>

                        {selectableCheckouts.length > 0 ? (
                            <form className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)_auto]" onSubmit={createDomain}>
                                <label className="grid gap-2 text-[12px] font-semibold text-muted">
                                    Domínio
                                    <input
                                        value={hostname}
                                        onChange={(event) => setHostname(event.target.value.toLowerCase())}
                                        placeholder="checkout.empresa.com"
                                        disabled={!canManage || busy !== null}
                                        className="h-11 rounded-xl border border-border bg-[var(--control-bg)] px-4 text-[13px] font-medium text-foreground outline-none transition placeholder:text-muted/65 focus:border-brand/45 focus:ring-4 focus:ring-brand/10"
                                    />
                                </label>
                                <label className="grid gap-2 text-[12px] font-semibold text-muted">
                                    Checkout vinculado
                                    <CustomSelect
                                        name="checkoutId"
                                        value={checkoutId}
                                        onValueChange={setCheckoutId}
                                        options={selectableCheckouts.map((checkout) => ({
                                            value: checkout.id,
                                            label: checkout.name,
                                            badge:
                                                checkout.status === 'published'
                                                    ? 'Publicado'
                                                    : 'Rascunho',
                                        }))}
                                        disabled={!canManage || busy !== null}
                                        required
                                    />
                                </label>
                                <Button className="mt-auto" variant="primary" type="submit" disabled={!canManage || busy !== null || !hostname.trim()}>
                                    <Icon name="plus" className="size-4" />
                                    {busy === 'create' ? 'Adicionando...' : 'Adicionar'}
                                </Button>
                            </form>
                        ) : (
                            <div className="mt-6 rounded-2xl border border-border bg-surface-muted/35 p-4 text-[13px] text-muted">
                                Crie um checkout antes de configurar o domínio.{' '}
                                <ButtonLink href="/checkouts" variant="ghost">Ir para checkouts</ButtonLink>
                            </div>
                        )}
                    </div>
                    <div className="rounded-[22px] border border-border bg-surface-muted/35 p-5">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Disponibilidade</p>
                        <p className="mt-3 text-[15px] font-semibold text-foreground">Plano Pro ou superior</p>
                        <p className="mt-1 text-[12px] leading-5 text-muted">A quantidade permitida é configurada por plano. O limite é validado também pela API.</p>
                    </div>
                </div>
            </section>

            {domains.length === 0 ? (
                <section className="glass-panel rounded-[26px] px-6 py-12 text-center">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong"><Icon name="link" className="size-5" /></span>
                    <h2 className="mt-4 text-[16px] font-semibold text-foreground">Nenhum domínio configurado</h2>
                    <p className="mt-1 text-[13px] text-muted">Adicione seu primeiro subdomínio para começar.</p>
                </section>
            ) : (
                <div className="grid gap-4">
                    {domains.map((domain) => (
                        <DomainCard
                            key={domain.id}
                            domain={domain}
                            busy={busy === domain.id}
                            canManage={canManage}
                            onVerify={() => verifyDomain(domain)}
                            onRemove={() => removeDomain(domain)}
                            onCopy={copy}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function DomainCard({ domain, busy, canManage, onVerify, onRemove, onCopy }: {
    domain: CustomDomain;
    busy: boolean;
    canManage: boolean;
    onVerify: () => void;
    onRemove: () => void;
    onCopy: (value: string) => void;
}) {
    const active = domain.status === 'active';
    return (
        <section className="glass-panel overflow-hidden rounded-[26px]">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {active ? (
                            <a href={`https://${domain.hostname}`} target="_blank" rel="noreferrer" className="truncate text-[16px] font-semibold text-foreground hover:text-brand-strong">{domain.hostname}</a>
                        ) : (
                            <h2 className="truncate text-[16px] font-semibold text-foreground">{domain.hostname}</h2>
                        )}
                        <StatusBadge status={domain.status} />
                    </div>
                    <p className="mt-1 text-[12px] text-muted">Checkout: {domain.checkoutName}{active ? ' · SSL automático ativo' : ''}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {!active && (
                        <Button variant="secondary" type="button" disabled={!canManage || busy} onClick={onVerify}>
                            <Icon name="check" className="size-[15px]" /> {busy ? 'Verificando...' : 'Verificar DNS'}
                        </Button>
                    )}
                    <Button variant="danger" type="button" disabled={!canManage || busy} onClick={onRemove}>
                        <Icon name="trash" className="size-3.5" /> Remover
                    </Button>
                </div>
            </div>
            {!active && (
                <div className="border-t border-border bg-surface-muted/25 p-6">
                    <p className="text-[13px] font-semibold text-foreground">Configure este registro no provedor do seu domínio</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)]">
                        <DnsValue label="Tipo" value="CNAME" onCopy={onCopy} />
                        <DnsValue label="Nome / host" value={domain.hostname} onCopy={onCopy} />
                        <DnsValue label="Aponta para" value={domain.cnameTarget} onCopy={onCopy} />
                    </div>
                    <p className="mt-4 text-[12px] leading-5 text-muted">A propagação pode levar alguns minutos. Depois, clique em “Verificar DNS”. O domínio ficará disponível quando o checkout vinculado estiver publicado.</p>
                </div>
            )}
        </section>
    );
}

function DnsValue({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) {
    return (
        <div className="rounded-2xl border border-border bg-[var(--control-bg)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
                <code className="min-w-0 truncate text-[12px] font-semibold text-foreground">{value}</code>
                <Button variant="icon" className="size-8 shrink-0" type="button" title={`Copiar ${label}`} onClick={() => onCopy(value)}>
                    <Icon name="copy" className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: CustomDomain['status'] }) {
    const labels = {
        active: 'Ativo',
        pending_verification: 'Aguardando DNS',
        verification_failed: 'DNS não encontrado',
        disabled: 'Desativado',
    } as const;
    return (
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status === 'active' ? 'border-success/25 bg-success/10 text-success' : status === 'verification_failed' ? 'border-warning/25 bg-warning/10 text-warning' : 'border-border bg-surface-muted/60 text-muted'}`}>
            {labels[status]}
        </span>
    );
}
