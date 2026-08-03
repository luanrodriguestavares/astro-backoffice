'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    function PasswordInput({ className = '', ...props }, ref) {
        const [visible, setVisible] = useState(false);
        return (
            <span className="relative block">
                <input
                    ref={ref}
                    {...props}
                    type={visible ? 'text' : 'password'}
                    className={`${className} pr-11`}
                />
                <Button
                    type="button"
                    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={visible}
                    onClick={() => setVisible((current) => !current)}
                    className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-brand-soft hover:text-brand-strong"
                >
                    <Icon name={visible ? 'eye-off' : 'eye'} className="size-4" />
                </Button>
            </span>
        );
    },
);
