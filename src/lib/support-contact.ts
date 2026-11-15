/** Canais oficiais de atendimento do Astro, exibidos no menu do perfil. */
const WHATSAPP_NUMBER = '5588994479245';

export const SUPPORT_CONTACT = {
    whatsapp: {
        label: '+55 (88) 99447-9245',
        href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Preciso de ajuda com o Astro.')}`,
    },
    emails: [
        { label: 'Suporte', email: 'support@astroengine.com.br' },
        { label: 'Financeiro', email: 'billing@astroengine.com.br' },
        { label: 'Segurança', email: 'security@astroengine.com.br' },
    ],
} as const;
