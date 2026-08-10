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
│   ├── (dashboard)/        # áreas internas protegidas, incluindo /analytics
│   ├── (platform-admin)/   # administração global, organizações e planos
│   ├── api/auth/           # BFF de sessão
│   └── api/analytics/      # proxy autenticado de relatórios JSON/CSV
├── components/
│   ├── analytics/          # cards, gráficos, funil e relatórios
│   ├── layout/             # shell, navegação, cabeçalho e tours guiados
│   ├── platform-admin/     # configuração de planos e entitlements
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

## Analytics

A rota protegida `/analytics` exige `analytics.read` e complementa a Visão geral rápida do painel.
Ela está dividida em quatro abas:

- **Resumo:** métricas financeiras e operacionais, incluindo receita, pedidos, ticket, conversão,
  MRR, churn, pagamentos, reembolsos e vendas recuperadas por e-mail;
- **Desempenho:** comparações por gateway, produto, método de pagamento e checkout;
- **Clientes:** funil, abandono, novos versus recorrentes, LTV, assinaturas e renovações;
- **Relatórios:** tabelas de pedidos, assinaturas, clientes, reembolsos, atividades, falhas de
  pagamento, uso da plataforma e projeção de receita.

O seletor global suporta 24H, 7D, 30D, 90D e 12M. Gráficos temporais permitem selecionar um trecho
com clique e arraste quando existe mais de um ponto. Datas, situações e legendas são apresentadas em
português; rótulos longos permanecem horizontais e abreviados para preservar leitura. Relatórios
extensos usam paginação/limite visual em vez de crescer indefinidamente.

Cada card, gráfico ou tabela possui download CSV integral. O BFF
`/api/analytics/[report]` encaminha sessão, query string e headers de download para
`/api/v1/analytics/:report`, sem expor o access token ao navegador.

O card **Vendas recuperadas** conta somente compras concluídas depois que a sessão foi retomada por um
link de recuperação. O período considera a data de conclusão da sessão; um e-mail enviado ou aberto
sem venda não aumenta o indicador.

A página possui tour guiado específico, sem etapa sobre a sidebar. Ele explica separadamente as abas
Resumo, Desempenho, Clientes e Relatórios, além do período, indicadores, seleção de trecho e
exportação.

## E-mails e recursos dos planos

O backoffice não envia e-mails diretamente. A API entrega pelo Resend as mensagens de conta, convite,
venda aprovada e recuperação de checkout. O admin global pode alterar os recursos por plano em
`http://localhost:3001/admin/plans`:

- `notifications.sale_email` — e-mail ao proprietário a cada venda aprovada;
- `checkout.abandoned_recovery` — e-mail ao comprador identificado quando a sessão expira.

Os defaults atuais habilitam ambos no Pro; recuperação também vem habilitada em Business e
Enterprise. O valor salvo no plano é a fonte da verdade, portanto a disponibilidade pode ser ajustada
pela interface sem alteração de código.

## Plano e cobrança do tenant

`/settings?view=plan` é a área de self-billing acessível pelo item **Plano e cobrança** da sidebar.
Ela apresenta:

- plano atual, situação, valor, forma de pagamento e próxima renovação;
- comparação dos planos ativos e contratação com cartão dentro de um modal do Astro;
- consumo e limites de cada entitlement do plano;
- últimos 50 eventos de pagamento, com comprovante quando disponível;
- aviso de pagamento atrasado e data final da carência;
- cancelamento ao fim do ciclo para usuários com `platform_billing.manage`.

A tela é organizada nas abas **Plano e pagamento**, **Uso e limites** e **Histórico de cobranças**.
O Stripe Payment Element coleta e tokeniza o cartão dentro da interface, sem página externa. Número
e CVV não passam pela API do Astro; pagamentos, renovações e falhas aparecem no histórico a partir
dos webhooks assinados do Stripe.

## Domínio próprio do checkout

`/domains` permite que clientes Pro ou superiores vinculem um checkout ao endereço
`checkout.empresa.com`. A tela mostra o registro CNAME, permite copiar os valores, verificar a
propagação, acompanhar o estado do SSL e remover o domínio. O item só aparece na sidebar quando a
assinatura está ativa, o entitlement `domains.custom` está habilitado e o usuário possui
`checkouts.publish`; a API repete a validação de plano e limite em todas as criações.

## API e desenvolvedores

`/developer` apresenta a saúde das credenciais, instruções de autenticação e os endpoints disponíveis
por escopo. A criação permite configurar validade, limite por minuto e permissões agrupadas; a lista
traduz estados e escopos, mostra último uso e expiração e oferece rotação e revogação. O segredo é
exibido apenas na criação ou rotação. O tutorial específico explica autenticação, escopos e o impacto
das ações de segurança.

## Pixels e conversões

`/pixels` está disponível quando `marketing.pixels` está habilitado no plano e o membro possui
`tracking.manage`. O item fica em Integrações, participa da busca global e não aparece na sidebar fora
do Pro+; acesso direto sem entitlement redireciona para Plano e cobrança.

A aba **Destinos** cria e edita Meta Pixel, Google Analytics/Ads e TikTok Pixel com o select
personalizado do backoffice. Cada destino define envio pelo navegador, pelo servidor ou ambos,
eventos habilitados e escopo para todos os checkouts ou uma seleção. Credenciais server-side são
enviadas ao BFF e persistidas criptografadas pela API; o valor atual nunca retorna à interface.

A aba **Histórico de envios** exibe até 100 conversões server-side recentes, situação, tentativas,
resposta e motivo de falha. O checkout público mostra o aviso de privacidade no próprio tema e não
carrega pixels antes da autorização. Compras usam o mesmo ID do pedido no browser e no backend para
deduplicação. O tour guiado explica resumo, criação, as duas abas, consentimento e deduplicação sem
criar uma etapa para a sidebar.

## Tema e tipografia

O backoffice usa Inter na pilha tipográfica global e os tokens de tema definidos em `globals.css` para
superfícies, cards, controles, gráficos e estados. Essa configuração pertence somente a esta aplicação:
o checkout público continua usando a tipografia e o tema definidos no documento do checkout e no
`@astro/checkout-renderer`.

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
