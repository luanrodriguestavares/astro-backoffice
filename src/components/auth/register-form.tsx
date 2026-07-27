'use client';

import { Button } from '@/components/ui/button';

import { useState } from 'react';

import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';

const inputClass =
    'h-10 w-full rounded-xl border border-[#d9d7e8] bg-white/75 px-3 text-[12px] font-normal text-[#17182f] outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.14)]';

export function RegisterForm() {
    const [displayName, setDisplayName] = useState('');
    const [slug, setSlug] = useState('');
    const [customSlug, setCustomSlug] = useState(false);

    function updateDisplayName(value: string) {
        setDisplayName(value);
        if (!customSlug) setSlug(slugify(value));
    }

    return (
        <form action="/api/auth/register" method="post" className="mt-4">
            <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-[20px] border border-[#ecebf3] bg-[#fafafe]/75 p-4">
                <div>
                    <h3 className="text-[13px] font-semibold">Seus dados</h3>
                    <p className="mt-0.5 text-[10px] text-muted">
                        Você será o administrador da organização.
                    </p>
                </div>
                <div className="mt-3 grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                    <Field label="Nome completo">
                        <input
                            name="name"
                            required
                            minLength={2}
                            maxLength={160}
                            autoComplete="name"
                            placeholder="Seu nome"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="E-mail profissional">
                        <input
                            name="email"
                            required
                            type="email"
                            maxLength={320}
                            autoComplete="email"
                            placeholder="voce@empresa.com"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Senha" hint="Mínimo de 12 caracteres">
                        <input
                            name="password"
                            required
                            type="password"
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder="Crie uma senha segura"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Confirmar senha">
                        <input
                            name="passwordConfirmation"
                            required
                            type="password"
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder="Repita sua senha"
                            className={inputClass}
                        />
                    </Field>
                </div>
            </section>
            <section className="rounded-[20px] border border-[#ecebf3] bg-[#fafafe]/75 p-4">
                <div>
                    <h3 className="text-[13px] font-semibold">Sua organização</h3>
                    <p className="mt-0.5 text-[10px] text-muted">
                        Esses dados identificam o seu negócio dentro do Astro.
                    </p>
                </div>
                <div className="mt-3 grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                    <Field label="Nome da marca">
                        <input
                            name="displayName"
                            value={displayName}
                            onChange={(event) => updateDisplayName(event.target.value)}
                            required
                            minLength={2}
                            maxLength={160}
                            placeholder="Astro Store"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Razão social">
                        <input
                            name="legalName"
                            required
                            minLength={2}
                            maxLength={200}
                            autoComplete="organization"
                            placeholder="Empresa LTDA"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Tipo de documento">
                        <CustomSelect
                            name="documentType"
                            defaultValue="CNPJ"
                            options={[
                                { value: 'CNPJ', label: 'CNPJ' },
                                { value: 'CPF', label: 'CPF' },
                                { value: 'OTHER', label: 'Outro' },
                            ]}
                        />
                    </Field>
                    <Field label="Número do documento">
                        <input
                            name="documentNumber"
                            required
                            minLength={5}
                            maxLength={40}
                            inputMode="numeric"
                            placeholder="00.000.000/0001-00"
                            className={inputClass}
                        />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field
                            label="Identificador da organização"
                            hint="Usado em URLs e integrações"
                        >
                            <div className="flex h-10 overflow-hidden rounded-xl border border-[#d9d7e8] bg-white/75 transition focus-within:border-brand/70 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(109,93,244,.14)]">
                                <span className="flex items-center border-r border-[#d9d7e8] bg-[#faf9ff] px-3 text-[10px] text-muted">
                                    astro.app/
                                </span>
                                <input
                                    name="slug"
                                    value={slug}
                                    onChange={(event) => {
                                        setCustomSlug(true);
                                        setSlug(slugify(event.target.value));
                                    }}
                                    required
                                    minLength={2}
                                    maxLength={80}
                                    placeholder="minha-empresa"
                                    className="min-w-0 flex-1 bg-transparent px-3 text-[12px] outline-none"
                                />
                            </div>
                        </Field>
                    </div>
                </div>
            </section>
            </div>
            <div className="mt-3 grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <label className="flex items-start gap-2.5 rounded-xl border border-[#ecebf3] bg-[#fafafe]/75 px-3 py-2.5 text-[10px] leading-4 text-muted">
                <input
                    type="checkbox"
                    name="terms"
                    required
                    className="mt-0.5 size-3.5 shrink-0 rounded border-[#d9d7e8] accent-brand"
                />
                <span>
                    Li e concordo com os{' '}
                    <span className="font-semibold text-brand-strong">Termos de Uso</span> e a{' '}
                    <span className="font-semibold text-brand-strong">Política de Privacidade</span>
                    .
                </span>
            </label>
            <Button
                type="submit"
                variant="primary"
                className="w-full"
            >
                Criar conta gratuita
                <Icon name="arrow-right" className="size-4" />
            </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-[11px] font-semibold text-[#24253c]">
            <span className="mb-1.5 flex items-center justify-between gap-3">
                <span>{label}</span>
                {hint && <span className="text-[8px] font-normal text-muted">{hint}</span>}
            </span>
            {children}
        </label>
    );
}

function slugify(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}
