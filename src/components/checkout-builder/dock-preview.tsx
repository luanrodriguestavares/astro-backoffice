/**
 * Prévia animada das áreas do dock (Funil, Checkout, Pagamento): no hover ou foco, um cartão
 * mostra em miniatura o que a área faz. Decorativo: o nome acessível fica no próprio botão.
 */

export type DockPreviewKind = 'funnel' | 'checkout' | 'payment';

export const dockPreviewCopy: Record<DockPreviewKind, { title: string; description: string }> = {
    funnel: {
        title: 'Funil',
        description: 'O caminho do comprador: páginas, checkout, pagamento e resultados.',
    },
    checkout: {
        title: 'Checkout',
        description: 'A página onde o comprador preenche os dados e paga.',
    },
    payment: {
        title: 'Pagamento',
        description: 'O orquestrador: por qual gateway cada venda passa e o que fazer depois.',
    },
};

export function DockPreview({
    kind,
    title,
    description,
}: {
    kind: DockPreviewKind;
    title?: string;
    description?: string;
}) {
    const copy = dockPreviewCopy[kind];
    return (
        <span className="ce-dock-preview" aria-hidden="true">
            <span className="ce-dock-preview-art" data-art={kind}>
                <PreviewArt kind={kind} />
            </span>
            <b>{title ?? copy.title}</b>
            <small>{description ?? copy.description}</small>
        </span>
    );
}

function PreviewArt({ kind }: { kind: DockPreviewKind }) {
    switch (kind) {
        case 'funnel':
            return (
                <svg viewBox="0 0 220 96">
                    <path className="art-line" d="M50 48 H84" />
                    <path className="art-line" d="M128 48 C146 48 146 24 164 24" />
                    <path className="art-line" d="M128 48 C146 48 146 72 164 72" />
                    <rect className="art-node" x="8" y="34" width="42" height="28" rx="7" />
                    <rect
                        className="art-node art-node--brand"
                        x="84"
                        y="34"
                        width="44"
                        height="28"
                        rx="7"
                    />
                    <rect
                        className="art-node art-node--ok"
                        x="164"
                        y="10"
                        width="46"
                        height="28"
                        rx="7"
                    />
                    <rect
                        className="art-node art-node--bad"
                        x="164"
                        y="58"
                        width="46"
                        height="28"
                        rx="7"
                    />
                    <circle className="art-dot art-dot--funnel" r="4" />
                </svg>
            );
        case 'checkout':
            return (
                <svg viewBox="0 0 220 96">
                    <rect className="art-card" x="50" y="6" width="120" height="84" rx="9" />
                    <rect
                        className="art-field art-field--1"
                        x="62"
                        y="18"
                        width="96"
                        height="10"
                        rx="4"
                    />
                    <rect
                        className="art-field art-field--2"
                        x="62"
                        y="34"
                        width="96"
                        height="10"
                        rx="4"
                    />
                    <rect
                        className="art-field art-field--3"
                        x="62"
                        y="50"
                        width="96"
                        height="10"
                        rx="4"
                    />
                    <rect className="art-button" x="62" y="68" width="96" height="14" rx="5" />
                </svg>
            );
        case 'payment':
            return (
                <svg viewBox="0 0 220 96">
                    <path className="art-line" d="M26 48 H62" />
                    <path className="art-line" d="M118 30 H150 C164 30 164 48 178 48" />
                    <path className="art-line art-line--fail" d="M90 42 V56" />
                    <path className="art-line" d="M118 68 H150 C164 68 164 48 178 48" />
                    <circle className="art-node art-node--brand" cx="18" cy="48" r="9" />
                    <rect
                        className="art-chip art-chip--a"
                        x="62"
                        y="20"
                        width="56"
                        height="20"
                        rx="10"
                    />
                    <rect
                        className="art-chip art-chip--b"
                        x="62"
                        y="58"
                        width="56"
                        height="20"
                        rx="10"
                    />
                    <circle className="art-node art-node--ok" cx="190" cy="48" r="12" />
                    <path className="art-check art-check--late" d="M184 48 L188 52 L196 44" />
                    <circle className="art-dot art-dot--payment" r="4" />
                </svg>
            );
    }
}
