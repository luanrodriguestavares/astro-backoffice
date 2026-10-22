'use client';

import { FormEvent, useRef, useState } from 'react';

import { PasswordInput } from '@/components/auth/password-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';

const inputClass =
    'h-11 w-full rounded-xl border border-[#e6e8eb] bg-white/75 px-3.5 text-[13.5px] font-normal text-[#111111] outline-none transition duration-200 placeholder:text-[#a9adb1] hover:border-[#d9dde1] focus:border-[#9fd34a] focus:bg-white focus:shadow-[0_0_0_4px_rgb(145_207_36_/_12%)]';

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

export function RegisterForm({
    invitation,
    social,
}: {
    invitation?: InvitationContext;
    /** Atalhos de cadastro social: só aparecem na primeira etapa. */
    social?: React.ReactNode;
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmationRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(0);
    const [displayName, setDisplayName] = useState('');
    const [slug, setSlug] = useState('');
    const [customSlug, setCustomSlug] = useState(false);
    const steps =
        invitation === undefined
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
            action={
                invitation
                    ? `/api/auth/register?invite=${encodeURIComponent(invitation.token)}`
                    : '/api/auth/register'
            }
            method="post"
            className="mt-2"
            onSubmit={submit}
        >
            {invitation && <input type="hidden" name="invitationToken" value={invitation.token} />}
            {invitation === undefined && (
                <ol className="mt-5 grid grid-cols-3" aria-label="Etapas do cadastro">
                    {steps.map((item, index) => (
                        <li key={item.label} className="relative min-w-0">
                            {index > 0 && (
                                <span
                                    aria-hidden="true"
                                    className={`absolute right-[calc(50%+20px)] top-[14px] h-[2px] w-[calc(100%-40px)] rounded-full transition ${index <= step ? 'bg-[#9fd34a]' : 'bg-[#eceef0]'}`}
                                />
                            )}
                            <button
                                type="button"
                                disabled={index > step}
                                onClick={() => index < step && setStep(index)}
                                aria-current={index === step ? 'step' : undefined}
                                className="flex w-full flex-col items-center text-center disabled:cursor-default"
                            >
                                <span
                                    className={`grid size-7 place-items-center rounded-full text-[12px] font-semibold transition ${
                                        index === step
                                            ? 'bg-[#7cbd1c] text-white shadow-[0_0_0_4px_rgb(145_207_36_/_16%)]'
                                            : index < step
                                              ? 'bg-[#7cbd1c] text-white'
                                              : 'bg-[#eef0f2] text-[#5d6166]'
                                    }`}
                                >
                                    {index < step ? (
                                        <Icon name="check" className="size-3.5" />
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span
                                    className={`mt-2 truncate text-[12px] font-semibold ${index <= step ? 'text-[#101214]' : 'text-[#3f4245]'}`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        </li>
                    ))}
                </ol>
            )}

            <div className="mt-4 min-h-[220px] border-t border-[#e3e6e9]/80 pt-4">
                <section data-step="0" hidden={step !== 0}>
                    <StepHeading
                        title="Vamos começar por você"
                        description="Seus dados de acesso ao Astro."
                    />
                    <div className="mt-3.5 grid gap-x-3 gap-y-3 sm:grid-cols-2">
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
                                className={`${inputClass} ${invitation ? 'cursor-not-allowed bg-[#f1f0f7]/80 text-muted focus:border-[#e2e2e2] focus:shadow-none' : ''}`}
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
                                placeholder="Crie uma senha"
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
                            <div className="mt-4 rounded-2xl border border-[#e3f1cc] bg-[#f7fbef] px-4 py-3">
                                <p className="text-[12px] font-semibold text-[#3b660a]">
                                    Você entrará na workspace {invitation.organizationName}
                                </p>
                                <p className="mt-0.5 text-[11.5px] leading-[1.45] text-[#6a6e73]">
                                    Convite para {invitation.email} · perfil {invitation.role}
                                </p>
                            </div>
                            <Terms />
                        </>
                    )}
                </section>

                {invitation === undefined && (
                    <section data-step="1" hidden={step !== 1}>
                        <StepHeading
                            title="Agora, o seu negócio"
                            description="Como a sua operação aparece no Astro."
                        />
                        <div className="mt-3.5 grid gap-x-3 gap-y-3 sm:grid-cols-2">
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
                    </section>
                )}

                {invitation === undefined && (
                    <section data-step="2" hidden={step !== 2}>
                        <StepHeading
                            title="Dê um endereço à sua operação"
                            description="O endereço da sua workspace."
                        />
                        <div className="mt-3.5">
                            <Field
                                label="Endereço da workspace"
                                hint="Usado em URLs e integrações."
                            >
                                <div className="flex h-11 overflow-hidden rounded-xl border border-[#e6e8eb] bg-white/75 transition duration-200 hover:border-[#d9dde1] focus-within:border-[#9fd34a] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(145_207_36_/_12%)]">
                                    <span className="flex items-center border-r border-[#eceef0] bg-[#f6f7f6] px-3.5 text-[12.5px] text-[#8a8f94]">
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
                                        className="min-w-0 flex-1 bg-transparent px-3.5 text-[13.5px] text-[#111111] outline-none placeholder:text-[#a9adb1]"
                                    />
                                </div>
                            </Field>
                            <div className="mt-4 rounded-2xl border border-[#e3f1cc] bg-[#f7fbef] px-4 py-3">
                                <p className="text-[12px] font-semibold text-[#3b660a]">
                                    {displayName || 'Sua organização'} será sua primeira workspace
                                </p>
                                <p className="mt-0.5 text-[11.5px] leading-[1.45] text-[#6a6e73]">
                                    Você entrará como administrador e poderá convidar a equipe
                                    depois.
                                </p>
                            </div>
                            <Terms />
                        </div>
                    </section>
                )}
            </div>

            <div className="mt-4 flex items-center gap-3">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={() => setStep((current) => Math.max(0, current - 1))}
                        className="auth-secondary flex h-12 items-center gap-2 rounded-full px-5 text-[14px] font-medium text-[#3a3e42]"
                    >
                        <Icon name="arrow-right" className="size-3.5 rotate-180" />
                        Voltar
                    </button>
                )}
                {step < steps.length - 1 ? (
                    <button type="button" className="auth-cta flex-1" onClick={advance}>
                        Continuar
                        <Icon name="arrow-right" className="size-[18px]" />
                    </button>
                ) : (
                    <button type="submit" className="auth-cta flex-1">
                        {invitation ? 'Criar conta e entrar' : 'Criar minha conta'}
                        <Icon name="arrow-right" className="size-[18px]" />
                    </button>
                )}
            </div>
            {step === 0 && social}
        </form>
    );
}

function Terms() {
    return (
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[12px] leading-[1.45] text-[#6a6e73]">
            <input type="checkbox" name="terms" required className="auth-check mt-px" />
            <span>
                Li e concordo com os{' '}
                <span className="font-medium text-[#2b2e31]">Termos de Uso</span> e a{' '}
                <span className="font-medium text-[#2b2e31]">Política de Privacidade</span>.
            </span>
        </label>
    );
}

function StepHeading({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h2 className="auth-display text-[15px] font-bold tracking-[-0.02em] text-[#101214]">
                {title}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-5 text-[#6a6e73]">{description}</p>
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
        <label className="block text-[12.5px] font-medium text-[#2b2e31]">
            <span className="mb-1.5 block">{label}</span>
            {children}
            {hint && (
                <span className="mt-1.5 block text-[11px] font-normal text-[#7a7e83]">{hint}</span>
            )}
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
