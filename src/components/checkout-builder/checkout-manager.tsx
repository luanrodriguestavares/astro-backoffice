'use client';

import { Button, ButtonLink } from '@/components/ui/button';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Icon } from '@/components/ui/icon';
import { CustomSelect } from '@/components/ui/custom-select';
import { showToast } from '@/components/ui/toast';
import {
    buildCheckoutFromTemplate,
    checkoutTemplates,
    periodLabel,
    type CheckoutTemplateId,
} from '@/lib/checkout/templates';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
import { defaultCheckoutAppearance, type CheckoutAppearance } from '@astro/checkout-renderer/theme';
import { CheckoutAppearanceStudio } from '@/components/checkout-builder/appearance-studio';
import type { Checkout } from '@/lib/api/types';
import { useEscapeClose } from '@/hooks/use-escape-close';

export type CheckoutCatalogOption = {
    productId: string;
    priceId: string;
    productName: string;
    priceName: string;
    amountMinor: number;
    currency: string;
    pricingType: string;
    recurringInterval?: string | null;
    recurringIntervalCount?: number | null;
    active: boolean;
};

export function CheckoutManager({
    checkouts,
    catalog,
    canWrite,
    initialQuery = '',
    initialTemplate,
    focusId,
}: {
    checkouts: Checkout[];
    catalog: CheckoutCatalogOption[];
    canWrite: boolean;
    initialQuery?: string;
    initialTemplate?: CheckoutTemplateId;
    focusId?: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(Boolean(canWrite && initialTemplate && catalog.length));
    const [step, setStep] = useState<'template' | 'details' | 'appearance'>(
        initialTemplate ? 'details' : 'template',
    );
    const [template, setTemplate] = useState<CheckoutTemplateId | undefined>(initialTemplate);
    const [templateQuery, setTemplateQuery] = useState('');
    const [templateCategory, setTemplateCategory] = useState<
        'all' | 'sales' | 'checkout' | 'recurring'
    >('all');
    const [productId, setProductId] = useState('');
    const [planIds, setPlanIds] = useState<string[]>([]);
    const [appearance, setAppearance] = useState<CheckoutAppearance>(defaultCheckoutAppearance);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Checkout>();
    const [deleting, setDeleting] = useState(false);
    const [missingProductAlert, setMissingProductAlert] = useState(
        Boolean(canWrite && initialTemplate && catalog.length === 0),
    );
    const [query, setQuery] = useState(initialQuery);
    const filteredCheckouts = useMemo(() => {
        const term = normalize(query.trim());
        if (!term) return checkouts;
        return checkouts.filter((checkout) =>
            normalize(`${checkout.name} ${checkout.slug} ${checkout.status}`).includes(term),
        );
    }, [checkouts, query]);
    const visibleTemplates = useMemo(() => {
        const term = normalize(templateQuery.trim());
        return checkoutTemplates.filter(
            (item) =>
                (templateCategory === 'all' || item.category === templateCategory) &&
                (!term ||
                    normalize(
                        `${item.name} ${item.description} ${item.audience} ${item.highlights.join(' ')}`,
                    ).includes(term)),
        );
    }, [templateCategory, templateQuery]);

    useEffect(() => {
        if (!focusId) return;
        window.requestAnimationFrame(() =>
            document
                .getElementById(`checkout-${focusId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        );
    }, [focusId]);

    function openCreate() {
        if (catalog.length === 0) {
            setMissingProductAlert(true);
            return;
        }
        setStep('template');
        setTemplate(undefined);
        setTemplateQuery('');
        setTemplateCategory('all');
        setProductId('');
        setPlanIds([]);
        setAppearance(defaultCheckoutAppearance);
        setName('');
        setSlug('');
        setSlugTouched(false);
        setOpen(true);
    }

    useEscapeClose(open || Boolean(deleteTarget) || missingProductAlert, () => {
        if (missingProductAlert) setMissingProductAlert(false);
        else if (deleteTarget && !deleting) setDeleteTarget(undefined);
        else closeCreate();
    });

    function closeCreate() {
        if (loading) return;
        setOpen(false);
    }

    // Um produto aparece uma vez; os preços dele são os planos que entram no checkout.
    const catalogProducts = groupCatalog(orderedCatalog(catalog, template));
    const productPlans = catalogProducts.find((item) => item.productId === productId)?.plans ?? [];
    const chosenPlans = productPlans.filter((plan) => planIds.includes(plan.priceId));
    const selectedPrice = chosenPlans[0];

    function chooseProduct(id: string) {
        setProductId(id);
        const plans = catalogProducts.find((item) => item.productId === id)?.plans ?? [];
        // Assinatura começa com os planos recorrentes; os outros modelos, com todos.
        const recurring = plans.filter((plan) => plan.pricingType === 'recurring');
        setPlanIds(
            (template === 'subscription' && recurring.length ? recurring : plans).map(
                (plan) => plan.priceId,
            ),
        );
    }

    function continueToAppearance(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedPrice) {
            showToast({
                tone: 'warning',
                description: 'Selecione um produto e ao menos um plano.',
            });
            return;
        }
        setStep('appearance');
    }

    async function create() {
        const selected = selectedPrice;
        if (!selected) {
            setStep('details');
            showToast({
                tone: 'warning',
                description: 'Selecione um produto e ao menos um plano.',
            });
            return;
        }
        setLoading(true);
        const built = buildCheckoutFromTemplate(template ?? 'blank', chosenPlans, appearance);
        const response = await fetch('/api/checkouts', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: name.trim(),
                slug: slugify(slug || name),
                checkoutType: built.products.length > 1 ? 'multi_product' : 'single_product',
                defaultCurrency: selected.currency,
                products: built.products,
                document: built.document,
            }),
        });
        const body = (await response.json()) as { data?: Checkout; detail?: string };
        setLoading(false);
        if (!response.ok || !body.data) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível criar o checkout.',
            });
            return;
        }
        router.push(`/checkouts/${body.data.id}`);
    }

    async function removeCheckout() {
        if (!deleteTarget) return;
        setDeleting(true);
        const response = await fetch(`/api/checkouts/${deleteTarget.id}`, { method: 'DELETE' });
        const body = response.ok ? undefined : ((await response.json()) as { detail?: string });
        setDeleting(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body?.detail ?? 'Não foi possível excluir o checkout.',
            });
            setDeleteTarget(undefined);
            return;
        }
        setDeleteTarget(undefined);
        showToast({
            tone: 'success',
            title: 'Checkout excluído',
            description: 'O checkout foi removido com sucesso.',
        });
        router.refresh();
    }

    return (
        <>
            <div className="glass-panel mb-4 flex flex-col gap-4 rounded-[22px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2 className="text-sm font-semibold tracking-[-0.02em]">
                        Experiências de checkout
                    </h2>
                    <p className="mt-1 text-[12px] text-muted">
                        Crie e edite suas páginas de conversão
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    {checkouts.length > 0 && (
                        <label className="filter-control ui-control-frame flex h-11 min-w-0 items-center gap-2 px-3.5 sm:w-[260px]">
                            <Icon name="search" className="size-3.5 shrink-0 text-muted" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Buscar checkout"
                                className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted"
                            />
                        </label>
                    )}
                    {canWrite && (
                        <Button
                            type="button"
                            variant="primary"
                            onClick={openCreate}
                            className="h-10 px-4"
                        >
                            <Icon name="plus" className="size-3.5" /> Criar checkout
                        </Button>
                    )}
                </div>
            </div>

            {filteredCheckouts.length === 0 ? (
                <section className="glass-panel rounded-[28px] px-5 py-14 text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft/75 text-brand">
                        <Icon name="layout" className="size-4" />
                    </span>
                    <h2 className="mt-3 text-sm font-semibold">
                        {checkouts.length ? 'Nenhum checkout encontrado' : 'Nenhum checkout criado'}
                    </h2>
                    <p className="mt-1 text-[13px] text-muted">
                        {checkouts.length
                            ? 'Tente buscar por outro nome ou endereço.'
                            : 'Escolha como começar e monte sua primeira experiência.'}
                    </p>
                </section>
            ) : (
                <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredCheckouts.map((checkout) => (
                        <CheckoutCard
                            key={checkout.id}
                            checkout={checkout}
                            onDelete={() => setDeleteTarget(checkout)}
                            canWrite={canWrite}
                            focused={focusId === checkout.id}
                        />
                    ))}
                </section>
            )}

            {open &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) closeCreate();
                        }}
                        className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm"
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className={`theme-modal modal-surface glass-panel ${
                                step === 'appearance'
                                    ? // Assistente de aparência: ocupa a altura da tela e só os controles rolam.
                                      'flex h-[min(calc(100dvh-2rem),920px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(16,18,20,.18)] sm:p-7'
                                    : step === 'template'
                                      ? // A galeria cresce na horizontal; apenas a lista de modelos rola.
                                        'flex h-[min(calc(100dvh-2rem),920px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(16,18,20,.18)] sm:p-7'
                                      : 'my-6 w-full max-w-xl overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(16,18,20,.18)] sm:p-7'
                            }`}
                        >
                            <div className="flex shrink-0 items-start justify-between gap-5">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                                        Novo checkout · Etapa{' '}
                                        {step === 'template' ? 1 : step === 'details' ? 2 : 3} de 3
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                                        {step === 'template'
                                            ? 'Como você quer começar?'
                                            : step === 'details'
                                              ? 'Configure seu checkout'
                                              : 'Dê a cara da sua marca'}
                                    </h2>
                                    <p className="mt-1.5 text-[13px] leading-5 text-muted">
                                        {step === 'template'
                                            ? 'Escolha um ponto de partida. Você poderá personalizar tudo no editor.'
                                            : step === 'details'
                                              ? `Modelo: ${checkoutTemplates.find((item) => item.id === template)?.name ?? ''}. Defina o nome e a oferta principal.`
                                              : 'Defina a identidade visual básica. Todas as opções podem ser alteradas depois, em Aparência, no editor.'}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="icon"
                                    aria-label="Fechar"
                                    onClick={closeCreate}
                                    className="size-9"
                                >
                                    <Icon name="close" className="size-4" />
                                </Button>
                            </div>

                            {step === 'template' ? (
                                <>
                                    <div className="mt-5 flex shrink-0 flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
                                        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-[var(--control-bg)] px-3 lg:max-w-sm">
                                            <Icon name="search" className="size-4 text-muted" />
                                            <input
                                                value={templateQuery}
                                                onChange={(event) =>
                                                    setTemplateQuery(event.target.value)
                                                }
                                                placeholder="Buscar templates de funil"
                                                className="min-w-0 flex-1 bg-transparent text-[13px] font-normal outline-none placeholder:text-muted"
                                            />
                                        </label>
                                        <div className="flex gap-1 overflow-x-auto">
                                            {(
                                                [
                                                    ['all', 'Todos'],
                                                    ['sales', 'Venda'],
                                                    ['checkout', 'Checkout'],
                                                    ['recurring', 'Recorrência'],
                                                ] as const
                                            ).map(([value, label]) => (
                                                <Button
                                                    key={value}
                                                    type="button"
                                                    variant="secondary"
                                                    aria-pressed={templateCategory === value}
                                                    onClick={() => setTemplateCategory(value)}
                                                    className={
                                                        templateCategory === value
                                                            ? 'border-brand/45 bg-brand-soft text-brand-strong'
                                                            : ''
                                                    }
                                                >
                                                    {label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                                        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
                                            {visibleTemplates.map((item) => {
                                                const selected = template === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        aria-pressed={selected}
                                                        onClick={() => setTemplate(item.id)}
                                                        onDoubleClick={() => {
                                                            setTemplate(item.id);
                                                            setStep('details');
                                                        }}
                                                        className={`checkout-template-card group grid content-start gap-3 rounded-[20px] border p-2.5 text-left transition ${selected ? 'border-brand/55 bg-brand-soft/60 shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--brand)_14%,transparent)]' : 'border-border bg-[var(--control-bg)] hover:border-brand/25'}`}
                                                    >
                                                        <TemplateThumb id={item.id} />
                                                        <span className="grid gap-1 px-1.5 pb-1.5">
                                                            <span className="flex items-center justify-between gap-2">
                                                                <span className="text-sm font-semibold tracking-[-0.01em]">
                                                                    {item.name}
                                                                </span>
                                                                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                                                                    {item.flowSteps}{' '}
                                                                    {item.flowSteps === 1
                                                                        ? 'etapa'
                                                                        : 'etapas'}
                                                                </span>
                                                            </span>
                                                            <span className="text-[12px] leading-5 text-muted">
                                                                {item.description}
                                                            </span>
                                                            <span className="mt-1 flex flex-wrap gap-1">
                                                                {item.highlights.map(
                                                                    (highlight) => (
                                                                        <span
                                                                            key={highlight}
                                                                            className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-medium text-foreground/75"
                                                                        >
                                                                            <Icon
                                                                                name="check"
                                                                                className="size-3"
                                                                            />
                                                                            {highlight}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {visibleTemplates.length === 0 && (
                                            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border text-center text-[13px] text-muted">
                                                Nenhum template encontrado com esses filtros.
                                            </div>
                                        )}
                                        <p className="mt-4 text-[12px] leading-5 text-muted">
                                            Depois do nome e do produto, você define cor, fonte e
                                            estilo com uma prévia ao vivo.
                                        </p>
                                    </div>
                                    <div className="mt-5 flex shrink-0 justify-end gap-2 border-t border-border pt-5">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={closeCreate}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={!template}
                                            onClick={() => setStep('details')}
                                            className="px-6"
                                        >
                                            Continuar
                                        </Button>
                                    </div>
                                </>
                            ) : step === 'appearance' ? (
                                <>
                                    <div className="mt-5 min-h-0 flex-1 overflow-y-auto lg:overflow-visible">
                                        <CheckoutAppearanceStudio
                                            value={appearance}
                                            onChange={setAppearance}
                                            product={{
                                                name: selectedPrice?.productName ?? 'Seu produto',
                                                price: selectedPrice
                                                    ? `${money(selectedPrice.amountMinor, selectedPrice.currency)}`
                                                    : 'R$ 97,00',
                                                recurringLabel: selectedPrice
                                                    ? periodLabel(selectedPrice) || undefined
                                                    : undefined,
                                            }}
                                        />
                                    </div>
                                    <div className="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={loading}
                                            onClick={() => setStep('details')}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={loading}
                                            onClick={() => void create()}
                                            className="px-6"
                                        >
                                            {loading ? 'Criando...' : 'Criar e abrir editor'}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={continueToAppearance}>
                                    <div className="mt-6 grid gap-4">
                                        <label className="text-[13px] font-semibold">
                                            Nome do checkout
                                            <input
                                                name="name"
                                                required
                                                value={name}
                                                onChange={(event) => {
                                                    setName(event.target.value);
                                                    if (!slugTouched)
                                                        setSlug(slugify(event.target.value));
                                                }}
                                                placeholder="Ex.: Plano Pro anual"
                                                className={inputClass}
                                            />
                                        </label>
                                        <label className="text-[13px] font-semibold">
                                            Endereço da página
                                            <span className="mt-2 flex h-11 items-center overflow-hidden rounded-xl border border-border bg-[var(--control-bg)] focus-within:border-brand/70 focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]">
                                                <span className="hidden h-full items-center border-r border-border bg-surface-muted px-3 text-[12px] font-normal text-muted sm:flex">
                                                    {checkoutPublicUrl('').replace(/\/$/, '')}/
                                                </span>
                                                <input
                                                    name="slug"
                                                    value={slug}
                                                    onChange={(event) => {
                                                        setSlugTouched(true);
                                                        setSlug(slugify(event.target.value));
                                                    }}
                                                    placeholder="meu-checkout"
                                                    className="h-full min-w-0 flex-1 bg-transparent px-3 font-normal outline-none placeholder:text-muted"
                                                />
                                            </span>
                                        </label>
                                        <label className="text-[13px] font-semibold">
                                            Produto
                                            <div className="mt-2">
                                                <CustomSelect
                                                    name="productId"
                                                    required
                                                    value={productId}
                                                    onValueChange={chooseProduct}
                                                    placeholder="Selecione um produto"
                                                    options={catalogProducts.map((item) => ({
                                                        value: item.productId,
                                                        label: item.productName,
                                                        badge:
                                                            item.plans.length === 1 && item.plans[0]
                                                                ? `${money(item.plans[0].amountMinor, item.plans[0].currency)}${periodLabel(item.plans[0])}`
                                                                : `${String(item.plans.length)} planos`,
                                                    }))}
                                                />
                                            </div>
                                        </label>
                                        {productPlans.length > 1 && (
                                            <fieldset className="text-[13px] font-semibold">
                                                <legend>Planos no checkout</legend>
                                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                    {productPlans.map((plan) => {
                                                        const checked = planIds.includes(
                                                            plan.priceId,
                                                        );
                                                        return (
                                                            <label
                                                                key={plan.priceId}
                                                                data-checked={checked || undefined}
                                                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-[var(--control-bg)] px-3.5 py-2.5 font-normal transition data-[checked]:border-brand/70 data-[checked]:bg-brand-soft/40"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() =>
                                                                        setPlanIds((current) =>
                                                                            checked
                                                                                ? current.filter(
                                                                                      (id) =>
                                                                                          id !==
                                                                                          plan.priceId,
                                                                                  )
                                                                                : [
                                                                                      ...current,
                                                                                      plan.priceId,
                                                                                  ],
                                                                        )
                                                                    }
                                                                    className="size-4 accent-[var(--brand)]"
                                                                />
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate font-semibold">
                                                                        {plan.priceName}
                                                                    </span>
                                                                    <span className="block text-[11.5px] text-muted">
                                                                        {money(
                                                                            plan.amountMinor,
                                                                            plan.currency,
                                                                        )}
                                                                        {periodLabel(plan)}
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <span className="mt-1.5 block text-[11.5px] font-normal leading-4 text-muted">
                                                    {chosenPlans.length > 1
                                                        ? 'O checkout já vem com o seletor de planos; o comprador escolhe um.'
                                                        : 'Marque mais de um para o comprador poder escolher o plano.'}
                                                </span>
                                            </fieldset>
                                        )}
                                    </div>
                                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={loading}
                                            onClick={() => setStep('template')}
                                        >
                                            Voltar
                                        </Button>
                                        <Button variant="primary" className="px-6">
                                            Continuar
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}

            {deleteTarget &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget && !deleting)
                                setDeleteTarget(undefined);
                        }}
                        className="fixed inset-0 z-[110] grid place-items-center bg-[#17172c]/18 p-4 backdrop-blur-sm"
                    >
                        <div
                            className="theme-modal modal-surface glass-panel w-full max-w-md rounded-[26px] p-6 shadow-[0_30px_90px_rgba(37,31,76,.2)]"
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="delete-checkout-title"
                        >
                            <span className="grid size-11 place-items-center rounded-full border border-danger/20 bg-danger/10 text-danger">
                                <Icon name="trash" className="size-4.5" />
                            </span>
                            <h2
                                id="delete-checkout-title"
                                className="mt-4 text-xl font-semibold tracking-[-0.03em]"
                            >
                                Excluir checkout?
                            </h2>
                            <p className="mt-2 text-[13px] leading-5 text-muted">
                                O checkout{' '}
                                <strong className="text-foreground">{deleteTarget.name}</strong>{' '}
                                será excluído permanentemente. Esta ação não pode ser desfeita.
                            </p>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={deleting}
                                    onClick={() => setDeleteTarget(undefined)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    variant="danger"
                                    disabled={deleting}
                                    onClick={removeCheckout}
                                    className="h-11 rounded-xl px-5"
                                >
                                    {deleting ? 'Excluindo...' : 'Excluir checkout'}
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}

            {missingProductAlert &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setMissingProductAlert(false);
                        }}
                        className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-[#17172c]/18 p-4 backdrop-blur-sm"
                    >
                        <section
                            role="alertdialog"
                            aria-modal="true"
                            className="theme-modal modal-surface glass-panel my-6 w-full max-w-md rounded-[26px] p-6 shadow-[0_30px_90px_rgba(37,31,76,.2)]"
                        >
                            <span className="grid size-11 place-items-center rounded-full border border-warning/20 bg-warning/10 text-warning">
                                <Icon name="box" className="size-4.5" />
                            </span>
                            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">
                                Produto necessário
                            </h2>
                            <p className="mt-2 text-[13px] leading-5 text-muted">
                                Cadastre um produto com preço ativo antes de criar um checkout.
                            </p>
                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setMissingProductAlert(false)}
                                >
                                    Fechar
                                </Button>
                                <ButtonLink href="/products">Cadastrar produto</ButtonLink>
                            </div>
                        </section>
                    </div>,
                    document.body,
                )}
        </>
    );
}

function CheckoutCard({
    checkout,
    onDelete,
    canWrite,
    focused = false,
}: {
    checkout: Checkout;
    onDelete: () => void;
    canWrite: boolean;
    focused?: boolean;
}) {
    // Miniatura estática: sem animações nem cronômetro rodando em cada card da lista.
    const previewUrl = `/checkouts/${checkout.id}/preview?embed=1&static=1&saved=${encodeURIComponent(checkout.updatedAt)}`;
    const publicUrl = checkoutPublicUrl(checkout.slug);
    return (
        <article
            id={`checkout-${checkout.id}`}
            className={`checkout-list-card glass-panel group overflow-hidden rounded-[20px] p-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(66,57,128,.08)] ${focused ? 'ring-2 ring-brand/35 shadow-[0_18px_48px_color-mix(in_srgb,var(--brand)_14%,transparent)]' : ''}`}
        >
            <Link
                href={canWrite ? `/checkouts/${checkout.id}` : `/checkouts/${checkout.id}/preview`}
                className="relative block h-32 overflow-hidden rounded-[14px] border border-[#dfddea]/70 bg-gradient-to-br from-[#f5f3ff] to-[#edf4ff]"
                aria-label={`Abrir editor de ${checkout.name}`}
            >
                <span className="absolute inset-0 grid place-items-center text-brand/35">
                    <Icon name="layout" className="size-7" />
                </span>
                <iframe
                    src={previewUrl}
                    title={`Prévia salva de ${checkout.name}`}
                    loading="lazy"
                    tabIndex={-1}
                    className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left border-0 bg-white [transform:scale(.25)]"
                />
                <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/45" />
            </Link>

            <div className="mt-3.5 flex min-w-0 items-start justify-between gap-3 px-0.5">
                <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold tracking-[-0.025em]">
                        {checkout.name}
                    </h2>
                    {checkout.status === 'published' ? (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block max-w-full truncate text-[11px] text-brand-strong hover:underline"
                        >
                            {publicUrl}
                        </a>
                    ) : (
                        <p className="mt-1 truncate text-[12px] text-muted">/{checkout.slug}</p>
                    )}
                </div>
                <span
                    className={`checkout-list-status inline-flex h-6 shrink-0 items-center justify-center rounded-full border px-2.5 text-[10px] font-semibold leading-none ${checkout.status === 'published' ? 'border-emerald-100 bg-[#e8f7f1] text-success' : 'border-[#dedce9] bg-white/55 text-muted'}`}
                >
                    {checkout.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
            </div>

            <div className="checkout-list-footer mt-3.5 flex items-center justify-between border-t border-white/70 px-0.5 pt-3">
                <span className="text-[11px] text-muted">Versão {checkout.version}</span>
                <div className="flex items-center gap-1">
                    {canWrite && (
                        <Button
                            type="button"
                            variant="icon"
                            onClick={onDelete}
                            aria-label={`Excluir ${checkout.name}`}
                            className="size-8 rounded-lg hover:border-danger/20 hover:bg-danger/10 hover:text-danger"
                        >
                            <Icon name="trash" className="size-3.5" />
                        </Button>
                    )}
                    {checkout.status === 'published' && (
                        <Button
                            type="button"
                            variant="icon"
                            onClick={() => void navigator.clipboard.writeText(publicUrl)}
                            aria-label={`Copiar link público de ${checkout.name}`}
                            title="Copiar link público"
                            className="size-8 rounded-lg"
                        >
                            <Icon name="link" className="size-3.5" />
                        </Button>
                    )}
                    <ButtonLink
                        href={
                            canWrite
                                ? `/checkouts/${checkout.id}`
                                : `/checkouts/${checkout.id}/preview`
                        }
                        variant="ghost"
                        className="h-8 rounded-lg px-2.5"
                    >
                        {canWrite ? 'Abrir' : 'Visualizar'}{' '}
                        <Icon name="arrow-right" className="size-3.5" />
                    </ButtonLink>
                </div>
            </div>
        </article>
    );
}

function slugify(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

const inputClass =
    'mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]';

/** Agrupa os preços por produto, mantendo a ordem em que os produtos aparecem. */
function groupCatalog(catalog: CheckoutCatalogOption[]) {
    const groups = new Map<
        string,
        { productId: string; productName: string; plans: CheckoutCatalogOption[] }
    >();
    for (const item of catalog) {
        const group = groups.get(item.productId) ?? {
            productId: item.productId,
            productName: item.productName,
            plans: [],
        };
        group.plans.push(item);
        groups.set(item.productId, group);
    }
    return [...groups.values()];
}

/** Assinatura mostra primeiro os preços recorrentes; os demais modelos mantêm a ordem. */
function orderedCatalog(catalog: CheckoutCatalogOption[], template?: CheckoutTemplateId) {
    if (template !== 'subscription') return catalog;
    return [...catalog].sort(
        (a, b) => Number(b.pricingType === 'recurring') - Number(a.pricingType === 'recurring'),
    );
}

/** Miniatura do layout de cada modelo, desenhada com os tokens do painel (claro e escuro). */
export function TemplateThumb({ id }: { id: CheckoutTemplateId }) {
    const bar = 'block rounded-full bg-foreground/15';
    const card = 'rounded-[6px] border border-border bg-surface p-1.5';
    const button = 'block h-2.5 rounded-[4px] bg-brand';
    return (
        <span
            aria-hidden="true"
            className="relative block h-[118px] overflow-hidden rounded-[14px] border border-border bg-surface-muted p-2.5"
        >
            {id === 'vsl' && (
                <span className="grid h-full grid-cols-[1fr_1.25fr] gap-2">
                    <span className="grid content-center justify-items-center gap-1.5 rounded-[7px] bg-[#111318] px-3">
                        <span className="grid size-8 place-items-center rounded-full bg-brand text-white shadow-sm">
                            <Icon name="play" className="ml-0.5 size-3.5" />
                        </span>
                        <span className="block h-1.5 w-14 rounded-full bg-white/65" />
                        <span className="block h-1 w-9 rounded-full bg-white/25" />
                    </span>
                    <span className="grid content-center gap-1.5">
                        <span className={`${bar} h-2 w-20 bg-foreground/30`} />
                        <span className={`${bar} h-1 w-full`} />
                        <span className={`${bar} h-1 w-4/5`} />
                        <span className={`${button} mt-1`} />
                        <span className="mx-auto block h-1 w-16 rounded-full bg-foreground/10" />
                    </span>
                </span>
            )}
            {id === 'subscription' && (
                <span className="grid h-full grid-cols-[1.3fr_1fr] gap-1.5">
                    <span className="grid content-start gap-1">
                        {[0, 1, 2].map((index) => (
                            <span
                                key={index}
                                className={`flex items-center gap-1.5 rounded-[6px] border px-1.5 py-1 ${index === 2 ? 'border-brand bg-surface' : 'border-border bg-surface'}`}
                            >
                                <span
                                    className={`size-2 rounded-full border ${index === 2 ? 'border-[3px] border-brand' : 'border-foreground/25'}`}
                                />
                                <span className={`${bar} h-1.5 w-10`} />
                                <span className={`${bar} ml-auto h-1.5 w-5 bg-foreground/30`} />
                            </span>
                        ))}
                        <span className={`${card} grid gap-1`}>
                            <span className={`${bar} h-1.5 w-12`} />
                            <span className="block h-2.5 rounded-[4px] border border-border" />
                        </span>
                    </span>
                    <span className={`${card} grid content-start gap-1`}>
                        <span className={`${bar} h-1.5 w-10`} />
                        <span className={`${bar} h-1 w-14 bg-foreground/10`} />
                        <span className="mt-1 flex justify-between">
                            <span className={`${bar} h-1.5 w-6`} />
                            <span className={`${bar} h-1.5 w-8 bg-foreground/35`} />
                        </span>
                        <span className={`${button} mt-1`} />
                        <span className="mt-0.5 block h-1.5 w-8 rounded-full bg-[#91cf24]" />
                    </span>
                </span>
            )}
            {id === 'digital-product' && (
                <span className="grid h-full content-start gap-1.5">
                    <span className="flex h-3.5 items-center justify-between rounded-[5px] bg-brand px-1.5">
                        <span className="block h-1 w-12 rounded-full bg-white/60" />
                        <span className="flex gap-0.5">
                            {[0, 1, 2].map((index) => (
                                <span
                                    key={index}
                                    className="block size-2 rounded-[2px] bg-white/30"
                                />
                            ))}
                        </span>
                    </span>
                    <span className="grid justify-items-center gap-1 py-1">
                        <span className={`${bar} h-2 w-24 bg-foreground/30`} />
                        <span className={`${bar} h-1 w-16`} />
                        <span className="block h-2.5 w-14 rounded-[4px] bg-brand" />
                    </span>
                    <span className="grid grid-cols-3 gap-1">
                        {[0, 1, 2].map((index) => (
                            <span key={index} className={`${card} grid gap-1`}>
                                <span className="block size-2 rounded-[3px] bg-[#91cf24]" />
                                <span className={`${bar} h-1 w-8`} />
                            </span>
                        ))}
                    </span>
                </span>
            )}
            {id === 'express' && (
                <span className="grid h-full content-start gap-1.5">
                    <span className="flex h-3 items-center gap-1 rounded-[5px] border border-border bg-surface px-1.5">
                        <span className="block size-1.5 rounded-full bg-[#91cf24] ring-2 ring-[#91cf24]/30" />
                        <span className={`${bar} h-1 w-16`} />
                    </span>
                    <span className="grid grid-cols-[1.25fr_1fr] gap-1.5">
                        <span className="grid gap-1">
                            <span className={`${card} grid gap-1`}>
                                <span className="block h-2 rounded-[3px] border border-border" />
                                <span className="block h-2 rounded-[3px] border border-border" />
                            </span>
                            <span className="grid grid-cols-3 gap-0.5 rounded-[6px] bg-foreground/[.06] p-0.5">
                                <span className="block h-2.5 rounded-[4px] bg-surface" />
                                <span className="block h-2.5" />
                                <span className="block h-2.5" />
                            </span>
                        </span>
                        <span className={`${card} grid content-start gap-1`}>
                            <span className="flex justify-between">
                                <span className={`${bar} h-1.5 w-7`} />
                                <span className={`${bar} h-1.5 w-6 bg-foreground/35`} />
                            </span>
                            <span className={`${button} mt-1`} />
                        </span>
                    </span>
                </span>
            )}
            {id === 'presell' && (
                <span className="grid h-full grid-cols-[1.25fr_1fr] gap-2">
                    <span className={`${card} grid content-start gap-1`}>
                        <span className={`${bar} h-2 w-full bg-foreground/30`} />
                        <span className={`${bar} h-1 w-full`} />
                        <span className={`${bar} h-1 w-full`} />
                        <span className={`${bar} h-1 w-3/4`} />
                        <span className={`${bar} h-1 w-full`} />
                        <span className={`${button} mt-1`} />
                    </span>
                    <span className={`${card} grid content-center gap-1`}>
                        <span className={`${bar} h-1.5 w-10`} />
                        <span className="block h-2 rounded-[3px] border border-border" />
                        <span className={`${button} mt-1`} />
                    </span>
                </span>
            )}
            {id === 'pix-express' && (
                <span className="grid h-full place-items-center">
                    <span className={`${card} grid w-28 justify-items-center gap-1.5`}>
                        <span className="grid size-9 grid-cols-3 gap-0.5 rounded-[4px] border border-border p-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                                <span
                                    key={index}
                                    className={`rounded-[1px] ${index % 2 ? 'bg-foreground/10' : 'bg-foreground/45'}`}
                                />
                            ))}
                        </span>
                        <span className={`${bar} h-1.5 w-14`} />
                        <span className={`${button} w-full`} />
                        <span className="block h-1.5 w-10 rounded-full bg-[#91cf24]" />
                    </span>
                </span>
            )}
            {id === 'high-ticket' && (
                <span className="grid h-full content-start gap-1.5">
                    <span className="grid justify-items-center gap-1">
                        <span className="block h-1.5 w-10 rounded-full bg-brand/40" />
                        <span className={`${bar} h-2 w-24 bg-foreground/30`} />
                    </span>
                    <span className="grid grid-cols-[1.25fr_1fr] gap-1.5">
                        <span className={`${card} grid gap-1`}>
                            {[0, 1, 2].map((index) => (
                                <span
                                    key={index}
                                    className="block h-2 rounded-[3px] border border-border"
                                />
                            ))}
                        </span>
                        <span className={`${card} grid content-start gap-1`}>
                            <span className={`${bar} h-1.5 w-8`} />
                            <span className={`${button} mt-1`} />
                            <span className="block h-1.5 w-12 rounded-full bg-[#91cf24]" />
                        </span>
                    </span>
                </span>
            )}
            {id === 'blank' && (
                <span className="grid h-full grid-cols-2 gap-1.5">
                    {[0, 1, 2].map((index) => (
                        <span
                            key={index}
                            className={`grid place-items-center rounded-[6px] border border-dashed border-foreground/20 ${index === 2 ? 'col-span-2' : ''}`}
                        >
                            <Icon name="plus" className="size-3 text-muted" />
                        </span>
                    ))}
                </span>
            )}
        </span>
    );
}
