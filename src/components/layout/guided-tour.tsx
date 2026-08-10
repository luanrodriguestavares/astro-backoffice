'use client';

import type { Driver, DriveStep } from 'driver.js';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { guidedTourStartEvent } from '@/components/layout/guided-tour-trigger';

export function GuidedTour() {
    const pathname = usePathname();
    const driverRef = useRef<Driver | null>(null);

    const startTour = useCallback(async () => {
        driverRef.current?.destroy();

        const { driver } = await import('driver.js');
        const darkTheme =
            document.documentElement.classList.contains('astro-dark-portals') ||
            document.querySelector('.dashboard-dark') !== null;
        document.documentElement.classList.add('astro-tour-active');
        const tour = driver({
            animate: true,
            smoothScroll: true,
            allowClose: true,
            allowScroll: false,
            overlayClickBehavior: 'close',
            overlayColor: '#000000',
            overlayOpacity: darkTheme ? 0.84 : 0.7,
            stagePadding: 8,
            stageRadius: 18,
            popoverClass: 'astro-tour-popover',
            popoverOffset: 14,
            showProgress: true,
            progressText: '{{current}} de {{total}}',
            nextBtnText: 'Próximo',
            prevBtnText: 'Voltar',
            doneBtnText: 'Concluir',
            onDestroyed: () => {
                driverRef.current = null;
                document.documentElement.classList.remove('astro-tour-active');
            },
            steps: stepsForPath(pathname),
        });

        driverRef.current = tour;
        tour.drive();
    }, [pathname]);

    useEffect(() => {
        const handleStart = () => void startTour();
        window.addEventListener(guidedTourStartEvent, handleStart);
        return () => window.removeEventListener(guidedTourStartEvent, handleStart);
    }, [startTour]);

    useEffect(() => {
        driverRef.current?.destroy();
        document.documentElement.classList.remove('astro-tour-active');
    }, [pathname]);

    useEffect(
        () => () => {
            driverRef.current?.destroy();
            document.documentElement.classList.remove('astro-tour-active');
        },
        [],
    );

    return null;
}

function stepsForPath(pathname: string): DriveStep[] {
    if (pathname === '/dashboard') return dashboardSteps;
    if (pathname === '/analytics') return analyticsSteps;
    if (pathname === '/developer') return developerSteps;
    if (pathname === '/pixels') return trackingSteps;
    if (pathname === '/products') return productSteps;
    if (pathname === '/coupons') return couponSteps;
    if (/^\/checkouts\/[^/]+\/builder\/?$/.test(pathname)) return checkoutBuilderSteps;
    return genericSteps(pageTours[pathname] ?? fallbackTour);
}

type PageTour = {
    title: string;
    description: string;
    action?: string;
    summary?: string;
    contentTitle: string;
    content: string;
};

function genericSteps(tour: PageTour): DriveStep[] {
    return [
        {
            element: '[data-tour="page-header"]',
            popover: {
                title: tour.title,
                description: tour.description,
                side: 'bottom',
                align: 'start',
            },
        },
        ...(tour.action
            ? [
                  {
                      element: '[data-tour="page-actions"]',
                      skipMissingElement: true,
                      popover: {
                          title: 'Ação principal',
                          description: tour.action,
                          side: 'left' as const,
                          align: 'center' as const,
                      },
                  },
              ]
            : []),
        ...(tour.summary
            ? [
                  {
                      element: '[data-tour="page-summary"]',
                      skipMissingElement: true,
                      popover: {
                          title: 'Resumo da página',
                          description: tour.summary,
                          side: 'bottom' as const,
                          align: 'center' as const,
                      },
                  },
              ]
            : []),
        {
            element: '[data-tour="page-primary"]',
            skipMissingElement: true,
            popover: {
                title: tour.contentTitle,
                description: tour.content,
                side: 'top',
                align: 'center',
            },
        },
    ];
}

const pageTours: Record<string, PageTour> = {
    '/checkouts': {
        title: 'Checkouts',
        description: 'Crie e publique as experiências de venda usadas pelos seus clientes.',
        summary: 'Veja quantos checkouts estão publicados ou ainda em rascunho.',
        contentTitle: 'Experiências de venda',
        content:
            'Crie um checkout, abra o construtor visual, publique alterações e consulte o link público.',
    },
    '/customers': {
        title: 'Clientes',
        description: 'Consulte os compradores identificados durante pedidos e pagamentos.',
        summary: 'Acompanhe o tamanho e a atividade recente da sua base de clientes.',
        contentTitle: 'Base de clientes',
        content: 'Use a busca e a paginação para localizar contatos e revisar seu histórico.',
    },
    '/developer': {
        title: 'API e desenvolvedores',
        description: 'Gerencie as credenciais usadas para integrar sistemas externos ao Astro.',
        action: 'Crie uma nova chave e selecione somente os escopos necessários para a integração.',
        contentTitle: 'Chaves de API',
        content:
            'Confira prefixo, permissões, limite de uso, status e último acesso de cada chave.',
    },
    '/files': {
        title: 'Biblioteca de mídia',
        description: 'Centralize imagens e documentos reutilizados em produtos e checkouts.',
        contentTitle: 'Arquivos e pastas',
        content:
            'Envie arquivos, organize-os em pastas, pesquise e acompanhe o armazenamento usado.',
    },
    '/gateways': {
        title: 'Gateways',
        description: 'Conecte os provedores responsáveis pelo processamento dos pagamentos.',
        summary: 'Acompanhe conexões, volume processado e taxa de aprovação.',
        contentTitle: 'Central de gateways',
        content: 'Conecte, teste e gerencie as credenciais e o ambiente de cada provedor.',
    },
    '/inventory': {
        title: 'Estoque',
        description: 'Esta área está sendo preparada para o gerenciamento de produtos físicos.',
        contentTitle: 'Recurso em construção',
        content: 'Aqui serão exibidos saldos, reservas, movimentações e alertas de estoque.',
    },
    '/invoices': {
        title: 'Faturas',
        description: 'Acompanhe cobranças geradas para assinaturas e seus vencimentos.',
        contentTitle: 'Cobranças recorrentes',
        content: 'Pesquise faturas e confira valores, situação do pagamento e datas importantes.',
    },
    '/notifications': {
        title: 'Notificações',
        description: 'Veja acontecimentos recentes e avisos importantes da operação.',
        contentTitle: 'Atualizações da operação',
        content: 'As notificações são organizadas por data e mostram o contexto de cada evento.',
    },
    '/orders': {
        title: 'Pedidos',
        description: 'Consulte o que foi comprado e a situação comercial de cada venda.',
        summary: 'Acompanhe valores, pedidos pagos, saldo a receber e descontos.',
        contentTitle: 'Lista de pedidos',
        content: 'Busque pedidos, confira cliente e itens e abra os detalhes financeiros da venda.',
    },
    '/payments': {
        title: 'Vendas e pagamentos',
        description: 'Acompanhe as transações enviadas aos gateways conectados.',
        summary: 'Veja volume recebido, aprovação, processamentos e falhas.',
        contentTitle: 'Transações',
        content:
            'Use os filtros para localizar pagamentos e abra uma transação para ver seus detalhes.',
    },
    '/refunds': {
        title: 'Reembolsos',
        description: 'Consulte devoluções solicitadas ou concluídas na sua operação.',
        contentTitle: 'Histórico de reembolsos',
        content: 'Localize devoluções e confira valor, motivo, status e data da solicitação.',
    },
    '/roadmap': {
        title: 'Roadmap',
        description:
            'Sugira melhorias, vote na comunidade e acompanhe o que está em desenvolvimento.',
        contentTitle: 'Ideias da comunidade',
        content: 'Navegue pelas etapas, pesquise propostas, vote e envie uma nova sugestão.',
    },
    '/settings': {
        title: 'Configurações',
        description: 'Gerencie os dados, a identidade visual e as preferências da organização.',
        contentTitle: 'Preferências da conta',
        content:
            'Atualize a organização, consulte sua conta e personalize tema, cores e aparência.',
    },
    '/shipping': {
        title: 'Frete',
        description: 'Esta área está sendo preparada para a operação de produtos físicos.',
        contentTitle: 'Recurso em construção',
        content: 'Aqui serão configuradas zonas de entrega, tarifas e prazos de envio.',
    },
    '/subscriptions': {
        title: 'Assinaturas',
        description: 'Acompanhe cobranças recorrentes, renovações e cancelamentos.',
        summary: 'Veja assinaturas ativas, receita recorrente e ciclos em atenção.',
        contentTitle: 'Planos recorrentes',
        content: 'Pesquise assinaturas e confira cliente, plano, valor, ciclo e status.',
    },
    '/team': {
        title: 'Equipe',
        description: 'Controle quem pode acessar a organização e quais funções cada pessoa possui.',
        action: 'Envie um convite informando o e-mail e o nível de acesso do novo membro.',
        summary: 'Acompanhe membros, acessos ativos e convites pendentes.',
        contentTitle: 'Membros e convites',
        content:
            'Revise os acessos atuais, altere funções permitidas e acompanhe convites enviados.',
    },
    '/webhooks': {
        title: 'Webhooks',
        description: 'Configure endpoints que recebem eventos da plataforma em tempo real.',
        action: 'Cadastre a URL, escolha os eventos e ative o endpoint da integração.',
        contentTitle: 'Endpoints configurados',
        content: 'Consulte URLs, eventos inscritos e o status de cada webhook.',
    },
};

const fallbackTour: PageTour = {
    title: 'Conheça esta página',
    description: 'Este tutorial apresenta os recursos disponíveis nesta área do Astro.',
    contentTitle: 'Conteúdo principal',
    content: 'Use esta área para consultar informações e executar as ações disponíveis.',
};

const sharedNavigationStep: DriveStep = {
    element: '[data-tour="main-navigation"]',
    popover: {
        title: 'Navegação principal',
        description: 'Use este menu para acessar as demais áreas da sua operação.',
        side: 'right',
        align: 'start',
    },
};

const trackingSteps: DriveStep[] = [
    {
        element: '[data-tour="page-header"]',
        popover: {
            title: 'Pixels e conversões',
            description:
                'Centralize a mensuração dos seus checkouts com Meta, Google e TikTok, sem inserir códigos personalizados na página.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="tracking-summary"]',
        popover: {
            title: 'Visão rápida da integração',
            description:
                'Acompanhe quantos destinos estão ativos e identifique imediatamente entregas concluídas ou falhas recentes.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="tracking-create"]',
        skipMissingElement: true,
        popover: {
            title: 'Configure um destino',
            description:
                'Escolha o provedor, informe o ID, defina navegador e servidor, selecione os eventos e limite a integração a checkouts específicos quando necessário.',
            side: 'left',
            align: 'center',
        },
    },
    {
        element: '[data-tour="tracking-tabs"]',
        popover: {
            title: 'Aba Destinos',
            description:
                'Em Destinos você gerencia IDs, credenciais criptografadas, escopo dos checkouts e canais de envio de cada pixel.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="tracking-tabs"]',
        popover: {
            title: 'Aba Histórico de envios',
            description:
                'Abra Histórico de envios para conferir as conversões server-side, tentativas, resposta do provedor e o motivo de eventuais falhas.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="tracking-destinations"]',
        popover: {
            title: 'Consentimento e deduplicação',
            description:
                'O checkout só carrega pixels após autorização do comprador. Compras usam o mesmo ID de pedido no navegador e no servidor para evitar contagem duplicada.',
            side: 'top',
            align: 'center',
        },
    },
];

const dashboardSteps: DriveStep[] = [
    {
        popover: {
            title: 'Bem-vindo ao Astro',
            description:
                'Este tour rápido apresenta os atalhos principais para acompanhar e configurar sua operação.',
            side: 'bottom',
            align: 'center',
        },
    },
    sharedNavigationStep,
    {
        element: '[data-tour="global-search"]',
        popover: {
            title: 'Busca rápida',
            description: 'Encontre páginas e recursos do sistema sem percorrer todos os menus.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="dashboard-home"]',
        popover: {
            title: 'Sua visão geral',
            description:
                'A página inicial reúne os dados mais importantes da operação e atalhos para as próximas ações.',
            side: 'top',
            align: 'center',
        },
    },
    {
        element: '[data-tour="dashboard-metrics"]',
        skipMissingElement: true,
        popover: {
            title: 'Indicadores',
            description: 'Acompanhe receita, pedidos, conversão e ticket médio rapidamente.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="dashboard-performance"]',
        skipMissingElement: true,
        popover: {
            title: 'Desempenho da operação',
            description:
                'Use os gráficos para observar a evolução das vendas e a distribuição entre gateways.',
            side: 'top',
            align: 'center',
        },
    },
    {
        element: '[data-tour="dashboard-recent"]',
        popover: {
            title: 'Atividade recente',
            description:
                'Confira os últimos checkouts e eventos da operação sem sair da página inicial.',
            side: 'top',
            align: 'center',
        },
    },
    {
        element: '[data-tour="account-menu"]',
        popover: {
            title: 'Sua conta',
            description: 'Aqui você encontra as configurações da conta e a opção de sair.',
            side: 'bottom',
            align: 'end',
        },
    },
];

const analyticsSteps: DriveStep[] = [
    {
        element: '[data-tour="page-header"]',
        popover: {
            title: 'Central de Analytics',
            description:
                'Explore indicadores financeiros, tendências, desempenho de vendas, recorrência e relatórios detalhados da sua operação.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="analytics-tab-overview"]',
        popover: {
            title: 'Resumo',
            description:
                'Reúne os principais indicadores da operação e as tendências ao longo do tempo: receita, pedidos, ticket médio, conversão, MRR e assinaturas.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="analytics-tab-performance"]',
        popover: {
            title: 'Desempenho',
            description:
                'Compara gateways, produtos, métodos de pagamento e checkouts. Use esta visão para descobrir o que mais vende e gera receita.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="analytics-tab-customers"]',
        popover: {
            title: 'Clientes',
            description:
                'Apresenta o funil do checkout, abandono, clientes novos e recorrentes, LTV, situação das assinaturas e resultados das renovações.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="analytics-tab-reports"]',
        popover: {
            title: 'Relatórios',
            description:
                'Disponibiliza tabelas detalhadas de pedidos, assinaturas, clientes, reembolsos, atividades e falhas, além do uso do plano e da projeção de receita.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="analytics-period"]',
        popover: {
            title: 'Período da análise',
            description:
                'Escolha de 24 horas a 12 meses. Esse período é global e atualiza os indicadores e gráficos de qualquer aba selecionada.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="analytics-metrics"]',
        popover: {
            title: 'Indicadores principais',
            description:
                'Acompanhe receita, pedidos, ticket médio, conversão, MRR, assinaturas e pagamentos. O ícone de download exporta cada indicador em CSV.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="analytics-trend"]',
        skipMissingElement: true,
        popover: {
            title: 'Tendências e seleção',
            description:
                'Passe o cursor para ver cada ponto ou clique e arraste quando houver mais de um ponto para analisar um trecho específico do período.',
            side: 'top',
            align: 'center',
        },
    },
    {
        element: '[data-tour="analytics-download"]',
        skipMissingElement: true,
        popover: {
            title: 'Exportação integral',
            description:
                'Use o botão CSV de qualquer gráfico ou relatório para baixar os dados completos com os filtros atuais.',
            side: 'left',
            align: 'center',
        },
    },
];

const developerSteps: DriveStep[] = [
    {
        element: '[data-tour="page-header"]',
        popover: {
            title: 'API e desenvolvedores',
            description:
                'Esta área concentra as credenciais usadas por servidores, automações e integrações externas para acessar a API do Astro.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="developer-summary"]',
        popover: {
            title: 'Saúde das credenciais',
            description:
                'Veja quantas chaves estão ativas, quais foram usadas nos últimos 30 dias e quais precisam ser renovadas em breve.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="developer-auth"]',
        popover: {
            title: 'Como autenticar',
            description:
                'Envie a chave pelo header x-api-key. O segredo completo aparece somente uma vez e deve ficar no servidor ou em um cofre de segredos, nunca no frontend.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="developer-endpoints"]',
        popover: {
            title: 'Endpoints e escopos',
            description:
                'Consulte quais operações aceitam API key e qual escopo cada uma exige. Separe chaves por integração e conceda apenas as permissões necessárias.',
            side: 'top',
            align: 'center',
        },
    },
    {
        element: '[data-tour="developer-create"]',
        popover: {
            title: 'Criar uma chave',
            description:
                'Defina nome, limite por minuto, validade e escopos. As opções são agrupadas como em Webhooks para deixar clara a finalidade de cada permissão.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="developer-keys"]',
        popover: {
            title: 'Gerenciar acessos',
            description:
                'Acompanhe último uso e expiração. Rotacionar gera um novo segredo e revoga o anterior; revogar interrompe a integração imediatamente.',
            side: 'top',
            align: 'center',
        },
    },
];

const productSteps: DriveStep[] = [
    {
        element: '[data-tour="products-page"]',
        popover: {
            title: 'Catálogo de produtos',
            description:
                'Nesta página você cadastra produtos, define o modelo de cobrança e acompanha sua disponibilidade.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="product-create"]',
        skipMissingElement: true,
        popover: {
            title: 'Criar produto',
            description:
                'Cadastre o nome, tipo, imagem, preço inicial e escolha entre pagamento único ou recorrente.',
            side: 'left',
            align: 'center',
        },
    },
    {
        element: '[data-tour="product-controls"]',
        popover: {
            title: 'Busca e filtros',
            description:
                'Localize produtos pelo nome e filtre o catálogo por ativos, rascunhos ou inativos.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="products-list"]',
        popover: {
            title: 'Gerencie o catálogo',
            description:
                'Consulte preço, cobrança e status. Na coluna de ações você pode editar, ativar, desativar ou excluir.',
            side: 'top',
            align: 'center',
        },
    },
];

const couponSteps: DriveStep[] = [
    {
        element: '[data-tour="coupons-page"]',
        popover: {
            title: 'Cupons e promoções',
            description:
                'Aqui você cria códigos de desconto e controla onde cada promoção pode ser utilizada.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="coupon-create"]',
        skipMissingElement: true,
        popover: {
            title: 'Criar cupom',
            description:
                'Defina o código, o desconto, a validade e onde ele será aceito. Para aplicá-lo, o checkout precisa conter o componente Campo de cupom.',
            side: 'left',
            align: 'center',
        },
    },
    {
        element: '[data-tour="coupon-summary"]',
        popover: {
            title: 'Resumo dos cupons',
            description:
                'Veja quantos cupons estão cadastrados, ativos e com data de expiração configurada.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="coupon-list"]',
        popover: {
            title: 'Regras configuradas',
            description:
                'Busque códigos, confira desconto e validade e altere o produto ou checkout associado ao cupom.',
            side: 'top',
            align: 'center',
        },
    },
];

const checkoutBuilderSteps: DriveStep[] = [
    {
        element: '[data-tour="builder-header"]',
        popover: {
            title: 'Seu checkout e o estado do trabalho',
            description:
                'Aqui você identifica o checkout, volta para a listagem e acompanha se existem alterações não salvas ou se a versão já foi publicada.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="builder-components"]',
        popover: {
            title: 'Biblioteca de componentes',
            description:
                'Os componentes estão separados por categoria. Arraste títulos, formulários, resumo, formas de pagamento e outros blocos para o checkout.',
            side: 'right',
            align: 'start',
        },
    },
    {
        element: '.astro-checkout-editor [class*="_PuckCanvas-controls_"]',
        skipMissingElement: true,
        popover: {
            title: 'Celular, tablet e desktop',
            description:
                'Alterne o tamanho do preview para revisar a experiência em cada dispositivo. O controle de zoom ajuda a visualizar páginas maiores.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '.astro-checkout-editor [class*="_PuckCanvas_"]',
        skipMissingElement: true,
        popover: {
            title: 'Monte a página no canvas',
            description:
                'Este é o checkout editável. Reordene os blocos arrastando, selecione um componente para configurá-lo e confira o resultado em tempo real.',
            side: 'left',
            align: 'center',
        },
    },
    {
        element: '.astro-checkout-editor [class*="_Sidebar--right_"]',
        skipMissingElement: true,
        popover: {
            title: 'Propriedades e tema',
            description:
                'Ao selecionar um bloco, seus campos aparecem aqui. Sem uma seleção, esta área permite configurar tema, cores, tipografia, espaçamento e largura da página.',
            side: 'left',
            align: 'start',
        },
    },
    {
        element: '[data-tour="builder-history"]',
        popover: {
            title: 'Histórico de versões',
            description:
                'Cada publicação cria uma versão. Use o histórico para revisar alterações anteriores e restaurar uma versão quando necessário.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="builder-public-link"]',
        skipMissingElement: true,
        popover: {
            title: 'Link público',
            description:
                'Depois da primeira publicação, copie o endereço compartilhável ou abra o checkout real em uma nova aba.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="builder-readiness"]',
        popover: {
            title: 'Verifique a prontidão',
            description:
                'Antes de publicar, confira componentes obrigatórios, formas de pagamento, gateways e vínculos de cada método. O contador indica pendências.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="builder-preview"]',
        popover: {
            title: 'Preview isolado',
            description:
                'Abra uma visualização limpa, sem os controles do backoffice, para conferir como a página será apresentada ao cliente.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="builder-save"]',
        skipMissingElement: true,
        popover: {
            title: 'Salvar rascunho',
            description:
                'Salve o trabalho atual sem alterar a versão pública. Você pode continuar editando e publicar somente quando estiver pronto.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="builder-publish"]',
        popover: {
            title: 'Publicar o checkout',
            description:
                'Publicar coloca as alterações no checkout real e registra uma nova versão no histórico. Revise a prontidão e o preview antes de concluir.',
            side: 'bottom',
            align: 'end',
        },
    },
];
