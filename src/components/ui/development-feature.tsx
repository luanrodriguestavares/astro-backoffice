import Image from 'next/image';

import { PageHeader } from '@/components/ui/page-header';

export function DevelopmentFeature({
    eyebrow,
    title,
    description,
    kicker,
    headline,
    body,
    features,
}: {
    eyebrow: string;
    title: string;
    description: string;
    kicker: string;
    headline: string;
    body: string;
    features: string[];
}) {
    return (
        <>
            <PageHeader eyebrow={eyebrow} title={title} description={description} />
            <section
                data-tour="page-primary"
                className="glass-panel overflow-hidden rounded-[28px] px-6 pb-12 pt-5 text-center sm:px-10 sm:pb-14"
            >
                <div
                    role="img"
                    aria-label="Robô do Astro trabalhando no desenvolvimento deste recurso"
                    className="relative mx-auto h-[245px] w-full max-w-[620px] overflow-hidden sm:h-[300px]"
                >
                    <Image
                        src="/images/astro-dev.png"
                        alt=""
                        width={1536}
                        height={1024}
                        sizes="(max-width: 640px) 125vw, 730px"
                        className="feature-dev-image-light absolute left-1/2 top-1/2 h-auto w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2"
                    />
                    <Image
                        src="/images/astro-dev-dark.png"
                        alt=""
                        width={1536}
                        height={1024}
                        sizes="(max-width: 640px) 125vw, 730px"
                        className="feature-dev-image-dark absolute left-1/2 top-1/2 hidden h-auto w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2"
                    />
                </div>
                <span className="inline-flex rounded-full border border-brand/10 bg-brand-soft/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-strong">
                    Em construção
                </span>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    {kicker}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-[28px]">
                    {headline}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-muted">{body}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-medium text-muted">
                    {features.map((feature, index) => (
                        <span key={feature} className="contents">
                            {index > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="size-1 rounded-full bg-brand/45"
                                />
                            )}
                            <span>{feature}</span>
                        </span>
                    ))}
                </div>
            </section>
        </>
    );
}
