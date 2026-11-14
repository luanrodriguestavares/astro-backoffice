import type { Plan, PlanEntitlementValue, Price, Product } from '@/lib/api/types';

/*
 * Modelo de edição dos planos do produto: Produto → Plano → Preço(s).
 * Os rascunhos guardam o que foi salvo (`saved`) para mandar à API só o que mudou.
 */

export type EntitlementKind = 'number' | 'boolean' | 'text' | 'unlimited';

export type EntitlementDraft = {
    uid: string;
    key: string;
    kind: EntitlementKind;
    /** number/text: o texto digitado; boolean: 'true' | 'false'; unlimited: ignorado. */
    value: string;
};

export type FeatureDraft = { uid: string; text: string };

export type RecurringInterval = 'day' | 'week' | 'month' | 'year';

type PriceSnapshot = {
    name: string;
    amountMinor: number;
    trialDays: number;
    intervalCount: number;
    allowQuantity: boolean;
    minimumQuantity: number;
    maximumQuantity: number;
};

export type PriceDraft = PriceSnapshot & {
    uid: string;
    id?: string;
    version?: number;
    pricingType: 'one_time' | 'recurring';
    interval: RecurringInterval;
    removed?: boolean;
    saved?: PriceSnapshot;
};

type PlanSnapshot = {
    key: string;
    name: string;
    description: string | null;
    badge: string | null;
    features: string[];
    entitlements: Record<string, PlanEntitlementValue>;
    sortOrder: number;
};

export type PlanErrors = {
    name?: string;
    key?: string;
    prices?: string;
    features?: string;
    entitlements?: string;
    general?: string;
};

export type PlanDraft = {
    uid: string;
    id?: string;
    version?: number;
    /**
     * Preço sem plano (API ainda sem planos, ou preço antigo sem vínculo): edita só o preço,
     * como antes. `name` é o nome do preço.
     */
    legacy?: boolean;
    key: string;
    /** O código foi escrito à mão: deixa de acompanhar o nome. */
    keyTouched: boolean;
    name: string;
    description: string;
    badgeEnabled: boolean;
    badge: string;
    features: FeatureDraft[];
    entitlements: EntitlementDraft[];
    prices: PriceDraft[];
    expanded: boolean;
    removed?: boolean;
    saved?: PlanSnapshot;
    errors?: PlanErrors;
};

export const planKeyPattern = /^[a-z0-9][a-z0-9_.-]{0,79}$/;
export const entitlementKeyPattern = /^[a-z][a-z0-9_]{0,59}$/;
export const planLimits = {
    features: 30,
    featureLength: 160,
    entitlements: 40,
    entitlementText: 120,
    badge: 40,
    description: 500,
    name: 120,
} as const;

export function recurringByDefault(type: Product['type']) {
    return type === 'saas' || type === 'service';
}

function uid() {
    return crypto.randomUUID();
}

function normalize(value: string) {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Código do plano a partir do nome: "Alto volume" → "alto-volume". */
export function planKeyFromName(name: string) {
    return normalize(name)
        .replace(/[^a-z0-9_.]+/g, '-')
        .replace(/^[-_.]+|-+$/g, '')
        .slice(0, 80);
}

/** Normaliza a chave de um limite enquanto se digita: "Domínios extras" → "dominios_extras". */
export function entitlementKeyInput(value: string) {
    return normalize(value)
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^[^a-z]+/, '')
        .slice(0, 60);
}

export function newPrice(
    pricingType: PriceDraft['pricingType'],
    interval: RecurringInterval = 'month',
    intervalCount = 1,
    amountMinor = 0,
): PriceDraft {
    return {
        uid: uid(),
        name: '',
        pricingType,
        interval,
        intervalCount,
        amountMinor,
        trialDays: 0,
        allowQuantity: false,
        minimumQuantity: 1,
        maximumQuantity: 1,
    };
}

export function newPlan(type: Product['type']): PlanDraft {
    return {
        uid: uid(),
        key: '',
        keyTouched: false,
        name: '',
        description: '',
        badgeEnabled: false,
        badge: 'Mais popular',
        features: [],
        entitlements: [],
        prices: [newPrice(recurringByDefault(type) ? 'recurring' : 'one_time')],
        expanded: true,
    };
}

function quantity(value: string | number | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

export function priceFromApi(price: Price): PriceDraft {
    const snapshot: PriceSnapshot = {
        name: price.name,
        amountMinor: price.amountMinor,
        trialDays: price.trialDays ?? 0,
        intervalCount: price.recurringIntervalCount ?? 1,
        allowQuantity: price.allowQuantity ?? false,
        minimumQuantity: quantity(price.minimumQuantity, 1),
        maximumQuantity: quantity(price.maximumQuantity, 1),
    };
    const interval = price.recurringInterval;
    return {
        ...snapshot,
        uid: price.id,
        id: price.id,
        version: price.version,
        pricingType: price.pricingType === 'recurring' ? 'recurring' : 'one_time',
        interval:
            interval === 'day' || interval === 'week' || interval === 'year' ? interval : 'month',
        saved: snapshot,
    };
}

function entitlementFromApi(key: string, value: PlanEntitlementValue): EntitlementDraft {
    if (value === null) return { uid: uid(), key, kind: 'unlimited', value: '' };
    if (typeof value === 'boolean')
        return { uid: uid(), key, kind: 'boolean', value: value ? 'true' : 'false' };
    if (typeof value === 'number') return { uid: uid(), key, kind: 'number', value: String(value) };
    return { uid: uid(), key, kind: 'text', value };
}

export function planFromApi(plan: Plan): PlanDraft {
    return {
        uid: plan.id,
        id: plan.id,
        version: plan.version,
        key: plan.key,
        keyTouched: true,
        name: plan.name,
        description: plan.description ?? '',
        badgeEnabled: Boolean(plan.badge),
        badge: plan.badge ?? 'Mais popular',
        features: plan.features.map((text) => ({ uid: uid(), text })),
        entitlements: Object.entries(plan.entitlements).map(([key, value]) =>
            entitlementFromApi(key, value),
        ),
        prices: sortPrices(plan.prices.filter((price) => price.status !== 'archived')).map(
            priceFromApi,
        ),
        expanded: false,
        saved: {
            key: plan.key,
            name: plan.name,
            description: plan.description,
            badge: plan.badge,
            features: plan.features,
            entitlements: plan.entitlements,
            sortOrder: plan.sortOrder,
        },
    };
}

/** Preço sem plano: vira um cartão próprio, editado como antes. */
export function legacyPlanFromPrice(price: Price): PlanDraft {
    return {
        uid: price.id,
        legacy: true,
        key: '',
        keyTouched: true,
        name: price.name,
        description: '',
        badgeEnabled: false,
        badge: '',
        features: [],
        entitlements: [],
        prices: [priceFromApi(price)],
        expanded: false,
    };
}

const intervalRank: Record<string, number> = { day: 0, week: 1, month: 2, year: 3 };

function sortPrices(prices: Price[]) {
    return prices.toSorted(
        (left, right) =>
            (intervalRank[left.recurringInterval ?? ''] ?? -1) -
                (intervalRank[right.recurringInterval ?? ''] ?? -1) ||
            (left.recurringIntervalCount ?? 1) - (right.recurringIntervalCount ?? 1),
    );
}

export function activePrices(plan: PlanDraft) {
    return plan.prices.filter((price) => !price.removed);
}

export function isMonthly(price: PriceDraft) {
    return (
        price.pricingType === 'recurring' && price.interval === 'month' && price.intervalCount === 1
    );
}

export function isAnnual(price: PriceDraft) {
    return (
        price.pricingType === 'recurring' &&
        ((price.interval === 'year' && price.intervalCount === 1) ||
            (price.interval === 'month' && price.intervalCount === 12))
    );
}

/** Desconto do anual sobre 12 mensalidades, em % inteiro (ou undefined se não se aplica). */
export function annualDiscount(monthlyMinor: number, annualMinor: number) {
    if (monthlyMinor <= 0 || annualMinor <= 0) return undefined;
    const discount = 1 - annualMinor / (monthlyMinor * 12);
    return discount > 0.005 ? Math.round(discount * 100) : undefined;
}

export function intervalText(
    price: Pick<PriceDraft, 'pricingType' | 'interval' | 'intervalCount'>,
) {
    if (price.pricingType === 'one_time') return 'Pagamento único';
    const count = price.intervalCount;
    const units: Record<RecurringInterval, [string, string, string]> = {
        day: ['Diário', 'dia', 'dias'],
        week: ['Semanal', 'semana', 'semanas'],
        month: ['Mensal', 'mês', 'meses'],
        year: ['Anual', 'ano', 'anos'],
    };
    const [single, , plural] = units[price.interval];
    if (count === 1) return single;
    if (price.interval === 'month' && count === 3) return 'Trimestral';
    if (price.interval === 'month' && count === 6) return 'Semestral';
    if (price.interval === 'month' && count === 12) return 'Anual';
    return `A cada ${String(count)} ${plural}`;
}

/** Sufixo curto para valores: "/mês", "/ano", "/3 meses". */
export function intervalSuffix(
    price: Pick<PriceDraft, 'pricingType' | 'interval' | 'intervalCount'>,
) {
    if (price.pricingType === 'one_time') return '';
    const short: Record<RecurringInterval, [string, string]> = {
        day: ['dia', 'dias'],
        week: ['semana', 'semanas'],
        month: ['mês', 'meses'],
        year: ['ano', 'anos'],
    };
    const [single, plural] = short[price.interval];
    return price.intervalCount === 1 ? `/${single}` : `/${String(price.intervalCount)} ${plural}`;
}

function autoPriceName(planName: string, price: PriceDraft) {
    const name = planName.trim() || 'Plano';
    return price.pricingType === 'one_time' ? name : `${name} · ${intervalText(price)}`;
}

/** Nome enviado à API: preços novos seguem o plano; os salvos só mudam se o plano mudar de nome. */
function priceName(plan: PlanDraft, price: PriceDraft) {
    if (plan.legacy) return plan.name.trim();
    if (!price.saved) return autoPriceName(plan.name, price);
    if (plan.saved && plan.saved.name !== plan.name.trim()) return autoPriceName(plan.name, price);
    return price.saved.name;
}

function entitlementValue(entry: EntitlementDraft): PlanEntitlementValue {
    if (entry.kind === 'unlimited') return null;
    if (entry.kind === 'boolean') return entry.value === 'true';
    if (entry.kind === 'number') return Number(entry.value.replace(',', '.'));
    return entry.value.trim();
}

export function planPayload(plan: PlanDraft, sortOrder: number): PlanSnapshot {
    const badge = plan.badgeEnabled ? plan.badge.trim() : '';
    return {
        key: plan.key.trim(),
        name: plan.name.trim(),
        description: plan.description.trim() || null,
        badge: badge || null,
        features: plan.features.map((feature) => feature.text.trim()).filter(Boolean),
        entitlements: Object.fromEntries(
            plan.entitlements
                .filter((entry) => entry.key.trim())
                .map((entry) => [entry.key.trim(), entitlementValue(entry)]),
        ),
        sortOrder,
    };
}

/** Valida os planos ativos; devolve os rascunhos com `errors` preenchido (e abertos) onde houver erro. */
export function validatePlans(plans: PlanDraft[]): { plans: PlanDraft[]; valid: boolean } {
    const active = plans.filter((plan) => !plan.removed);
    const keyCount = new Map<string, number>();
    for (const plan of active) {
        if (plan.legacy) continue;
        const key = plan.key.trim();
        keyCount.set(key, (keyCount.get(key) ?? 0) + 1);
    }
    let valid = active.length > 0;
    const next = plans.map((plan) => {
        if (plan.removed) return { ...plan, errors: undefined };
        const errors: PlanErrors = {};
        const name = plan.name.trim();
        if (!name) errors.name = 'Dê um nome ao plano.';
        else if (name.length > planLimits.name) errors.name = 'Use até 120 caracteres.';
        const prices = activePrices(plan);
        if (prices.length === 0) errors.prices = 'Adicione pelo menos um preço.';
        else if (prices.some((price) => price.amountMinor <= 0))
            errors.prices = 'Todo preço precisa de um valor maior que zero.';
        else if (
            prices.some(
                (price) =>
                    price.pricingType === 'recurring' &&
                    (!Number.isInteger(price.intervalCount) || price.intervalCount < 1),
            )
        )
            errors.prices = 'O intervalo de cobrança precisa ser de pelo menos 1.';
        else if (
            prices.some(
                (price) =>
                    price.allowQuantity &&
                    (price.minimumQuantity < 1 || price.maximumQuantity < price.minimumQuantity),
            )
        )
            errors.prices = 'A quantidade máxima precisa ser maior ou igual à mínima.';
        else {
            const signatures = prices.map((price) =>
                price.pricingType === 'one_time'
                    ? 'one_time'
                    : `${price.interval}:${String(price.intervalCount)}`,
            );
            if (new Set(signatures).size !== signatures.length)
                errors.prices = 'Há dois preços com a mesma periodicidade neste plano.';
        }
        if (!plan.legacy) {
            const key = plan.key.trim();
            if (!key) errors.key = 'Informe o código do plano.';
            else if (!planKeyPattern.test(key))
                errors.key =
                    'Use letras minúsculas, números, "-", "_" ou "." (começando com letra ou número).';
            else if ((keyCount.get(key) ?? 0) > 1) errors.key = 'Outro plano já usa este código.';
            if (plan.description.trim().length > planLimits.description)
                errors.general = 'A descrição pode ter até 500 caracteres.';
            if (plan.badgeEnabled && !plan.badge.trim())
                errors.general = 'Escreva o texto do selo ou desligue-o.';
            const features = plan.features.filter((feature) => feature.text.trim());
            if (features.length > planLimits.features)
                errors.features = 'Use até 30 benefícios por plano.';
            else if (
                features.some((feature) => feature.text.trim().length > planLimits.featureLength)
            )
                errors.features = 'Cada benefício pode ter até 160 caracteres.';
            const entries = plan.entitlements.filter((entry) => entry.key.trim());
            const keys = entries.map((entry) => entry.key.trim());
            if (entries.length > planLimits.entitlements)
                errors.entitlements = 'Use até 40 limites por plano.';
            else if (keys.some((key) => !entitlementKeyPattern.test(key)))
                errors.entitlements =
                    'As chaves usam letras minúsculas, números e "_" (começando com letra).';
            else if (new Set(keys).size !== keys.length)
                errors.entitlements = 'Há limites com a mesma chave.';
            else if (
                entries.some(
                    (entry) =>
                        entry.kind === 'number' &&
                        !Number.isFinite(Number(entry.value.replace(',', '.'))),
                ) ||
                entries.some((entry) => entry.kind === 'number' && !entry.value.trim())
            )
                errors.entitlements = 'Preencha os limites numéricos com um número.';
            else if (
                entries.some(
                    (entry) =>
                        entry.kind === 'text' &&
                        (!entry.value.trim() ||
                            entry.value.trim().length > planLimits.entitlementText),
                )
            )
                errors.entitlements = 'Limites de texto precisam de 1 a 120 caracteres.';
        }
        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) valid = false;
        return {
            ...plan,
            errors: hasErrors ? errors : undefined,
            expanded: plan.expanded || hasErrors,
        };
    });
    return { plans: next, valid };
}

/* ------------------------------------------------------------------ persistência */

type ApiProblem = { detail?: string; code?: string };

async function send<T>(
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: unknown,
): Promise<{ ok: true; data: T | undefined } | { ok: false; status: number; problem: ApiProblem }> {
    const response = await fetch(url, {
        method,
        ...(body === undefined
            ? {}
            : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    });
    const payload = (await response.json().catch(() => ({}))) as { data?: T } & ApiProblem;
    if (response.ok) return { ok: true, data: payload.data };
    return { ok: false, status: response.status, problem: payload };
}

function sameJson(left: unknown, right: unknown) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function priceSnapshot(price: PriceDraft, name: string): PriceSnapshot {
    const recurring = price.pricingType === 'recurring';
    return {
        name,
        amountMinor: price.amountMinor,
        trialDays: recurring ? price.trialDays : 0,
        intervalCount: recurring ? price.intervalCount : 1,
        allowQuantity: price.allowQuantity,
        minimumQuantity: price.allowQuantity ? price.minimumQuantity : 1,
        maximumQuantity: price.allowQuantity ? price.maximumQuantity : 1,
    };
}

/** Salva um preço do plano. Devolve o rascunho atualizado ou a mensagem de erro. */
async function persistPrice(
    productId: string,
    plan: PlanDraft,
    price: PriceDraft,
    planId: string | undefined,
): Promise<{ price?: PriceDraft; error?: string }> {
    if (price.removed) {
        if (!price.id) return {};
        const result = await send(`/api/prices/${price.id}`, 'DELETE');
        return result.ok
            ? {}
            : { price, error: result.problem.detail ?? 'Não foi possível arquivar o preço.' };
    }
    const target = priceSnapshot(price, priceName(plan, price));
    const recurring = price.pricingType === 'recurring';
    if (price.id && price.saved) {
        const changes: Record<string, unknown> = {};
        for (const field of Object.keys(target) as Array<keyof PriceSnapshot>)
            if (target[field] !== price.saved[field]) changes[field] = target[field];
        if (Object.keys(changes).length === 0) return { price };
        if ('intervalCount' in changes) {
            changes.recurringIntervalCount = changes.intervalCount;
            delete changes.intervalCount;
        }
        const result = await send<Price>(`/api/prices/${price.id}`, 'PATCH', {
            ...changes,
            version: price.version,
        });
        if (!result.ok)
            return {
                price,
                error:
                    result.problem.code === 'STALE_VERSION'
                        ? 'O preço foi alterado em outra tela. Feche e abra o produto de novo.'
                        : (result.problem.detail ?? 'Não foi possível atualizar o preço.'),
            };
        return {
            price: {
                ...price,
                version: result.data?.version ?? (price.version ?? 0) + 1,
                saved: target,
            },
        };
    }
    const result = await send<Price>(`/api/products/${productId}/prices`, 'POST', {
        name: target.name,
        pricingType: price.pricingType,
        amountMinor: target.amountMinor,
        currency: 'BRL',
        ...(recurring
            ? {
                  recurringInterval: price.interval,
                  recurringIntervalCount: target.intervalCount,
                  billingMode: 'gateway_managed',
                  ...(target.trialDays > 0 ? { trialDays: target.trialDays } : {}),
              }
            : {}),
        status: 'active',
        allowQuantity: target.allowQuantity,
        minimumQuantity: target.minimumQuantity,
        maximumQuantity: target.maximumQuantity,
        metadata: {},
        ...(planId ? { planId } : {}),
    });
    if (!result.ok || !result.data)
        return {
            price,
            error: (!result.ok && result.problem.detail) || 'Não foi possível criar o preço.',
        };
    return {
        price: {
            ...price,
            uid: price.uid,
            id: result.data.id,
            version: result.data.version,
            saved: target,
        },
    };
}

async function persistPrices(
    productId: string,
    plan: PlanDraft,
    planId: string | undefined,
): Promise<PlanDraft> {
    const prices: PriceDraft[] = [];
    const errors: string[] = [];
    for (const price of plan.prices) {
        const result = await persistPrice(productId, plan, price, planId);
        if (result.price) prices.push(result.price);
        if (result.error) errors.push(`${intervalText(price)}: ${result.error}`);
    }
    return {
        ...plan,
        prices,
        errors: errors.length > 0 ? { prices: errors.join(' · ') } : undefined,
    };
}

export type PersistOutcome = {
    /** Rascunho atualizado (ids, versões e erros); undefined quando o plano foi arquivado. */
    plan?: PlanDraft;
    /** A API ainda não tem planos: os preços foram salvos sem plano. */
    plansUnavailable?: boolean;
};

/**
 * Cria/atualiza o plano e depois os preços dele (com planId). Erros ficam no próprio rascunho,
 * e o que já foi salvo fica marcado — salvar de novo não duplica nada.
 */
export async function persistPlan(
    productId: string,
    plan: PlanDraft,
    sortOrder: number,
): Promise<PersistOutcome> {
    if (plan.removed) {
        if (plan.legacy) {
            const result = await persistPrices(
                productId,
                { ...plan, prices: plan.prices.map((price) => ({ ...price, removed: true })) },
                undefined,
            );
            return result.errors ? { plan: { ...result, removed: false } } : {};
        }
        if (!plan.id) return {};
        const result = await send(`/api/plans/${plan.id}`, 'DELETE');
        if (result.ok) return {};
        return {
            plan: {
                ...plan,
                removed: false,
                expanded: true,
                errors: {
                    general: result.problem.detail ?? 'Não foi possível arquivar o plano.',
                },
            },
        };
    }

    if (plan.legacy) return { plan: await persistPrices(productId, plan, undefined) };

    const target = planPayload(plan, sortOrder);
    let current: PlanDraft = { ...plan, errors: undefined };

    if (!plan.id) {
        const { sortOrder: order, ...rest } = target;
        const result = await send<Plan>(`/api/products/${productId}/plans`, 'POST', {
            key: rest.key,
            name: rest.name,
            ...(rest.description ? { description: rest.description } : {}),
            features: rest.features,
            entitlements: rest.entitlements,
            ...(rest.badge ? { badge: rest.badge } : {}),
            sortOrder: order,
            metadata: {},
        });
        if (!result.ok || !result.data) {
            // O produto acabou de ser salvo, então 404 aqui é API sem a rota de planos:
            // salva os preços como antes para não perder o cadastro.
            if (!result.ok && (result.status === 404 || result.status === 405)) {
                const legacy = await persistPrices(productId, { ...plan, legacy: true }, undefined);
                return { plan: { ...legacy, legacy: true }, plansUnavailable: true };
            }
            return { plan: { ...current, expanded: true, errors: planError(result, true) } };
        }
        current = { ...current, id: result.data.id, version: result.data.version, saved: target };
    } else if (plan.saved) {
        const changes: Record<string, unknown> = {};
        for (const field of Object.keys(target) as Array<keyof PlanSnapshot>)
            if (!sameJson(target[field], plan.saved[field])) changes[field] = target[field];
        if (Object.keys(changes).length > 0) {
            const result = await send<Plan>(`/api/plans/${plan.id}`, 'PATCH', {
                ...changes,
                version: plan.version,
            });
            if (!result.ok)
                return {
                    plan: {
                        ...current,
                        expanded: true,
                        errors: planError(result, 'key' in changes),
                    },
                };
            current = {
                ...current,
                version: result.data?.version ?? (plan.version ?? 0) + 1,
                saved: target,
            };
        }
    }

    return { plan: await persistPrices(productId, current, current.id) };
}

function planError(
    result: { ok: false; status: number; problem: ApiProblem } | { ok: true },
    keyChanged: boolean,
): PlanErrors {
    if (result.ok) return { general: 'Não foi possível salvar o plano.' };
    const { status, problem } = result;
    if (problem.code === 'STALE_VERSION')
        return {
            general:
                'Este plano foi alterado em outra tela. Feche e abra o produto de novo para ver a versão atual.',
        };
    if (status === 409 && keyChanged && !problem.code?.startsWith('IDEMPOTENCY'))
        return { key: 'Este código já está em uso em outro plano da sua conta. Escolha outro.' };
    return { general: problem.detail ?? 'Não foi possível salvar o plano.' };
}
