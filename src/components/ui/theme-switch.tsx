'use client';

import { motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function ThemeSwitch({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
    const reduceMotion = useReducedMotion();
    const spring = reduceMotion
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.65 };

    function toggle() {
        applyDashboardThemeClasses(!dark);
        onToggle();
    }

    return (
        <motion.div
            className="inline-flex"
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            transition={spring}
        >
            <Button
                type="button"
                role="switch"
                aria-checked={dark}
                aria-label={`Usar tema ${dark ? 'claro' : 'escuro'}`}
                title={`Mudar para tema ${dark ? 'claro' : 'escuro'}`}
                className="dashboard-theme-switch"
                onClick={toggle}
            >
                <motion.span
                    className="dashboard-theme-switch-sun grid place-items-center"
                    animate={{ rotate: dark ? -70 : 0, scale: dark ? 0.78 : 1, opacity: dark ? 0.55 : 1 }}
                    transition={spring}
                >
                    <Icon name="sun" className="size-3.5" />
                </motion.span>
                <span className="dashboard-theme-switch-track" aria-hidden="true">
                    <motion.span
                        className="dashboard-theme-switch-thumb"
                        animate={{ x: dark ? 14.4 : 0 }}
                        transition={spring}
                    />
                </span>
                <motion.span
                    className="dashboard-theme-switch-moon grid place-items-center"
                    animate={{ rotate: dark ? 0 : 70, scale: dark ? 1 : 0.78, opacity: dark ? 1 : 0.55 }}
                    transition={spring}
                >
                    <Icon name="moon" className="size-3.5" />
                </motion.span>
            </Button>
        </motion.div>
    );
}

export function applyDashboardThemeClasses(dark: boolean) {
    document.documentElement.classList.toggle('dashboard-dark', dark);
    document.documentElement.classList.toggle('astro-dark-portals', dark);
}
