import Link from 'next/link';

import { Icon, type IconName } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';

export function ModulePlaceholder({
    title,
    description,
    icon,
    action,
}: {
    title: string;
    description: string;
    icon: IconName;
    action: string;
}) {
    return (
        <>
            <PageHeader title={title} description={description} />
            <section className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed bg-surface p-8 text-center shadow-panel">
                <div className="max-w-md">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                        <Icon name={icon} className="size-6" />
                    </span>
                    <h2 className="mt-5 text-lg font-bold">Tudo pronto para conectar</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        A estrutura desta área já está criada. O próximo passo é ligar a listagem e
                        os formulários aos endpoints da API Astro.
                    </p>
                    <Link
                        href="#"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
                    >
                        {action}
                        <Icon name="arrow-right" className="size-4" />
                    </Link>
                </div>
            </section>
        </>
    );
}
