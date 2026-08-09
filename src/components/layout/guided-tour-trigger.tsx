'use client';

import { Button } from '@/components/ui/button';

export const guidedTourStartEvent = 'astro-guided-tour-start';

export function GuidedTourTrigger() {
    return (
        <Button
            type="button"
            aria-label="Iniciar tutorial desta página"
            title="Tutorial desta página"
            className="glass-panel-soft grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold text-brand transition hover:-translate-y-0.5 hover:text-brand-strong"
            onClick={() => window.dispatchEvent(new Event(guidedTourStartEvent))}
        >
            ?
        </Button>
    );
}
