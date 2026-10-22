import { AuthFrame } from '@/components/auth/auth-frame';

/*
 * Login e cadastro compartilham esta moldura. Como o layout persiste na navegação
 * entre as duas rotas, a tela se transforma (card, vitrine e prévia animam) em vez
 * de ser trocada por inteiro.
 */
export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
    return <AuthFrame>{children}</AuthFrame>;
}
