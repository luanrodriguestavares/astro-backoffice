"use client";

import { Button } from "@/components/ui/button";

import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function CustomerCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [createdName, setCreatedName] = useState<string>();

  function openForm() {
    setError(undefined);
    setOpen(true);
  }

  function closeForm() {
    if (loading) return;
    setError(undefined);
    setOpen(false);
  }

  useEscapeClose(open || Boolean(createdName), () => {
    if (createdName) setCreatedName(undefined);
    else closeForm();
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        email: form.get("email"),
        phone: String(form.get("phone") ?? "").trim() || undefined,
        locale: "pt-BR",
        timezone: "America/Fortaleza",
        metadata: {},
      }),
    });
    const body = (await response.json()) as { detail?: string };
    setLoading(false);
    if (!response.ok) {
      setError(body.detail ?? "Não foi possível cadastrar o cliente.");
      return;
    }
    setOpen(false);
    setCreatedName(name);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        onClick={openForm}
        className="glass-interactive inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] transition hover:-translate-y-0.5 hover:bg-brand-strong"
      >
        <Icon name="plus" className="size-3.5" />
        Adicionar cliente
      </Button>

      {open &&
        createPortal(
          <div onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }} className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm">
            <form
              onSubmit={submit}
              className="modal-surface glass-panel my-6 w-full max-w-2xl overflow-hidden rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                    Relacionamento
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    Novo cliente
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-muted">
                    Cadastre os dados de contato para acompanhar compras e pagamentos.
                  </p>
                </div>
                <Button
                  type="button"
                  aria-label="Fechar"
                  disabled={loading}
                  onClick={closeForm}
                  className="grid size-9 place-items-center rounded-full border border-white/80 bg-white/45 text-muted transition hover:bg-white/75 hover:text-foreground disabled:opacity-50"
                >
                  <Icon name="close" className="size-4" />
                </Button>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Field name="name" label="Nome" placeholder="Ex.: Maria Oliveira" autoComplete="name" required />
                <Field name="email" label="E-mail" type="email" placeholder="maria@exemplo.com" autoComplete="email" required />
                <Field name="phone" label="Telefone (opcional)" type="tel" placeholder="(85) 99999-9999" autoComplete="tel" className="sm:col-span-2" />
              </div>

              {error && (
                <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7]/75 p-3 text-[13px] text-danger">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-danger/10 font-bold">!</span>
                  <p className="pt-0.5">{error}</p>
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  disabled={loading}
                  onClick={closeForm}
                  className="h-11 rounded-xl border border-white/85 bg-white/42 px-5 text-[13px] font-semibold text-muted transition hover:bg-white/70 hover:text-foreground disabled:opacity-50"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={loading}
                  className="glass-interactive h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? "Cadastrando..." : "Cadastrar cliente"}
                </Button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {createdName &&
        createPortal(
          <div onMouseDown={(event) => { if (event.target === event.currentTarget) setCreatedName(undefined); }} className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-[#17172c]/24 p-4 backdrop-blur-sm">
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="customer-created-title"
              aria-describedby="customer-created-description"
              className="modal-surface glass-panel w-full max-w-md rounded-[26px] p-6 shadow-[0_32px_100px_rgba(37,31,76,.24)]"
            >
              <span className="grid size-11 place-items-center rounded-2xl border border-[#d5f0e5] bg-[#e8f7f1]/90 text-success shadow-sm">
                <Icon name="check" className="size-4.5" />
              </span>
              <h2 id="customer-created-title" className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                Cliente cadastrado
              </h2>
              <p id="customer-created-description" className="mt-2 text-[13px] leading-5 text-muted">
                <strong className="font-semibold text-foreground">{createdName}</strong> foi adicionado à sua base de clientes com sucesso.
              </p>
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setCreatedName(undefined)}
                  className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(91,69,223,.2)] transition hover:bg-brand-strong"
                >
                  Concluir
                </Button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

function Field({
  label,
  className,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`text-[13px] font-semibold ${className ?? ""}`}>
      {label}
      <input
        {...input}
        className="mt-2 h-11 w-full rounded-xl border border-white/80 bg-white/48 px-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/25 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(109,93,244,.07)]"
      />
    </label>
  );
}
