'use client';

import { Button } from '@/components/ui/button';

import Image from 'next/image';
import {
    Children,
    type FormEvent,
    isValidElement,
    type ReactElement,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { MediaPicker } from '@/components/files/media-picker';
import { Icon, type IconName } from '@/components/ui/icon';
import { CustomSelect, type SelectOption } from '@/components/ui/custom-select';
import { showToast } from '@/components/ui/toast';
import { useEscapeClose } from '@/hooks/use-escape-close';
import type { MediaFile, Price, Product } from '@/lib/api/types';

type StatusFilter = 'all' | Product['status'];

export function ProductManager({
    products,
    prices,
    files,
    canWrite,
    initialQuery = '',
    focusId,
}: {
    products: Product[];
    prices: Record<string, Price[]>;
    files: MediaFile[];
    canWrite: boolean;
    initialQuery?: string;
    focusId?: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Product>();
    const [deleteTarget, setDeleteTarget] = useState<Product>();
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState<StatusFilter>('all');
    const [pageSize, setPageSize] = useState(10);
    const [productType, setProductType] = useState<Product['type']>('digital');
    const [plans, setPlans] = useState<PlanDraft[]>([]);
    const [statusChanging, setStatusChanging] = useState<string>();
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [selectedImageFileId, setSelectedImageFileId] = useState<string | null>();

    const visibleProducts = useMemo(() => {
        const term = normalize(query.trim());
        return products.filter((product) => {
            const matchesStatus = status === 'all' || product.status === status;
            const matchesQuery =
                !term ||
                normalize(
                    `${product.name} ${product.slug} ${product.shortDescription ?? ''} ${typeLabel(product.type)}`,
                ).includes(term);
            return matchesStatus && matchesQuery;
        });
    }, [products, query, status]);
    const [page, setPage] = useState(() => {
        if (!focusId) return 1;
        const index = visibleProducts.findIndex((product) => product.id === focusId);
        return index < 0 ? 1 : Math.floor(index / 10) + 1;
    });
    const pageCount = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const pagedProducts = visibleProducts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );
    const focusedIndex = focusId
        ? visibleProducts.findIndex((product) => product.id === focusId)
        : -1;
    const selectedImageFile = files.find((file) => file.id === selectedImageFileId);

    useEffect(() => {
        if (!focusId || focusedIndex < 0) return;
        window.requestAnimationFrame(() =>
            document
                .getElementById(`product-${focusId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        );
    }, [focusId, focusedIndex, page]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);
        const name = String(form.get('name') ?? '').trim();
        const shortDescription = String(form.get('shortDescription') ?? '').trim();
        const image = form.get('image');
        let imageFileId = selectedImageFileId;
        if (image instanceof File && image.size > 0) {
            const upload = await uploadProductImage(image);
            if (!upload.id) {
                setLoading(false);
                showToast({
                    tone: 'error',
                    description: upload.detail ?? 'Não foi possível enviar a imagem.',
                });
                return;
            }
            imageFileId = upload.id;
        }
        const productPayload = {
            type: form.get('type'),
            name,
            slug: slugify(String(form.get('slug') || name)),
            shortDescription: editing ? shortDescription : shortDescription || undefined,
            status: form.get('status'),
            deliveryMode: form.get('type') === 'digital' ? 'digital' : 'none',
            ...(editing
                ? { imageFileId: imageFileId ?? null }
                : imageFileId
                  ? { imageFileId }
                  : {}),
        };

        const activePlans = plans.filter((plan) => !plan.removed);
        const invalid = activePlans.find((plan) => !plan.name.trim() || plan.amountMinor <= 0);
        if (activePlans.length === 0 || invalid) {
            setLoading(false);
            showToast({
                tone: 'error',
                description:
                    activePlans.length === 0
                        ? 'Adicione pelo menos um plano.'
                        : 'Todo plano precisa de um nome e de um valor maior que zero.',
            });
            return;
        }

        let productId = editing?.id;
        if (editing) {
            const response = await fetch(`/api/products/${editing.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ ...productPayload, version: editing.version }),
            });
            const body = (await response.json()) as { detail?: string };
            if (!response.ok) {
                setLoading(false);
                showToast({
                    tone: 'error',
                    description: body.detail ?? 'Não foi possível atualizar o produto.',
                });
                return;
            }
        } else {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    ...productPayload,
                    inventoryMode: 'unlimited',
                    metadata: {},
                }),
            });
            const body = (await response.json()) as { data?: Product; detail?: string };
            if (!response.ok || !body.data) {
                setLoading(false);
                showToast({
                    tone: 'error',
                    description: body.detail ?? 'Não foi possível criar o produto.',
                });
                return;
            }
            productId = body.data.id;
        }

        // Planos: em sequência, para cada falha virar uma mensagem clara.
        const failures: string[] = [];
        for (const plan of plans) {
            const label = plan.name.trim() || 'Plano sem nome';
            const result = await savePlan(productId as string, plan);
            if (result) failures.push(`${label}: ${result}`);
        }
        setLoading(false);
        router.refresh();
        // Fecha mesmo com falha: salvar de novo duplicaria o que já foi criado.
        setOpen(false);
        setEditing(undefined);
        if (failures.length > 0) {
            showToast({
                tone: 'warning',
                title: editing
                    ? 'Produto salvo, mas alguns planos falharam'
                    : 'Produto criado, mas há planos pendentes',
                description: failures.join(' · '),
            });
            return;
        }
        showToast({
            tone: 'success',
            title: editing ? 'Produto atualizado' : 'Produto criado',
            description: editing
                ? 'As alterações do produto e dos planos foram salvas.'
                : `O produto foi adicionado ao catálogo com ${String(activePlans.length)} ${activePlans.length === 1 ? 'plano' : 'planos'}.`,
        });
    }

    async function remove(product: Product) {
        setDeleting(true);
        const response = await fetch(`/api/products/${product.id}`, {
            method: 'DELETE',
        });
        setDeleting(false);
        if (!response.ok) {
            const body = (await response.json()) as { detail?: string };
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível excluir o produto.',
            });
            setDeleteTarget(undefined);
            return;
        }
        setDeleteTarget(undefined);
        showToast({
            tone: 'success',
            title: 'Produto excluído',
            description: 'O produto foi removido do catálogo.',
        });
        router.refresh();
    }

    async function changeStatus(product: Product, status: 'active' | 'inactive') {
        setStatusChanging(product.id);
        const response = await fetch(`/api/products/${product.id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status, version: product.version }),
        });
        setStatusChanging(undefined);
        if (!response.ok) {
            const body = (await response.json()) as { detail?: string };
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível alterar o status do produto.',
            });
            return;
        }
        showToast({
            tone: 'success',
            title: status === 'active' ? 'Produto ativado' : 'Produto desativado',
            description: 'O status do produto foi atualizado.',
        });
        router.refresh();
    }

    function openCreate() {
        setEditing(undefined);
        setProductType('digital');
        setPlans([newPlan('digital')]);
        setSelectedImageFileId(null);
        setOpen(true);
    }

    function openEdit(product: Product) {
        setEditing(product);
        setProductType(product.type);
        setPlans(
            (prices[product.id] ?? [])
                .filter((price) => price.status !== 'archived')
                .map(planFromPrice),
        );
        setSelectedImageFileId(product.imageFileId);
        setOpen(true);
    }

    function updatePlan(key: string, change: Partial<PlanDraft>) {
        setPlans((current) =>
            current.map((plan) => (plan.key === key ? withAutoName({ ...plan, ...change }) : plan)),
        );
    }

    function closeForm() {
        if (loading) return;
        setOpen(false);
        setMediaPickerOpen(false);
        setEditing(undefined);
    }

    useEscapeClose((open || Boolean(deleteTarget)) && !mediaPickerOpen, () => {
        if (deleteTarget && !deleting) setDeleteTarget(undefined);
        else closeForm();
    });

    return (
        <>
            <section
                data-tour="product-controls"
                className="glass-panel mb-4 flex flex-col gap-3 rounded-[22px] p-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="product-search filter-control ui-control-frame flex h-11 min-w-0 flex-1 items-center gap-2 px-3.5 sm:max-w-[310px]">
                        <Icon name="search" className="size-3.5 shrink-0 text-muted" />
                        <input
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Buscar produto..."
                            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
                        />
                        {query && (
                            <Button
                                type="button"
                                aria-label="Limpar busca"
                                onClick={() => {
                                    setQuery('');
                                    setPage(1);
                                }}
                                className="text-muted transition hover:text-foreground"
                            >
                                <Icon name="close" className="size-3" />
                            </Button>
                        )}
                    </label>

                    <div className="product-filter-tabs ui-tabs">
                        {(
                            [
                                ['all', 'Todos'],
                                ['active', 'Ativos'],
                                ['draft', 'Rascunhos'],
                                ['inactive', 'Inativos'],
                            ] as const
                        ).map(([value, label]) => (
                            <Button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setStatus(value);
                                    setPage(1);
                                }}
                                data-active={status === value}
                                aria-pressed={status === value}
                                className="ui-tab px-3 py-1.5 text-[12px] font-semibold"
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                    <div className="w-40">
                        <CustomSelect
                            name="products-page-size"
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPage(1);
                            }}
                            options={[10, 20, 50, 100].map((value) => ({
                                value: String(value),
                                label: `${value} por página`,
                            }))}
                        />
                    </div>
                </div>

                {canWrite && (
                    <Button
                        type="button"
                        variant="primary"
                        data-tour="product-create"
                        onClick={openCreate}
                        className="h-10 shrink-0 px-4"
                    >
                        <Icon name="plus" className="size-3.5" />
                        Criar produto
                    </Button>
                )}
            </section>

            <div data-tour="products-list">
                {products.length === 0 ? (
                    <EmptyProducts onCreate={canWrite ? openCreate : undefined} />
                ) : (
                    <ProductTable
                        products={pagedProducts}
                        focusId={focusId}
                        prices={prices}
                        hasFilters={Boolean(query) || status !== 'all'}
                        onClear={() => {
                            setQuery('');
                            setStatus('all');
                            setPage(1);
                        }}
                        onEdit={openEdit}
                        onRemove={setDeleteTarget}
                        onStatusChange={changeStatus}
                        statusChanging={statusChanging}
                        canWrite={canWrite}
                        resultCount={visibleProducts.length}
                        currentPage={currentPage}
                        pageCount={pageCount}
                        onPreviousPage={() => setPage(currentPage - 1)}
                        onNextPage={() => setPage(currentPage + 1)}
                    />
                )}
            </div>

            {open &&
                createPortal(
                    <div
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) closeForm();
                        }}
                        className="fixed inset-0 z-[100] grid place-items-center bg-black/20 p-4 backdrop-blur-sm"
                    >
                        {/* Altura fixa: o cabeçalho e o rodapé ficam parados e só o conteúdo rola. */}
                        <form
                            onSubmit={submit}
                            className="product-modal theme-modal modal-surface glass-panel flex h-[min(760px,calc(100dvh-32px))] w-full max-w-5xl flex-col overflow-hidden rounded-[28px]"
                        >
                            <header className="flex shrink-0 items-start justify-between gap-5 border-b border-border px-5 py-5 sm:px-7">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                                        Catálogo
                                    </p>
                                    <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em]">
                                        {editing ? 'Editar produto' : 'Novo produto'}
                                    </h2>
                                    <p className="mt-1 text-[13px] leading-5 text-muted">
                                        Dados do produto à esquerda; os planos que o cliente pode
                                        escolher à direita.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="icon"
                                    aria-label="Fechar"
                                    onClick={closeForm}
                                    className="size-9"
                                >
                                    <Icon name="close" className="size-4" />
                                </Button>
                            </header>

                            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:overflow-hidden">
                                <section className="space-y-4 px-5 py-6 sm:px-7 lg:overflow-y-auto">
                                    <h3 className="text-[14px] font-semibold">Produto</h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            name="name"
                                            label="Nome"
                                            placeholder="Ex.: Curso de Marketing"
                                            defaultValue={editing?.name}
                                            required
                                        />
                                        <Field
                                            name="slug"
                                            label="Slug (opcional)"
                                            placeholder="curso-de-marketing"
                                            defaultValue={editing?.slug}
                                        />
                                        <SelectField
                                            name="type"
                                            label="Tipo"
                                            value={productType}
                                            onChange={(event) => {
                                                const type = event.target.value as Product['type'];
                                                setProductType(type);
                                                // Plano novo ainda intocado acompanha o tipo.
                                                setPlans((current) =>
                                                    current.map((plan) =>
                                                        !plan.id && !plan.touched
                                                            ? withAutoName({
                                                                  ...plan,
                                                                  pricingType: recurringByDefault(
                                                                      type,
                                                                  )
                                                                      ? 'recurring'
                                                                      : 'one_time',
                                                              })
                                                            : plan,
                                                    ),
                                                );
                                            }}
                                        >
                                            <option value="digital">Digital</option>
                                            <option value="service">Serviço</option>
                                            <option value="saas">SaaS</option>
                                        </SelectField>
                                        <SelectField
                                            name="status"
                                            label={editing ? 'Status' : 'Status inicial'}
                                            defaultValue={editing?.status ?? 'draft'}
                                        >
                                            <option value="active">Ativo</option>
                                            <option value="draft">Rascunho</option>
                                            <option value="inactive">Inativo</option>
                                        </SelectField>
                                    </div>
                                    <label className="block text-[13px] font-semibold">
                                        Descrição curta
                                        <textarea
                                            name="shortDescription"
                                            defaultValue={editing?.shortDescription ?? ''}
                                            placeholder="Explique brevemente o que o cliente recebe."
                                            className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-border bg-[var(--control-bg)] p-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)]"
                                        />
                                    </label>
                                    <div className="text-[13px] font-semibold">
                                        Imagem do produto
                                        <div className="product-image-field mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-[var(--control-bg)] p-3 transition focus-within:border-brand/70">
                                            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft text-brand">
                                                {selectedImageFile ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={`/api/files/${encodeURIComponent(selectedImageFile.id)}/content`}
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    <Icon name="image" className="size-4" />
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-semibold">
                                                    {selectedImageFile?.originalName ??
                                                        'Nenhuma imagem'}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-normal text-muted">
                                                    JPG, PNG ou WebP de até 5 MB.
                                                </span>
                                            </span>
                                            <label className="ui-button inline-flex h-9 cursor-pointer items-center rounded-xl border border-border bg-[var(--control-bg)] px-3 text-[12px] font-semibold text-muted hover:bg-surface-muted hover:text-foreground">
                                                Enviar
                                                <input
                                                    name="image"
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    className="sr-only"
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="!h-9 px-3 text-[12px]"
                                                onClick={() => setMediaPickerOpen(true)}
                                            >
                                                Biblioteca
                                            </Button>
                                            {selectedImageFileId && (
                                                <Button
                                                    type="button"
                                                    variant="icon"
                                                    className="size-9"
                                                    onClick={() => setSelectedImageFileId(null)}
                                                    aria-label="Remover imagem do produto"
                                                >
                                                    <Icon name="close" className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="flex min-h-0 flex-col border-t border-border bg-surface-muted/40 lg:border-l lg:border-t-0">
                                    <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-6 sm:px-7">
                                        <div>
                                            <h3 className="text-[14px] font-semibold">
                                                Planos e preços
                                            </h3>
                                            <p className="mt-0.5 text-[12px] text-muted">
                                                {recurringByDefault(productType)
                                                    ? 'Ex.: Mensal e Anual, ou Básico e Pro.'
                                                    : 'Um preço único ou opções do mesmo produto.'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="!h-9 shrink-0 px-3 text-[12px]"
                                            onClick={() =>
                                                setPlans((current) => [
                                                    ...current,
                                                    newPlan(productType),
                                                ])
                                            }
                                        >
                                            <Icon name="plus" className="size-3.5" />
                                            Adicionar plano
                                        </Button>
                                    </div>
                                    <div className="min-h-0 flex-1 space-y-3 px-5 pb-6 sm:px-7 lg:overflow-y-auto">
                                        {plans.map((plan, index) =>
                                            plan.removed ? null : (
                                                <PlanCard
                                                    key={plan.key}
                                                    plan={plan}
                                                    index={index}
                                                    removable={
                                                        plans.filter((item) => !item.removed)
                                                            .length > 1
                                                    }
                                                    onChange={(change) =>
                                                        updatePlan(plan.key, change)
                                                    }
                                                    onRemove={() =>
                                                        setPlans((current) =>
                                                            plan.id
                                                                ? current.map((item) =>
                                                                      item.key === plan.key
                                                                          ? {
                                                                                ...item,
                                                                                removed: true,
                                                                            }
                                                                          : item,
                                                                  )
                                                                : current.filter(
                                                                      (item) =>
                                                                          item.key !== plan.key,
                                                                  ),
                                                        )
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                </section>
                            </div>

                            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                <p className="text-[12px] text-muted">
                                    {plans.filter((plan) => !plan.removed).length}{' '}
                                    {plans.filter((plan) => !plan.removed).length === 1
                                        ? 'plano'
                                        : 'planos'}
                                </p>
                                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                    <Button type="button" variant="secondary" onClick={closeForm}>
                                        Cancelar
                                    </Button>
                                    <Button variant="primary" disabled={loading} className="px-6">
                                        {loading
                                            ? editing
                                                ? 'Salvando...'
                                                : 'Criando...'
                                            : editing
                                              ? 'Salvar alterações'
                                              : 'Criar produto'}
                                    </Button>
                                </div>
                            </footer>
                        </form>
                    </div>,
                    document.body,
                )}

            {deleteTarget &&
                createPortal(
                    <DeleteProductModal
                        product={deleteTarget}
                        loading={deleting}
                        onCancel={() => !deleting && setDeleteTarget(undefined)}
                        onConfirm={() => remove(deleteTarget)}
                    />,
                    document.body,
                )}
            <MediaPicker
                open={mediaPickerOpen}
                files={files}
                value={selectedImageFileId}
                onSelect={setSelectedImageFileId}
                onClose={() => setMediaPickerOpen(false)}
            />
        </>
    );
}

function ProductTable({
    products,
    prices,
    focusId,
    hasFilters,
    onClear,
    onEdit,
    onRemove,
    onStatusChange,
    statusChanging,
    canWrite,
    resultCount,
    currentPage,
    pageCount,
    onPreviousPage,
    onNextPage,
}: {
    products: Product[];
    prices: Record<string, Price[]>;
    focusId?: string;
    hasFilters: boolean;
    onClear: () => void;
    onEdit: (product: Product) => void;
    onRemove: (product: Product) => void;
    onStatusChange: (product: Product, status: 'active' | 'inactive') => void;
    statusChanging?: string;
    canWrite: boolean;
    resultCount: number;
    currentPage: number;
    pageCount: number;
    onPreviousPage: () => void;
    onNextPage: () => void;
}) {
    return (
        <section className="product-table glass-panel overflow-hidden rounded-[28px]">
            <div className="flex items-center justify-between gap-4 border-b border-white/65 px-5 py-5 sm:px-6">
                <div>
                    <h2 className="text-sm font-semibold tracking-[-0.02em]">
                        Catálogo de produtos
                    </h2>
                    <p className="mt-1 text-[12px] text-muted">
                        {products.length}{' '}
                        {products.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    </p>
                </div>
                <span className="hidden rounded-full border border-white/80 bg-white/42 px-3 py-1.5 text-[12px] font-medium text-muted sm:inline-flex">
                    Valores em BRL
                </span>
            </div>

            {products.length === 0 ? (
                <div className="px-5 py-14 text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft/75 text-brand">
                        <Icon name="search" className="size-4" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">Nenhum resultado</h3>
                    <p className="mt-1 text-[13px] text-muted">
                        Ajuste a busca ou os filtros utilizados.
                    </p>
                    {hasFilters && (
                        <Button
                            type="button"
                            onClick={onClear}
                            className="mt-4 text-[13px] font-semibold text-brand-strong hover:underline"
                        >
                            Limpar filtros
                        </Button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left">
                        <thead className="bg-white/24 text-[12px] uppercase tracking-[0.09em] text-muted">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold">Produto</th>
                                <th className="px-5 py-3.5 font-semibold">Tipo</th>
                                <th className="px-5 py-3.5 font-semibold">Preço principal</th>
                                <th className="px-5 py-3.5 font-semibold">Cobrança</th>
                                <th className="px-5 py-3.5 font-semibold">Status</th>
                                <th className="px-5 py-3.5 font-semibold">Atualização</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/65">
                            {products.map((product) => {
                                const productPrices = prices[product.id] ?? [];
                                const primaryPrice =
                                    productPrices.find((price) => price.status === 'active') ??
                                    productPrices[0];
                                return (
                                    <tr
                                        id={`product-${product.id}`}
                                        key={product.id}
                                        className={`group text-[13px] transition hover:bg-white/34 ${focusId === product.id ? 'bg-brand-soft/70 ring-1 ring-inset ring-brand/30' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="product-table-icon relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[13px] border border-white/80 bg-gradient-to-br from-white/75 to-brand-soft/65 text-brand">
                                                    {product.imageFileId ? (
                                                        <Image
                                                            src={`/api/files/${encodeURIComponent(product.imageFileId)}/content`}
                                                            alt={product.name}
                                                            fill
                                                            unoptimized
                                                            sizes="40px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Icon
                                                            name={productIcon(product.type)}
                                                            className="size-4"
                                                        />
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="max-w-[260px] truncate font-semibold text-foreground">
                                                        {product.name}
                                                    </p>
                                                    <p className="mt-1 max-w-[260px] truncate text-[12px] text-muted">
                                                        {product.shortDescription ||
                                                            `/${product.slug}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <TypeBadge type={product.type} />
                                        </td>
                                        <td className="px-5 py-4">
                                            {primaryPrice ? (
                                                <div>
                                                    <p className="font-semibold tabular-nums text-foreground">
                                                        {money(
                                                            primaryPrice.amountMinor,
                                                            primaryPrice.currency,
                                                        )}
                                                    </p>
                                                    {productPrices.length > 1 && (
                                                        <p className="mt-1 text-[12px] text-muted">
                                                            +{productPrices.length - 1}{' '}
                                                            {productPrices.length === 2
                                                                ? 'preço'
                                                                : 'preços'}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[12px] font-medium text-warning">
                                                    Não configurado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-muted">
                                            {primaryPrice ? billingLabel(primaryPrice) : '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge status={product.status} />
                                        </td>
                                        <td className="px-5 py-4 text-[12px] text-muted">
                                            <time dateTime={product.updatedAt}>
                                                {shortDate(product.updatedAt)}
                                            </time>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canWrite && (
                                                <div className="inline-flex items-center gap-1 opacity-65 transition group-hover:opacity-100">
                                                    <ActionButton
                                                        label="Editar produto"
                                                        icon="edit"
                                                        onClick={() => onEdit(product)}
                                                    />
                                                    <ActionButton
                                                        label={
                                                            product.status === 'active'
                                                                ? 'Desativar produto'
                                                                : 'Ativar produto'
                                                        }
                                                        icon={
                                                            product.status === 'active'
                                                                ? 'close'
                                                                : 'check'
                                                        }
                                                        disabled={statusChanging === product.id}
                                                        onClick={() =>
                                                            onStatusChange(
                                                                product,
                                                                product.status === 'active'
                                                                    ? 'inactive'
                                                                    : 'active',
                                                            )
                                                        }
                                                    />
                                                    <ActionButton
                                                        label="Excluir produto"
                                                        icon="trash"
                                                        danger
                                                        onClick={() => onRemove(product)}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="flex items-center justify-between border-t border-white/65 px-5 py-4 text-xs text-muted sm:px-6">
                <span>
                    {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="icon"
                        aria-label="Página anterior"
                        disabled={currentPage === 1}
                        onClick={onPreviousPage}
                    >
                        <Icon name="arrow-right" className="size-3.5 rotate-180" />
                    </Button>
                    <span>
                        Página {currentPage} de {pageCount}
                    </span>
                    <Button
                        variant="icon"
                        aria-label="Próxima página"
                        disabled={currentPage >= pageCount}
                        onClick={onNextPage}
                    >
                        <Icon name="arrow-right" className="size-3.5" />
                    </Button>
                </div>
            </div>
        </section>
    );
}

function ActionButton({
    label,
    icon,
    danger = false,
    disabled = false,
    onClick,
}: {
    label: string;
    icon: IconName;
    danger?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <span className="group/action relative inline-flex">
            <Button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                className={`inline-grid size-8 place-items-center rounded-xl transition ${danger ? 'text-muted hover:bg-[#fff0f2] hover:text-danger' : 'text-muted hover:bg-brand-soft/70 hover:text-brand-strong'}`}
            >
                <Icon name={icon} className="size-3.5" />
            </Button>
            <span
                role="tooltip"
                className="product-action-tooltip pointer-events-none absolute bottom-[calc(100%+7px)] right-0 z-20 whitespace-nowrap rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 backdrop-blur-xl transition duration-200 group-hover/action:-translate-y-0.5 group-hover/action:opacity-100 group-focus-within/action:-translate-y-0.5 group-focus-within/action:opacity-100"
            >
                {label}
                <span className="product-action-tooltip-arrow absolute -bottom-1 right-3 size-2 rotate-45" />
            </span>
        </span>
    );
}

function DeleteProductModal({
    product,
    loading,
    onCancel,
    onConfirm,
}: {
    product: Product;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
            className="fixed inset-0 z-[110] grid place-items-center bg-black/25 p-4 backdrop-blur-sm"
        >
            <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-product-title"
                aria-describedby="delete-product-description"
                className="theme-modal modal-surface glass-panel w-full max-w-md rounded-[26px] p-6 shadow-[0_32px_100px_rgba(20,20,24,.24)]"
            >
                <span className="grid size-11 place-items-center rounded-2xl border border-danger/20 bg-danger/10 text-danger shadow-sm">
                    <Icon name="trash" className="size-4.5" />
                </span>
                <h2
                    id="delete-product-title"
                    className="mt-5 text-xl font-semibold tracking-[-0.035em]"
                >
                    Excluir produto?
                </h2>
                <p
                    id="delete-product-description"
                    className="mt-2 text-[13px] leading-5 text-muted"
                >
                    <strong className="font-semibold text-foreground">{product.name}</strong> será
                    removido permanentemente do catálogo. Esta ação não pode ser desfeita.
                </p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        disabled={loading}
                        onClick={onConfirm}
                        className="h-11 rounded-xl px-5"
                    >
                        {loading ? 'Excluindo...' : 'Excluir produto'}
                    </Button>
                </div>
            </section>
        </div>
    );
}

function EmptyProducts({ onCreate }: { onCreate?: () => void }) {
    return (
        <section className="glass-panel rounded-[28px] px-5 py-16 text-center sm:py-20">
            <span className="product-empty-icon mx-auto grid size-12 place-items-center rounded-2xl border border-white/85 bg-brand-soft/70 text-brand">
                <Icon name="box" className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold tracking-[-0.025em]">
                Seu catálogo começa aqui
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-muted">
                Crie o primeiro produto e configure seu preço para começar a vender.
            </p>
            {onCreate && (
                <Button type="button" variant="primary" onClick={onCreate} className="mt-5">
                    <Icon name="plus" className="size-3.5" />
                    Criar primeiro produto
                </Button>
            )}
        </section>
    );
}

function Field({
    label,
    className,
    ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="text-[13px] font-semibold">
            {label}
            <input
                {...input}
                className={`mt-2 h-11 w-full rounded-xl border border-border bg-[var(--control-bg)] px-3.5 font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_16%,transparent)] ${className ?? ''}`}
            />
        </label>
    );
}

function SelectField({
    label,
    children,
    ...select
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    children: React.ReactNode;
}) {
    const options = Children.toArray(children)
        .filter(isValidElement)
        .map((child) => {
            const option = child as ReactElement<{
                value?: string;
                children?: React.ReactNode;
                disabled?: boolean;
                'data-badge'?: string;
            }>;
            return {
                value: String(option.props.value ?? ''),
                label: String(option.props.children ?? ''),
                disabled: option.props.disabled,
                badge: option.props['data-badge'],
            };
        }) satisfies SelectOption[];
    return (
        <label className="text-[13px] font-semibold">
            {label}
            <div className="mt-2">
                <CustomSelect
                    name={select.name ?? ''}
                    value={select.value === undefined ? undefined : String(select.value)}
                    defaultValue={
                        select.defaultValue === undefined ? undefined : String(select.defaultValue)
                    }
                    options={options}
                    onValueChange={(value) =>
                        select.onChange?.({
                            target: { value },
                        } as React.ChangeEvent<HTMLSelectElement>)
                    }
                />
            </div>
        </label>
    );
}

type PlanDraft = {
    key: string;
    /** Preço já salvo: só nome e valor podem mudar (a API não troca cobrança/periodicidade). */
    id?: string;
    version?: number;
    name: string;
    pricingType: 'one_time' | 'recurring';
    amountMinor: number;
    interval: 'week' | 'month' | 'year';
    /** O nome foi escrito à mão: deixa de acompanhar cobrança e periodicidade. */
    touched?: boolean;
    removed?: boolean;
    saved?: { name: string; amountMinor: number };
};

function recurringByDefault(type: Product['type']) {
    return type === 'saas' || type === 'service';
}

function autoPlanName(plan: Pick<PlanDraft, 'pricingType' | 'interval'>) {
    if (plan.pricingType === 'one_time') return 'Pagamento único';
    return plan.interval === 'year'
        ? 'Plano anual'
        : plan.interval === 'week'
          ? 'Plano semanal'
          : 'Plano mensal';
}

function withAutoName(plan: PlanDraft): PlanDraft {
    return plan.touched || plan.id ? plan : { ...plan, name: autoPlanName(plan) };
}

function newPlan(type: Product['type']): PlanDraft {
    return withAutoName({
        key: crypto.randomUUID(),
        name: '',
        pricingType: recurringByDefault(type) ? 'recurring' : 'one_time',
        amountMinor: 0,
        interval: 'month',
    });
}

function planFromPrice(price: Price): PlanDraft {
    return {
        key: price.id,
        id: price.id,
        version: price.version,
        name: price.name,
        pricingType: price.pricingType === 'recurring' ? 'recurring' : 'one_time',
        amountMinor: price.amountMinor,
        interval:
            price.recurringInterval === 'year' || price.recurringInterval === 'week'
                ? price.recurringInterval
                : 'month',
        saved: { name: price.name, amountMinor: price.amountMinor },
    };
}

/** Cria, atualiza ou remove um plano. Devolve a mensagem de erro, ou nada se deu certo. */
async function savePlan(productId: string, plan: PlanDraft): Promise<string | undefined> {
    const json = { 'content-type': 'application/json' };
    let response: Response | undefined;
    if (plan.id && plan.removed) {
        response = await fetch(`/api/prices/${plan.id}`, { method: 'DELETE' });
    } else if (plan.id) {
        if (plan.saved?.name === plan.name.trim() && plan.saved.amountMinor === plan.amountMinor)
            return undefined;
        response = await fetch(`/api/prices/${plan.id}`, {
            method: 'PATCH',
            headers: json,
            body: JSON.stringify({
                name: plan.name.trim(),
                amountMinor: plan.amountMinor,
                version: plan.version,
            }),
        });
    } else if (!plan.removed) {
        const recurring = plan.pricingType === 'recurring';
        response = await fetch(`/api/products/${productId}/prices`, {
            method: 'POST',
            headers: json,
            body: JSON.stringify({
                name: plan.name.trim(),
                pricingType: plan.pricingType,
                amountMinor: plan.amountMinor,
                currency: 'BRL',
                ...(recurring
                    ? {
                          recurringInterval: plan.interval,
                          recurringIntervalCount: 1,
                          billingMode: 'gateway_managed',
                      }
                    : {}),
                status: 'active',
                allowQuantity: false,
                minimumQuantity: 1,
                maximumQuantity: 1,
                metadata: {},
            }),
        });
    }
    if (!response || response.ok) return undefined;
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    return body.detail ?? 'não foi possível salvar';
}

function PlanCard({
    plan,
    index,
    removable,
    onChange,
    onRemove,
}: {
    plan: PlanDraft;
    index: number;
    removable: boolean;
    onChange(change: Partial<PlanDraft>): void;
    onRemove(): void;
}) {
    const saved = Boolean(plan.id);
    return (
        <article className="rounded-2xl border border-border bg-[var(--control-bg)] p-4">
            <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1 text-[12px] font-semibold">
                    Nome do plano
                    <input
                        value={plan.name}
                        placeholder={`Plano ${String(index + 1)}`}
                        onChange={(event) => onChange({ name: event.target.value, touched: true })}
                        className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface px-3 text-[13px] font-normal outline-none transition placeholder:text-muted focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_16%,transparent)]"
                    />
                </label>
                {removable && (
                    <Button
                        type="button"
                        variant="icon"
                        className="size-10 shrink-0"
                        aria-label={`Remover ${plan.name || 'plano'}`}
                        onClick={onRemove}
                    >
                        <Icon name="trash" className="size-3.5" />
                    </Button>
                )}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="text-[12px] font-semibold">
                    Cobrança
                    <div className="mt-1.5">
                        <CustomSelect
                            name={`pricing_${plan.key}`}
                            value={plan.pricingType}
                            disabled={saved}
                            options={[
                                { value: 'one_time', label: 'Pagamento único' },
                                { value: 'recurring', label: 'Recorrente' },
                            ]}
                            onValueChange={(value) =>
                                onChange({ pricingType: value as PlanDraft['pricingType'] })
                            }
                        />
                    </div>
                </label>
                {plan.pricingType === 'recurring' ? (
                    <label className="text-[12px] font-semibold">
                        Periodicidade
                        <div className="mt-1.5">
                            <CustomSelect
                                name={`interval_${plan.key}`}
                                value={plan.interval}
                                disabled={saved}
                                options={[
                                    { value: 'month', label: 'Mensal' },
                                    { value: 'year', label: 'Anual' },
                                    { value: 'week', label: 'Semanal' },
                                ]}
                                onValueChange={(value) =>
                                    onChange({ interval: value as PlanDraft['interval'] })
                                }
                            />
                        </div>
                    </label>
                ) : (
                    <span className="hidden sm:block" />
                )}
                <MoneyInput
                    label="Valor"
                    value={plan.amountMinor}
                    onChange={(amountMinor) => onChange({ amountMinor })}
                />
            </div>
            {saved && (
                <p className="mt-2.5 text-[11px] text-muted">
                    Cobrança e periodicidade não mudam depois de criadas. Para outra, adicione um
                    plano novo.
                </p>
            )}
        </article>
    );
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
                    className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-[13px] font-normal tabular-nums outline-none transition focus:border-brand/70 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_16%,transparent)]"
                />
            </div>
        </label>
    );
}

async function uploadProductImage(file: File): Promise<{ id?: string; detail?: string }> {
    if (file.size > 5_000_000) return { detail: 'A imagem deve ter no máximo 5 MB.' };
    const contentBase64 = await fileToBase64(file);
    const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ originalName: file.name, contentType: file.type, contentBase64 }),
    });
    const body = (await response.json()) as { data?: { id: string }; detail?: string };
    return response.ok && body.data ? { id: body.data.id } : { detail: body.detail };
}

function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function TypeBadge({ type }: { type: Product['type'] }) {
    return (
        <span className="product-type-badge inline-flex rounded-full border border-white/80 bg-white/48 px-2.5 py-1 text-[12px] font-medium text-muted">
            {typeLabel(type)}
        </span>
    );
}

function StatusBadge({ status }: { status: Product['status'] }) {
    const style =
        status === 'active'
            ? 'bg-[#e7f7f0] text-success'
            : status === 'draft'
              ? 'bg-brand-soft text-brand-strong'
              : 'bg-white/55 text-muted';
    return (
        <span
            className={`product-status-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${style}`}
        >
            <span className="size-1.5 rounded-full bg-current opacity-65" />
            {statusLabel(status)}
        </span>
    );
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function slugify(value: string) {
    return normalize(value)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function money(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value / 100);
}

function typeLabel(type: Product['type']) {
    return {
        digital: 'Digital',
        physical: 'Físico',
        service: 'Serviço',
        saas: 'SaaS',
    }[type];
}

function productIcon(type: Product['type']): 'box' | 'bolt' | 'code' | 'tag' {
    if (type === 'digital') return 'bolt';
    if (type === 'physical') return 'box';
    if (type === 'service') return 'tag';
    return 'code';
}

function statusLabel(status: Product['status']) {
    return { draft: 'Rascunho', active: 'Ativo', inactive: 'Inativo' }[status];
}

function intervalLabel(interval: string | null) {
    return (
        { day: 'Diária', week: 'Semanal', month: 'Mensal', year: 'Anual' }[interval ?? ''] ??
        'Recorrente'
    );
}

function billingLabel(price: Price) {
    return price.pricingType === 'recurring'
        ? intervalLabel(price.recurringInterval)
        : price.pricingType === 'one_time'
          ? 'Pagamento único'
          : price.pricingType === 'free'
            ? 'Grátis'
            : 'Personalizado';
}

function shortDate(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}
