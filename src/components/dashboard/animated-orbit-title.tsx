'use client';

import { motion, useReducedMotion } from 'motion/react';

export function AnimatedOrbitTitle() {
    const reduceMotion = useReducedMotion();

    if (reduceMotion) {
        return (
            <>
                Suas vendas em{' '}
                <span className="astro-title-highlight">órbita.</span>
            </>
        );
    }

    return (
        <span className="inline-flex flex-wrap items-baseline" aria-label="Suas vendas em órbita.">
            <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
                Suas vendas em&nbsp;
            </motion.span>
            <motion.span
                aria-hidden="true"
                className="relative isolate inline-block"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
                <motion.span
                    className="absolute inset-x-[-0.08em] bottom-[0.06em] top-[0.18em] -z-10 origin-left rounded-[0.12em] bg-highlight"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.12, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                />
                <span className="relative text-highlight-contrast">órbita.</span>
            </motion.span>
        </span>
    );
}
