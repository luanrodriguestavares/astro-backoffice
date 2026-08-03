'use client';

import { FormEvent, useRef, useState } from 'react';

import { PasswordInput } from '@/components/auth/password-input';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';

const inputClass =
    'h-11 w-full rounded-xl border border-[#d9d7e8] bg-white/75 px-3.5 text-[12px] font-normal text-[#17182f] outline-none transition placeholder:text-[#aaaabd] focus:border-brand/70 focus:bg-white focus:shadow-[0_0_0_3px_rgba(109,93,244,.14)]';

const organizationSteps = [
    { label: 'Seu acesso', description: 'Identidade e segurança' },
    { label: 'Seu negócio', description: 'Dados da organização' },
    { label: 'Workspace', description: 'Endereço e confirmação' },
];

interface InvitationContext {
    token: string;
    organizationName: string;
    email: string;
    role: string;
}

export function RegisterForm({ invitation }: { invitation?: InvitationContext }) {
    const formRef = useRef<HTMLFormElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmationRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(0);
    const [displayName, setDisplayName] = useState('');
    const [slug, setSlug] = useState('');
    const [customSlug, setCustomSlug] = useState(false);
    const steps = invitation === undefined
        ? organizationSteps
        : [{ label: 'Seu acesso', description: `Entrar em ${invitation.organizationName}` }];

    function updateDisplayName(value: string) {
        setDisplayName(value);
        if (!customSlug) setSlug(slugify(value));
    }

    function validateStep(index: number) {
        const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${index}"]`);
        const fields = section?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
            'input, select',
        );
        if (!fields) return false;
        if (index === 0 && confirmationRef.current) {
            confirmationRef.current.setCustomValidity(
                confirmationRef.current.value === passwordRef.current?.value
                    ? ''
                    : 'As senhas precisam ser iguais.',
            );
        }
        for (const field of fields) {
            if (!field.checkValidity()) {
                field.reportValidity();
                return false;
            }
        }
        return true;
    }

    function advance() {
        if (validateStep(step)) setStep((current) => Math.min(current + 1, steps.length - 1));
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        if (step < steps.length - 1) {
            event.preventDefault();
            advance();
        }
    }

    return (
        <form
            ref={formRef}
            action={invitation ? `/api/auth/register?invite=${encodeURIComponent(invitation.token)}` : '/api/auth/register'}
            method="post"
            className="mt-5"
            onSubmit={submit}
        >
            {invitation && <input type="hidden" name="invitationToken" value={invitation.token} />}
            <ol className={`grid gap-2 ${invitation ? 'grid-cols-1' : 'grid-cols-3'}`} aria-label="Etapas do cadastro">
                {steps.map((item, index) => (
                    <li key={item.label} className="min-w-0">
                        <button
                            type="button"
                            disabled={index > step}
                            onClick={() => index < step && setStep(index)}
                            className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                                index === step
                                    ? 'border-brand/35 bg-brand-soft/75 text-brand-strong'
                                    : index < step
                                      ? 'border-brand/15 bg-white/60 text-foreground hover:border-brand/28'
                                      : 'border-[#ecebf3] bg-[#fafafe]/65 text-muted'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={`grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-bold ${index <= step ? 'bg-brand text-white' : 'bg-[#e9e8f1] text-muted'}`}
                                >
                                    {index < step ? (
                                        <Icon name="check" className="size-3" />
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span className="truncate text-[11px] font-semibold">
                                    {item.label}
                                </span>
                            </span>
                            <span className="mt-1 hidden truncate pl-7 text-[9px] text-muted sm:block">
                                {item.description}
                            </span>
                        </button>
                    </li>
                ))}
            </ol>

            <div className="mt-4 min-h-[286px] rounded-[22px] border border-[#ecebf3] bg-[#fafafe]/75 p-4 sm:p-5">
                <section data-step="0" hidden={step !== 0}>
                    <StepHeading
                        icon="user"
                        title="Vamos começar por você"
                        description="Use seus dados reais para manter a conta segura e fácil de reconhecer."
                    />
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                        <Field
                            label="E-mail profissional"
                            hint={invitation ? 'Definido pelo convite' : undefined}
                        >
                            <input
                                name="email"
                                required
                                type="email"
                                defaultValue={invitation?.email}
                                readOnly={invitation !== undefined}
                                maxLength={320}
                                autoComplete="email"
                                placeholder="voce@empresa.com"
                                className={`${inputClass} ${invitation ? 'cursor-not-allowed bg-[#f1f0f7]/80 text-muted focus:border-[#d9d7e8] focus:shadow-none' : ''}`}
                            />
                        </Field>
                        <Field label="Senha" hint="Mínimo de 12 caracteres">
                            <PasswordInput
                                ref={passwordRef}
                                name="password"
                                required
                                minLength={12}
                                maxLength={128}
                                autoComplete="new-password"
                                placeholder="Crie uma senha segura"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Confirmar senha">
                            <PasswordInput
                                ref={confirmationRef}
                                name="passwordConfirmation"
                                required
                                minLength={12}
                                maxLength={128}
                                autoComplete="new-password"
                                placeholder="Repita sua senha"
                                className={inputClass}
                                onChange={(event) => event.currentTarget.setCustomValidity('')}
                            />
                        </Field>
                    </div>
                    {invitation && (
                        <>
                            <div className="mt-4 rounded-2xl border border-brand/12 bg-brand-soft/45 px-4 py-3">
                                <p className="text-[11px] font-semibold text-brand-strong">
                                    Você entrará na workspace {invitation.organizationName}
                                </p>
                                <p className="mt-1 text-[10px] leading-4 text-muted">
                                    Convite para {invitation.email} · perfil {invitation.role}
                                </p>
                            </div>
                            <Terms />
                        </>
                    )}
                </section>

                {invitation === undefined && <section data-step="1" hidden={step !== 1}>
                    <StepHeading
                        icon="box"
                        title="Agora, o seu negócio"
                        description="Esses dados identificam a operação que você administrará no Astro."
                    />
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                    </div>
                </section>}

                {invitation === undefined && <section data-step="2" hidden={step !== 2}>
                    <StepHeading
                        icon="layout"
                        title="Dê um endereço à sua estação"
                        description="Você poderá reconhecer e acessar esta workspace por esse identificador."
                    />
                    <div className="mt-5">
                        <Field label="Identificador da organização" hint="URLs e integrações">
                            <div className="flex h-11 overflow-hidden rounded-xl border border-[#d9d7e8] bg-white/75 transition focus-within:border-brand/70 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(109,93,244,.14)]">
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
                        <div className="mt-4 rounded-2xl border border-brand/12 bg-brand-soft/45 px-4 py-3">
                            <p className="text-[11px] font-semibold text-brand-strong">
                                {displayName || 'Sua organização'} será sua primeira workspace
                            </p>
                            <p className="mt-1 text-[10px] leading-4 text-muted">
                                Você entrará como administrador e poderá convidar a equipe depois.
                            </p>
                        </div>
                        <Terms />
                    </div>
                </section>}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    disabled={step === 0}
                    onClick={() => setStep((current) => Math.max(0, current - 1))}
                    className={step === 0 ? 'invisible' : ''}
                >
                    <Icon name="arrow-right" className="size-3.5 rotate-180" />
                    Voltar
                </Button>
                {step < steps.length - 1 ? (
                    <Button type="button" variant="primary" onClick={advance}>
                        Continuar
                        <Icon name="arrow-right" className="size-4" />
                    </Button>
                ) : (
                    <Button type="submit" variant="primary">
                        {invitation ? 'Criar conta e entrar' : 'Criar minha estação'}
                        <Icon name="arrow-right" className="size-4" />
                    </Button>
                )}
            </div>
        </form>
    );
}

function Terms() {
    return (
        <label className="mt-4 flex items-start gap-2.5 text-[10px] leading-4 text-muted">
            <input
                type="checkbox"
                name="terms"
                required
                className="mt-0.5 size-3.5 shrink-0 rounded border-[#d9d7e8] accent-brand"
            />
            <span>
                Li e concordo com os{' '}
                <span className="font-semibold text-brand-strong">Termos de Uso</span> e a{' '}
                <span className="font-semibold text-brand-strong">Política de Privacidade</span>.
            </span>
        </label>
    );
}

function StepHeading({
    icon,
    title,
    description,
}: {
    icon: 'user' | 'box' | 'layout';
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon name={icon} className="size-4" />
            </span>
            <div>
                <h2 className="text-[14px] font-semibold tracking-[-0.02em]">{title}</h2>
                <p className="mt-0.5 text-[10px] leading-4 text-muted">{description}</p>
            </div>
        </div>
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
