# Astro Backoffice

O checkout builder consome `@astro/checkout-renderer` a partir de
`../checkout-renderer`. O backoffice mantém edição e dados de preview; tema,
componentes e variantes visuais pertencem ao renderer compartilhado.

Frontend interno da plataforma Astro, usado pelas organizações para administrar produtos, checkouts,
gateways, vendas, clientes e assinaturas.

## Stack

- Next.js 16.2.11 com App Router e Turbopack;
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

No editor de checkout, **Pagamentos** define o ambiente e vincula explicitamente uma conexão ativa
para cada método habilitado. Em produção, a API recusa publicações sem esses vínculos ou com gateway
mock, não testado, incompatível, desatualizado ou sem segredo de webhook.

Produtos, preços, checkouts, cupons, clientes, gateways, arquivos, inventário, frete, assinaturas,
equipe, notificações, developer API keys, roadmap e administração da plataforma já possuem
integrações com endpoints da API. Algumas telas de consulta ainda podem apresentar estados vazios ou
conteúdo de apoio enquanto seus fluxos completos são finalizados.

## Verificação

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` executa todos os gates. A suíte atual cobre contratos de configuração e seleção de
gateway; jornadas de navegador continuam sendo requisito de staging.

## Produção

Variáveis obrigatórias:

```env
ASTRO_API_URL=http://api:3000
NEXT_PUBLIC_APP_NAME=Astro
NEXT_PUBLIC_CHECKOUT_URL=https://checkout.example.com
```

`ASTRO_API_URL` é server-side e pode usar a rede privada do cluster. A URL pública do checkout deve
usar HTTPS. A imagem standalone, sem processo root, inclui healthcheck em `/api/health`, que só
responde `ready` quando a readiness da API também está verde:

```bash
docker build \
  --build-arg NEXT_PUBLIC_CHECKOUT_URL=https://checkout.example.com \
  -t astro-backoffice .

ASTRO_BACKOFFICE_URL=https://app.example.com pnpm smoke:production
```

O workflow `.github/workflows/ci.yml` usa lockfile congelado, auditoria de dependências, lint, typecheck,
testes, build e imagem. A aplicação envia CSP e demais headers defensivos; cookies de sessão são
`HttpOnly`, `Secure` em produção, `SameSite=Strict` e de alta prioridade.

Os requisitos restantes de deploy e go-live estão em
[`PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md).
