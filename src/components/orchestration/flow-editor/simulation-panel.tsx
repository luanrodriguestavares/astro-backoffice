'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import type {
    Checkout,
    FlowEvent,
    FlowSimulation,
    Product,
    RoutingPaymentMethod,
    SimulatedAction,
} from '@/lib/api/types';
import { eventLabels, fromMinor, methodLabels, toMinor } from '@/lib/orchestration/flow';

export interface SimulationInput {
    /** Sem evento: decisão do gateway ("Venda iniciada"). Com evento: as ações. */
    event: FlowEvent | null;
    paymentMethod: RoutingPaymentMethod;
    amountMinor: number;
    environment: 'sandbox' | 'production';
    checkoutId: string | null;
    productIds: string[];
    seed: string;
}

export function SimulationPanel({
    checkouts,
    products,
    result,
    running,
    defaultEnvironment,
    availableEvents,
    onAddTrigger,
    onRun,
    onClose,
}: {
    /** Eventos com gatilho no quadro; os outros aparecem desabilitados. */
    availableEvents: FlowEvent[];
    onAddTrigger(event: FlowEvent): void;
    /** Ambiente dos gateways do fluxo: simular em outro pularia todos eles. */
    defaultEnvironment: 'sandbox' | 'production';
    checkouts: Checkout[];
    products: Product[];
    result: FlowSimulation | null;
    running: boolean;
    onRun(input: SimulationInput): void;
    onClose(): void;
}) {
    const [input, setInput] = useState<SimulationInput>({
        event: null,
        paymentMethod: 'pix',
        amountMinor: 15_000,
        environment: defaultEnvironment,
        checkoutId: null,
        productIds: [],
        seed: newSeed(),
    });
    const [amount, setAmount] = useState(fromMinor(15_000));
    const [ranEvent, setRanEvent] = useState<FlowEvent | null>(null);
    // O resultado fica abaixo do formulário: rola até ele a cada simulação.
    const resultRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (result) resultRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [result]);
    const run = (next: SimulationInput) => {
        setRanEvent(next.event);
        onRun(next);
    };
    const update = (patch: Partial<SimulationInput>) =>
        setInput((current) => ({ ...current, ...patch }));

    return (
        <aside
            aria-label="Simular venda"
            className="flex h-full w-full flex-col overflow-hidden border-l border-border bg-surface"
        >
            <header className="flex items-start gap-3 px-5 pb-4 pt-5">
                <span className="flow-tone-trigger grid size-11 shrink-0 place-items-center rounded-xl">
                    <Icon name="play" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-semibold tracking-[-0.02em]">Simular venda</h2>
                    <p className="mt-0.5 text-[12px] leading-4 text-muted">
                        Roda o rascunho numa venda de exemplo. Nada é cobrado.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="icon"
                    aria-label="Fechar simulação"
                    onClick={onClose}
                >
                    <Icon name="close" className="size-3.5" />
                </Button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-5">
                <div>
                    <span className="mb-1.5 block text-[12px] font-semibold">O que acontece</span>
                    <CustomSelect
                        name="simulation_event"
                        value={input.event ?? ''}
                        options={[
                            { value: '', label: 'Venda iniciada (escolha do gateway)' },
                            ...(Object.keys(eventLabels) as FlowEvent[])
                                .sort(
                                    (left, right) =>
                                        Number(availableEvents.includes(right)) -
                                        Number(availableEvents.includes(left)),
                                )
                                .map((event) => ({
                                    value: event,
                                    label: availableEvents.includes(event)
                                        ? eventLabels[event]
                                        : `${eventLabels[event]} · sem gatilho no quadro`,
                                    disabled: !availableEvents.includes(event),
                                })),
                        ]}
                        onValueChange={(value) =>
                            update({ event: (value || null) as FlowEvent | null })
                        }
                    />
                </div>
                <div>
                    <span className="mb-1.5 block text-[12px] font-semibold">
                        Forma de pagamento
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                        {(['card', 'pix', 'boleto', 'bank_transfer'] as const).map((method) => (
                            <button
                                key={method}
                                type="button"
                                aria-pressed={input.paymentMethod === method}
                                onClick={() => update({ paymentMethod: method })}
                                className={`h-9 rounded-xl border text-[12px] font-semibold transition ${input.paymentMethod === method ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'}`}
                            >
                                {methodLabels[method]}
                            </button>
                        ))}
                    </div>
                </div>
                <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold">Valor da venda</span>
                    <span className="relative block">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">
                            R$
                        </span>
                        <input
                            value={amount}
                            inputMode="decimal"
                            onChange={(event) => {
                                setAmount(event.target.value);
                                const minor = toMinor(event.target.value);
                                if (minor !== undefined) update({ amountMinor: minor });
                            }}
                            className="block h-10 w-full rounded-xl border border-border bg-[var(--control-bg)] pl-9 pr-3 text-[13px] outline-none focus:border-brand/60"
                        />
                    </span>
                </label>
                <div>
                    <span className="mb-1.5 block text-[12px] font-semibold">Ambiente</span>
                    <div className="ui-tabs">
                        {(
                            [
                                ['production', 'Produção'],
                                ['sandbox', 'Sandbox'],
                            ] as const
                        ).map(([value, label]) => (
                            <Button
                                key={value}
                                type="button"
                                data-active={input.environment === value}
                                aria-pressed={input.environment === value}
                                onClick={() => update({ environment: value })}
                                className="ui-tab px-3.5 py-1 text-[12px] font-semibold"
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>
                {checkouts.length > 0 && (
                    <div>
                        <span className="mb-1.5 block text-[12px] font-semibold">Checkout</span>
                        <CustomSelect
                            name="simulation_checkout"
                            value={input.checkoutId ?? ''}
                            placeholder="Qualquer checkout"
                            options={[
                                { value: '', label: 'Qualquer checkout' },
                                ...checkouts.map(({ id, name }) => ({ value: id, label: name })),
                            ]}
                            onValueChange={(value) => update({ checkoutId: value || null })}
                        />
                    </div>
                )}
                {products.length > 0 && (
                    <div>
                        <span className="mb-1.5 block text-[12px] font-semibold">
                            Produtos no pedido
                        </span>
                        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                            {products.map((product) => {
                                const active = input.productIds.includes(product.id);
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() =>
                                            update({
                                                productIds: active
                                                    ? input.productIds.filter(
                                                          (id) => id !== product.id,
                                                      )
                                                    : [...input.productIds, product.id],
                                            })
                                        }
                                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${active ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'}`}
                                    >
                                        {product.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={running}
                        onClick={() => run(input)}
                        className="flow-highlight-button inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition"
                    >
                        <Icon name="play" className="size-3.5" />
                        {running ? 'Simulando…' : 'Rodar simulação'}
                    </button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-10 px-3"
                        title="Outra venda: muda o lado das divisões A/B"
                        aria-label="Simular outra venda"
                        disabled={running}
                        onClick={() => {
                            const seed = newSeed();
                            update({ seed });
                            run({ ...input, seed });
                        }}
                    >
                        <Icon name="repeat" className="size-3.5" />
                    </Button>
                </div>

                {result && (
                    <div ref={resultRef}>
                        <SimulationResult
                            result={result}
                            event={ranEvent}
                            onAddTrigger={onAddTrigger}
                            environment={input.environment}
                            onSwitchEnvironment={(environment) => {
                                update({ environment });
                                run({ ...input, environment });
                            }}
                        />
                    </div>
                )}
            </div>
        </aside>
    );
}

function SimulationResult({
    result,
    event,
    environment,
    onSwitchEnvironment,
    onAddTrigger,
}: {
    result: FlowSimulation;
    event: FlowEvent | null;
    onAddTrigger(event: FlowEvent): void;
    environment: 'sandbox' | 'production';
    onSwitchEnvironment(environment: 'sandbox' | 'production'): void;
}) {
    if (event) return <ActionsResult result={result} event={event} onAddTrigger={onAddTrigger} />;
    const usable = result.attempts.filter((attempt) => !attempt.skipped);
    const otherEnvironment = environment === 'production' ? 'sandbox' : 'production';
    const wrongEnvironment = result.attempts.some(
        (attempt) => attempt.skipped === 'Outro ambiente',
    );
    return (
        <section className="rounded-2xl border border-border p-4" aria-live="polite">
            <h3 className="text-[13px] font-semibold">Resultado</h3>
            {result.attempts.length > 0 && usable.length === 0 && (
                <p className="mt-2 rounded-xl bg-[#fff5e9] px-3 py-2 text-[12px] leading-5 text-[#7a4a0b]">
                    Nenhum gateway do caminho pode cobrar esta venda: a venda seria recusada.
                </p>
            )}
            {wrongEnvironment && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-[12px] leading-5">
                    <span className="text-muted">
                        Há gateway de {otherEnvironment === 'sandbox' ? 'Sandbox' : 'Produção'} no
                        caminho, e esta simulação é em{' '}
                        {environment === 'sandbox' ? 'Sandbox' : 'Produção'}.
                    </span>
                    <button
                        type="button"
                        onClick={() => onSwitchEnvironment(otherEnvironment)}
                        className="font-semibold underline-offset-2 hover:underline"
                    >
                        Simular em {otherEnvironment === 'sandbox' ? 'Sandbox' : 'Produção'}
                    </button>
                </div>
            )}
            {result.attempts.length === 0 ? (
                <p className="mt-2 text-[12px] leading-5 text-muted">
                    Nenhum gateway no caminho: a venda usa o gateway configurado no checkout.
                </p>
            ) : (
                <ol className="mt-3 space-y-2">
                    {result.attempts.map((attempt, index) => (
                        <li
                            key={`${attempt.nodeId}-${attempt.gatewayConnectionId ?? index}`}
                            className="flex items-start gap-2.5"
                        >
                            <span
                                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${attempt.skipped ? 'bg-surface-muted text-muted' : 'bg-[#c6f448] text-[#101214]'}`}
                            >
                                {attempt.skipped ? '–' : usable.indexOf(attempt) + 1}
                            </span>
                            <span className="min-w-0 text-[12px] leading-5">
                                <span
                                    className={`font-semibold ${attempt.skipped ? 'text-muted line-through' : ''}`}
                                >
                                    {attempt.name}
                                </span>{' '}
                                <span className="font-mono text-[10.5px] text-muted">
                                    {attempt.nodeId}
                                </span>
                                {attempt.skipped && (
                                    <span className="block text-[11px] text-warning">
                                        Pulado: {attempt.skipped}
                                    </span>
                                )}
                                {!attempt.skipped && usable.indexOf(attempt) > 0 && (
                                    <span className="block text-[11px] text-muted">
                                        se o anterior falhar
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ol>
            )}
            <AfterPayment title="Se aprovada" actions={result.afterSuccess} />
            <AfterPayment title="Se recusada" actions={result.afterFailure} />
            <p className="mt-3 border-t border-border pt-3 text-[11px] leading-4 text-muted">
                {result.end === 'failed'
                    ? 'Se todos falharem, a venda é recusada.'
                    : result.end === 'open' && result.attempts.length > 0
                      ? 'O caminho termina sem uma saída definida.'
                      : 'Gateways mais baratos e instáveis são reordenados na hora da venda.'}
            </p>
        </section>
    );
}

/** Ações ligadas depois de "Pagamento aprovado" / "Pagamento recusado". */
function AfterPayment({ title, actions }: { title: string; actions: SimulatedAction[] }) {
    if (actions.length === 0) return null;
    return (
        <div className="mt-3 border-t border-border pt-3">
            <p className="text-[11.5px] font-semibold">{title}, depois roda:</p>
            <ul className="mt-1.5 space-y-1">
                {actions.map((action) => (
                    <li key={action.nodeId} className="flex items-center gap-2 text-[12px]">
                        <Icon
                            name={action.kind === 'email' ? 'mail' : 'webhook'}
                            className="size-3.5 text-muted"
                        />
                        <span className={action.skipped ? 'text-muted line-through' : ''}>
                            {action.name}
                        </span>
                        {action.skipped && (
                            <span className="text-[11px] text-warning">{action.skipped}</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Resultado de um gatilho de evento: as ações que rodariam, sem enviar nada. */
function ActionsResult({
    result,
    event,
    onAddTrigger,
}: {
    result: FlowSimulation;
    event: FlowEvent;
    onAddTrigger(event: FlowEvent): void;
}) {
    return (
        <section className="rounded-2xl border border-border p-4" aria-live="polite">
            <h3 className="text-[13px] font-semibold">Quando: {eventLabels[event]}</h3>
            {result.path.length === 0 ? (
                <div className="mt-2 space-y-2 rounded-xl bg-[#fff5e9] px-3 py-2.5 text-[12px] leading-5 text-[#7a4a0b]">
                    <p>
                        O quadro não tem o gatilho &ldquo;{eventLabels[event]}&rdquo;, então nada
                        roda neste evento. Adicione o gatilho e ligue a ele as ações (webhook,
                        e-mail) que devem acontecer.
                    </p>
                    <button
                        type="button"
                        onClick={() => onAddTrigger(event)}
                        className="inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline"
                    >
                        <Icon name="plus" className="size-3" />
                        Adicionar gatilho &ldquo;{eventLabels[event]}&rdquo;
                    </button>
                </div>
            ) : result.actions.length === 0 ? (
                <p className="mt-2 text-[12px] leading-5 text-muted">
                    As condições não deixaram nenhuma ação rodar para esta venda.
                </p>
            ) : (
                <ol className="mt-3 space-y-2">
                    {result.actions.map((action, index) => (
                        <li key={action.nodeId} className="flex items-start gap-2.5">
                            <span
                                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${action.skipped ? 'bg-surface-muted text-muted' : 'bg-[#c6f448] text-[#101214]'}`}
                            >
                                {action.skipped ? '–' : index + 1}
                            </span>
                            <span className="min-w-0 text-[12px] leading-5">
                                <span className="font-semibold">{action.name}</span>{' '}
                                <span className="font-mono text-[10.5px] text-muted">
                                    {action.nodeId}
                                </span>
                                {action.skipped && (
                                    <span className="block text-[11px] text-warning">
                                        Não roda: {action.skipped}
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ol>
            )}
            <p className="mt-3 border-t border-border pt-3 text-[11px] leading-4 text-muted">
                Na simulação nada é enviado. Publicado, roda a cada evento real.
            </p>
        </section>
    );
}

function newSeed() {
    return `sim_${Math.random().toString(36).slice(2, 10)}`;
}
