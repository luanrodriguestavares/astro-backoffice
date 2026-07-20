"use client";

import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/custom-select";
import { Icon } from "@/components/ui/icon";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function InviteMember() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [token, setToken] = useState<string>();

  function close() {
    if (loading) return;
    setOpen(false);
    setToken(undefined);
    setError(undefined);
  }

  useEscapeClose(open, close);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/team/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), role: form.get("role") }) });
    const body = await response.json() as { data?: { developmentToken?: string }; detail?: string };
    setLoading(false);
    if (!response.ok) return setError(body.detail ?? "Falha ao convidar.");
    setToken(body.data?.developmentToken);
    router.refresh();
    if (!body.data?.developmentToken) close();
  }

  return <><button type="button" onClick={() => setOpen(true)} className="glass-interactive inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)]"><Icon name="plus" className="size-3.5" />Convidar membro</button>{open && createPortal(<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#17172c]/20 p-4 backdrop-blur-sm"><form onSubmit={submit} className="modal-surface glass-panel my-6 w-full max-w-lg rounded-[28px] p-5 shadow-[0_32px_100px_rgba(37,31,76,.2)] sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-strong">Acesso</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Convidar membro</h2><p className="mt-1.5 text-[13px] leading-5 text-muted">Envie um convite e defina o nível de acesso à organização.</p></div><button type="button" aria-label="Fechar" disabled={loading} onClick={close} className="grid size-9 place-items-center rounded-full border border-white/80 bg-white/45 text-muted transition hover:bg-white/75 hover:text-foreground"><Icon name="close" className="size-4" /></button></div>{token ? <><p className="mt-6 text-[13px] leading-5 text-muted">Em ambiente local, compartilhe este token com o convidado. Ele é exibido somente agora.</p><code className="mt-3 block overflow-x-auto rounded-xl border border-[#d9d7e8] bg-white/70 p-3 text-xs">{token}</code><div className="mt-6 flex justify-end"><button type="button" onClick={close} className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white">Concluir</button></div></> : <><div className="mt-7 grid gap-4"><label className="text-[13px] font-semibold">E-mail<input name="email" type="email" required placeholder="nome@empresa.com" className="mt-2 h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/70 px-3.5 font-normal outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.16)]" /></label><label className="text-[13px] font-semibold">Função<div className="mt-2"><CustomSelect name="role" defaultValue="admin" options={[{ value: "admin", label: "Administrador" }, { value: "finance", label: "Financeiro" }, { value: "support", label: "Suporte" }, { value: "viewer", label: "Leitura" }]} /></div></label></div>{error && <p role="alert" className="mt-5 rounded-2xl border border-[#f7d8de] bg-[#fff5f7] p-3 text-[13px] text-danger">{error}</p>}<div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={loading} onClick={close} className="h-11 rounded-xl border border-[#d9d7e8] bg-white/70 px-5 text-[13px] font-semibold text-muted">Cancelar</button><button disabled={loading} className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(91,69,223,.22)] disabled:opacity-50">{loading ? "Enviando..." : "Enviar convite"}</button></div></>}</form></div>, document.body)}</>;
}
