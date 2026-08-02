'use client';

import { Button, ButtonLink } from '@/components/ui/button';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Icon, type IconName } from '@/components/ui/icon';
import { CustomSelect } from '@/components/ui/custom-select';
import { showToast } from '@/components/ui/toast';
import { blankCheckoutDocument } from '@/lib/checkout/document';
import { checkoutPublicUrl } from '@/lib/checkout/public-url';
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
    active: boolean;
};

const templates: {
    id: string;
    name: string;
    description: string;
    icon: IconName;
    available: boolean;
}[] = [
    {
        id: 'blank',
        name: 'Em branco',
        description: 'Comece só com a estrutura essencial de pagamento e personalize o restante.',
        icon: 'plus',
        available: true,
    },
    {
        id: 'product-launch',
        name: 'Lançamento',
        description: 'Estrutura para apresentar uma oferta e gerar conversão.',
        icon: 'bolt',
        available: false,
    },
    {
        id: 'digital-product',
        name: 'Produto digital',
        description: 'Página completa para cursos, ebooks e comunidades.',
        icon: 'box',
        available: false,
    },
    {
        id: 'subscription',
        name: 'Assinatura',
        description: 'Experiência focada em planos e cobrança recorrente.',
        icon: 'repeat',
        available: false,
    },
];

export function CheckoutManager({
    checkouts,
    catalog,
}: {
    checkouts: Checkout[];
    catalog: CheckoutCatalogOption[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'template' | 'details'>('template');
    const [template, setTemplate] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Checkout>();
    const [deleting, setDeleting] = useState(false);
    const [missingProductAlert, setMissingProductAlert] = useState(false);

    function openCreate() {
        if (catalog.length === 0) {
            setMissingProductAlert(true);
            return;
        }
        setStep('template');
        setTemplate(undefined);
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

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);
        const selected = catalog.find((item) => item.priceId === form.get('priceId'));
        if (!selected) {
            setLoading(false);
            showToast({ tone: 'warning', description: 'Selecione um produto e preço.' });
            return;
        }
        const name = String(form.get('name') ?? '').trim();
        const response = await fetch('/api/checkouts', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name,
                slug: slugify(String(form.get('slug') || name)),
                checkoutType: 'single_product',
                defaultCurrency: selected.currency,
                products: [
                    {
                        productId: selected.productId,
                        priceId: selected.priceId,
                        isDefault: true,
                        minimumQuantity: 1,
                        maximumQuantity: 1,
                    },
                ],
                document: blankCheckoutDocument,
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
        router.push(`/checkouts/${body.data.id}/builder`);
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
            <div className="glass-panel mb-4 flex items-center justify-between gap-4 rounded-[22px] px-5 py-4 sm:px-6">
                <div>
                    <h2 className="text-sm font-semibold tracking-[-0.02em]">
                        Experiências de checkout
                    </h2>
                    <p className="mt-1 text-[12px] text-muted">
                        Crie e edite suas páginas de conversão
                    </p>
                </div>
                <Button type="button" variant="primary" onClick={openCreate} className="h-10 px-4">
                    <Icon name="plus" className="size-3.5" /> Criar checkout
                </Button>
            </div>

            {checkouts.length === 0 ? (
                <section className="glass-panel rounded-[28px] px-5 py-14 text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft/75 text-brand">
                        <Icon name="layout" className="size-4" />
                    </span>
                    <h2 className="mt-3 text-sm font-semibold">Nenhum checkout criado</h2>
                    <p className="mt-1 text-[13px] text-muted">
                        Escolha como começar e monte sua primeira experiência.
                    </p>
                </section>
            ) : (
                <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {checkouts.map((checkout) => (
                        <CheckoutCard
                            key={checkout.id}
                            checkout={checkout}
                            onDelete={() => setDeleteTarget(checkout)}
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
                        <div className="theme-modal modal-surface glass-panel my-6 w-full max-w-3xl overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7">
                            <div className="flex items-start justify-between gap-5">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                                        Novo checkout ·{' '}
                                        {step === 'template' ? 'Etapa 1 de 2' : 'Etapa 2 de 2'}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                                        {step === 'template'
                                            ? 'Como você quer começar?'
                                            : 'Configure seu checkout'}
                                    </h2>
                                    <p className="mt-1.5 text-[13px] leading-5 text-muted">
                                        {step === 'template'
                                            ? 'Escolha um ponto de partida. Você poderá personalizar tudo no editor.'
                                            : 'Defina a oferta e os dados básicos antes de abrir o editor.'}
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
                                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                        {templates.map((item) => (
                                            <Button
                                                key={item.id}
                                                type="button"
                                                disabled={!item.available}
                                                data-selected={template === item.id}
                                                onClick={() => setTemplate(item.id)}
                                                className={`checkout-template-option relative min-h-36 rounded-[20px] border p-5 text-left transition ${template === item.id ? 'border-brand/40 bg-brand-soft/70 shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_8%,transparent)]' : 'border-border bg-[var(--control-bg)] hover:border-brand/24 hover:bg-surface-muted/55'} disabled:cursor-not-allowed disabled:opacity-55`}
                                            >
                                                <span
                                                    className={`grid size-10 place-items-center rounded-xl ${template === item.id ? 'bg-brand text-white' : 'bg-surface-muted/55 text-brand'}`}
                                                >
                                                    <Icon name={item.icon} className="size-4" />
                                                </span>
                                                <p className="mt-4 text-sm font-semibold">
                                                    {item.name}
                                                </p>
                                                <p className="mt-1 text-[12px] leading-5 text-muted">
                                                    {item.description}
                                                </p>
                                                {!item.available && (
                                                    <span className="absolute right-4 top-4 rounded-full border border-border bg-[var(--control-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                                                        Em breve
                                                    </span>
                                                )}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="mt-7 flex justify-end gap-2">
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
                            ) : (
                                <form onSubmit={submit}>
                                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                        <Field
                                            name="name"
                                            label="Nome do checkout"
                                            placeholder="Ex.: Checkout principal"
                                            required
                                        />
                                        <Field
                                            name="slug"
                                            label="Slug (opcional)"
                                            placeholder="checkout-principal"
                                        />
                                        <label className="text-[13px] font-semibold sm:col-span-2">
                                            Produto e preço
                                            <div className="mt-2">
                                                <CustomSelect
                                                    name="priceId"
                                                    required
                                                    placeholder="Selecione um produto e preço"
                                                    options={catalog.map((item) => ({
                                                        value: item.priceId,
                                                        label: `${item.productName} · ${item.priceName} · ${money(item.amountMinor, item.currency)}${item.pricingType === 'recurring' ? '/recorrente' : ''}`,
                                                    }))}
                                                />
                                            </div>
                                        </label>
                                    </div>
                                    <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={loading}
                                            onClick={() => setStep('template')}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            variant="primary"
                                            disabled={loading}
                                            className="px-6"
                                        >
                                            {loading ? 'Criando...' : 'Criar e abrir editor'}
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

function CheckoutCard({ checkout, onDelete }: { checkout: Checkout; onDelete: () => void }) {
    const previewUrl = `/checkouts/${checkout.id}/preview?embed=1&saved=${encodeURIComponent(checkout.updatedAt)}`;
    const publicUrl = checkoutPublicUrl(checkout.slug);
    return (
        <article className="checkout-list-card glass-panel group overflow-hidden rounded-[20px] p-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(66,57,128,.08)]">
            <Link
                href={`/checkouts/${checkout.id}/builder`}
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
                    <Button
                        type="button"
                        variant="icon"
                        onClick={onDelete}
                        aria-label={`Excluir ${checkout.name}`}
                        className="size-8 rounded-lg hover:border-danger/20 hover:bg-danger/10 hover:text-danger"
                    >
                        <Icon name="trash" className="size-3.5" />
                    </Button>
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
                        href={`/checkouts/${checkout.id}/builder`}
                        variant="ghost"
                        className="h-8 rounded-lg px-2.5"
                    >
                        Editar <Icon name="arrow-right" className="size-3.5" />
                    </ButtonLink>
                </div>
            </div>
        </article>
    );
}

function Field({
    label,
    ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="text-[13px] font-semibold">
            {label}
            <input
                {...input}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]"
            />
        </label>
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

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}
