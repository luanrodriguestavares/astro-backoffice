"use client";

import { Button } from "@/components/ui/button";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function CustomSelect({ name, value, defaultValue, options, placeholder = "Selecione", onValueChange, required, disabled }: { name: string; value?: string; defaultValue?: string; options: SelectOption[]; placeholder?: string; onValueChange?: (value: string) => void; required?: boolean; disabled?: boolean }) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = value ?? internal;
  const label = options.find((option) => option.value === selected)?.label;

  useEffect(() => {
    function close(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", escape); };
  }, []);

  function choose(next: string) { setInternal(next); onValueChange?.(next); setOpen(false); }

  return <div ref={root} className="relative"><input type="hidden" name={name} value={selected} required={required} /><Button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-3.5 text-left font-normal outline-none transition focus-visible:border-brand/70 focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(109,93,244,.16)] ${open ? "border-brand/70 bg-white shadow-[0_0_0_3px_rgba(109,93,244,.16)]" : "border-[#d9d7e8] bg-white/70 hover:border-brand/45"} disabled:opacity-50`}><span className={label ? "text-foreground" : "text-muted"}>{label ?? placeholder}</span><Icon name="arrow-right" className={`size-3.5 shrink-0 text-muted transition-transform ${open ? "-rotate-90 text-brand" : "rotate-90"}`} /></Button>{open && <div role="listbox" className="absolute z-[130] mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white bg-white p-1.5 shadow-[0_20px_55px_rgba(39,33,82,.18)]">{options.map((option) => <Button key={option.value} type="button" role="option" aria-selected={selected === option.value} disabled={option.disabled} onClick={() => choose(option.value)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition ${selected === option.value ? "bg-brand-soft text-brand-strong" : "hover:bg-[#f7f6fb]"} disabled:opacity-45`}><span>{option.label}</span>{selected === option.value && <Icon name="check" className="size-3.5 text-brand" />}</Button>)}</div>}</div>;
}
