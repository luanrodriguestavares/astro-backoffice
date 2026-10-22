'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { TemplateThumb } from '@/components/checkout-builder/checkout-manager';
import { Icon } from '@/components/ui/icon';
import { checkoutTemplates } from '@/lib/checkout/templates';

type Category = 'all' | 'sales' | 'checkout' | 'recurring';

export function FunnelTemplateMarketplace({ canWrite }: { canWrite: boolean }) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<Category>('all');
    const templates = useMemo(() => {
        const term = normalize(query);
        return checkoutTemplates.filter(
            (template) =>
                (category === 'all' || template.category === category) &&
                (!term ||
                    normalize(
                        `${template.name} ${template.description} ${template.audience} ${template.highlights.join(' ')}`,
                    ).includes(term)),
        );
    }, [category, query]);

    return (
        <section className="glass-panel overflow-hidden rounded-[28px]">
            <div className="border-b border-border px-5 py-5 sm:px-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-brand-strong">Marketplace</p>
                        <h2 className="mt-1 text-xl font-semibold tracking-[-.035em]">Comece com um funil pronto</h2>
                        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted">Cada template cria páginas, blocos e conexões iniciais. Depois você pode alterar livremente no construtor.</p>
                    </div>
                    <label className="filter-control ui-control-frame flex h-11 min-w-0 items-center gap-2 px-3.5 lg:w-[320px]">
                        <Icon name="search" className="size-4 text-muted" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar templates" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" />
                    </label>
                </div>
                <div className="mt-5 flex gap-2 overflow-x-auto">
                    {([
                        ['all', 'Todos'],
                        ['sales', 'Venda'],
                        ['checkout', 'Checkout'],
                        ['recurring', 'Recorrência'],
                    ] as const).map(([value, label]) => (
                        <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`h-9 rounded-xl border px-4 text-[12px] font-semibold transition ${category === value ? 'border-brand/45 bg-brand-soft text-brand-strong' : 'border-border bg-surface text-muted hover:text-foreground'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3 sm:p-7">
                {templates.map((template) => (
                    <article key={template.id} className="group overflow-hidden rounded-[22px] border border-border bg-[var(--control-bg)] p-3 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_20px_55px_rgba(35,34,58,.08)]">
                        <TemplateThumb id={template.id} />
                        <div className="p-2 pt-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-brand-strong">{template.audience}</span>
                                    <h3 className="mt-1 text-[16px] font-semibold tracking-[-.025em]">{template.name}</h3>
                                </div>
                                <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted">{template.flowSteps} {template.flowSteps === 1 ? 'etapa' : 'etapas'}</span>
                            </div>
                            <p className="mt-2 min-h-10 text-[12.5px] leading-5 text-muted">{template.description}</p>
                            <div className="mt-3 flex min-h-12 flex-wrap content-start gap-1.5">
                                {template.highlights.map((highlight) => (
                                    <span key={highlight} className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-1 text-[10.5px] text-foreground/75"><Icon name="check" className="size-3 text-brand" />{highlight}</span>
                                ))}
                            </div>
                            {canWrite ? (
                                <Link href={`/checkouts?template=${encodeURIComponent(template.id)}`} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-[12px] font-semibold text-background transition hover:opacity-90">
                                    Usar este template <Icon name="arrow-right" className="size-3.5" />
                                </Link>
                            ) : (
                                <p className="mt-5 rounded-xl bg-surface-muted px-3 py-2.5 text-center text-[11px] text-muted">Seu perfil não pode criar checkouts.</p>
                            )}
                        </div>
                    </article>
                ))}
                {templates.length === 0 && (
                    <div className="col-span-full grid min-h-64 place-items-center rounded-2xl border border-dashed border-border text-center text-[13px] text-muted">Nenhum template encontrado.</div>
                )}
            </div>
        </section>
    );
}

function normalize(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}
