/**
 * Versão publicada dos Termos de Uso e da Política de Privacidade (landing: /termos e /privacidade).
 * Ao mudar o texto de forma relevante, atualize aqui para registrar o novo aceite no cadastro.
 */
export const TERMS_VERSION = '2026-11-10';

const landing = (process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:4321').replace(/\/$/, '');

export const termsUrl = `${landing}/termos`;
export const privacyUrl = `${landing}/privacidade`;
