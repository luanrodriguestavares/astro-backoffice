"use client";

import type { Config, Data } from "@puckeditor/core";

type BuilderProps = {
  hero: { eyebrow: string; title: string; description: string; buttonLabel: string; alignment: "left" | "center" };
  text: { title: string; content: string; alignment: "left" | "center" };
  image: { url: string; alt: string; caption: string };
  benefits: { title: string; items: { title: string; description: string }[] };
  testimonials: { title: string; items: { quote: string; name: string; role: string }[] };
  faq: { title: string; items: { question: string; answer: string }[] };
  guarantee: { title: string; description: string; days: number };
  countdown: { title: string; deadline: string };
  product_summary: { title: string; description: string };
  checkout_form: { title: string; description: string; buttonLabel: string };
  order_summary: { title: string };
  footer: { text: string; showSecurity: boolean };
};

export type BuilderRootProps = { backgroundColor: string; surfaceColor: string; textColor: string; accentColor: string; radius: number; maxWidth: number };
export type BuilderData = Data<BuilderProps, BuilderRootProps>;

const alignment = [{ label: "Esquerda", value: "left" }, { label: "Centralizado", value: "center" }] as const;
const fixed = { delete: false, drag: false, duplicate: false, insert: false } as const;

export const checkoutBuilderConfig: Config<BuilderProps, BuilderRootProps> = {
  categories: {
    content: { title: "Conteúdo", components: ["hero", "text", "image", "benefits", "testimonials", "faq", "guarantee", "countdown"], defaultExpanded: true },
    checkout: { title: "Checkout", components: ["product_summary", "checkout_form", "order_summary"] },
    structure: { title: "Estrutura", components: ["footer"] },
  },
  root: {
    fields: {
      backgroundColor: { type: "text", label: "Cor do fundo" }, surfaceColor: { type: "text", label: "Cor dos cards" }, textColor: { type: "text", label: "Cor do texto" }, accentColor: { type: "text", label: "Cor principal" }, radius: { type: "number", label: "Arredondamento", min: 0, max: 40 }, maxWidth: { type: "number", label: "Largura máxima", min: 720, max: 1440 },
    },
    defaultProps: { backgroundColor: "#f7f7fb", surfaceColor: "#ffffff", textColor: "#202235", accentColor: "#7065e8", radius: 16, maxWidth: 1120 },
    render: ({ children, ...theme }) => <div style={{ ...variables(theme), minHeight: "100vh", background: safeColor(theme.backgroundColor, "#f7f7fb"), color: safeColor(theme.textColor, "#202235"), padding: "40px 20px" }}><main style={{ maxWidth: clamp(theme.maxWidth, 720, 1440), margin: "0 auto", display: "grid", gap: 24 }}>{children}</main></div>,
  },
  components: {
    hero: {
      label: "Apresentação",
      fields: { eyebrow: { type: "text", label: "Chamada superior", contentEditable: true }, title: { type: "textarea", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, buttonLabel: { type: "text", label: "Texto do botão" }, alignment: { type: "radio", label: "Alinhamento", options: alignment } },
      defaultProps: { eyebrow: "Oferta especial", title: "Uma transformação começa aqui", description: "Apresente de forma clara o principal resultado que seu produto entrega.", buttonLabel: "Quero começar", alignment: "center" },
      render: ({ eyebrow, title, description, buttonLabel, alignment }) => <section style={{ ...card(), textAlign: alignment, padding: "clamp(36px, 7vw, 88px) 24px", overflow: "hidden", position: "relative" }}><div style={{ position: "absolute", width: 280, height: 280, borderRadius: 999, background: "var(--checkout-accent)", opacity: .1, filter: "blur(24px)", right: -80, top: -100 }} /><div style={{ position: "relative", maxWidth: 760, margin: alignment === "center" ? "0 auto" : undefined }}><p style={{ color: "var(--checkout-accent)", fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>{eyebrow}</p><h1 style={{ margin: "14px 0 0", fontSize: "clamp(36px, 6vw, 66px)", lineHeight: 1.04, letterSpacing: "-.045em" }}>{title}</h1><p style={{ margin: "20px 0 0", fontSize: 18, lineHeight: 1.7, opacity: .72 }}>{description}</p><button type="button" style={primaryButton()}>{buttonLabel}</button></div></section>,
    },
    text: {
      label: "Texto",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, content: { type: "textarea", label: "Conteúdo", contentEditable: true }, alignment: { type: "radio", label: "Alinhamento", options: alignment } },
      defaultProps: { title: "Conte sua história", content: "Explique o problema, apresente a solução e ajude seu cliente a entender por que essa oferta é ideal para ele.", alignment: "left" },
      render: ({ title, content, alignment }) => <section style={{ ...card(), padding: "clamp(28px, 5vw, 56px)", textAlign: alignment }}><h2 style={heading()}>{title}</h2><p style={{ margin: "14px auto 0", maxWidth: 780, whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.8, opacity: .72 }}>{content}</p></section>,
    },
    image: {
      label: "Imagem",
      fields: { url: { type: "text", label: "URL HTTPS" }, alt: { type: "text", label: "Texto alternativo" }, caption: { type: "text", label: "Legenda" } },
      defaultProps: { url: "", alt: "Imagem da oferta", caption: "" },
      render: ({ url, alt, caption }) => <figure style={{ ...card(), margin: 0, padding: 12, overflow: "hidden" }}>{safeHttpsUrl(url) ? <div role="img" aria-label={alt} style={{ minHeight: 420, backgroundImage: `url(${JSON.stringify(url)})`, backgroundPosition: "center", backgroundSize: "cover", borderRadius: "calc(var(--checkout-radius) - 6px)" }} /> : <div style={{ display: "grid", minHeight: 280, placeItems: "center", borderRadius: "calc(var(--checkout-radius) - 6px)", background: "#eeeef5", color: "#77798a" }}>Informe uma URL HTTPS para a imagem</div>}{caption && <figcaption style={{ padding: "12px 8px 4px", textAlign: "center", fontSize: 13, opacity: .65 }}>{caption}</figcaption>}</figure>,
    },
    benefits: {
      label: "Benefícios",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Benefícios", min: 1, max: 6, arrayFields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" } }, defaultItemProps: { title: "Novo benefício", description: "Descreva este benefício." }, getItemSummary: (item) => item.title } },
      defaultProps: { title: "Por que escolher esta oferta?", items: [{ title: "Resultado rápido", description: "Comece imediatamente com um caminho claro." }, { title: "Método comprovado", description: "Siga um processo estruturado e objetivo." }, { title: "Suporte de verdade", description: "Tenha ajuda quando precisar." }] },
      render: ({ title, items }) => <section style={{ padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 28 }}>{items.map((item, index) => <article key={`${item.title}-${index}`} style={{ ...card(), padding: 24 }}><span style={numberBadge()}>{index + 1}</span><h3 style={{ margin: "18px 0 0", fontSize: 18 }}>{item.title}</h3><p style={{ margin: "9px 0 0", lineHeight: 1.65, opacity: .68 }}>{item.description}</p></article>)}</div></section>,
    },
    testimonials: {
      label: "Depoimentos",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Depoimentos", min: 1, max: 6, arrayFields: { quote: { type: "textarea", label: "Depoimento" }, name: { type: "text", label: "Nome" }, role: { type: "text", label: "Identificação" } }, defaultItemProps: { quote: "Essa experiência mudou minha forma de trabalhar.", name: "Cliente", role: "Cliente verificado" }, getItemSummary: (item) => item.name } },
      defaultProps: { title: "Quem já comprou recomenda", items: [{ quote: "Consegui colocar tudo em prática rapidamente e os resultados apareceram.", name: "Marina Costa", role: "Cliente verificada" }, { quote: "Conteúdo direto, organizado e muito mais completo do que eu esperava.", name: "Rafael Lima", role: "Cliente verificado" }] },
      render: ({ title, items }) => <section style={{ padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 28 }}>{items.map((item, index) => <blockquote key={`${item.name}-${index}`} style={{ ...card(), margin: 0, padding: 28 }}><p style={{ margin: 0, fontSize: 17, lineHeight: 1.7 }}>&ldquo;{item.quote}&rdquo;</p><footer style={{ marginTop: 20 }}><strong>{item.name}</strong><span style={{ display: "block", marginTop: 3, fontSize: 12, opacity: .6 }}>{item.role}</span></footer></blockquote>)}</div></section>,
    },
    faq: {
      label: "Perguntas frequentes",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Perguntas", min: 1, max: 10, arrayFields: { question: { type: "text", label: "Pergunta" }, answer: { type: "textarea", label: "Resposta" } }, defaultItemProps: { question: "Nova pergunta", answer: "Escreva a resposta." }, getItemSummary: (item) => item.question } },
      defaultProps: { title: "Perguntas frequentes", items: [{ question: "Como recebo o acesso?", answer: "Você receberá as instruções logo após a confirmação do pagamento." }, { question: "O pagamento é seguro?", answer: "Sim. O pagamento é processado diretamente por um gateway homologado." }] },
      render: ({ title, items }) => <section style={{ ...card(), padding: "clamp(28px, 5vw, 52px)" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ maxWidth: 800, margin: "28px auto 0" }}>{items.map((item, index) => <details key={`${item.question}-${index}`} style={{ borderTop: index === 0 ? "1px solid #e6e6ed" : 0, borderBottom: "1px solid #e6e6ed", padding: "18px 0" }}><summary style={{ cursor: "pointer", fontWeight: 750 }}>{item.question}</summary><p style={{ margin: "12px 0 0", lineHeight: 1.7, opacity: .7 }}>{item.answer}</p></details>)}</div></section>,
    },
    guarantee: {
      label: "Garantia",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, days: { type: "number", label: "Dias", min: 0, max: 365 } },
      defaultProps: { title: "Garantia de 7 dias", description: "Experimente com tranquilidade. Se não fizer sentido, solicite o reembolso dentro do prazo.", days: 7 },
      render: ({ title, description, days }) => <section style={{ ...card(), display: "flex", alignItems: "center", gap: 24, padding: 28, border: "1px solid color-mix(in srgb, var(--checkout-accent) 28%, white)" }}><span style={{ ...numberBadge(), width: 64, height: 64, fontSize: 20 }}>{days}</span><div><h2 style={{ margin: 0, fontSize: 23 }}>{title}</h2><p style={{ margin: "8px 0 0", lineHeight: 1.65, opacity: .7 }}>{description}</p></div></section>,
    },
    countdown: {
      label: "Contagem regressiva",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, deadline: { type: "text", label: "Data limite (ISO)" } },
      defaultProps: { title: "Esta condição termina em breve", deadline: "2026-12-31T23:59:59-03:00" },
      render: ({ title, deadline }) => <section style={{ ...card(), padding: 28, textAlign: "center" }}><p style={{ margin: 0, fontWeight: 750 }}>{title}</p><p style={{ margin: "12px 0 0", color: "var(--checkout-accent)", fontSize: 28, fontWeight: 850 }}>{formatDeadline(deadline)}</p></section>,
    },
    product_summary: {
      label: "Produto (controlado)", permissions: fixed,
      defaultProps: { title: "Resumo da sua compra", description: "Confira o produto selecionado e suas condições." },
      render: ({ title, description }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Dados seguros do catálogo</span><h2 style={{ margin: "14px 0 0", fontSize: 24 }}>{title}</h2><p style={{ margin: "8px 0 0", opacity: .65 }}>{description}</p><div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginTop: 22, paddingTop: 20, borderTop: "1px solid #e9e9ef" }}><div><strong>Produto selecionado</strong><span style={{ display: "block", marginTop: 5, fontSize: 13, opacity: .6 }}>Carregado da publicação</span></div><strong style={{ color: "var(--checkout-accent)", fontSize: 22 }}>R$ —</strong></div></section>,
    },
    checkout_form: {
      label: "Formulário (controlado)", permissions: fixed,
      defaultProps: { title: "Seus dados", description: "Preencha as informações para concluir a compra.", buttonLabel: "Finalizar compra" },
      render: ({ title, description, buttonLabel }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Componente protegido</span><h2 style={{ margin: "14px 0 0", fontSize: 24 }}>{title}</h2><p style={{ margin: "7px 0 20px", opacity: .65 }}>{description}</p><div style={{ display: "grid", gap: 12 }}><FakeInput label="Nome completo" /><FakeInput label="E-mail" /><FakeInput label="Telefone" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><FakeInput label="CPF/CNPJ" /><FakeInput label="CEP" /></div></div><button type="button" style={{ ...primaryButton(), width: "100%", marginTop: 20 }}>{buttonLabel}</button></section>,
    },
    order_summary: {
      label: "Total (controlado)", permissions: fixed,
      defaultProps: { title: "Total do pedido" },
      render: ({ title }) => <aside style={{ ...card(), padding: 24 }}><span style={controlledLabel()}>Calculado pela API</span><h2 style={{ margin: "14px 0 18px", fontSize: 20 }}>{title}</h2><div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, opacity: .7 }}><span>Subtotal</span><span>R$ —</span></div><div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #e9e9ef", fontSize: 20, fontWeight: 800 }}><span>Total</span><span>R$ —</span></div></aside>,
    },
    footer: {
      label: "Rodapé",
      fields: { text: { type: "text", label: "Texto", contentEditable: true }, showSecurity: { type: "radio", label: "Selo de segurança", options: [{ label: "Exibir", value: true }, { label: "Ocultar", value: false }] } },
      defaultProps: { text: "Pagamento seguro processado pelo Astro.", showSecurity: true },
      render: ({ text, showSecurity }) => <footer style={{ padding: "28px 16px", textAlign: "center", fontSize: 12, opacity: .58 }}><p>{text}</p>{showSecurity && <p style={{ marginTop: 8 }}>🔒 Ambiente protegido e pagamento criptografado</p>}</footer>,
    },
  },
};

function variables(theme: BuilderRootProps) { return { "--checkout-bg": safeColor(theme.backgroundColor, "#f7f7fb"), "--checkout-surface": safeColor(theme.surfaceColor, "#ffffff"), "--checkout-text": safeColor(theme.textColor, "#202235"), "--checkout-accent": safeColor(theme.accentColor, "#7065e8"), "--checkout-radius": `${clamp(theme.radius, 0, 40)}px` } as React.CSSProperties; }
function card(): React.CSSProperties { return { background: "var(--checkout-surface)", borderRadius: "var(--checkout-radius)", boxShadow: "0 18px 50px rgba(30, 31, 48, .07)" }; }
function heading(): React.CSSProperties { return { margin: 0, fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.15, letterSpacing: "-.035em" }; }
function primaryButton(): React.CSSProperties { return { display: "inline-flex", justifyContent: "center", marginTop: 26, border: 0, borderRadius: 12, background: "var(--checkout-accent)", color: "white", padding: "15px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer" }; }
function numberBadge(): React.CSSProperties { return { display: "grid", width: 38, height: 38, placeItems: "center", borderRadius: 999, background: "color-mix(in srgb, var(--checkout-accent) 14%, white)", color: "var(--checkout-accent)", fontWeight: 850 }; }
function controlledLabel(): React.CSSProperties { return { display: "inline-flex", borderRadius: 999, background: "#eeeefe", color: "#5d52ce", padding: "5px 9px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }; }
function FakeInput({ label }: { label: string }) { return <label style={{ fontSize: 12, fontWeight: 700 }}>{label}<span style={{ display: "block", height: 44, marginTop: 6, border: "1px solid #dddde7", borderRadius: 10, background: "#fafafd" }} /></label>; }
function safeColor(value: string, fallback: string) { return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function safeHttpsUrl(value: string) { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number(value) || min)); }
function formatDeadline(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Defina uma data válida" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(date); }
