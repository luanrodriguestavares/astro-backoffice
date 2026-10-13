'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { CustomSelect, type SelectOption } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';

export type FilterView = 'events' | 'webhooks' | 'gateway' | 'requests';

const fieldLabels: Record<string, string> = {
    paymentId: 'Pagamento',
    correlationId: 'Correlação',
    requestId: 'Request ID',
    category: 'Categoria',
    outcome: 'Resultado',
    eventType: 'Evento',
    provider: 'Provedor',
    status: 'Status',
    route: 'Rota',
    method: 'Método',
    actorType: 'Origem',
    from: 'Início',
    to: 'Fim',
};

export function LogFilterDialog({
    view,
    params,
    pathname = '/logs',
    preserveView = true,
    routeView,
}: {
    view: FilterView;
    params: Record<string, string | undefined>;
    pathname?: string;
    preserveView?: boolean;
    routeView?: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const active = Object.entries(params).filter(
        ([key, value]) => key !== 'view' && Boolean(value?.trim()),
    );

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const query = new URLSearchParams();
        if (preserveView) query.set('view', routeView ?? view);
        for (const [key, raw] of new FormData(event.currentTarget)) {
            const value = String(raw).trim();
            if (value) query.set(key, value);
        }
        setOpen(false);
        router.push(`${pathname}?${query.toString()}`);
    }

    function clear() {
        const query = preserveView ? `?view=${routeView ?? view}` : '';
        setOpen(false);
        router.push(`${pathname}${query}`);
    }

    return (
        <>
            <section className="mb-4 flex flex-col gap-3 rounded-[20px] border border-border bg-surface/62 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold">
                        {active.length ? `${active.length} filtros aplicados` : 'Visão sem filtros'}
                    </p>
                    <div className="mt-1 flex min-w-0 flex-wrap gap-1.5 text-[10px] text-muted">
                        {active.length ? (
                            active.slice(0, 4).map(([key, value]) => (
                                <span
                                    key={key}
                                    className="max-w-[260px] truncate rounded-full bg-surface-muted px-2 py-1"
                                >
                                    {fieldLabels[key] ?? key}: {value}
                                </span>
                            ))
                        ) : (
                            <span>
                                Use filtros somente quando precisar investigar um caso específico.
                            </span>
                        )}
                        {active.length > 4 && (
                            <span className="px-1 py-1">+{active.length - 4}</span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {active.length > 0 && (
                        <Button type="button" variant="ghost" onClick={clear}>
                            Limpar
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
                        <Icon name="settings" className="size-3.5" />
                        Filtros
                        {active.length > 0 && (
                            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] text-brand-contrast">
                                {active.length}
                            </span>
                        )}
                    </Button>
                </div>
            </section>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                labelledBy="log-filter-title"
                maxWidth="max-w-3xl"
            >
                <form onSubmit={submit}>
                    <ModalHeader
                        titleId="log-filter-title"
                        eyebrow="Busca avançada"
                        title="Filtrar registros"
                        description={filterDescription(view)}
                        onClose={() => setOpen(false)}
                    />
                    <ModalBody className="grid gap-5">
                        <FilterFields view={view} params={params} />
                    </ModalBody>
                    <ModalFooter>
                        {active.length > 0 && (
                            <Button type="button" variant="ghost" onClick={clear}>
                                Limpar todos
                            </Button>
                        )}
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            <Icon name="search" className="size-3.5" />
                            Aplicar filtros
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </>
    );
}

function FilterFields({
    view,
    params,
}: {
    view: FilterView;
    params: Record<string, string | undefined>;
}) {
    return (
        <>
            <section>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Identificação
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {(view === 'events' || view === 'webhooks' || view === 'gateway') && (
                        <Field
                            name="paymentId"
                            value={params.paymentId}
                            label="Pagamento ou venda"
                            placeholder="pmi_, pay_, pat_ ou ref_"
                        />
                    )}
                    {view === 'events' && (
                        <>
                            <Field
                                name="correlationId"
                                value={params.correlationId}
                                label="Correlation ID"
                                placeholder="ID de correlação"
                            />
                            <Field
                                name="requestId"
                                value={params.requestId}
                                label="Request ID"
                                placeholder="ID da requisição"
                            />
                        </>
                    )}
                    {view === 'webhooks' && (
                        <Field
                            name="eventType"
                            value={params.eventType}
                            label="Tipo de evento"
                            placeholder="payment.approved.v1"
                        />
                    )}
                    {view === 'gateway' && (
                        <Field
                            name="provider"
                            value={params.provider}
                            label="Provedor"
                            placeholder="stripe, mercado_pago…"
                        />
                    )}
                    {view === 'requests' && (
                        <>
                            <Field
                                name="route"
                                value={params.route}
                                label="Rota"
                                placeholder="/developer/v1/payments"
                            />
                            <Field
                                name="requestId"
                                value={params.requestId}
                                label="Request ID"
                                placeholder="ID da requisição"
                            />
                            <Field
                                name="correlationId"
                                value={params.correlationId}
                                label="Correlation ID"
                                placeholder="ID de correlação"
                            />
                        </>
                    )}
                </div>
            </section>

            <section>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Classificação
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {view === 'events' && (
                        <>
                            <SelectField
                                name="category"
                                value={params.category}
                                label="Categoria"
                                options={categoryOptions}
                            />
                            <SelectField
                                name="outcome"
                                value={params.outcome}
                                label="Resultado"
                                options={outcomeOptions}
                            />
                        </>
                    )}
                    {view === 'webhooks' && (
                        <SelectField
                            name="status"
                            value={params.status}
                            label="Status da entrega"
                            options={deliveryStatusOptions}
                        />
                    )}
                    {view === 'gateway' && (
                        <SelectField
                            name="status"
                            value={params.status}
                            label="Status do processamento"
                            options={gatewayStatusOptions}
                        />
                    )}
                    {view === 'requests' && (
                        <>
                            <SelectField
                                name="method"
                                value={params.method}
                                label="Método HTTP"
                                options={methodOptions}
                            />
                            <SelectField
                                name="status"
                                value={params.status}
                                label="Faixa de status"
                                options={httpStatusOptions}
                            />
                            <SelectField
                                name="actorType"
                                value={params.actorType}
                                label="Origem"
                                options={actorOptions}
                            />
                        </>
                    )}
                </div>
            </section>

            <section>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Período
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                        name="from"
                        value={params.from}
                        label="A partir de"
                        type="datetime-local"
                    />
                    <Field name="to" value={params.to} label="Até" type="datetime-local" />
                </div>
            </section>
        </>
    );
}

function Field({
    name,
    value,
    label,
    placeholder,
    type = 'text',
}: {
    name: string;
    value?: string;
    label: string;
    placeholder?: string;
    type?: string;
}) {
    return (
        <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-medium">{label}</span>
            <input
                type={type}
                name={name}
                defaultValue={value}
                placeholder={placeholder}
                className="ui-control h-11 w-full px-3.5 text-[12px]"
            />
        </label>
    );
}

function SelectField({
    name,
    value,
    label,
    options,
}: {
    name: string;
    value?: string;
    label: string;
    options: SelectOption[];
}) {
    return (
        <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-medium">{label}</span>
            <CustomSelect
                name={name}
                defaultValue={value ?? ''}
                options={[{ value: '', label: 'Todos' }, ...options]}
            />
        </label>
    );
}

function filterDescription(view: FilterView) {
    if (view === 'events')
        return 'Encontre uma venda pelo identificador ou refine os eventos exibidos.';
    if (view === 'requests')
        return 'Refine as chamadas por rota, resposta, origem ou identificadores técnicos.';
    if (view === 'webhooks') return 'Refine as entregas feitas aos seus endpoints.';
    return 'Refine os eventos recebidos dos gateways de pagamento.';
}

const categoryOptions = [
    ['status', 'Mudança de status'],
    ['routing', 'Orquestração'],
    ['attempt', 'Tentativa'],
    ['gateway', 'Gateway'],
    ['refund', 'Reembolso'],
    ['cancellation', 'Cancelamento'],
    ['reconciliation', 'Reconciliação'],
    ['gateway_webhook', 'Webhook recebido'],
    ['customer_webhook', 'Webhook enviado'],
].map(([value, label]) => ({ value, label }));
const outcomeOptions = [
    ['success', 'Sucesso'],
    ['failure', 'Falha'],
    ['warning', 'Alerta'],
    ['info', 'Informação'],
    ['automatic', 'Ação automática'],
].map(([value, label]) => ({ value, label }));
const deliveryStatusOptions = [
    ['pending', 'Na fila'],
    ['delivering', 'Enviando'],
    ['delivered', 'Entregue'],
    ['failed', 'Falhou'],
    ['dead_letter', 'Falha definitiva'],
].map(([value, label]) => ({ value, label }));
const gatewayStatusOptions = [
    ['pending', 'Pendente'],
    ['processed', 'Processado'],
    ['ignored', 'Ignorado'],
    ['failed', 'Falhou'],
].map(([value, label]) => ({ value, label }));
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({
    value,
    label: value,
}));
const httpStatusOptions = [
    ['2xx', '2xx · sucesso'],
    ['3xx', '3xx · redirecionamento'],
    ['4xx', '4xx · erro do cliente'],
    ['5xx', '5xx · erro do servidor'],
].map(([value, label]) => ({ value, label }));
const actorOptions = [
    { value: 'user', label: 'Usuário do painel' },
    { value: 'api_key', label: 'Chave de API' },
];
