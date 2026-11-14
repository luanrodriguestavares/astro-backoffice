/**
 * Aster, o mascote do assistente de IA. Uma imagem só, sem fundo: recorte de
 * public/images/mascot/mascot.png exportado em public/images/mascot/aster.webp (256px).
 */
export const ASTER_NAME = 'Aster';

export function AsterAvatar({ size, className = '' }: { size: number; className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- arquivo estático já otimizado
        <img
            src="/images/mascot/aster.webp"
            alt=""
            aria-hidden
            width={size}
            height={size}
            decoding="async"
            draggable={false}
            className={`aster-avatar shrink-0 select-none object-contain ${className}`}
            style={{ width: size, height: size }}
        />
    );
}
