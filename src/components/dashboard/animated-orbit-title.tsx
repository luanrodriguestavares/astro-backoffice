'use client';

import { motion, useReducedMotion } from 'motion/react';

export function AnimatedOrbitTitle() {
    const reduceMotion = useReducedMotion();

    if (reduceMotion) {
        return (
            <>
                Suas vendas <span className="astro-title-highlight">sob controle.</span>
            </>
        );
    }

    return (
        <span
            className="inline-flex flex-wrap items-baseline"
            aria-label="Suas vendas sob controle."
        >
            <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
                Suas vendas&nbsp;
            </motion.span>
            <motion.span
                aria-hidden="true"
                className="astro-title-highlight inline-block"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
                sob controle.
            </motion.span>
        </span>
    );
}
