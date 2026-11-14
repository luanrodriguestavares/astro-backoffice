'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import type { Product } from '@/lib/api/types';

import {
    activePrices,
    annualDiscount,
    type EntitlementDraft,
    type EntitlementKind,
    entitlementKeyInput,
    type FeatureDraft,
    intervalSuffix,
    intervalText,
    isAnnual,
    isMonthly,
    newPrice,
    type PlanDraft,
    planKeyFromName,
    planLimits,
    type PriceDraft,
    recurringByDefault,
} from './plan-model';

const inputClass =
    'h-10 w-full rounded-xl border bg-surface px-3 text-[13px] font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_16%,transparent)]';

function borderFor(error: unknown) {
    return error ? 'border-danger/60' : 'border-border';
}

export function money(value: number, currency = 'BRL') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

type Tab = 'prices' | 'features' | 'limits';

export function PlanCard({
    plan,
    index,
    count,
    productType,
    onChange,
    onMove,
    onRemove,
}: {
    plan: PlanDraft;
    index: number;
    count: number;
    productType: Product['type'];
    onChange(change: Partial<PlanDraft>): void;
    onMove(direction: -1 | 1): void;
    onRemove(): void;
}) {
    const [tab, setTab] = useState<Tab>('prices');
    const prices = activePrices(plan);
    const errors = plan.errors;
    const hasErrors = Boolean(errors && Object.keys(errors).length > 0);
    const features = plan.features.filter((feature) => feature.text.trim()).length;
    const limits = plan.entitlements.filter((entry) => entry.key.trim()).length;
    const title =
        plan.name.trim() || (plan.legacy ? 'Preço sem nome' : `Plano ${String(index + 1)}`);

    return (
        <article
            className={`rounded-2xl border bg-[var(--control-bg)] transition ${hasErrors ? 'border-danger/45' : 'border-border'}`}
        >
            {/* Resumo: sempre visível, clica para abrir/fechar. */}
            <div className="flex items-center gap-2 p-3 pl-4">
                <button
                    type="button"
                    onClick={() => onChange({ expanded: !plan.expanded })}
                    aria-expanded={plan.expanded}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                    <span className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-border bg-surface-muted text-[12px] font-semibold tabular-nums text-muted">
                        {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-[13px] font-semibold">{title}</span>
                            {plan.badgeEnabled && plan.badge.trim() && !plan.legacy && (
                                <span className="shrink-0 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                                    {plan.badge.trim()}
                                </span>
                            )}
                            {hasErrors && (
                                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-danger">
                                    <Icon name="alert" className="size-3" />
                                    Revisar
                                </span>
                            )}
                        </span>
                        <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                            {plan.legacy ? (
                                <span>Preço sem plano</span>
                            ) : (
                                <span className="font-mono">{plan.key || 'sem-codigo'}</span>
                            )}
                            {prices.length > 0 && (
                                <span className="tabular-nums text-foreground/80">
                                    {prices
                                        .map(
                                            (price) =>
                                                `${money(price.amountMinor)}${intervalSuffix(price)}`,
                                        )
                                        .join(' · ')}
                                </span>
                            )}
                            {!plan.legacy && (features > 0 || limits > 0) && (
                                <span>
                                    {features} {features === 1 ? 'benefício' : 'benefícios'} ·{' '}
                                    {limits} {limits === 1 ? 'limite' : 'limites'}
                                </span>
                            )}
                        </span>
                    </span>
                    <Icon
                        name="chevron-down"
                        className={`size-3.5 shrink-0 text-muted transition ${plan.expanded ? 'rotate-180' : ''}`}
                    />
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                    <IconAction
                        label="Mover para cima"
                        disabled={index === 0}
                        onClick={() => onMove(-1)}
                        icon={<Icon name="arrow-up" className="size-3" />}
                    />
                    <IconAction
                        label="Mover para baixo"
                        disabled={index === count - 1}
                        onClick={() => onMove(1)}
                        icon={<Icon name="arrow-up" className="size-3 rotate-180" />}
                    />
                    {count > 1 && (
                        <IconAction
                            label={plan.id || plan.legacy ? 'Arquivar plano' : 'Remover plano'}
                            danger
                            onClick={onRemove}
                            icon={<Icon name="trash" className="size-3" />}
                        />
                    )}
                </div>
            </div>

            {plan.expanded && (
                <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">
                    {errors?.general && <ErrorNote>{errors.general}</ErrorNote>}
                    {plan.legacy ? (
                        <LegacyFields plan={plan} onChange={onChange} />
                    ) : (
                        <PlanIdentity plan={plan} onChange={onChange} />
                    )}

                    {!plan.legacy && (
                        <div className="ui-tabs w-full" role="tablist">
                            {(
                                [
                                    ['prices', 'Preços', prices.length, errors?.prices],
                                    ['features', 'Benefícios', features, errors?.features],
                                    ['limits', 'Limites', limits, errors?.entitlements],
                                ] as const
                            ).map(([value, label, total, error]) => (
                                <Button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === value}
                                    data-active={tab === value}
                                    onClick={() => setTab(value)}
                                    className="ui-tab flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
                                >
                                    {label}
                                    <span className="tabular-nums opacity-60">{total}</span>
                                    {error && <span className="size-1.5 rounded-full bg-danger" />}
                                </Button>
                            ))}
                        </div>
                    )}

                    {(plan.legacy || tab === 'prices') && (
                        <PricesEditor plan={plan} productType={productType} onChange={onChange} />
                    )}
                    {!plan.legacy && tab === 'features' && (
                        <FeaturesEditor
                            features={plan.features}
                            error={errors?.features}
                            onChange={(next) => onChange({ features: next })}
                        />
                    )}
                    {!plan.legacy && tab === 'limits' && (
                        <EntitlementsEditor
                            entries={plan.entitlements}
                            error={errors?.entitlements}
                            onChange={(next) => onChange({ entitlements: next })}
                        />
                    )}
                </div>
            )}
        </article>
    );
}

function PlanIdentity({
    plan,
    onChange,
}: {
    plan: PlanDraft;
    onChange(change: Partial<PlanDraft>): void;
}) {
    const keyChanged = Boolean(plan.id && plan.saved && plan.key.trim() !== plan.saved.key);
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[12px] font-semibold">
                    Nome do plano
                    <input
                        value={plan.name}
                        maxLength={planLimits.name}
                        placeholder="Ex.: Crescimento"
                        onChange={(event) => {
                            const name = event.target.value;
                            onChange(
                                plan.keyTouched ? { name } : { name, key: planKeyFromName(name) },
                            );
                        }}
                        className={`mt-1.5 ${inputClass} ${borderFor(plan.errors?.name)}`}
                    />
                    {plan.errors?.name && <FieldError>{plan.errors.name}</FieldError>}
                </label>
                <label className="text-[12px] font-semibold">
                    Código do plano
                    <input
                        value={plan.key}
                        maxLength={80}
                        spellCheck={false}
                        autoCapitalize="off"
                        placeholder="crescimento"
                        onChange={(event) =>
                            onChange({
                                key: event.target.value.toLowerCase().replace(/\s+/g, '-'),
                                keyTouched: true,
                            })
                        }
                        className={`mt-1.5 font-mono ${inputClass} ${borderFor(plan.errors?.key)}`}
                    />
                    {plan.errors?.key ? (
                        <FieldError>{plan.errors.key}</FieldError>
                    ) : (
                        <span className="mt-1 block text-[11px] font-normal leading-4 text-muted">
                            Usado nos webhooks e na API para identificar o plano.
                        </span>
                    )}
                </label>
            </div>
            {keyChanged && plan.saved && (
                <div className="flex items-start gap-2 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-[11px] leading-4 text-foreground">
                    <Icon name="alert" className="mt-0.5 size-3 shrink-0 text-warning" />
                    <span className="flex-1">
                        Integrações que liberam acesso pelo código{' '}
                        <code className="font-mono font-semibold">{plan.saved.key}</code> deixam de
                        reconhecer este plano depois de salvar.
                    </span>
                    <button
                        type="button"
                        className="shrink-0 font-semibold underline-offset-2 hover:underline"
                        onClick={() => plan.saved && onChange({ key: plan.saved.key })}
                    >
                        Desfazer
                    </button>
                </div>
            )}
            <label className="block text-[12px] font-semibold">
                Descrição curta <span className="font-normal text-muted">(opcional)</span>
                <input
                    value={plan.description}
                    maxLength={planLimits.description}
                    placeholder="Ex.: Para operações que estão escalando."
                    onChange={(event) => onChange({ description: event.target.value })}
                    className={`mt-1.5 ${inputClass} border-border`}
                />
            </label>
            <div className="flex flex-wrap items-center gap-3">
                <Switch
                    checked={plan.badgeEnabled}
                    label="Selo de destaque"
                    onChange={(badgeEnabled) => onChange({ badgeEnabled })}
                />
                {plan.badgeEnabled && (
                    <input
                        value={plan.badge}
                        maxLength={planLimits.badge}
                        placeholder="Mais popular"
                        aria-label="Texto do selo"
                        onChange={(event) => onChange({ badge: event.target.value })}
                        className={`${inputClass} !h-9 max-w-[220px] flex-1 border-border`}
                    />
                )}
            </div>
        </div>
    );
}

function LegacyFields({
    plan,
    onChange,
}: {
    plan: PlanDraft;
    onChange(change: Partial<PlanDraft>): void;
}) {
    return (
        <label className="block text-[12px] font-semibold">
            Nome do preço
            <input
                value={plan.name}
                maxLength={planLimits.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className={`mt-1.5 ${inputClass} ${borderFor(plan.errors?.name)}`}
            />
            {plan.errors?.name && <FieldError>{plan.errors.name}</FieldError>}
        </label>
    );
}

/* ------------------------------------------------------------------ preços */

function PricesEditor({
    plan,
    productType,
    onChange,
}: {
    plan: PlanDraft;
    productType: Product['type'];
    onChange(change: Partial<PlanDraft>): void;
}) {
    const prices = activePrices(plan);
    const archived = plan.prices.filter((price) => price.removed && price.id).length;
    const monthly = prices.find(isMonthly);
    const annual = prices.find(isAnnual);
    const recurring =
        prices.some((price) => price.pricingType === 'recurring') ||
        (prices.length === 0 && recurringByDefault(productType));

    function update(uid: string, change: Partial<PriceDraft>) {
        onChange({
            prices: plan.prices.map((price) =>
                price.uid === uid ? { ...price, ...change } : price,
            ),
        });
    }

    function remove(price: PriceDraft) {
        onChange({
            prices: price.id
                ? plan.prices.map((item) =>
                      item.uid === price.uid ? { ...item, removed: true } : item,
                  )
                : plan.prices.filter((item) => item.uid !== price.uid),
        });
    }

    function add(price: PriceDraft) {
        onChange({ prices: [...plan.prices, price] });
    }

    const annualSuggestion = monthly ? monthly.amountMinor * 10 : 0;

    return (
        <div className="space-y-2.5">
            {prices.map((price) => (
                <PriceRow
                    key={price.uid}
                    price={price}
                    removable={prices.length > 1}
                    monthlyMinor={isAnnual(price) ? monthly?.amountMinor : undefined}
                    onChange={(change) => update(price.uid, change)}
                    onRemove={() => remove(price)}
                />
            ))}
            {plan.errors?.prices && <ErrorNote>{plan.errors.prices}</ErrorNote>}
            {archived > 0 && (
                <p className="flex items-center gap-2 text-[11px] text-muted">
                    {archived} {archived === 1 ? 'preço será arquivado' : 'preços serão arquivados'}{' '}
                    ao salvar. Assinaturas existentes continuam.
                    <button
                        type="button"
                        className="font-semibold text-foreground underline-offset-2 hover:underline"
                        onClick={() =>
                            onChange({
                                prices: plan.prices.map((price) => ({ ...price, removed: false })),
                            })
                        }
                    >
                        Desfazer
                    </button>
                </p>
            )}
            {recurring
                ? !plan.legacy && (
                      <div className="flex flex-wrap gap-2">
                          {!monthly && (
                              <AddButton onClick={() => add(newPrice('recurring', 'month'))}>
                                  Preço mensal
                              </AddButton>
                          )}
                          {!annual && (
                              <AddButton
                                  onClick={() =>
                                      add(newPrice('recurring', 'year', 1, annualSuggestion))
                                  }
                              >
                                  Adicionar preço anual
                                  {monthly && monthly.amountMinor > 0 && (
                                      <span className="font-normal text-muted">
                                          · {money(annualSuggestion)} (2 meses grátis)
                                      </span>
                                  )}
                              </AddButton>
                          )}
                          <AddButton onClick={() => add(newPrice('recurring', 'month', 3))}>
                              Outro intervalo
                          </AddButton>
                      </div>
                  )
                : prices.length === 0 && (
                      <AddButton onClick={() => add(newPrice('one_time'))}>Preço</AddButton>
                  )}
        </div>
    );
}

type IntervalChoice = 'month' | 'year' | 'custom' | 'week' | 'day';

function intervalChoice(price: PriceDraft): IntervalChoice {
    if (price.interval === 'week' || price.interval === 'day') return price.interval;
    if (price.interval === 'year' && price.intervalCount === 1) return 'year';
    if (price.interval === 'month' && price.intervalCount === 1) return 'month';
    return 'custom';
}

function PriceRow({
    price,
    removable,
    monthlyMinor,
    onChange,
    onRemove,
}: {
    price: PriceDraft;
    removable: boolean;
    monthlyMinor?: number;
    onChange(change: Partial<PriceDraft>): void;
    onRemove(): void;
}) {
    const saved = Boolean(price.id);
    const recurring = price.pricingType === 'recurring';
    const choice = intervalChoice(price);
    const discount =
        monthlyMinor === undefined ? undefined : annualDiscount(monthlyMinor, price.amountMinor);
    const months = price.interval === 'year' ? price.intervalCount * 12 : price.intervalCount;
    const perMonth =
        recurring && price.interval !== 'week' && price.interval !== 'day' && months > 1
            ? Math.round(price.amountMinor / months)
            : undefined;
    const intervalOptions = [
        { value: 'month', label: 'Mensal' },
        { value: 'year', label: 'Anual' },
        { value: 'custom', label: 'A cada N meses' },
        ...(choice === 'week' ? [{ value: 'week', label: intervalText(price) }] : []),
        ...(choice === 'day' ? [{ value: 'day', label: intervalText(price) }] : []),
    ];

    return (
        <div className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-end gap-2">
                {recurring ? (
                    <label className="w-[150px] shrink-0 text-[12px] font-semibold">
                        Periodicidade
                        <div className="mt-1.5">
                            <CustomSelect
                                name={`interval_${price.uid}`}
                                value={choice}
                                disabled={saved}
                                options={intervalOptions}
                                onValueChange={(value) => {
                                    if (value === 'month')
                                        onChange({ interval: 'month', intervalCount: 1 });
                                    else if (value === 'year')
                                        onChange({ interval: 'year', intervalCount: 1 });
                                    else if (value === 'custom')
                                        onChange({ interval: 'month', intervalCount: 3 });
                                }}
                            />
                        </div>
                    </label>
                ) : (
                    <div className="w-[150px] shrink-0 text-[12px] font-semibold">
                        Cobrança
                        <p className="mt-1.5 flex h-10 items-center rounded-xl border border-border bg-surface-muted/60 px-3 text-[13px] font-normal text-muted">
                            Pagamento único
                        </p>
                    </div>
                )}
                {recurring && choice === 'custom' && (
                    <label className="w-[92px] shrink-0 text-[12px] font-semibold">
                        Meses
                        <input
                            type="number"
                            min={1}
                            max={36}
                            value={price.intervalCount}
                            onChange={(event) =>
                                onChange({
                                    intervalCount: Math.max(
                                        1,
                                        Math.round(Number(event.target.value) || 1),
                                    ),
                                })
                            }
                            className={`mt-1.5 tabular-nums ${inputClass} border-border`}
                        />
                    </label>
                )}
                <div className="min-w-0 flex-1">
                    <MoneyInput
                        label="Valor"
                        value={price.amountMinor}
                        onChange={(amountMinor) => onChange({ amountMinor })}
                    />
                </div>
                {removable && (
                    <Button
                        type="button"
                        variant="icon"
                        className="size-10 shrink-0"
                        aria-label={`Remover preço ${intervalText(price).toLowerCase()}`}
                        onClick={onRemove}
                    >
                        <Icon name="trash" className="size-3.5" />
                    </Button>
                )}
            </div>

            {(discount !== undefined || perMonth !== undefined) && price.amountMinor > 0 && (
                <p className="mt-2 text-[11px] text-muted">
                    {perMonth !== undefined && <>Equivale a {money(perMonth)}/mês</>}
                    {discount !== undefined && (
                        <>
                            {perMonth !== undefined && ' · '}
                            <span className="font-semibold text-success">
                                {discount}% de desconto
                            </span>{' '}
                            sobre 12 mensalidades
                        </>
                    )}
                </p>
            )}

            {recurring && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
                    <label className="flex items-center gap-2 text-[12px] font-semibold">
                        Teste grátis
                        <input
                            type="number"
                            min={0}
                            max={365}
                            value={price.trialDays || ''}
                            placeholder="0"
                            onChange={(event) =>
                                onChange({
                                    trialDays: Math.max(
                                        0,
                                        Math.round(Number(event.target.value) || 0),
                                    ),
                                })
                            }
                            className={`${inputClass} !h-8 w-16 border-border px-2 tabular-nums`}
                        />
                        <span className="font-normal text-muted">dias</span>
                    </label>
                    <Switch
                        checked={price.allowQuantity}
                        label="Cobrar por quantidade (assentos)"
                        onChange={(allowQuantity) =>
                            onChange(
                                allowQuantity
                                    ? {
                                          allowQuantity,
                                          minimumQuantity: Math.max(1, price.minimumQuantity),
                                          maximumQuantity: Math.max(
                                              price.maximumQuantity,
                                              price.minimumQuantity,
                                              50,
                                          ),
                                      }
                                    : { allowQuantity },
                            )
                        }
                    />
                    {price.allowQuantity && (
                        <span className="flex items-center gap-1.5 text-[12px] text-muted">
                            de
                            <input
                                type="number"
                                min={1}
                                aria-label="Quantidade mínima"
                                value={price.minimumQuantity}
                                onChange={(event) =>
                                    onChange({
                                        minimumQuantity: Math.max(
                                            1,
                                            Math.round(Number(event.target.value) || 1),
                                        ),
                                    })
                                }
                                className={`${inputClass} !h-8 w-16 border-border px-2 tabular-nums`}
                            />
                            até
                            <input
                                type="number"
                                min={1}
                                aria-label="Quantidade máxima"
                                value={price.maximumQuantity}
                                onChange={(event) =>
                                    onChange({
                                        maximumQuantity: Math.max(
                                            1,
                                            Math.round(Number(event.target.value) || 1),
                                        ),
                                    })
                                }
                                className={`${inputClass} !h-8 w-20 border-border px-2 tabular-nums`}
                            />
                        </span>
                    )}
                </div>
            )}
            {saved && recurring && (
                <p className="mt-2 text-[11px] text-muted">
                    A periodicidade de um preço salvo não muda. Para outra, adicione um preço novo.
                </p>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ benefícios */

function FeaturesEditor({
    features,
    error,
    onChange,
}: {
    features: FeatureDraft[];
    error?: string;
    onChange(next: FeatureDraft[]): void;
}) {
    const [focusUid, setFocusUid] = useState<string>();

    function insertAfter(index: number) {
        const item = { uid: crypto.randomUUID(), text: '' };
        setFocusUid(item.uid);
        onChange([...features.slice(0, index + 1), item, ...features.slice(index + 1)]);
    }

    function move(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= features.length) return;
        const next = [...features];
        [next[index], next[target]] = [next[target] as FeatureDraft, next[index] as FeatureDraft];
        onChange(next);
    }

    return (
        <div className="space-y-2">
            <p className="text-[11px] text-muted">
                Lista exibida no checkout e na comparação de planos. Enter adiciona uma linha.
            </p>
            {features.map((feature, index) => (
                <div key={feature.uid} className="flex items-center gap-1.5">
                    <Icon name="check" className="size-3 shrink-0 text-success" />
                    <input
                        value={feature.text}
                        maxLength={planLimits.featureLength}
                        autoFocus={feature.uid === focusUid}
                        placeholder="Ex.: 10 páginas de checkout"
                        aria-label={`Benefício ${String(index + 1)}`}
                        onChange={(event) =>
                            onChange(
                                features.map((item) =>
                                    item.uid === feature.uid
                                        ? { ...item, text: event.target.value }
                                        : item,
                                ),
                            )
                        }
                        onKeyDown={(event) => {
                            if (event.key !== 'Enter') return;
                            event.preventDefault();
                            if (features.length < planLimits.features) insertAfter(index);
                        }}
                        className={`${inputClass} !h-9 border-border`}
                    />
                    <IconAction
                        label="Mover para cima"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        icon={<Icon name="arrow-up" className="size-3" />}
                    />
                    <IconAction
                        label="Mover para baixo"
                        disabled={index === features.length - 1}
                        onClick={() => move(index, 1)}
                        icon={<Icon name="arrow-up" className="size-3 rotate-180" />}
                    />
                    <IconAction
                        label="Remover benefício"
                        danger
                        onClick={() =>
                            onChange(features.filter((item) => item.uid !== feature.uid))
                        }
                        icon={<Icon name="close" className="size-3" />}
                    />
                </div>
            ))}
            {error && <ErrorNote>{error}</ErrorNote>}
            {features.length < planLimits.features && (
                <AddButton onClick={() => insertAfter(features.length - 1)}>Benefício</AddButton>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ limites */

const entitlementSuggestions = [
    'checkouts',
    'custom_domains',
    'monthly_sales_limit',
    'seats',
    'projects',
    'api_requests_per_month',
    'storage_gb',
    'priority_support',
];

const kindOptions: Array<{ value: EntitlementKind; label: string }> = [
    { value: 'number', label: 'Número' },
    { value: 'boolean', label: 'Sim/não' },
    { value: 'text', label: 'Texto' },
    { value: 'unlimited', label: 'Ilimitado' },
];

function EntitlementsEditor({
    entries,
    error,
    onChange,
}: {
    entries: EntitlementDraft[];
    error?: string;
    onChange(next: EntitlementDraft[]): void;
}) {
    const listId = useId();

    function update(uid: string, change: Partial<EntitlementDraft>) {
        onChange(entries.map((entry) => (entry.uid === uid ? { ...entry, ...change } : entry)));
    }

    return (
        <div className="space-y-2">
            <p className="text-[11px] leading-4 text-muted">
                Limites que o seu software lê no webhook e na API para liberar acesso. Ex.:{' '}
                <code className="font-mono">checkouts = 10</code>,{' '}
                <code className="font-mono">custom_domains = 3</code>.
            </p>
            <datalist id={listId}>
                {entitlementSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                ))}
            </datalist>
            {entries.length > 0 && (
                <div className="grid grid-cols-[minmax(0,1.2fr)_118px_minmax(0,1fr)_auto] gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <span>Chave</span>
                    <span>Tipo</span>
                    <span>Valor</span>
                    <span className="w-8" />
                </div>
            )}
            {entries.map((entry) => (
                <div
                    key={entry.uid}
                    className="grid grid-cols-[minmax(0,1.2fr)_118px_minmax(0,1fr)_auto] items-center gap-1.5"
                >
                    <input
                        value={entry.key}
                        list={listId}
                        spellCheck={false}
                        autoCapitalize="off"
                        placeholder="checkouts"
                        aria-label="Chave do limite"
                        onChange={(event) =>
                            update(entry.uid, { key: entitlementKeyInput(event.target.value) })
                        }
                        className={`${inputClass} !h-9 border-border font-mono text-[12px]`}
                    />
                    <CustomSelect
                        name={`entitlement_kind_${entry.uid}`}
                        value={entry.kind}
                        options={kindOptions}
                        onValueChange={(value) =>
                            update(entry.uid, {
                                kind: value as EntitlementKind,
                                value: value === 'boolean' ? 'true' : '',
                            })
                        }
                    />
                    <EntitlementValue
                        entry={entry}
                        onChange={(value) => update(entry.uid, { value })}
                    />
                    <IconAction
                        label="Remover limite"
                        danger
                        onClick={() => onChange(entries.filter((item) => item.uid !== entry.uid))}
                        icon={<Icon name="close" className="size-3" />}
                    />
                </div>
            ))}
            {error && <ErrorNote>{error}</ErrorNote>}
            {entries.length < planLimits.entitlements && (
                <AddButton
                    onClick={() =>
                        onChange([
                            ...entries,
                            { uid: crypto.randomUUID(), key: '', kind: 'number', value: '' },
                        ])
                    }
                >
                    Limite
                </AddButton>
            )}
        </div>
    );
}

function EntitlementValue({
    entry,
    onChange,
}: {
    entry: EntitlementDraft;
    onChange(value: string): void;
}) {
    if (entry.kind === 'unlimited')
        return (
            <span className="flex h-9 items-center rounded-xl border border-dashed border-border px-3 text-[12px] text-muted">
                Sem limite
            </span>
        );
    if (entry.kind === 'boolean')
        return (
            <div className="ui-tabs !p-0.5">
                {(
                    [
                        ['true', 'Sim'],
                        ['false', 'Não'],
                    ] as const
                ).map(([value, label]) => (
                    <Button
                        key={value}
                        type="button"
                        data-active={entry.value === value}
                        aria-pressed={entry.value === value}
                        onClick={() => onChange(value)}
                        className="ui-tab flex-1 px-2 py-1 text-[12px] font-semibold"
                    >
                        {label}
                    </Button>
                ))}
            </div>
        );
    return (
        <input
            value={entry.value}
            inputMode={entry.kind === 'number' ? 'decimal' : undefined}
            maxLength={entry.kind === 'text' ? planLimits.entitlementText : 24}
            placeholder={entry.kind === 'number' ? '10' : 'Ex.: prioritário'}
            aria-label="Valor do limite"
            onChange={(event) =>
                onChange(
                    entry.kind === 'number'
                        ? event.target.value.replace(/[^\d.,-]/g, '')
                        : event.target.value,
                )
            }
            className={`${inputClass} !h-9 border-border ${entry.kind === 'number' ? 'tabular-nums' : ''}`}
        />
    );
}

/* ------------------------------------------------------------------ peças */

export function MoneyInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange(value: number): void;
}) {
    return (
        <label className="text-[12px] font-semibold">
            {label}
            <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[12px] text-muted">
                    R$
                </span>
                <input
                    inputMode="numeric"
                    value={new Intl.NumberFormat('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(value / 100)}
                    onChange={(event) => onChange(Number(event.target.value.replace(/\D/g, '')))}
                    className={`${inputClass} border-border pl-9 tabular-nums`}
                />
            </div>
        </label>
    );
}

function Switch({
    checked,
    label,
    onChange,
}: {
    checked: boolean;
    label: string;
    onChange(checked: boolean): void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="inline-flex items-center gap-2 text-[12px] font-semibold"
        >
            <span
                className={`relative h-5 w-9 shrink-0 rounded-full border transition ${checked ? 'border-transparent bg-brand' : 'border-border bg-surface-muted'}`}
            >
                <span
                    className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full shadow-sm transition-all ${checked ? 'left-[18px] bg-brand-contrast' : 'left-0.5 bg-[var(--control-bg)]'}`}
                />
            </span>
            {label}
        </button>
    );
}

function IconAction({
    label,
    icon,
    danger = false,
    disabled = false,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
    onClick(): void;
}) {
    return (
        <Button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={`inline-grid size-8 shrink-0 place-items-center rounded-lg text-muted transition disabled:pointer-events-none disabled:opacity-30 ${danger ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-surface-muted hover:text-foreground'}`}
        >
            {icon}
        </Button>
    );
}

function AddButton({ onClick, children }: { onClick(): void; children: React.ReactNode }) {
    return (
        <Button
            type="button"
            variant="ghost"
            onClick={onClick}
            className="!h-8 border border-dashed border-border px-2.5"
        >
            <Icon name="plus" className="size-3" />
            {children}
        </Button>
    );
}

function FieldError({ children }: { children: React.ReactNode }) {
    return (
        <span role="alert" className="mt-1 block text-[11px] font-medium leading-4 text-danger">
            {children}
        </span>
    );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
    return (
        <p
            role="alert"
            className="flex items-start gap-1.5 rounded-xl border border-danger/30 bg-danger/[0.07] px-3 py-2 text-[12px] leading-4 text-danger"
        >
            <Icon name="alert" className="mt-px size-3 shrink-0" />
            <span>{children}</span>
        </p>
    );
}
