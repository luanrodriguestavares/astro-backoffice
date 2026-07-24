"use client";

import { FieldLabel, type FieldProps, type SelectField } from "@puckeditor/core";

import { CustomSelect } from "@/components/ui/custom-select";

type CheckoutSelectFieldProps = FieldProps<SelectField> & {
  id?: string;
  label?: string;
  name: string;
};

export function CheckoutSelectField({ field, id, label, name, onChange, readOnly, value }: CheckoutSelectFieldProps) {
  const options = field.options.map((option) => ({
    value: serializeValue(option.value),
    label: option.label,
  }));

  return (
    <FieldLabel label={label ?? field.label ?? name} readOnly={readOnly}>
      <CustomSelect
        name={id ?? name}
        value={serializeValue(value)}
        disabled={readOnly}
        options={options}
        onValueChange={(next) => onChange(deserializeValue(next))}
      />
    </FieldLabel>
  );
}

function serializeValue(value: unknown) {
  return JSON.stringify({ value });
}

function deserializeValue(value: string) {
  return (JSON.parse(value) as { value?: unknown }).value;
}
