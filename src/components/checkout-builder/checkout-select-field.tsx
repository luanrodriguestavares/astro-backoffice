'use client';

import { FieldLabel, type FieldProps, type SelectField } from '@puckeditor/core';

import { CustomSelect } from '@/components/ui/custom-select';
import { fontStack, type CheckoutFontPreset } from '@astro/checkout-renderer/theme';

type CheckoutSelectFieldProps = FieldProps<SelectField> & {
    id?: string;
    label?: string;
    name: string;
};

export function CheckoutSelectField({
    field,
    id,
    label,
    name,
    onChange,
    readOnly,
    value,
}: CheckoutSelectFieldProps) {
    const options = field.options.map((option) => ({
        value: serializeValue(option.value),
        label: option.label,
    }));
    const previewsFont = name === 'fontFamily' || name === 'headingFontFamily';
    const fontPreview = (serialized: string) => {
        const value = deserializeValue(serialized);
        return value === 'inherit' ? 'inherit' : fontStack(value as CheckoutFontPreset);
    };

    return (
        <FieldLabel label={label ?? field.label ?? name} readOnly={readOnly}>
            <CustomSelect
                name={id ?? name}
                value={serializeValue(value)}
                disabled={readOnly}
                options={options}
                renderOption={
                    previewsFont
                        ? (option) => (
                              <span className="flex items-baseline justify-between gap-3">
                                  <span>{option.label}</span>
                                  <span
                                      aria-hidden="true"
                                      className="text-[16px] text-foreground"
                                      style={{ fontFamily: fontPreview(option.value) }}
                                  >
                                      Aa
                                  </span>
                              </span>
                          )
                        : undefined
                }
                renderValue={
                    previewsFont
                        ? (option) => (
                              <span style={{ fontFamily: fontPreview(option.value) }}>
                                  {option.label}
                              </span>
                          )
                        : undefined
                }
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
