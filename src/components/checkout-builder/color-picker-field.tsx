"use client";

import { FieldLabel } from "@puckeditor/core";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const quickColors = [
  "#6d5df4",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#18181b",
  "#ffffff",
];

export function ColorPickerField({ label, name, value, onChange }: { label?: string; name: string; value?: string; onChange: (value: string) => void }) {
  const selected = normalizeColor(value);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function select(color: string) {
    const normalized = normalizeColor(color);
    onChange(normalized);
    setOpen(false);
  }

  return (
    <FieldLabel label={label ?? "Cor"}>
      <div ref={root} className="relative">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-[#dedee7] bg-white px-2">
          <Button
            type="button"
            aria-label="Abrir paleta de cores"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="size-6 shrink-0 rounded-md border border-black/10"
            style={{ background: selected }}
          />
          <input key={selected} className="min-w-0 flex-1 bg-transparent font-mono text-xs uppercase outline-none" defaultValue={selected} maxLength={7} onBlur={(event) => { if (!/^#[0-9a-f]{6}$/i.test(event.currentTarget.value)) event.currentTarget.value = selected; }} onChange={(event) => { const next = event.currentTarget.value; if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase()); }} />
          <label className="relative grid size-7 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-muted" title="Escolher uma cor personalizada">
            <span aria-hidden="true" className="text-sm">+</span>
            <span className="sr-only">Escolher uma cor personalizada</span>
            <input className="absolute inset-0 size-full opacity-0" type="color" name={name} value={selected} onChange={(event) => select(event.currentTarget.value)} />
          </label>
        </div>
        {open && (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] z-20 grid grid-cols-5 gap-1.5 rounded-xl border border-[#e4e2ed] bg-white p-2.5 shadow-[0_16px_45px_rgba(39,35,75,.16)]">
            {quickColors.map((color) => (
              <Button
                key={color}
                type="button"
                aria-label={`Usar cor ${color}`}
                aria-pressed={selected === color}
                onClick={() => select(color)}
                className={`h-7 rounded-md border transition-shadow ${selected === color ? "border-brand shadow-[0_0_0_2px_rgba(109,93,244,.2)]" : "border-black/10"}`}
                style={{ background: color }}
              />
            ))}
          </div>
        )}
      </div>
    </FieldLabel>
  );
}

function normalizeColor(value?: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "#6d5df4";
}
