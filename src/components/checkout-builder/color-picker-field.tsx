"use client";

import { FieldLabel } from "@puckeditor/core";

import { Button } from "@/components/ui/button";

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

  function select(color: string) {
    const normalized = normalizeColor(color);
    onChange(normalized);
  }

  return (
    <FieldLabel label={label ?? "Cor"}>
      <div className="grid gap-2.5">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-[#dedee7] bg-white px-2">
          <label className="relative size-6 shrink-0 overflow-hidden rounded-md border border-black/10" style={{ background: selected }}>
            <span className="sr-only">Escolher cor</span>
            <input className="absolute inset-0 size-full opacity-0" type="color" name={name} value={selected} onChange={(event) => select(event.currentTarget.value)} />
          </label>
          <input key={selected} className="min-w-0 flex-1 bg-transparent font-mono text-xs uppercase outline-none" defaultValue={selected} maxLength={7} onBlur={(event) => { if (!/^#[0-9a-f]{6}$/i.test(event.currentTarget.value)) event.currentTarget.value = selected; }} onChange={(event) => { const next = event.currentTarget.value; if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase()); }} />
        </div>
        <div className="grid grid-cols-5 gap-1.5">
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
      </div>
    </FieldLabel>
  );
}

function normalizeColor(value?: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "#6d5df4";
}
