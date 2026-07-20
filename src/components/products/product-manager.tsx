"use client";

import { type FormEvent, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Icon, type IconName } from "@/components/ui/icon";
import type { Price, Product } from "@/lib/api/types";

type StatusFilter = "all" | Product["status"];

export function ProductManager({
  products,
  prices,
}: {
  products: Product[];
  prices: Record<string, Price[]>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product>();
  const [deleteTarget, setDeleteTarget] = useState<Product>();
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pricingType, setPricingType] = useState("one_time");

  const visibleProducts = useMemo(() => {
    const term = normalize(query.trim());
    return products.filter((product) => {
      const matchesStatus = status === "all" || product.status === status;
      const matchesQuery =
        !term ||
        normalize(
          `${product.name} ${product.slug} ${product.shortDescription ?? ""} ${typeLabel(product.type)}`,
        ).includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [products, query, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const shortDescription = String(form.get("shortDescription") ?? "").trim();
    const productPayload = {
      type: form.get("type"),
      name,
      slug: slugify(String(form.get("slug") || name)),
      shortDescription: editing
        ? shortDescription
        : shortDescription || undefined,
      status: form.get("status"),
      deliveryMode: form.get("type") === "digital" ? "digital" : "none",
    };

    if (editing) {
      const response = await fetch(`/api/products/${editing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...productPayload, version: editing.version }),
      });
      const body = (await response.json()) as { detail?: string };
      setLoading(false);
      if (!response.ok) {
        setError(body.detail ?? "Falha ao atualizar produto.");
        return;
      }
      setOpen(false);
      setEditing(undefined);
      router.refresh();
      return;
    }

    const productResponse = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...productPayload,
        inventoryMode: "unlimited",
        metadata: {},
      }),
    });
    const productBody = (await productResponse.json()) as {
      data?: Product;
      detail?: string;
    };
    if (!productResponse.ok || !productBody.data) {
      setLoading(false);
      return setError(productBody.detail ?? "Falha ao criar produto.");
    }

    const recurring = pricingType === "recurring";
    const priceResponse = await fetch(
      `/api/products/${productBody.data.id}/prices`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: recurring ? "Plano principal" : "Preço principal",
          pricingType,
          amountMinor: Math.round(Number(form.get("amount")) * 100),
          currency: "BRL",
          ...(recurring
            ? {
                recurringInterval: form.get("interval"),
                recurringIntervalCount: 1,
                billingMode: "gateway_managed",
              }
            : {}),
          status: "active",
          allowQuantity: false,
          minimumQuantity: 1,
          maximumQuantity: 1,
          metadata: {},
        }),
      },
    );
    const priceBody = (await priceResponse.json()) as { detail?: string };
    setLoading(false);
    if (!priceResponse.ok)
      return setError(
        priceBody.detail ??
          "Produto criado sem preço. Recarregue a página para continuar.",
      );
    setOpen(false);
    setPricingType("one_time");
    router.refresh();
  }

  async function remove(product: Product) {
    setDeleting(true);
    setError(undefined);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!response.ok) {
      const body = (await response.json()) as { detail?: string };
      setError(body.detail ?? "Falha ao excluir.");
      setDeleteTarget(undefined);
      return;
    }
    setDeleteTarget(undefined);
    router.refresh();
  }

  function openCreate() {
    setError(undefined);
    setEditing(undefined);
    setPricingType("one_time");
    setOpen(true);
  }

  function openEdit(product: Product) {
    setError(undefined);
    setEditing(product);
    setOpen(true);
  }

  function closeForm() {
    if (loading) return;
    setOpen(false);
    setEditing(undefined);
    setError(undefined);
  }

  return (
    <>
      <section className="glass-panel-soft mb-4 flex flex-col gap-3 rounded-[22px] p-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/80 bg-white/42 px-3 sm:max-w-[310px]">
            <Icon name="search" className="size-3.5 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar produto..."
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setQuery("")}
                className="text-muted transition hover:text-foreground"
              >
                <Icon name="close" className="size-3" />
              </button>
            )}
          </label>

          <div className="flex overflow-x-auto rounded-xl border border-white/75 bg-white/32 p-1 [scrollbar-width:none]">
            {(
              [
                ["all", "Todos"],
                ["active", "Ativos"],
                ["draft", "Rascunhos"],
                ["inactive", "Inativos"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${status === value ? "bg-white/80 text-brand-strong shadow-sm" : "text-muted hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="glass-interactive group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7665f5] to-[#5a42e3] px-4 text-xs font-semibold text-white shadow-[0_10px_26px_rgba(91,69,223,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(91,69,223,.27)]"
        >
          <Icon name="plus" className="size-3.5" />
          Criar produto
        </button>
      </section>

      {error && !open && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#f7d8de] bg-[#fff7f8]/80 p-4 text-xs text-danger shadow-sm backdrop-blur-xl">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#ffe8ec] font-bold">
            !
          </span>
          <p className="pt-1.5">{error}</p>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyProducts onCreate={openCreate} />
      ) : (
        <ProductTable
          products={visibleProducts}
          prices={prices}
          hasFilters={Boolean(query) || status !== "all"}
          onClear={() => {
            setQuery("");
            setStatus("all");
          }}
          onEdit={openEdit}
          onRemove={setDeleteTarget}
        />
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm">
            <form
              onSubmit={submit}
              className="glass-panel my-6 w-full max-w-2xl overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                    Catálogo
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    {editing ? "Editar produto" : "Novo produto"}
                  </h2>
                  <p className="mt-1.5 text-xs leading-5 text-muted">
                    {editing
                      ? "Atualize os dados comerciais e a disponibilidade do produto."
                      : "Cadastre os dados comerciais e o primeiro preço."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={closeForm}
                  className="grid size-9 place-items-center rounded-full border border-white/80 bg-white/45 text-muted transition hover:bg-white/75 hover:text-foreground"
                >
                  <Icon name="close" className="size-4" />
                </button>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
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
                  defaultValue={editing?.type ?? "digital"}
                >
                  <option value="digital">Digital</option>
                  <option value="service">Serviço</option>
                  <option value="saas">SaaS</option>
                  <option value="physical">Físico</option>
                </SelectField>
                <SelectField
                  name="status"
                  label="Status"
                  defaultValue={editing?.status ?? "active"}
                >
                  <option value="active">Ativo</option>
                  <option value="draft">Rascunho</option>
                  <option value="inactive">Inativo</option>
                </SelectField>
                <label className="text-xs font-semibold sm:col-span-2">
                  Descrição curta
                  <textarea
                    name="shortDescription"
                    defaultValue={editing?.shortDescription ?? ""}
                    placeholder="Explique brevemente o que o cliente recebe."
                    className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-white/80 bg-white/48 p-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/25 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.07)]"
                  />
                </label>
                {!editing && (
                  <>
                    <SelectField
                      name="pricingType"
                      label="Cobrança"
                      value={pricingType}
                      onChange={(event) => setPricingType(event.target.value)}
                    >
                      <option value="one_time">Pagamento único</option>
                      <option value="recurring">Recorrente</option>
                    </SelectField>
                    <Field
                      name="amount"
                      label="Valor (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      required
                    />
                  </>
                )}
                {!editing && pricingType === "recurring" && (
                  <SelectField
                    name="interval"
                    label="Periodicidade"
                    defaultValue="month"
                  >
                    <option value="month">Mensal</option>
                    <option value="year">Anual</option>
                    <option value="week">Semanal</option>
                  </SelectField>
                )}
              </div>

              {error && (
                <p className="mt-5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7]/75 p-3 text-xs text-danger">
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-11 rounded-xl border border-white/85 bg-white/42 px-5 text-xs font-semibold text-muted transition hover:bg-white/70 hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  className="glass-interactive h-11 rounded-xl bg-brand px-6 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading
                    ? editing
                      ? "Salvando..."
                      : "Criando..."
                    : editing
                      ? "Salvar alterações"
                      : "Criar produto"}
                </button>
              </div>
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
    </>
  );
}

function ProductTable({
  products,
  prices,
  hasFilters,
  onClear,
  onEdit,
  onRemove,
}: {
  products: Product[];
  prices: Record<string, Price[]>;
  hasFilters: boolean;
  onClear: () => void;
  onEdit: (product: Product) => void;
  onRemove: (product: Product) => void;
}) {
  return (
    <section className="glass-panel overflow-hidden rounded-[28px]">
      <div className="flex items-center justify-between gap-4 border-b border-white/65 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold tracking-[-0.02em]">
            Catálogo de produtos
          </h2>
          <p className="mt-1 text-[10px] text-muted">
            {products.length}{" "}
            {products.length === 1
              ? "produto encontrado"
              : "produtos encontrados"}
          </p>
        </div>
        <span className="hidden rounded-full border border-white/80 bg-white/42 px-3 py-1.5 text-[10px] font-medium text-muted sm:inline-flex">
          Valores em BRL
        </span>
      </div>

      {products.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft/75 text-brand">
            <Icon name="search" className="size-4" />
          </span>
          <h3 className="mt-3 text-sm font-semibold">Nenhum resultado</h3>
          <p className="mt-1 text-xs text-muted">
            Ajuste a busca ou os filtros utilizados.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="mt-4 text-xs font-semibold text-brand-strong hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-white/24 text-[10px] uppercase tracking-[0.09em] text-muted">
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
                  productPrices.find((price) => price.status === "active") ??
                  productPrices[0];
                return (
                  <tr
                    key={product.id}
                    className="group text-xs transition hover:bg-white/34"
                  >
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-[13px] border border-white/80 bg-gradient-to-br from-white/75 to-[#ece9ff]/65 text-brand shadow-[0_7px_20px_rgba(91,69,180,.08)]">
                          <Icon
                            name={productIcon(product.type)}
                            className="size-4"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate font-semibold text-foreground">
                            {product.name}
                          </p>
                          <p className="mt-1 max-w-[260px] truncate text-[10px] text-muted">
                            {product.shortDescription || `/${product.slug}`}
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
                            <p className="mt-1 text-[9px] text-muted">
                              +{productPrices.length - 1}{" "}
                              {productPrices.length === 2 ? "preço" : "preços"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-warning">
                          Não configurado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {primaryPrice ? billingLabel(primaryPrice) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-5 py-4 text-[10px] text-muted">
                      <time dateTime={product.updatedAt}>
                        {shortDate(product.updatedAt)}
                      </time>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1 opacity-65 transition group-hover:opacity-100">
                        <ActionButton
                          label="Editar produto"
                          icon="edit"
                          onClick={() => onEdit(product)}
                        />
                        <ActionButton
                          label="Excluir produto"
                          icon="trash"
                          danger
                          onClick={() => onRemove(product)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ActionButton({
  label,
  icon,
  danger = false,
  onClick,
}: {
  label: string;
  icon: IconName;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <span className="group/action relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-grid size-8 place-items-center rounded-xl transition ${danger ? "text-muted hover:bg-[#fff0f2] hover:text-danger" : "text-muted hover:bg-brand-soft/70 hover:text-brand-strong"}`}
      >
        <Icon name={icon} className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+7px)] right-0 z-20 whitespace-nowrap rounded-lg border border-white/10 bg-[#292844]/92 px-2.5 py-1.5 text-[9px] font-medium text-white opacity-0 shadow-[0_10px_28px_rgba(35,30,70,.2)] backdrop-blur-xl transition duration-200 group-hover/action:-translate-y-0.5 group-hover/action:opacity-100 group-focus-within/action:-translate-y-0.5 group-focus-within/action:opacity-100"
      >
        {label}
        <span className="absolute -bottom-1 right-3 size-2 rotate-45 bg-[#292844]/92" />
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
    <div className="fixed inset-0 z-[110] grid place-items-center bg-[#17172c]/24 p-4 backdrop-blur-sm">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
        aria-describedby="delete-product-description"
        className="glass-panel w-full max-w-md rounded-[26px] p-6 shadow-[0_32px_100px_rgba(37,31,76,.24)]"
      >
        <span className="grid size-11 place-items-center rounded-2xl border border-[#ffdce1] bg-[#fff0f2]/85 text-danger shadow-sm">
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
          className="mt-2 text-xs leading-5 text-muted"
        >
          <strong className="font-semibold text-foreground">
            {product.name}
          </strong>{" "}
          será removido permanentemente do catálogo. Esta ação não pode ser
          desfeita.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="h-11 rounded-xl border border-white/85 bg-white/45 px-5 text-xs font-semibold text-muted transition hover:bg-white/75 hover:text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="h-11 rounded-xl bg-danger px-5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(195,59,83,.2)] transition hover:bg-[#aa3148] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? "Excluindo..." : "Excluir produto"}
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyProducts({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="glass-panel rounded-[28px] px-5 py-16 text-center sm:py-20">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/85 bg-brand-soft/70 text-brand shadow-[0_12px_28px_rgba(91,69,180,.1)]">
        <Icon name="box" className="size-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold tracking-[-0.025em]">
        Seu catálogo começa aqui
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-muted">
        Crie o primeiro produto e configure seu preço para começar a vender.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(91,69,223,.2)] transition hover:-translate-y-0.5 hover:bg-brand-strong"
      >
        <Icon name="plus" className="size-3.5" />
        Criar primeiro produto
      </button>
    </section>
  );
}

function Field({
  label,
  className,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <input
        {...input}
        className={`mt-2 h-11 w-full rounded-xl border border-white/80 bg-white/48 px-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/25 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.07)] ${className ?? ""}`}
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
  return (
    <label className="text-xs font-semibold">
      {label}
      <select
        {...select}
        className="mt-2 h-11 w-full rounded-xl border border-white/80 bg-white/48 px-3.5 font-normal outline-none transition focus:border-brand/25 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.07)]"
      >
        {children}
      </select>
    </label>
  );
}

function TypeBadge({ type }: { type: Product["type"] }) {
  return (
    <span className="inline-flex rounded-full border border-white/80 bg-white/48 px-2.5 py-1 text-[10px] font-medium text-muted">
      {typeLabel(type)}
    </span>
  );
}

function StatusBadge({ status }: { status: Product["status"] }) {
  const style =
    status === "active"
      ? "bg-[#e7f7f0] text-success"
      : status === "draft"
        ? "bg-[#f0edff] text-brand-strong"
        : "bg-white/55 text-muted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${style}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-65" />
      {statusLabel(status)}
    </span>
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function money(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    value / 100,
  );
}
function typeLabel(type: Product["type"]) {
  return {
    digital: "Digital",
    physical: "Físico",
    service: "Serviço",
    saas: "SaaS",
  }[type];
}
function productIcon(type: Product["type"]): "box" | "bolt" | "code" | "tag" {
  if (type === "digital") return "bolt";
  if (type === "physical") return "box";
  if (type === "service") return "tag";
  return "code";
}
function statusLabel(status: Product["status"]) {
  return { draft: "Rascunho", active: "Ativo", inactive: "Inativo" }[status];
}
function intervalLabel(interval: string | null) {
  return (
    { day: "Diária", week: "Semanal", month: "Mensal", year: "Anual" }[
      interval ?? ""
    ] ?? "Recorrente"
  );
}
function billingLabel(price: Price) {
  return price.pricingType === "recurring"
    ? intervalLabel(price.recurringInterval)
    : price.pricingType === "one_time"
      ? "Pagamento único"
      : price.pricingType === "free"
        ? "Grátis"
        : "Personalizado";
}
function shortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
