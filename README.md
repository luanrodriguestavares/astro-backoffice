# Astro Backoffice

Frontend interno da plataforma Astro, usado pelas organizações para administrar produtos, checkouts,
gateways, vendas, clientes e assinaturas.

## Stack

- Next.js 16.2.10 com App Router e Turbopack;
- React 19;
- TypeScript estrito;
- Tailwind CSS 4;
- ESLint com Core Web Vitals.

## Desenvolvimento

Inicie primeiro a API conforme o [`README` da raiz](../README.md). Depois, em outro terminal:

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

O backoffice inicia em `http://localhost:3001`, enquanto a API permanece em `http://localhost:3000`.
Nas execuções seguintes, depois que `.env.local` e as dependências já existirem, basta executar:

```bash
pnpm dev
```

Se a porta `3001` já estiver ocupada, verifique se existe outra instância do backoffice ou algum container antigo usando essa porta.

## Estrutura

```text
src/
├── app/
│   ├── (auth)/login/       # autenticação
│   ├── (auth)/register/    # criação da conta e organização
│   ├── (dashboard)/        # áreas internas protegidas
│   └── api/auth/           # BFF de sessão
├── components/
│   ├── layout/             # shell, navegação e cabeçalho
│   └── ui/                 # componentes visuais compartilhados
├── lib/api/                # cliente e contratos da API Astro
└── proxy.ts                # proteção das rotas internas
```

Login e cadastro são enviados pelo servidor Next para a API. Access e refresh tokens ficam em cookies
`HttpOnly`, nunca em `localStorage`. O proxy renova a sessão antes de abrir rotas protegidas.

Produtos, preços, checkouts, cupons, clientes, gateways, arquivos, inventário, frete, assinaturas,
equipe, notificações, developer API keys, roadmap e administração da plataforma já possuem
integrações com endpoints da API. Algumas telas de consulta ainda podem apresentar estados vazios ou
conteúdo de apoio enquanto seus fluxos completos são finalizados.

## Verificação

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Ainda não existe suíte automatizada de testes unitários, de integração ou end-to-end neste projeto.
Os requisitos de deploy e go-live estão em
[`PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md).
