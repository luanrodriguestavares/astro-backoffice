'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import type {
    Checkout,
    FlowCondition,
    FlowConditionField,
    FlowConditionGroup,
    FlowIssue,
    FlowNode,
    GatewayConnection,
    Product,
    RoutingPaymentMethod,
    FlowEvent,
    SectionColor,
    WebhookEndpointSummary,
} from '@/lib/api/types';
import {
    blockOf,
    eventLabels,
    sectionColors,
    defaultCondition,
    fieldLabels,
    fieldOperators,
    fromMinor,
    groupSentence,
    methodLabels,
    newId,
    operatorLabels,
    toMinor,
} from '@/lib/orchestration/flow';

import { useFlowEditor } from './flow-context';
import { nodeTitle } from './flow-node';

type Tab = 'config' | 'data' | 'settings';

export function NodeInspector({
    node,
    connections,
    checkouts,
    products,
    issues,
    webhooks,
    onChange,
    onDelete,
    onDuplicate,
    onClose,
    initialTab = 'config',
}: {
    webhooks: WebhookEndpointSummary[];
    initialTab?: 'config' | 'settings';
    node: FlowNode;
    connections: GatewayConnection[];
    checkouts: Checkout[];
    products: Product[];
    issues: FlowIssue[];
    onChange(node: FlowNode): void;
    onDelete(): void;
    onDuplicate(): void;
    onClose(): void;
}) {
    const editor = useFlowEditor();
    const [tab, setTab] = useState<Tab>(initialTab);
    const block = blockOf(node);
    const gatewayId = node.type === 'gateway' ? node.config.gatewayConnectionId : null;
    const connection = gatewayId ? editor.connections.get(gatewayId) : undefined;

    return (
        <aside
            aria-label="Configuração do bloco"
            className="flex h-full w-full flex-col overflow-hidden border-l border-border bg-surface"
        >
            <header className="flex items-start gap-3 px-5 pb-3 pt-5">
                <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${block.tone}`}
                >
                    <Icon name={block.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-[16px] font-semibold tracking-[-0.02em]">
                            {nodeTitle(node, editor.connections)}
                        </h2>
                        {editor.fallbackNodes.has(node.id) && (
                            <span className="rounded-full bg-[#eef0ff] px-2 py-0.5 text-[10px] font-semibold text-[#4f46e5]">
                                Reserva
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-4 text-muted">{block.description}</p>
                </div>
                <Button type="button" variant="icon" aria-label="Fechar" onClick={onClose}>
                    <Icon name="close" className="size-3.5" />
                </Button>
            </header>

            <div role="tablist" className="flex gap-5 border-b border-border px-5 text-[13px]">
                {(
                    [
                        ['config', 'Configuração'],
                        ['data', 'Dados'],
                        ['settings', 'Ajustes'],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        onClick={() => setTab(value)}
                        className={`-mb-px border-b-2 pb-2.5 pt-1 font-semibold transition ${tab === value ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
                {issues.length > 0 && (
                    <ul className="space-y-1.5">
                        {issues.map((issue) => (
                            <li
                                key={issue.message}
                                className={`flex gap-2 rounded-xl px-3 py-2 text-[12px] leading-4 ${issue.severity === 'error' ? 'bg-[#fdecef] text-[#a3263b]' : 'bg-[#fff5e9] text-[#7a4a0b]'}`}
                            >
                                <Icon name="alert" className="mt-0.5 size-3.5 shrink-0" />
                                {issue.message}
                            </li>
                        ))}
                    </ul>
                )}

                {tab === 'config' && (
                    <ConfigTab
                        node={node}
                        webhooks={webhooks}
                        connections={connections}
                        checkouts={checkouts}
                        products={products}
                        onChange={onChange}
                    />
                )}
                {tab === 'data' && <DataTab node={node} connection={connection} />}
                {tab === 'settings' && (
                    <div className="space-y-4">
                        <Field label="Nome do bloco">
                            <input
                                value={node.name ?? ''}
                                maxLength={80}
                                placeholder={nodeTitle({ ...node, name: '' }, editor.connections)}
                                onChange={(event) =>
                                    onChange({ ...node, name: event.target.value || undefined })
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Anotações" hint="Só para a sua equipe; não muda as vendas.">
                            <textarea
                                value={node.notes ?? ''}
                                maxLength={500}
                                rows={4}
                                onChange={(event) =>
                                    onChange({ ...node, notes: event.target.value || undefined })
                                }
                                className={`${inputClass} h-auto py-2.5`}
                            />
                        </Field>
                        <p className="font-mono text-[11px] text-muted">id: {node.id}</p>
                        {node.type !== 'trigger' && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="h-9 px-3"
                                    onClick={onDuplicate}
                                >
                                    <Icon name="copy" className="size-3.5" /> Duplicar
                                </Button>
                                <Button type="button" variant="danger" onClick={onDelete}>
                                    <Icon name="trash" className="size-3.5" /> Excluir bloco
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

function ConfigTab({
    node,
    webhooks,
    connections,
    checkouts,
    products,
    onChange,
}: {
    node: FlowNode;
    webhooks: WebhookEndpointSummary[];
    connections: GatewayConnection[];
    checkouts: Checkout[];
    products: Product[];
    onChange(node: FlowNode): void;
}) {
    const usable = connections.filter((connection) => connection.status !== 'disabled');
    switch (node.type) {
        case 'event_trigger':
            return (
                <div className="space-y-4">
                    <Field label="Quando">
                        <CustomSelect
                            name={`event_${node.id}`}
                            value={node.config.event}
                            options={(Object.keys(eventLabels) as FlowEvent[]).map((event) => ({
                                value: event,
                                label: eventLabels[event],
                            }))}
                            onValueChange={(event) =>
                                onChange({ ...node, config: { event: event as FlowEvent } })
                            }
                        />
                    </Field>
                    <Explain>
                        A cada evento real, o fluxo segue por aqui: use Condição, Roteador ou
                        Divisão para filtrar e ligue ações como <b>Enviar webhook</b> e{' '}
                        <b>Enviar e-mail</b>. Rodam depois da venda, sem atrasar o pagamento.
                    </Explain>
                </div>
            );
        case 'send_webhook':
            return (
                <div className="space-y-4">
                    <Field label="Endpoint que recebe">
                        <CustomSelect
                            name={`webhook_${node.id}`}
                            value={node.config.webhookEndpointId ?? ''}
                            placeholder={
                                webhooks.length === 0
                                    ? 'Nenhum endpoint cadastrado'
                                    : 'Escolha o endpoint'
                            }
                            options={webhooks.map((endpoint) => ({
                                value: endpoint.id,
                                label: endpoint.name ?? endpoint.url,
                                badge: endpoint.status === 'active' ? undefined : 'Desativado',
                            }))}
                            onValueChange={(webhookEndpointId) =>
                                onChange({ ...node, config: { webhookEndpointId } })
                            }
                        />
                    </Field>
                    <Explain>
                        Envia um POST assinado com os dados do evento (pagamento, pedido, cliente,
                        valor e produtos). Se o sistema estiver fora do ar, a Astro tenta de novo e
                        o histórico fica em Webhooks.
                    </Explain>
                    <Link
                        href="/webhooks"
                        className="inline-flex items-center gap-1 text-[12px] font-semibold underline"
                    >
                        {webhooks.length === 0 ? 'Cadastrar um endpoint' : 'Gerenciar endpoints'}
                        <Icon name="arrow-right" className="size-3" />
                    </Link>
                </div>
            );
        case 'send_email':
            return <EmailEditor node={node} onChange={onChange} />;
        case 'trigger':
            return (
                <Explain>
                    Toda venda começa aqui, quando o comprador confirma o pagamento no checkout. O
                    fluxo decide por quais gateways ela passa, na ordem.
                </Explain>
            );
        case 'condition':
            return (
                <div className="space-y-4">
                    <Explain>
                        Vendas que cumprem as condições saem por <b>verdadeiro</b>; as outras, por{' '}
                        <b>falso</b>.
                    </Explain>
                    <ConditionGroupEditor
                        group={node.config}
                        checkouts={checkouts}
                        products={products}
                        onChange={(config) => onChange({ ...node, config })}
                    />
                </div>
            );
        case 'switch':
            return (
                <SwitchEditor
                    node={node}
                    checkouts={checkouts}
                    products={products}
                    onChange={onChange}
                />
            );
        case 'split':
            return (
                <div className="space-y-4">
                    <Explain>
                        Divide as vendas para comparar gateways. A mesma venda cai sempre no mesmo
                        lado, mesmo se for reprocessada.
                    </Explain>
                    <div className="rounded-2xl border border-border bg-[var(--control-bg)] p-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-[22px] font-semibold tracking-[-0.03em]">
                                A {node.config.percentage}%
                            </span>
                            <span className="text-[14px] font-semibold text-muted">
                                B {100 - node.config.percentage}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={99}
                            value={node.config.percentage}
                            aria-label="Porcentagem do caminho A"
                            onChange={(event) =>
                                onChange({
                                    ...node,
                                    config: { percentage: Number(event.target.value) },
                                })
                            }
                            className="mt-3 w-full accent-[var(--brand)]"
                        />
                    </div>
                </div>
            );
        case 'gateway': {
            const selected = connections.find(
                (connection) => connection.id === node.config.gatewayConnectionId,
            );
            return (
                <div className="space-y-4">
                    <Field label="Conta do gateway">
                        <CustomSelect
                            name={`gateway_${node.id}`}
                            value={node.config.gatewayConnectionId ?? ''}
                            placeholder="Escolha o gateway"
                            options={usable.map(connectionOption)}
                            onValueChange={(value) =>
                                onChange({ ...node, config: { gatewayConnectionId: value } })
                            }
                        />
                    </Field>
                    {selected && <ConnectionFacts connection={selected} />}
                    <Explain>
                        Se a cobrança falhar por instabilidade ou recusa recuperável, a venda segue
                        pela saída <b>falhou</b> para o próximo gateway, sem o comprador perceber.
                        Fraude e dados inválidos encerram a cascata.
                    </Explain>
                    {usable.length === 0 && (
                        <Link href="/gateways" className="text-[12px] font-semibold underline">
                            Conectar um gateway
                        </Link>
                    )}
                </div>
            );
        }
        case 'cheapest': {
            const selected = node.config.gatewayConnectionIds;
            const missingFees = selected
                .map((id) => connections.find((connection) => connection.id === id))
                .filter(
                    (connection) =>
                        connection && Object.keys(connection.feeSchedule ?? {}).length === 0,
                )
                .map((connection) => connection?.name ?? '');
            return (
                <div className="space-y-4">
                    <Explain>
                        A cada venda, tenta primeiro o gateway com a menor taxa estimada, pulando
                        quem aprova bem menos que o melhor. Se ele falhar, tenta o próximo mais
                        barato.
                    </Explain>
                    <ChipPicker
                        label="Gateways comparados"
                        options={usable.map((connection) => ({
                            value: connection.id,
                            label: connection.name,
                        }))}
                        selected={selected}
                        onChange={(gatewayConnectionIds) =>
                            onChange({
                                ...node,
                                config: { gatewayConnectionIds: gatewayConnectionIds.slice(0, 6) },
                            })
                        }
                    />
                    {missingFees.length > 0 && (
                        <p className="rounded-xl bg-[#fff5e9] px-3 py-2 text-[11px] leading-4 text-[#78590b]">
                            Sem taxa cadastrada: {missingFees.join(', ')}. Eles ficam depois dos que
                            têm taxa.{' '}
                            <Link href="/orchestration/costs" className="font-semibold underline">
                                Informar taxas
                            </Link>
                        </p>
                    )}
                </div>
            );
        }
        case 'checkout_default':
            return (
                <Explain>
                    Usa o gateway principal e as reservas configurados no próprio checkout, em
                    Prontidão. Bom como caminho padrão para as vendas que nenhuma condição separou.
                </Explain>
            );
        case 'success':
            return (
                <Explain>
                    A venda foi cobrada por um gateway do caminho. Ligue à saída deste bloco ações
                    como <b>Enviar webhook</b> ou <b>Enviar e-mail</b> (e lógica, se quiser
                    filtrar): elas rodam quando o pagamento é de fato aprovado, só para as vendas
                    que chegaram aqui.
                </Explain>
            );
        case 'failed':
            return (
                <Explain>
                    Todos os gateways do caminho falharam e a venda é recusada; o comprador vê o
                    motivo e pode tentar de novo. Ligue à saída deste bloco as ações que devem rodar
                    quando isso acontecer, como avisar a equipe por e-mail.
                </Explain>
            );
        case 'section':
            return (
                <div className="space-y-4">
                    <Field label="Título">
                        <input
                            value={node.config.title}
                            maxLength={80}
                            placeholder="Ex.: Cartão de crédito"
                            onChange={(event) =>
                                onChange({
                                    ...node,
                                    config: { ...node.config, title: event.target.value },
                                })
                            }
                            className={inputClass}
                        />
                    </Field>
                    <div>
                        <span className="mb-1.5 block text-[12px] font-semibold">Cor</span>
                        <div className="flex gap-2" role="radiogroup" aria-label="Cor da seção">
                            {sectionColors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    role="radio"
                                    aria-checked={node.config.color === color}
                                    aria-label={sectionColorLabels[color]}
                                    title={sectionColorLabels[color]}
                                    onClick={() =>
                                        onChange({ ...node, config: { ...node.config, color } })
                                    }
                                    className={`size-8 rounded-full border-2 transition ${node.config.color === color ? 'border-foreground' : 'border-transparent hover:border-border'}`}
                                >
                                    <span
                                        className="m-auto block size-5 rounded-full"
                                        style={{ background: sectionSwatches[color] }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <Explain>
                        Só organiza o quadro: não muda as vendas. Para mover a seção com os blocos
                        de dentro, arraste pelo nome (acima da moldura) ou, com ela selecionada, por
                        qualquer espaço vazio dentro dela. Puxe as bordas para redimensionar.
                    </Explain>
                </div>
            );
        case 'note':
            return (
                <Field label="Texto da nota">
                    <textarea
                        value={node.config.text}
                        rows={8}
                        maxLength={1000}
                        onChange={(event) =>
                            onChange({
                                ...node,
                                config: { ...node.config, text: event.target.value },
                            })
                        }
                        className={`${inputClass} h-auto py-2.5`}
                    />
                </Field>
            );
    }
}

const emailVariables = [
    ['cliente.nome', 'Nome do cliente'],
    ['cliente.email', 'E-mail do cliente'],
    ['valor', 'Valor'],
    ['forma_pagamento', 'Forma de pagamento'],
    ['pedido', 'Pedido'],
    ['pagamento', 'Pagamento'],
    ['checkout', 'Checkout'],
    ['evento', 'Evento'],
] as const;

/** E-mail com variáveis: clicar numa variável insere {{variavel}} onde está o cursor. */
function EmailEditor({
    node,
    onChange,
}: {
    node: Extract<FlowNode, { type: 'send_email' }>;
    onChange(node: FlowNode): void;
}) {
    const body = useRef<HTMLTextAreaElement>(null);
    const [emailsText, setEmailsText] = useState(node.config.emails.join(', '));
    const config = node.config;
    const set = (patch: Partial<typeof config>) =>
        onChange({ ...node, config: { ...config, ...patch } });
    const insert = (variable: string) => {
        const field = body.current;
        const token = `{{${variable}}}`;
        const start = field?.selectionStart ?? config.body.length;
        const end = field?.selectionEnd ?? config.body.length;
        set({ body: `${config.body.slice(0, start)}${token}${config.body.slice(end)}` });
        requestAnimationFrame(() => {
            field?.focus();
            field?.setSelectionRange(start + token.length, start + token.length);
        });
    };
    return (
        <div className="space-y-4">
            <div>
                <span className="mb-1.5 block text-[12px] font-semibold">Para quem</span>
                <div
                    className="grid grid-cols-3 gap-1.5"
                    role="radiogroup"
                    aria-label="Destinatários"
                >
                    {(
                        [
                            ['customer', 'Cliente'],
                            ['team', 'Equipe'],
                            ['custom', 'Outros'],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={config.recipients === value}
                            onClick={() => set({ recipients: value })}
                            className={`h-9 rounded-xl border text-[12px] font-semibold transition ${config.recipients === value ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                    {config.recipients === 'customer'
                        ? 'O e-mail informado pelo comprador no checkout.'
                        : config.recipients === 'team'
                          ? 'Proprietários e administradores do workspace.'
                          : 'Até 5 endereços, separados por vírgula.'}
                </p>
            </div>
            {config.recipients === 'custom' && (
                <Field label="E-mails">
                    <input
                        value={emailsText}
                        placeholder="financeiro@loja.com, eu@loja.com"
                        onChange={(event) => {
                            setEmailsText(event.target.value);
                            set({
                                emails: event.target.value
                                    .split(',')
                                    .map((email) => email.trim())
                                    .filter((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
                                    .slice(0, 5),
                            });
                        }}
                        className={inputClass}
                    />
                </Field>
            )}
            <Field label="Assunto">
                <input
                    value={config.subject}
                    maxLength={200}
                    placeholder="Ex.: Nova venda de {{valor}}"
                    onChange={(event) => set({ subject: event.target.value })}
                    className={inputClass}
                />
            </Field>
            <div>
                <span className="mb-1.5 block text-[12px] font-semibold">Mensagem</span>
                <textarea
                    ref={body}
                    value={config.body}
                    rows={7}
                    maxLength={5000}
                    aria-label="Mensagem"
                    placeholder={'Olá {{cliente.nome}}, recebemos seu pagamento de {{valor}}.'}
                    onChange={(event) => set({ body: event.target.value })}
                    className={`${inputClass} h-auto py-2.5`}
                />
                <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Inserir variável">
                    {emailVariables.map(([variable, label]) => (
                        <button
                            key={variable}
                            type="button"
                            title={`Insere {{${variable}}}`}
                            onClick={() => insert(variable)}
                            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-foreground/30 hover:text-foreground"
                        >
                            + {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SwitchEditor({
    node,
    checkouts,
    products,
    onChange,
}: {
    node: Extract<FlowNode, { type: 'switch' }>;
    checkouts: Checkout[];
    products: Product[];
    onChange(node: FlowNode): void;
}) {
    const { names } = useFlowEditor();
    const cases = node.config.cases;
    const [open, setOpen] = useState<string | null>(cases[0]?.id ?? null);
    const setCases = (next: typeof cases) => onChange({ ...node, config: { cases: next } });
    return (
        <div className="space-y-3">
            <Explain>
                Confere os caminhos de cima para baixo e usa o primeiro que combinar. Vendas que não
                combinam com nenhum saem por <b>senão</b>.
            </Explain>
            {cases.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-border">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                            type="button"
                            onClick={() => setOpen(open === item.id ? null : item.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            aria-expanded={open === item.id}
                        >
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-muted text-[10px] font-semibold">
                                {index + 1}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[12px] font-semibold">
                                    {item.label || `Caminho ${String(index + 1)}`}
                                </span>
                                <span className="block truncate text-[11px] text-muted">
                                    {groupSentence(item, names)}
                                </span>
                            </span>
                        </button>
                        <IconAction
                            label="Subir"
                            icon="arrow-up"
                            disabled={index === 0}
                            onClick={() => setCases(move(cases, index, -1))}
                        />
                        <IconAction
                            label="Remover caminho"
                            icon="trash"
                            onClick={() => setCases(cases.filter(({ id }) => id !== item.id))}
                        />
                    </div>
                    {open === item.id && (
                        <div className="space-y-3 border-t border-border px-3 py-3">
                            <Field label="Nome do caminho">
                                <input
                                    value={item.label}
                                    maxLength={40}
                                    placeholder={`Caminho ${String(index + 1)}`}
                                    onChange={(event) =>
                                        setCases(
                                            cases.map((current) =>
                                                current.id === item.id
                                                    ? { ...current, label: event.target.value }
                                                    : current,
                                            ),
                                        )
                                    }
                                    className={inputClass}
                                />
                            </Field>
                            <ConditionGroupEditor
                                group={item}
                                checkouts={checkouts}
                                products={products}
                                onChange={(group) =>
                                    setCases(
                                        cases.map((current) =>
                                            current.id === item.id
                                                ? { ...current, ...group }
                                                : current,
                                        ),
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            ))}
            {cases.length < 12 && (
                <AddButton
                    label="Adicionar caminho"
                    onClick={() => {
                        const id = newId('case');
                        setCases([
                            ...cases,
                            {
                                id,
                                label: '',
                                combinator: 'and',
                                conditions: [defaultCondition('paymentMethod')],
                            },
                        ]);
                        setOpen(id);
                    }}
                />
            )}
        </div>
    );
}

/** Lista de condições unidas por E ou OU; cada condição tem campo, operador e valor. */
function ConditionGroupEditor({
    group,
    checkouts,
    products,
    onChange,
}: {
    group: FlowConditionGroup;
    checkouts: Checkout[];
    products: Product[];
    onChange(group: FlowConditionGroup): void;
}) {
    const update = (index: number, condition: FlowCondition) =>
        onChange({
            ...group,
            conditions: group.conditions.map((current, position) =>
                position === index ? condition : current,
            ),
        });
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold">Condições</span>
                <div className="ui-tabs" role="radiogroup" aria-label="Como combinar as condições">
                    {(
                        [
                            ['and', 'E (todas)'],
                            ['or', 'OU (alguma)'],
                        ] as const
                    ).map(([value, label]) => (
                        <Button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={group.combinator === value}
                            data-active={group.combinator === value}
                            onClick={() => onChange({ ...group, combinator: value })}
                            className="ui-tab whitespace-nowrap px-3 py-1 text-[11px] font-semibold"
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>
            {group.conditions.map((condition, index) => (
                <div key={condition.id}>
                    {index > 0 && (
                        <div className="my-1.5 flex items-center gap-2">
                            <span className="h-px flex-1 bg-border" />
                            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                                {group.combinator === 'and' ? 'e' : 'ou'}
                            </span>
                            <span className="h-px flex-1 bg-border" />
                        </div>
                    )}
                    <ConditionRow
                        condition={condition}
                        checkouts={checkouts}
                        products={products}
                        onChange={(next) => update(index, next)}
                        onRemove={() =>
                            onChange({
                                ...group,
                                conditions: group.conditions.filter(
                                    (_, position) => position !== index,
                                ),
                            })
                        }
                    />
                </div>
            ))}
            {group.conditions.length < 20 && (
                <AddButton
                    label="Adicionar condição"
                    onClick={() =>
                        onChange({
                            ...group,
                            conditions: [...group.conditions, defaultCondition('amount')],
                        })
                    }
                />
            )}
        </div>
    );
}

function ConditionRow({
    condition,
    checkouts,
    products,
    onChange,
    onRemove,
}: {
    condition: FlowCondition;
    checkouts: Checkout[];
    products: Product[];
    onChange(condition: FlowCondition): void;
    onRemove(): void;
}) {
    return (
        <div className="space-y-2 rounded-2xl border border-border bg-[var(--control-bg)] p-3">
            <div className="grid grid-cols-[1fr_auto] gap-2">
                <CustomSelect
                    name={`field_${condition.id}`}
                    value={condition.field}
                    options={(Object.keys(fieldLabels) as FlowConditionField[]).map((field) => ({
                        value: field,
                        label: fieldLabels[field],
                    }))}
                    onValueChange={(value) =>
                        onChange({
                            ...defaultCondition(value as FlowConditionField),
                            id: condition.id,
                        })
                    }
                />
                <IconAction label="Remover condição" icon="trash" onClick={onRemove} />
            </div>
            <CustomSelect
                name={`operator_${condition.id}`}
                value={condition.operator}
                options={fieldOperators[condition.field].map((operator) => ({
                    value: operator,
                    label: operatorLabels[operator] ?? operator,
                }))}
                onValueChange={(operator) => onChange({ ...condition, operator } as FlowCondition)}
            />
            <ConditionValue
                condition={condition}
                checkouts={checkouts}
                products={products}
                onChange={onChange}
            />
        </div>
    );
}

function ConditionValue({
    condition,
    checkouts,
    products,
    onChange,
}: {
    condition: FlowCondition;
    checkouts: Checkout[];
    products: Product[];
    onChange(condition: FlowCondition): void;
}) {
    switch (condition.field) {
        case 'paymentMethod':
            return (
                <ChipPicker
                    options={(['card', 'pix', 'boleto', 'bank_transfer'] as const).map(
                        (method) => ({
                            value: method,
                            label: methodLabels[method],
                        }),
                    )}
                    selected={condition.values}
                    onChange={(values) =>
                        onChange({ ...condition, values: values as RoutingPaymentMethod[] })
                    }
                />
            );
        case 'environment':
            return (
                <ChipPicker
                    options={[
                        { value: 'production', label: 'Produção' },
                        { value: 'sandbox', label: 'Sandbox' },
                    ]}
                    selected={condition.values}
                    onChange={(values) =>
                        onChange({
                            ...condition,
                            values: values as ('sandbox' | 'production')[],
                        })
                    }
                />
            );
        case 'currency':
            return (
                <input
                    value={condition.values.join(', ')}
                    placeholder="BRL, USD"
                    aria-label="Moedas"
                    onChange={(event) =>
                        onChange({
                            ...condition,
                            values: event.target.value
                                .split(',')
                                .map((value) => value.trim().toUpperCase())
                                .filter((value) => value.length === 3),
                        })
                    }
                    className={inputClass}
                />
            );
        case 'checkout':
            return (
                <ChipPicker
                    searchable
                    emptyText="Nenhum checkout criado ainda."
                    options={checkouts.map(({ id, name }) => ({ value: id, label: name }))}
                    selected={condition.values}
                    onChange={(values) => onChange({ ...condition, values })}
                />
            );
        case 'product':
            return (
                <ChipPicker
                    searchable
                    emptyText="Nenhum produto criado ainda."
                    options={products.map(({ id, name }) => ({ value: id, label: name }))}
                    selected={condition.values}
                    onChange={(values) => onChange({ ...condition, values })}
                />
            );
        case 'amount': {
            const range = condition.operator === 'between' || condition.operator === 'not_between';
            return (
                <div className="flex items-center gap-2">
                    <MoneyInput
                        label="Valor"
                        value={condition.amountMinor}
                        onChange={(amountMinor) => onChange({ ...condition, amountMinor })}
                    />
                    {range && (
                        <>
                            <span className="text-[11px] text-muted">e</span>
                            <MoneyInput
                                label="Valor final"
                                value={condition.amountToMinor ?? condition.amountMinor}
                                onChange={(amountToMinor) =>
                                    onChange({ ...condition, amountToMinor })
                                }
                            />
                        </>
                    )}
                </div>
            );
        }
    }
}

function MoneyInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange(value: number): void;
}) {
    const [text, setText] = useState(fromMinor(value));
    return (
        <label className="relative block min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">
                R$
            </span>
            <input
                value={text}
                inputMode="decimal"
                aria-label={label}
                onChange={(event) => {
                    setText(event.target.value);
                    const minor = toMinor(event.target.value);
                    if (minor !== undefined) onChange(minor);
                }}
                onBlur={() => setText(fromMinor(value))}
                className={`${inputClass} pl-9`}
            />
        </label>
    );
}

function ChipPicker({
    label,
    options,
    selected,
    onChange,
    searchable = false,
    emptyText,
}: {
    label?: string;
    options: { value: string; label: string }[];
    selected: readonly string[];
    onChange(selected: string[]): void;
    searchable?: boolean;
    emptyText?: string;
}) {
    const [query, setQuery] = useState('');
    const visible = options.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
    const chip = (active: boolean) =>
        `rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
            active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-surface text-muted hover:text-foreground'
        }`;
    return (
        <div role="group" aria-label={label}>
            {label && <span className="mb-2 block text-[12px] font-semibold">{label}</span>}
            {searchable && options.length > 8 && (
                <input
                    value={query}
                    placeholder="Buscar…"
                    aria-label="Buscar"
                    onChange={(event) => setQuery(event.target.value)}
                    className={`${inputClass} mb-2 h-9`}
                />
            )}
            {options.length === 0 && emptyText && (
                <p className="text-[11px] text-muted">{emptyText}</p>
            )}
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {visible.map((option) => {
                    const active = selected.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
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
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function DataTab({
    node,
    connection,
}: {
    node: FlowNode;
    connection: GatewayConnection | undefined;
}) {
    const editor = useFlowEditor();
    const ids =
        node.type === 'gateway'
            ? connection
                ? [connection.id]
                : []
            : node.type === 'cheapest'
              ? node.config.gatewayConnectionIds
              : [];
    if (ids.length === 0)
        return (
            <Explain>
                Métricas aparecem nos blocos de gateway: aprovação, tempo de resposta e tentativas
                dos últimos 30 dias.
            </Explain>
        );
    return (
        <div className="space-y-3">
            {ids.map((id) => {
                const stats = editor.stats.get(id);
                const name = editor.connections.get(id)?.name ?? 'Gateway removido';
                return (
                    <section key={id} className="rounded-2xl border border-border p-4">
                        <p className="text-[12px] font-semibold">
                            {name} <span className="font-normal text-muted">· últimos 30 dias</span>
                        </p>
                        <dl className="mt-3 grid grid-cols-3 gap-3">
                            <Stat
                                label="Aprovação"
                                value={
                                    stats?.approvalRate == null ? '—' : percent(stats.approvalRate)
                                }
                            />
                            <Stat
                                label="Resposta média"
                                value={
                                    stats?.avgLatencyMs == null ? '—' : latency(stats.avgLatencyMs)
                                }
                            />
                            <Stat label="Tentativas" value={String(stats?.attempts ?? 0)} />
                            <Stat
                                label="Foram para reserva"
                                value={String(stats?.failovers ?? 0)}
                            />
                            <Stat
                                label="Erros técnicos"
                                value={
                                    stats && stats.attempts > 0
                                        ? percent(stats.technicalFailures / stats.attempts)
                                        : '—'
                                }
                            />
                            <Stat
                                label="p95"
                                value={
                                    stats?.p95LatencyMs == null ? '—' : latency(stats.p95LatencyMs)
                                }
                            />
                        </dl>
                    </section>
                );
            })}
            <Link
                href="/payments"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted hover:text-foreground"
            >
                Ver pagamentos <Icon name="arrow-right" className="size-3" />
            </Link>
        </div>
    );
}

function ConnectionFacts({ connection }: { connection: GatewayConnection }) {
    const fees = Object.keys(connection.feeSchedule ?? {}).length > 0;
    const unstable = connection.status === 'degraded';
    return (
        <ul className="space-y-1.5 rounded-2xl bg-surface-muted/70 px-3.5 py-3 text-[12px]">
            <li className="flex justify-between gap-3">
                <span className="text-muted">Ambiente</span>
                <span className="font-medium">
                    {connection.environment === 'production' ? 'Produção' : 'Sandbox'}
                </span>
            </li>
            <li className="flex justify-between gap-3">
                <span className="text-muted">Situação</span>
                <span className={`font-medium ${unstable ? 'text-warning' : 'text-success'}`}>
                    {unstable ? 'Instável agora' : 'Funcionando'}
                </span>
            </li>
            <li className="flex justify-between gap-3">
                <span className="text-muted">Taxas</span>
                {fees ? (
                    <span className="font-medium">Cadastradas</span>
                ) : (
                    <Link href="/orchestration/costs" className="font-semibold underline">
                        Informar
                    </Link>
                )}
            </li>
        </ul>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="mt-0.5 text-[17px] font-semibold tabular-nums tracking-[-0.02em]">
                {value}
            </dd>
        </div>
    );
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
        </label>
    );
}

function Explain({ children }: { children: React.ReactNode }) {
    return <p className="text-[12px] leading-5 text-muted">{children}</p>;
}

function AddButton({ label, onClick }: { label: string; onClick(): void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-[12px] font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
        >
            <Icon name="plus" className="size-3" />
            {label}
        </button>
    );
}

function IconAction({
    label,
    icon,
    onClick,
    disabled,
}: {
    label: string;
    icon: 'trash' | 'arrow-up';
    onClick(): void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
        >
            <Icon name={icon} className="size-3.5" />
        </button>
    );
}

function connectionOption(connection: GatewayConnection) {
    return {
        value: connection.id,
        label: connection.name,
        badge: connection.environment === 'production' ? 'Produção' : 'Sandbox',
    };
}

function move<T>(items: readonly T[], index: number, offset: -1 | 1) {
    const next = [...items];
    const target = index + offset;
    if (target < 0 || target >= next.length) return next;
    [next[index], next[target]] = [next[target] as T, next[index] as T];
    return next;
}

const sectionColorLabels: Record<SectionColor, string> = {
    neutral: 'Cinza',
    lime: 'Lima',
    blue: 'Azul',
    violet: 'Violeta',
    orange: 'Laranja',
    pink: 'Rosa',
};

const sectionSwatches: Record<SectionColor, string> = {
    neutral: '#94a3b8',
    lime: '#84cc16',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    orange: '#f97316',
    pink: '#ec4899',
};

const inputClass =
    'block h-10 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3 text-[13px] font-normal outline-none transition focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]';

function percent(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(
        value,
    );
}

function latency(ms: number) {
    return ms >= 1000
        ? `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}s`
        : `${String(Math.round(ms))}ms`;
}
