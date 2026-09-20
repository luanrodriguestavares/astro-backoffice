'use client';

import { motion, useReducedMotion } from 'motion/react';

export function AnimatedOrbitTitle() {
    const reduceMotion = useReducedMotion();

    if (reduceMotion) {
        return (
            <>
                Suas vendas em{' '}
                <span className="font-serif font-normal italic text-brand">órbita.</span>
            </>
        );
    }

    return (
        <span className="inline-flex flex-wrap items-baseline" aria-label="Suas vendas em órbita.">
            <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, y: 12, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
                Suas vendas em&nbsp;
            </motion.span>
            <motion.span
                aria-hidden="true"
                className="relative inline-block font-serif font-normal italic text-brand"
                initial={{ opacity: 0, x: -8, y: 8, rotate: -3, filter: 'blur(6px)' }}
                animate={{
                    opacity: 1,
                    x: 0,
                    y: [0, -2, 0],
                    rotate: 0,
                    filter: 'blur(0px)',
                }}
                transition={{
                    opacity: { delay: 0.2, duration: 0.42 },
                    x: { delay: 0.2, type: 'spring', stiffness: 260, damping: 20 },
                    rotate: { delay: 0.2, type: 'spring', stiffness: 260, damping: 20 },
                    filter: { delay: 0.2, duration: 0.42 },
                    y: { delay: 0.85, duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
                }}
            >
                órbita.
                <motion.span
                    className="absolute -bottom-0.5 left-[8%] h-px w-[84%] origin-left rounded-full bg-brand/45"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: [0, 0.75, 0.35] }}
                    transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
            </motion.span>
        </span>
    );
}
