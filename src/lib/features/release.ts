/**
 * Telas que existem no código mas não fazem parte da v1. Ficam fora do menu e da busca,
 * e o acesso direto pela URL volta para o painel. Para liberar, basta tirar daqui.
 */
export const hiddenInV1 = ['/inventory', '/shipping', '/pixels'] as const;

export function isHiddenInV1(pathname: string) {
    return hiddenInV1.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
