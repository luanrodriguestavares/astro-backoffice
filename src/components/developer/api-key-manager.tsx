'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { ApiKeyCreateAction } from '@/components/resources/create-actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ResourceTable, SummaryCard } from '@/components/ui/resource-table';
import { showToast } from '@/components/ui/toast';

export type ApiKeyItem = {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    rateLimitPerMinute: number;
    status: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
    rotatedAt: string | null;
    createdAt: string;
};

const scopeLabels: Record<string, string> = {
    'analytics.read': 'Consultar analytics',
    'analytics.write': 'Enviar eventos',
    'products.read': 'Consultar catálogo',
    'orders.read': 'Consultar pedidos',
    'customers.read': 'Consultar clientes',
    'subscriptions.read': 'Consultar assinaturas',
    'invoices.read': 'Consultar faturas',
    'usage.read': 'Consultar consumo',
    'usage.write': 'Registrar consumo',
};

export function ApiKeyManager({ keys }: { keys: ApiKeyItem[] }) {
    const [referenceTime] = useState(() => Date.now());
    const active = keys.filter((key) => key.status === 'active');
    const recentlyUsed = active.filter(
        (key) =>
            key.lastUsedAt && referenceTime - new Date(key.lastUsedAt).getTime() <= 30 * 86_400_000,
    );
    const expiring = active.filter(
        (key) =>
            key.expiresAt &&
            new Date(key.expiresAt).getTime() > referenceTime &&
            new Date(key.expiresAt).getTime() - referenceTime <= 30 * 86_400_000,
    );

    return (
        <div className="space-y-5">
            <div data-tour="developer-summary" className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                    label="Chaves ativas"
                    value={String(active.length)}
                    detail={`${keys.length} criadas no total`}
                    icon="code"
                />
                <SummaryCard
                    label="Usadas recentemente"
                    value={String(recentlyUsed.length)}
                    detail="Acessadas nos últimos 30 dias"
                    icon="bolt"
                />
                <SummaryCard
                    label="Expiram em breve"
                    value={String(expiring.length)}
                    detail="Validade termina em até 30 dias"
                    icon="clock"
                />
            </div>

            <div data-tour="developer-create" className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-[16px] font-semibold text-foreground">
                        Chaves da organização
                    </h2>
                    <p className="mt-1 text-[12px] text-muted">
                        Rotacione credenciais periodicamente e revogue acessos que não são mais
                        usados.
                    </p>
                </div>
                <ApiKeyCreateAction />
            </div>

            <div data-tour="developer-keys">
                <ResourceTable
                    rows={keys}
                    empty="Nenhuma chave de API criada."
                    title="Credenciais"
                    description="Prefixos e metadados são visíveis; os segredos nunca são recuperados."
                    columns={[
                        {
                            label: 'Chave',
                            value: (row) => `${row.name} ${row.prefix}`,
                            render: (row) => (
                                <div>
                                    <p className="font-semibold text-foreground">{row.name}</p>
                                    <code className="mt-1 block text-[11px] text-muted">
                                        {row.prefix}
                                    </code>
                                </div>
                            ),
                        },
                        {
                            label: 'Permissões',
                            value: (row) => row.scopes.map(scopeLabel).join(' '),
                            render: (row) => (
                                <div className="flex max-w-[300px] flex-wrap gap-1.5">
                                    {row.scopes.map((scope) => (
                                        <span
                                            key={scope}
                                            className="rounded-full border border-border bg-surface-muted/60 px-2.5 py-1 text-[10px] font-semibold text-muted"
                                        >
                                            {scopeLabel(scope)}
                                        </span>
                                    ))}
                                </div>
                            ),
                        },
                        { label: 'Limite', value: (row) => `${row.rateLimitPerMinute}/min` },
                        {
                            label: 'Situação',
                            value: (row) => statusLabel(row),
                            render: (row) => <KeyStatus keyItem={row} />,
                        },
                        { label: 'Último uso', value: (row) => formatDateTime(row.lastUsedAt) },
                        {
                            label: 'Validade',
                            value: (row) =>
                                row.expiresAt ? formatDateTime(row.expiresAt) : 'Sem expiração',
                        },
                        {
                            label: 'Ações',
                            value: () => '',
                            render: (row) => <ApiKeyActions keyItem={row} />,
                        },
                    ]}
                />
            </div>
        </div>
    );
}

function ApiKeyActions({ keyItem }: { keyItem: ApiKeyItem }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [secret, setSecret] = useState<string>();
    const active = keyItem.status === 'active' && !isExpired(keyItem);

    async function rotate() {
        if (
            !window.confirm(
                `Rotacionar “${keyItem.name}”? A chave atual será revogada imediatamente.`,
            )
        )
            return;
        setBusy(true);
        try {
            const response = await fetch(
                `/api/developer/api-keys/${encodeURIComponent(keyItem.id)}/rotate`,
                { method: 'POST' },
            );
            const payload = (await response.json()) as {
                data?: { secret?: string };
                detail?: string;
            };
            if (!response.ok || !payload.data?.secret)
                throw new Error(payload.detail ?? 'Não foi possível rotacionar a chave.');
            setSecret(payload.data.secret);
            router.refresh();
        } catch (error) {
            showToast({
                tone: 'error',
                description:
                    error instanceof Error ? error.message : 'Não foi possível rotacionar a chave.',
            });
        } finally {
            setBusy(false);
        }
    }

    async function revoke() {
        if (
            !window.confirm(
                `Revogar “${keyItem.name}”? Esta ação interrompe a integração imediatamente.`,
            )
        )
            return;
        setBusy(true);
        try {
            const response = await fetch(
                `/api/developer/api-keys/${encodeURIComponent(keyItem.id)}`,
                { method: 'DELETE' },
            );
            const payload = (await response.json()) as { detail?: string };
            if (!response.ok)
                throw new Error(payload.detail ?? 'Não foi possível revogar a chave.');
            showToast({ tone: 'success', description: 'Chave revogada.' });
            router.refresh();
        } catch (error) {
            showToast({
                tone: 'error',
                description:
                    error instanceof Error ? error.message : 'Não foi possível revogar a chave.',
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" disabled={!active || busy} onClick={rotate}>
                    Rotacionar
                </Button>
                <Button type="button" variant="danger" disabled={!active || busy} onClick={revoke}>
                    Revogar
                </Button>
            </div>
            {secret && <SecretDialog secret={secret} close={() => setSecret(undefined)} />}
        </>
    );
}

function SecretDialog({ secret, close }: { secret: string; close: () => void }) {
    return createPortal(
        <div
            className="fixed inset-0 z-[120] grid place-items-center bg-[#17172c]/20 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
            }}
        >
            <section className="modal-surface glass-panel w-full max-w-lg rounded-[26px] p-6">
                <span className="grid size-10 place-items-center rounded-2xl bg-success/10 text-success">
                    <Icon name="check" className="size-5" />
                </span>
                <h2 className="mt-4 text-xl font-semibold text-foreground">Nova chave gerada</h2>
                <p className="mt-2 text-[13px] leading-5 text-muted">
                    A credencial anterior já foi revogada. Copie a nova chave agora, pois ela não
                    será exibida novamente.
                </p>
                <code className="mt-4 block overflow-x-auto rounded-xl border border-border bg-[var(--control-bg)] p-3 text-xs text-foreground">
                    {secret}
                </code>
                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            void navigator.clipboard.writeText(secret);
                            showToast({ tone: 'success', description: 'Chave copiada.' });
                        }}
                    >
                        <Icon name="copy" className="size-4" />
                        Copiar
                    </Button>
                    <Button type="button" variant="primary" onClick={close}>
                        Concluir
                    </Button>
                </div>
            </section>
        </div>,
        document.body,
    );
}

function KeyStatus({ keyItem }: { keyItem: ApiKeyItem }) {
    const label = statusLabel(keyItem);
    const active = label === 'Ativa';
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${active ? 'border-success/25 bg-success/10 text-success' : 'border-border bg-surface-muted/60 text-muted'}`}
        >
            {label}
        </span>
    );
}

function statusLabel(keyItem: ApiKeyItem) {
    if (keyItem.status === 'revoked') return 'Revogada';
    if (isExpired(keyItem)) return 'Expirada';
    return keyItem.status === 'active' ? 'Ativa' : keyItem.status;
}

function isExpired(keyItem: ApiKeyItem) {
    return keyItem.expiresAt !== null && new Date(keyItem.expiresAt).getTime() <= Date.now();
}

function scopeLabel(scope: string) {
    return scopeLabels[scope] ?? scope;
}

function formatDateTime(value: string | null) {
    return value
        ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
              new Date(value),
          )
        : 'Nunca';
}
