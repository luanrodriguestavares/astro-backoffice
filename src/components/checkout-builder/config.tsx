"use client";

import { Button } from "@/components/ui/button";

import type { Config, Data, Slot } from "@puckeditor/core";

import { ColorPickerField } from "@/components/checkout-builder/color-picker-field";

type BuilderProps = {
  hero: { eyebrow: string; title: string; description: string; buttonLabel: string; alignment: "left" | "center" };
  text: { title: string; content: string; alignment: "left" | "center" };
  image: { url: string; alt: string; caption: string };
  logo: { url: string; alt: string; alignment: "left" | "center" | "right"; size: SizePreset };
  banner: { imageUrl: string; eyebrow: string; title: string; description: string; buttonLabel: string; height: SizePreset; overlay: "light" | "medium" | "strong" };
  grid: { columns: "2" | "3"; gap: SizePreset; column1: Slot; column2: Slot; column3: Slot };
  benefits: { title: string; items: { title: string; description: string }[] };
  testimonials: { title: string; items: { quote: string; name: string; role: string }[] };
  faq: { title: string; items: { question: string; answer: string }[] };
  guarantee: { title: string; description: string; days: number };
  countdown: { title: string; deadline: string };
  product_summary: { title: string; description: string };
  checkout_form: { title: string; description: string; buttonLabel: string };
  order_summary: { title: string };
  payment_methods: { title: string; description: string; showCard: boolean; showPix: boolean; showBoleto: boolean };
  card_payment: { title: string; description: string; showInstallments: boolean };
  pix_payment: { title: string; description: string; expiresIn: string };
  boleto_payment: { title: string; description: string; dueInDays: number };
  shipping_address: { title: string; description: string };
  shipping_methods: { title: string; economyLabel: string; expressLabel: string };
  coupon_field: { title: string; placeholder: string; buttonLabel: string };
  security_badges: { title: string; showEncryption: boolean; showGuarantee: boolean; showPrivacy: boolean };
  footer: { text: string; showSecurity: boolean };
};

type ThemePreset = "light" | "gray" | "zinc" | "slate" | "dark" | "dark-zinc";
type FontPreset = "system" | "geist" | "arial" | "georgia" | "serif" | "mono";
type SizePreset = "xs" | "sm" | "md" | "lg" | "xl";
type WidthPreset = "sm" | "md" | "lg" | "xl" | "full";
type ShadowPreset = "none" | "xs" | "sm" | "md" | "lg";

export type BuilderRootProps = { themePreset: ThemePreset; fontFamily: FontPreset; backgroundColor: string; surfaceColor: string; textColor: string; accentColor: string; radius: SizePreset; shadow: ShadowPreset; maxWidth: WidthPreset };
export type BuilderData = Data<BuilderProps, BuilderRootProps>;

const alignment = [{ label: "Esquerda", value: "left" }, { label: "Centralizado", value: "center" }] as const;
const fixed = { delete: false, drag: false, duplicate: false, insert: false } as const;
const booleanOptions = [{ label: "Exibir", value: true }, { label: "Ocultar", value: false }] as const;
const sizeOptions = [{ label: "XS", value: "xs" }, { label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "XL", value: "xl" }] as const;
const shadowOptions = [{ label: "Sem sombra", value: "none" }, ...sizeOptions.slice(0, 4)] as const;
const colorField = (label: string) => ({ type: "custom" as const, label, render: ({ name, value, onChange, field }: { name: string; value: string; onChange: (value: string) => void; field: { label?: string } }) => <ColorPickerField name={name} label={field.label} value={value} onChange={onChange} /> });

export const checkoutBuilderConfig: Config<BuilderProps, BuilderRootProps> = {
  categories: {
    content: { title: "Conteúdo", components: ["hero", "logo", "banner", "text", "image", "benefits", "testimonials", "faq", "guarantee", "countdown"], defaultExpanded: true },
    checkout: { title: "Checkout", components: ["product_summary", "checkout_form", "order_summary", "coupon_field"] },
    payment: { title: "Pagamento", components: ["payment_methods", "card_payment", "pix_payment", "boleto_payment"] },
    shipping: { title: "Frete", components: ["shipping_address", "shipping_methods"] },
    trust: { title: "Confiança", components: ["security_badges"] },
    structure: { title: "Estrutura", components: ["grid", "footer"] },
  },
  root: {
    fields: {
      themePreset: { type: "select", label: "Tema", options: [{ label: "Claro", value: "light" }, { label: "Gray", value: "gray" }, { label: "Zinc", value: "zinc" }, { label: "Slate", value: "slate" }, { label: "Escuro", value: "dark" }, { label: "Zinc escuro", value: "dark-zinc" }] },
      fontFamily: { type: "select", label: "Tipografia", options: [{ label: "Sistema", value: "system" }, { label: "Geist", value: "geist" }, { label: "Arial", value: "arial" }, { label: "Georgia", value: "georgia" }, { label: "Serif clássica", value: "serif" }, { label: "Monoespaçada", value: "mono" }] },
      backgroundColor: colorField("Cor do fundo"), surfaceColor: colorField("Cor dos componentes"), textColor: colorField("Cor do texto"), accentColor: colorField("Cor principal"),
      radius: { type: "select", label: "Cantos", options: sizeOptions },
      shadow: { type: "select", label: "Sombra", options: shadowOptions },
      maxWidth: { type: "select", label: "Largura", options: [{ label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "XL", value: "xl" }, { label: "Total", value: "full" }] },
    },
    defaultProps: { themePreset: "light", fontFamily: "system", backgroundColor: "#f7f7fb", surfaceColor: "#ffffff", textColor: "#202235", accentColor: "#7065e8", radius: "md", shadow: "sm", maxWidth: "lg" },
    render: ({ children, ...theme }) => { const palette = resolvePalette(theme); return <div style={{ ...variables(theme), minHeight: "100vh", background: palette.background, color: palette.text, fontFamily: fontStack(theme.fontFamily), padding: "32px 20px" }}><main style={{ maxWidth: widthValue(theme.maxWidth), margin: "0 auto", display: "grid", gap: 20 }}>{children}</main></div>; },
  },
  components: {
    hero: {
      label: "Apresentação",
      fields: { eyebrow: { type: "text", label: "Chamada superior", contentEditable: true }, title: { type: "textarea", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, buttonLabel: { type: "text", label: "Texto do botão" }, alignment: { type: "radio", label: "Alinhamento", options: alignment } },
      defaultProps: { eyebrow: "Oferta especial", title: "Uma transformação começa aqui", description: "Apresente de forma clara o principal resultado que seu produto entrega.", buttonLabel: "Quero começar", alignment: "center" },
      render: ({ eyebrow, title, description, buttonLabel, alignment }) => <section style={{ ...card(), textAlign: alignment, padding: "clamp(36px, 7vw, 88px) 24px", overflow: "hidden", position: "relative" }}><div style={{ position: "absolute", width: 280, height: 280, borderRadius: 999, background: "var(--checkout-accent)", opacity: .1, filter: "blur(24px)", right: -80, top: -100 }} /><div style={{ position: "relative", maxWidth: 760, margin: alignment === "center" ? "0 auto" : undefined }}><p style={{ color: "var(--checkout-accent)", fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>{eyebrow}</p><h1 style={{ margin: "14px 0 0", fontSize: "clamp(36px, 6vw, 66px)", lineHeight: 1.04, letterSpacing: "-.045em" }}>{title}</h1><p style={{ margin: "20px 0 0", fontSize: 18, lineHeight: 1.7, opacity: .72 }}>{description}</p><Button type="button" style={primaryButton()}>{buttonLabel}</Button></div></section>,
    },
    logo: {
      label: "Logo",
      fields: { url: { type: "text", label: "URL HTTPS" }, alt: { type: "text", label: "Texto alternativo" }, alignment: { type: "radio", label: "Alinhamento", options: [{ label: "Esquerda", value: "left" }, { label: "Centro", value: "center" }, { label: "Direita", value: "right" }] }, size: { type: "select", label: "Tamanho", options: sizeOptions } },
      defaultProps: { url: "", alt: "Logo da marca", alignment: "center", size: "md" },
      render: ({ url, alt, alignment, size }) => <div style={{ display: "flex", justifyContent: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center", padding: spacingValue("sm") }}>{safeHttpsUrl(url) ? <div role="img" aria-label={alt} style={{ width: logoSize(size), maxWidth: "100%", aspectRatio: "3 / 1", backgroundImage: `url(${JSON.stringify(url)})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain" }} /> : <div style={{ display: "grid", width: logoSize(size), aspectRatio: "3 / 1", placeItems: "center", border: "1px dashed var(--checkout-border)", borderRadius: "var(--checkout-radius)", color: "var(--checkout-text)", opacity: .55, fontSize: 12 }}>Adicione sua logo</div>}</div>,
    },
    banner: {
      label: "Banner",
      fields: { imageUrl: { type: "text", label: "Imagem HTTPS" }, eyebrow: { type: "text", label: "Chamada superior" }, title: { type: "textarea", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, buttonLabel: { type: "text", label: "Texto do botão" }, height: { type: "select", label: "Altura", options: sizeOptions }, overlay: { type: "select", label: "Contraste da imagem", options: [{ label: "Suave", value: "light" }, { label: "Médio", value: "medium" }, { label: "Forte", value: "strong" }] } },
      defaultProps: { imageUrl: "", eyebrow: "Novidade", title: "Uma oferta feita para você", description: "Use uma imagem marcante para destacar a principal mensagem da página.", buttonLabel: "Ver oferta", height: "lg", overlay: "medium" },
      render: ({ imageUrl, eyebrow, title, description, buttonLabel, height, overlay }) => <section style={{ ...card(), position: "relative", minHeight: bannerHeight(height), overflow: "hidden", display: "flex", alignItems: "flex-end", backgroundImage: safeHttpsUrl(imageUrl) ? `linear-gradient(rgba(10, 10, 18, ${overlayOpacity(overlay)}), rgba(10, 10, 18, ${Math.min(.9, overlayOpacity(overlay) + .18)})), url(${JSON.stringify(imageUrl)})` : "linear-gradient(135deg, var(--checkout-accent), color-mix(in srgb, var(--checkout-accent) 58%, #111827))", backgroundSize: "cover", backgroundPosition: "center" }}><div style={{ position: "relative", maxWidth: 700, padding: spacingValue("xl"), color: "white" }}><p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", opacity: .8 }}>{eyebrow}</p><h2 style={{ margin: "12px 0 0", fontSize: "clamp(30px, 5vw, 54px)", lineHeight: 1.08 }}>{title}</h2><p style={{ margin: "14px 0 0", maxWidth: 580, lineHeight: 1.65, opacity: .82 }}>{description}</p><Button type="button" style={{ ...secondaryButton(), marginTop: 20, background: "white", color: "#18181b", borderColor: "transparent" }}>{buttonLabel}</Button></div></section>,
    },
    grid: {
      label: "Grid",
      fields: { columns: { type: "radio", label: "Colunas", options: [{ label: "2 colunas", value: "2" }, { label: "3 colunas", value: "3" }] }, gap: { type: "select", label: "Espaçamento", options: sizeOptions }, column1: { type: "slot" }, column2: { type: "slot" }, column3: { type: "slot" } },
      defaultProps: { columns: "2", gap: "md", column1: [], column2: [], column3: [] },
      render: ({ columns, gap, column1: Column1, column2: Column2, column3: Column3 }) => <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: spacingValue(gap), alignItems: "start" }}><Column1 minEmptyHeight={160} /><Column2 minEmptyHeight={160} />{columns === "3" && <Column3 minEmptyHeight={160} />}</section>,
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
      render: ({ title, description, buttonLabel }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Componente protegido</span><h2 style={{ margin: "14px 0 0", fontSize: 24 }}>{title}</h2><p style={{ margin: "7px 0 20px", opacity: .65 }}>{description}</p><div style={{ display: "grid", gap: 12 }}><FakeInput label="Nome completo" /><FakeInput label="E-mail" /><FakeInput label="Telefone" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><FakeInput label="CPF/CNPJ" /><FakeInput label="CEP" /></div></div><Button type="button" style={{ ...primaryButton(), width: "100%", marginTop: 20 }}>{buttonLabel}</Button></section>,
    },
    order_summary: {
      label: "Total (controlado)", permissions: fixed,
      defaultProps: { title: "Total do pedido" },
      render: ({ title }) => <aside style={{ ...card(), padding: 24 }}><span style={controlledLabel()}>Calculado pela API</span><h2 style={{ margin: "14px 0 18px", fontSize: 20 }}>{title}</h2><div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, opacity: .7 }}><span>Subtotal</span><span>R$ —</span></div><div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #e9e9ef", fontSize: 20, fontWeight: 800 }}><span>Total</span><span>R$ —</span></div></aside>,
    },
    payment_methods: {
      label: "Métodos de pagamento",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, showCard: { type: "radio", label: "Cartão", options: booleanOptions }, showPix: { type: "radio", label: "Pix", options: booleanOptions }, showBoleto: { type: "radio", label: "Boleto", options: booleanOptions } },
      defaultProps: { title: "Como você quer pagar?", description: "Escolha uma forma de pagamento segura.", showCard: true, showPix: true, showBoleto: true },
      render: ({ title, description, showCard, showPix, showBoleto }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Métodos habilitados</span><h2 style={sectionTitle()}>{title}</h2><p style={sectionDescription()}>{description}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 20 }}>{showCard && <PaymentOption icon="▣" title="Cartão" detail="Crédito" active />}{showPix && <PaymentOption icon="◇" title="Pix" detail="Aprovação rápida" />}{showBoleto && <PaymentOption icon="▤" title="Boleto" detail="Até 3 dias úteis" />}</div></section>,
    },
    card_payment: {
      label: "Pagamento com cartão",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, showInstallments: { type: "radio", label: "Parcelamento", options: booleanOptions } },
      defaultProps: { title: "Dados do cartão", description: "Suas informações são protegidas e criptografadas.", showInstallments: true },
      render: ({ title, description, showInstallments }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Cartão seguro</span><h2 style={sectionTitle()}>{title}</h2><p style={sectionDescription()}>{description}</p><div style={{ display: "grid", gap: 12, marginTop: 20 }}><FakeInput label="Número do cartão" /><FakeInput label="Nome impresso no cartão" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><FakeInput label="Validade" /><FakeInput label="CVV" /></div>{showInstallments && <FakeInput label="Parcelas" />}</div></section>,
    },
    pix_payment: {
      label: "Pagamento via Pix",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, expiresIn: { type: "text", label: "Tempo de expiração" } },
      defaultProps: { title: "Pague com Pix", description: "Escaneie o QR Code ou copie o código Pix.", expiresIn: "30 minutos" },
      render: ({ title, description, expiresIn }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Confirmação automática</span><h2 style={sectionTitle()}>{title}</h2><p style={sectionDescription()}>{description}</p><div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 160px) 1fr", gap: 20, alignItems: "center", marginTop: 22 }}><div style={qrPlaceholder()}>PIX</div><div><p style={{ margin: 0, fontSize: 13, opacity: .65 }}>O código expira em {expiresIn}.</p><div style={{ height: 44, marginTop: 12, border: "1px solid var(--checkout-border)", borderRadius: 10, background: "var(--checkout-muted)" }} /><Button type="button" style={{ ...secondaryButton(), width: "100%", marginTop: 10 }}>Copiar código Pix</Button></div></div></section>,
    },
    boleto_payment: {
      label: "Pagamento via boleto",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, dueInDays: { type: "number", label: "Vencimento em dias", min: 1, max: 30 } },
      defaultProps: { title: "Pague com boleto", description: "O pedido será confirmado após a compensação bancária.", dueInDays: 3 },
      render: ({ title, description, dueInDays }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Boleto bancário</span><h2 style={sectionTitle()}>{title}</h2><p style={sectionDescription()}>{description}</p><div style={{ marginTop: 20, padding: 18, borderRadius: 12, background: "var(--checkout-muted)" }}><strong>Vencimento em {dueInDays} dias</strong><div style={{ height: 38, marginTop: 14, background: "repeating-linear-gradient(90deg, var(--checkout-text) 0 2px, transparent 2px 5px)", opacity: .5 }} /></div><Button type="button" style={{ ...secondaryButton(), width: "100%", marginTop: 12 }}>Gerar boleto</Button></section>,
    },
    shipping_address: {
      label: "Endereço de entrega",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" } },
      defaultProps: { title: "Endereço de entrega", description: "Informe onde o pedido deve ser entregue." },
      render: ({ title, description }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Entrega</span><h2 style={sectionTitle()}>{title}</h2><p style={sectionDescription()}>{description}</p><div style={{ display: "grid", gap: 12, marginTop: 20 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}><FakeInput label="CEP" /><FakeInput label="Rua" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}><FakeInput label="Número" /><FakeInput label="Complemento" /></div><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}><FakeInput label="Cidade" /><FakeInput label="Estado" /></div></div></section>,
    },
    shipping_methods: {
      label: "Opções de frete",
      fields: { title: { type: "text", label: "Título" }, economyLabel: { type: "text", label: "Frete econômico" }, expressLabel: { type: "text", label: "Frete expresso" } },
      defaultProps: { title: "Escolha a entrega", economyLabel: "Entrega econômica", expressLabel: "Entrega expressa" },
      render: ({ title, economyLabel, expressLabel }) => <section style={{ ...card(), padding: 28 }}><span style={controlledLabel()}>Calculado pelo CEP</span><h2 style={sectionTitle()}>{title}</h2><div style={{ display: "grid", gap: 10, marginTop: 20 }}><ShippingOption title={economyLabel} detail="5 a 8 dias úteis" price="R$ 12,90" active /><ShippingOption title={expressLabel} detail="2 a 3 dias úteis" price="R$ 24,90" /></div></section>,
    },
    coupon_field: {
      label: "Cupom de desconto",
      fields: { title: { type: "text", label: "Título" }, placeholder: { type: "text", label: "Placeholder" }, buttonLabel: { type: "text", label: "Texto do botão" } },
      defaultProps: { title: "Tem um cupom?", placeholder: "Digite o código", buttonLabel: "Aplicar" },
      render: ({ title, placeholder, buttonLabel }) => <section style={{ ...card(), padding: 24 }}><h2 style={{ margin: 0, fontSize: 17 }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 14 }}><div style={{ display: "flex", alignItems: "center", minHeight: 44, border: "1px solid var(--checkout-border)", borderRadius: 10, padding: "0 13px", opacity: .55 }}>{placeholder}</div><Button type="button" style={secondaryButton()}>{buttonLabel}</Button></div></section>,
    },
    security_badges: {
      label: "Selos de segurança",
      fields: { title: { type: "text", label: "Título" }, showEncryption: { type: "radio", label: "Criptografia", options: booleanOptions }, showGuarantee: { type: "radio", label: "Garantia", options: booleanOptions }, showPrivacy: { type: "radio", label: "Privacidade", options: booleanOptions } },
      defaultProps: { title: "Compra protegida", showEncryption: true, showGuarantee: true, showPrivacy: true },
      render: ({ title, showEncryption, showGuarantee, showPrivacy }) => <section style={{ textAlign: "center", padding: "24px 0" }}><h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2><div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 16 }}>{showEncryption && <TrustBadge label="Dados criptografados" />}{showGuarantee && <TrustBadge label="Compra garantida" />}{showPrivacy && <TrustBadge label="Privacidade protegida" />}</div></section>,
    },
    footer: {
      label: "Rodapé",
      fields: { text: { type: "text", label: "Texto", contentEditable: true }, showSecurity: { type: "radio", label: "Selo de segurança", options: [{ label: "Exibir", value: true }, { label: "Ocultar", value: false }] } },
      defaultProps: { text: "Pagamento seguro processado pelo Astro.", showSecurity: true },
      render: ({ text, showSecurity }) => <footer style={{ padding: "28px 16px", textAlign: "center", fontSize: 12, opacity: .58 }}><p>{text}</p>{showSecurity && <p style={{ marginTop: 8 }}>🔒 Ambiente protegido e pagamento criptografado</p>}</footer>,
    },
  },
};

const palettes: Record<ThemePreset, { background: string; surface: string; text: string; muted: string; border: string }> = {
  light: { background: "#f7f7fb", surface: "#ffffff", text: "#202235", muted: "#f4f4f8", border: "#e4e4ec" },
  gray: { background: "#f3f4f6", surface: "#ffffff", text: "#1f2937", muted: "#f3f4f6", border: "#dfe2e7" },
  zinc: { background: "#f4f4f5", surface: "#ffffff", text: "#27272a", muted: "#f4f4f5", border: "#e4e4e7" },
  slate: { background: "#f1f5f9", surface: "#ffffff", text: "#1e293b", muted: "#f1f5f9", border: "#dbe3ec" },
  dark: { background: "#111318", surface: "#1b1e25", text: "#f5f7fa", muted: "#252932", border: "#343945" },
  "dark-zinc": { background: "#18181b", surface: "#27272a", text: "#fafafa", muted: "#303034", border: "#3f3f46" },
};

function resolvePalette(theme: BuilderRootProps) {
  const preset = palettes[theme.themePreset] ?? palettes.light;
  if (theme.themePreset && theme.themePreset !== "light") return preset;
  return { ...preset, background: safeColor(theme.backgroundColor, preset.background), surface: safeColor(theme.surfaceColor, preset.surface), text: safeColor(theme.textColor, preset.text) };
}
function variables(theme: BuilderRootProps) { const palette = resolvePalette(theme); return { "--checkout-bg": palette.background, "--checkout-surface": palette.surface, "--checkout-text": palette.text, "--checkout-muted": palette.muted, "--checkout-border": palette.border, "--checkout-accent": safeColor(theme.accentColor, "#7065e8"), "--checkout-radius": radiusValue(theme.radius), "--checkout-shadow": shadowValue(theme.shadow) } as React.CSSProperties; }
function fontStack(font: FontPreset) { return { system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", geist: "Geist, Inter, system-ui, sans-serif", arial: "Arial, Helvetica, sans-serif", georgia: "Georgia, 'Times New Roman', serif", serif: "'Iowan Old Style', Baskerville, 'Times New Roman', serif", mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace" }[font] ?? "system-ui, sans-serif"; }
function card(): React.CSSProperties { return { background: "var(--checkout-surface)", border: "1px solid var(--checkout-border)", borderRadius: "var(--checkout-radius)", boxShadow: "var(--checkout-shadow)" }; }
function heading(): React.CSSProperties { return { margin: 0, fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.15, letterSpacing: "-.035em" }; }
function sectionTitle(): React.CSSProperties { return { margin: "14px 0 0", fontSize: 23, lineHeight: 1.25 }; }
function sectionDescription(): React.CSSProperties { return { margin: "7px 0 0", lineHeight: 1.6, opacity: .65 }; }
function primaryButton(): React.CSSProperties { return { display: "inline-flex", justifyContent: "center", marginTop: 26, border: 0, borderRadius: 12, background: "var(--checkout-accent)", color: "white", padding: "15px 24px", fontSize: 15, fontWeight: 800, cursor: "default" }; }
function secondaryButton(): React.CSSProperties { return { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, border: "1px solid var(--checkout-border)", borderRadius: 10, background: "var(--checkout-surface)", color: "var(--checkout-text)", padding: "0 16px", fontSize: 13, fontWeight: 750, cursor: "default" }; }
function numberBadge(): React.CSSProperties { return { display: "grid", width: 38, height: 38, placeItems: "center", borderRadius: 999, background: "color-mix(in srgb, var(--checkout-accent) 14%, white)", color: "var(--checkout-accent)", fontWeight: 850 }; }
function controlledLabel(): React.CSSProperties { return { display: "inline-flex", borderRadius: 999, background: "#eeeefe", color: "#5d52ce", padding: "5px 9px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }; }
function qrPlaceholder(): React.CSSProperties { return { display: "grid", aspectRatio: "1", placeItems: "center", border: "10px solid var(--checkout-surface)", borderRadius: 12, background: "repeating-conic-gradient(var(--checkout-text) 0 25%, var(--checkout-surface) 0 50%) 0 / 18px 18px", boxShadow: "0 0 0 1px var(--checkout-border)", color: "var(--checkout-accent)", fontWeight: 900 }; }
function FakeInput({ label }: { label: string }) { return <label style={{ fontSize: 12, fontWeight: 700 }}>{label}<span style={{ display: "block", height: 44, marginTop: 6, border: "1px solid var(--checkout-border)", borderRadius: 10, background: "var(--checkout-muted)" }} /></label>; }
function PaymentOption({ icon, title, detail, active = false }: { icon: string; title: string; detail: string; active?: boolean }) { return <div style={{ display: "flex", alignItems: "center", gap: 11, minHeight: 68, border: `1px solid ${active ? "var(--checkout-accent)" : "var(--checkout-border)"}`, borderRadius: 12, padding: 12, background: active ? "color-mix(in srgb, var(--checkout-accent) 7%, var(--checkout-surface))" : "var(--checkout-surface)" }}><span style={{ display: "grid", width: 34, height: 34, placeItems: "center", borderRadius: 9, background: "var(--checkout-muted)", color: "var(--checkout-accent)", fontWeight: 900 }}>{icon}</span><span><strong style={{ display: "block", fontSize: 13 }}>{title}</strong><small style={{ opacity: .58 }}>{detail}</small></span></div>; }
function ShippingOption({ title, detail, price, active = false }: { title: string; detail: string; price: string; active?: boolean }) { return <div style={{ display: "flex", alignItems: "center", gap: 12, border: `1px solid ${active ? "var(--checkout-accent)" : "var(--checkout-border)"}`, borderRadius: 12, padding: 15 }}><span style={{ width: 16, height: 16, border: `5px solid ${active ? "var(--checkout-accent)" : "var(--checkout-border)"}`, borderRadius: 999 }} /><span style={{ flex: 1 }}><strong style={{ display: "block", fontSize: 13 }}>{title}</strong><small style={{ opacity: .6 }}>{detail}</small></span><strong style={{ fontSize: 13 }}>{price}</strong></div>; }
function TrustBadge({ label }: { label: string }) { return <span style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--checkout-border)", borderRadius: 999, background: "var(--checkout-surface)", padding: "9px 13px", fontSize: 12, fontWeight: 700 }}><span style={{ color: "var(--checkout-accent)" }}>✓</span>{label}</span>; }
function radiusValue(size: SizePreset) { return { xs: "4px", sm: "8px", md: "12px", lg: "18px", xl: "26px" }[size] ?? "12px"; }
function shadowValue(size: ShadowPreset) { return { none: "none", xs: "0 2px 8px rgba(30,31,48,.04)", sm: "0 10px 30px rgba(30,31,48,.06)", md: "0 18px 48px rgba(30,31,48,.09)", lg: "0 26px 70px rgba(30,31,48,.13)" }[size] ?? "none"; }
function widthValue(size: WidthPreset) { return { sm: 760, md: 920, lg: 1120, xl: 1320, full: 1440 }[size] ?? 1120; }
function spacingValue(size: SizePreset) { return { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 }[size] ?? 20; }
function logoSize(size: SizePreset) { return { xs: 72, sm: 104, md: 144, lg: 192, xl: 256 }[size] ?? 144; }
function bannerHeight(size: SizePreset) { return { xs: 220, sm: 280, md: 360, lg: 440, xl: 540 }[size] ?? 440; }
function overlayOpacity(value: "light" | "medium" | "strong") { return { light: .18, medium: .4, strong: .62 }[value]; }
function safeColor(value: string, fallback: string) { return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function safeHttpsUrl(value: string) { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function formatDeadline(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Defina uma data válida" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(date); }
