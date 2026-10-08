'use client';

import { createContext, useContext } from 'react';

const ShellActionsContext = createContext<React.ReactNode>(null);

export function ShellActionsProvider({
    actions,
    children,
}: {
    actions: React.ReactNode;
    children: React.ReactNode;
}) {
    return <ShellActionsContext.Provider value={actions}>{children}</ShellActionsContext.Provider>;
}

/** Ações globais do shell (busca, notificações) exibidas no cabeçalho de cada página. */
export function ShellActions() {
    const actions = useContext(ShellActionsContext);
    if (!actions) return null;

    return <div className="flex items-center gap-2">{actions}</div>;
}
