/**
 * Biblioteca de mídia (upload de arquivos). Desligada na V1: os arquivos ficariam no disco da
 * VPS, junto do banco. Precisa bater com `FILES_ENABLED` da API; desligada, imagens entram por URL.
 */
export const mediaLibraryEnabled = process.env.NEXT_PUBLIC_FILES_ENABLED === 'true';

/**
 * Telas que existem no código mas não fazem parte da v1. Ficam fora do menu e da busca,
 * e o acesso direto pela URL volta para o painel. Para liberar, basta tirar daqui.
 */
export const hiddenInV1: readonly string[] = [
    '/inventory',
    '/shipping',
    '/pixels',
    ...(mediaLibraryEnabled ? [] : ['/files']),
];

export function isHiddenInV1(pathname: string) {
    return hiddenInV1.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
