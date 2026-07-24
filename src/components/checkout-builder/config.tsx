"use client";

import { Button } from "@/components/ui/button";

import type { Config, Data, Slot } from "@puckeditor/core";

import { ColorPickerField } from "@/components/checkout-builder/color-picker-field";

type BuilderProps = {
  hero: { eyebrow: string; title: string; description: string; buttonLabel: string; alignment: "left" | "center" };
  text: { title: string; content: string; alignment: "left" | "center" };
  image: { url: string; alt: string; caption: string };
  logo: { url: string; alt: string; alignment: "left" | "center" | "right"; size: SizePreset; radius: LogoRadius; overlapBanner: boolean };
  banner: { imageUrl: string; alt: string; aspectRatio: BannerRatio; fit: "cover" | "contain" };
  grid: { columns: "1" | "2" | "3"; columnGap: SizePreset; itemGap: SizePreset; padding: SizePreset; column1: Slot; column2: Slot; column3: Slot };
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

type ThemeMode = "light" | "dark" | "system";
type GrayTone = "neutral" | "gray" | "zinc" | "slate";
type FontPreset = "system" | "geist" | "arial" | "georgia" | "serif" | "mono";
type SizePreset = "xs" | "sm" | "md" | "lg" | "xl";
type WidthPreset = "sm" | "md" | "lg" | "xl" | "full";
type ShadowPreset = "none" | "xs" | "sm" | "md" | "lg";
type LogoRadius = "none" | "sm" | "md" | "lg" | "full";
type BannerRatio = "4/1" | "3/1" | "2/1" | "16/9" | "1/1" | "4/5";
type InputGroupStyle = "filled" | "outlined";

export type BuilderRootProps = { themeMode: ThemeMode; grayTone: GrayTone; fontFamily: FontPreset; backgroundColor: string; surfaceColor: string; textColor: string; accentColor: string; radius: SizePreset; shadow: ShadowPreset; maxWidth: WidthPreset; componentGap: SizePreset; pagePadding: SizePreset; inputGroupStyle: InputGroupStyle };
export type BuilderData = Data<BuilderProps, BuilderRootProps>;

const alignment = [{ label: "Esquerda", value: "left" }, { label: "Centralizado", value: "center" }] as const;
const booleanOptions = [{ label: "Exibir", value: true }, { label: "Ocultar", value: false }] as const;
const sizeOptions = [{ label: "XS", value: "xs" }, { label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "XL", value: "xl" }] as const;
const shadowOptions = [{ label: "Sem sombra", value: "none" }, ...sizeOptions.slice(0, 4)] as const;
const colorField = (label: string) => ({ type: "custom" as const, label, render: ({ name, value, onChange, field }: { name: string; value: string; onChange: (value: string) => void; field: { label?: string } }) => <ColorPickerField name={name} label={field.label} value={value} onChange={onChange} /> });

export const checkoutBuilderConfig: Config<BuilderProps, BuilderRootProps> = {
  categories: {
    content: { title: "Conteúdo", components: ["hero", "logo", "banner", "text", "image", "benefits", "testimonials", "faq", "guarantee", "countdown"], defaultExpanded: false },
    checkout: { title: "Checkout", components: ["product_summary", "checkout_form", "order_summary", "coupon_field"], defaultExpanded: false },
    payment: { title: "Pagamento", components: ["payment_methods", "card_payment", "pix_payment", "boleto_payment"], defaultExpanded: false },
    shipping: { title: "Frete", components: ["shipping_address", "shipping_methods"], defaultExpanded: false },
    trust: { title: "Confiança", components: ["security_badges"], defaultExpanded: false },
    structure: { title: "Estrutura", components: ["grid", "footer"], defaultExpanded: false },
  },
  root: {
    label: "Página",
    fields: {
      themeMode: { type: "select", label: "Tema", options: [{ label: "Claro", value: "light" }, { label: "Escuro", value: "dark" }, { label: "Sistema", value: "system" }] },
      grayTone: { type: "select", label: "Tom de cinza", options: [{ label: "Neutro", value: "neutral" }, { label: "Gray", value: "gray" }, { label: "Zinc", value: "zinc" }, { label: "Slate", value: "slate" }] },
      fontFamily: { type: "select", label: "Tipografia", options: [{ label: "Sistema", value: "system" }, { label: "Geist", value: "geist" }, { label: "Arial", value: "arial" }, { label: "Georgia", value: "georgia" }, { label: "Serif clássica", value: "serif" }, { label: "Monoespaçada", value: "mono" }] },
      backgroundColor: colorField("Cor do fundo"), surfaceColor: colorField("Cor dos componentes"), textColor: colorField("Cor do texto"), accentColor: colorField("Cor principal"),
      radius: { type: "select", label: "Arredondamento dos cantos", options: sizeOptions },
      shadow: { type: "select", label: "Sombra", options: shadowOptions },
      maxWidth: { type: "select", label: "Largura", options: [{ label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "XL", value: "xl" }, { label: "Total", value: "full" }] },
      componentGap: { type: "select", label: "Espaçamento entre componentes", options: sizeOptions },
      pagePadding: { type: "select", label: "Margem interna da página", options: sizeOptions },
      inputGroupStyle: { type: "select", label: "Estilo dos blocos de checkout", options: [{ label: "Fundo preenchido", value: "filled" }, { label: "Fundo vazado com borda", value: "outlined" }] },
    },
    defaultProps: { themeMode: "light", grayTone: "neutral", fontFamily: "system", backgroundColor: "#f7f7fb", surfaceColor: "#ffffff", textColor: "#202235", accentColor: "#7065e8", radius: "md", shadow: "sm", maxWidth: "lg", componentGap: "md", pagePadding: "lg", inputGroupStyle: "filled" },
    render: ({ children, ...theme }) => { const palette = resolvePalette(theme); return <div style={{ ...variables(theme), colorScheme: theme.themeMode === "system" ? "light dark" : theme.themeMode, minHeight: "100vh", background: palette.background, color: palette.text, fontFamily: fontStack(theme.fontFamily), padding: spacingValue(theme.pagePadding) }}><main style={{ width: "100%", maxWidth: widthValue(theme.maxWidth), margin: "0 auto", display: "grid", alignItems: "stretch", gap: spacingValue(theme.componentGap) }}>{children}</main></div>; },
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
      fields: { url: { type: "text", label: "URL HTTPS" }, alt: { type: "text", label: "Texto alternativo" }, alignment: { type: "radio", label: "Alinhamento", options: [{ label: "Esquerda", value: "left" }, { label: "Centro", value: "center" }, { label: "Direita", value: "right" }] }, size: { type: "select", label: "Tamanho", options: sizeOptions }, radius: { type: "select", label: "Arredondamento", options: [{ label: "Sem arredondamento", value: "none" }, { label: "Suave", value: "sm" }, { label: "Médio", value: "md" }, { label: "Grande", value: "lg" }, { label: "Totalmente redondo", value: "full" }] }, overlapBanner: { type: "radio", label: "Posição", options: [{ label: "Normal", value: false }, { label: "Sobrepor ao banner anterior", value: true }] } },
      defaultProps: { url: "", alt: "Logo da marca", alignment: "center", size: "md", radius: "md", overlapBanner: false },
      render: ({ url, alt, alignment, size, radius, overlapBanner }) => <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box", position: "relative", zIndex: overlapBanner ? 3 : undefined, display: "flex", justifyContent: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center", marginTop: overlapBanner ? `calc((var(--checkout-component-gap) + ${logoSize(size) / 2 + spacingValue("sm")}px) * -1)` : undefined, padding: spacingValue("sm") }}><div role={safeHttpsUrl(url) ? "img" : undefined} aria-label={safeHttpsUrl(url) ? alt : undefined} style={{ display: "grid", width: logoSize(size), maxWidth: "100%", aspectRatio: "1", placeItems: "center", overflow: "hidden", border: "1px solid var(--checkout-border)", borderRadius: logoRadiusValue(radius), background: safeHttpsUrl(url) ? `var(--checkout-surface) url(${JSON.stringify(url)}) center / contain no-repeat` : "linear-gradient(145deg, var(--checkout-surface), var(--checkout-muted))", boxShadow: "var(--checkout-shadow)", color: "var(--checkout-text)" }}>{!safeHttpsUrl(url) && <div style={{ textAlign: "center", opacity: .55 }}><span style={{ display: "block", fontSize: 24, lineHeight: 1 }}>◇</span><span style={{ display: "block", marginTop: 8, fontSize: 11, fontWeight: 700 }}>Sua logo</span></div>}</div></div>,
    },
    banner: {
      label: "Banner",
      fields: { imageUrl: { type: "text", label: "Imagem HTTPS" }, alt: { type: "text", label: "Texto alternativo" }, aspectRatio: { type: "select", label: "Formato", options: [{ label: "Faixa baixa · 4:1", value: "4/1" }, { label: "Panorâmico · 3:1", value: "3/1" }, { label: "Retangular alto · 2:1", value: "2/1" }, { label: "Paisagem · 16:9", value: "16/9" }, { label: "Quadrado · 1:1", value: "1/1" }, { label: "Vertical · 4:5", value: "4/5" }] }, fit: { type: "select", label: "Ajuste da imagem", options: [{ label: "Preencher", value: "cover" }, { label: "Mostrar inteira", value: "contain" }] } },
      defaultProps: { imageUrl: "", alt: "Banner da oferta", aspectRatio: "3/1", fit: "cover" },
      render: ({ imageUrl, alt, aspectRatio, fit }) => <figure style={{ ...card(), position: "relative", aspectRatio, margin: 0, overflow: "hidden", background: "var(--checkout-muted)" }}>{safeHttpsUrl(imageUrl) ? <div role="img" aria-label={alt} style={{ position: "absolute", inset: 0, background: `url(${JSON.stringify(imageUrl)}) center / ${fit} no-repeat` }} /> : <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "linear-gradient(135deg, color-mix(in srgb, var(--checkout-accent) 8%, var(--checkout-surface)), var(--checkout-muted))", color: "var(--checkout-text)" }}><div style={{ textAlign: "center", opacity: .55 }}><span style={{ display: "block", fontSize: 30 }}>▧</span><strong style={{ display: "block", marginTop: 8, fontSize: 13 }}>Banner retangular</strong><small style={{ display: "block", marginTop: 4 }}>Adicione uma imagem horizontal</small></div></div>}</figure>,
    },
    grid: {
      label: "Grid",
      fields: { columns: { type: "radio", label: "Colunas", options: [{ label: "1 coluna", value: "1" }, { label: "2 colunas", value: "2" }, { label: "3 colunas", value: "3" }] }, columnGap: { type: "select", label: "Espaçamento entre colunas", options: sizeOptions }, itemGap: { type: "select", label: "Espaçamento entre itens", options: sizeOptions }, padding: { type: "select", label: "Espaçamento vertical", options: sizeOptions }, column1: { type: "slot" }, column2: { type: "slot" }, column3: { type: "slot" } },
      defaultProps: { columns: "2", columnGap: "md", itemGap: "md", padding: "xs", column1: [], column2: [], column3: [] },
      render: ({ columns, columnGap, itemGap, padding, column1: Column1, column2: Column2, column3: Column3 }) => <section style={{ width: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: spacingValue(columnGap), alignItems: "stretch", paddingBlock: spacingValue(padding), paddingInline: 0 }}><Column1 minEmptyHeight={160} style={slotStyle(itemGap)} />{columns !== "1" && <Column2 minEmptyHeight={160} style={slotStyle(itemGap)} />}{columns === "3" && <Column3 minEmptyHeight={160} style={slotStyle(itemGap)} />}</section>,
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
      render: ({ title, items }) => <section style={{ ...fullWidth(), padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 28 }}>{items.map((item, index) => <article key={`${item.title}-${index}`} style={{ ...card(), padding: 24 }}><span style={numberBadge()}>{index + 1}</span><h3 style={{ margin: "18px 0 0", fontSize: 18 }}>{item.title}</h3><p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.65, opacity: .68 }}>{item.description}</p></article>)}</div></section>,
    },
    testimonials: {
      label: "Depoimentos",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Depoimentos", min: 1, max: 6, arrayFields: { quote: { type: "textarea", label: "Depoimento" }, name: { type: "text", label: "Nome" }, role: { type: "text", label: "Identificação" } }, defaultItemProps: { quote: "Essa experiência mudou minha forma de trabalhar.", name: "Cliente", role: "Cliente verificado" }, getItemSummary: (item) => item.name } },
      defaultProps: { title: "Quem já comprou recomenda", items: [{ quote: "Consegui colocar tudo em prática rapidamente e os resultados apareceram.", name: "Marina Costa", role: "Cliente verificada" }, { quote: "Conteúdo direto, organizado e muito mais completo do que eu esperava.", name: "Rafael Lima", role: "Cliente verificado" }] },
      render: ({ title, items }) => <section style={{ ...fullWidth(), padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 28 }}>{items.map((item, index) => <blockquote key={`${item.name}-${index}`} style={{ ...card(), margin: 0, padding: 28 }}><p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>&ldquo;{item.quote}&rdquo;</p><footer style={{ marginTop: 20 }}><strong style={{ fontSize: 14 }}>{item.name}</strong><span style={{ display: "block", marginTop: 3, fontSize: 12, opacity: .6 }}>{item.role}</span></footer></blockquote>)}</div></section>,
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
      label: "Itens do carrinho",
      fields: { title: { type: "text", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true } },
      defaultProps: { title: "Itens do carrinho", description: "Confira o produto selecionado e suas condições." },
      render: ({ title, description }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 16, alignItems: "center", marginTop: 24, paddingTop: 22, borderTop: "1px solid var(--checkout-border)" }}><div style={{ display: "grid", width: 72, aspectRatio: "1", placeItems: "center", borderRadius: 14, background: "linear-gradient(145deg, color-mix(in srgb, var(--checkout-accent) 12%, var(--checkout-surface)), var(--checkout-muted))", color: "var(--checkout-accent)", fontSize: 24 }}>◇</div><div><strong style={{ display: "block", fontSize: 15 }}>Produto selecionado</strong><span style={{ display: "block", marginTop: 5, fontSize: 12, opacity: .58 }}>1 unidade</span></div><strong style={{ color: "var(--checkout-text)", fontSize: 20, letterSpacing: "-.03em" }}>R$ —</strong></div></section>,
    },
    checkout_form: {
      label: "Dados pessoais",
      resolvePermissions: (data) => ({ delete: !isProtectedCheckoutForm(data.props.id) }),
      fields: { title: { type: "text", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, buttonLabel: { type: "text", label: "Texto do botão" } },
      defaultProps: { title: "Dados pessoais", description: "Preencha as informações para concluir a compra.", buttonLabel: "Finalizar compra" },
      render: ({ title, description, buttonLabel }) => <form onSubmit={(event) => event.preventDefault()} style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gap: 16, marginTop: 24 }}><CheckoutInput label="Nome completo" name="customerName" autoComplete="name" placeholder="Digite seu nome" /><CheckoutInput label="E-mail" name="customerEmail" type="email" autoComplete="email" placeholder="voce@email.com" /><CheckoutInput label="Telefone" name="customerPhone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" /><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}><CheckoutInput label="CPF/CNPJ" name="customerDocument" placeholder="000.000.000-00" /><CheckoutInput label="CEP" name="customerPostalCode" autoComplete="postal-code" placeholder="00000-000" /></div></div><Button type="submit" style={{ ...primaryButton(), width: "100%", marginTop: 24 }}>{buttonLabel}</Button><p style={{ margin: "13px 0 0", textAlign: "center", fontSize: 11, opacity: .55 }}>🔒 Seus dados estão protegidos</p></form>,
    },
    order_summary: {
      label: "Resumo do pedido",
      fields: { title: { type: "text", label: "Título", contentEditable: true } },
      defaultProps: { title: "Resumo do pedido" },
      render: ({ title }) => <aside style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><div style={{ display: "grid", gap: 13, marginTop: 20, fontSize: 14 }}><div style={summaryRow()}><span style={{ opacity: .64 }}>Subtotal</span><span>R$ —</span></div><div style={summaryRow()}><span style={{ opacity: .64 }}>Desconto</span><span>R$ 0,00</span></div><div style={summaryRow()}><span style={{ opacity: .64 }}>Frete</span><span>A calcular</span></div></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--checkout-border)", fontSize: 21, fontWeight: 850, letterSpacing: "-.03em" }}><span>Total</span><span>R$ —</span></div></aside>,
    },
    payment_methods: {
      label: "Formas de pagamento",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, showCard: { type: "radio", label: "Cartão", options: booleanOptions }, showPix: { type: "radio", label: "Pix", options: booleanOptions }, showBoleto: { type: "radio", label: "Boleto", options: booleanOptions } },
      defaultProps: { title: "Formas de pagamento", description: "Escolha uma forma de pagamento segura.", showCard: true, showPix: true, showBoleto: true },
      render: ({ title, description, showCard, showPix, showBoleto }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 22 }}>{showCard && <PaymentOption value="card" icon="▣" title="Cartão" detail="Crédito" defaultChecked />}{showPix && <PaymentOption value="pix" icon="◇" title="Pix" detail="Aprovação rápida" />}{showBoleto && <PaymentOption value="boleto" icon="▤" title="Boleto" detail="Até 3 dias úteis" />}</div></section>,
    },
    card_payment: {
      label: "Dados de pagamento",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, showInstallments: { type: "radio", label: "Parcelamento", options: booleanOptions } },
      defaultProps: { title: "Dados de pagamento", description: "Suas informações são protegidas e criptografadas.", showInstallments: true },
      render: ({ title, description, showInstallments }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gap: 16, marginTop: 24 }}><CheckoutInput label="Número do cartão" name="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" /><CheckoutInput label="Nome impresso no cartão" name="cardName" autoComplete="cc-name" placeholder="Como está no cartão" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><CheckoutInput label="Validade" name="cardExpiry" autoComplete="cc-exp" placeholder="MM/AA" /><CheckoutInput label="CVV" name="cardCvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" /></div>{showInstallments && <label style={inputLabel()}><span>Parcelas</span><select name="installments" defaultValue="1" style={inputControl()}><option value="1">1x sem juros</option><option value="2">2x sem juros</option><option value="3">3x sem juros</option></select></label>}</div></section>,
    },
    pix_payment: {
      label: "Pagamento via Pix",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, expiresIn: { type: "text", label: "Tempo de expiração" } },
      defaultProps: { title: "Pague com Pix", description: "Escaneie o QR Code ou copie o código Pix.", expiresIn: "30 minutos" },
      render: ({ title, description, expiresIn }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 160px) minmax(0, 1fr)", gap: 24, alignItems: "center", marginTop: 24 }}><div style={qrPlaceholder()}>PIX</div><div><p style={{ margin: 0, fontSize: 13, opacity: .65 }}>O código expira em {expiresIn}.</p><input aria-label="Código Pix" readOnly value="00020126••••••••••••••••" style={{ ...inputControl(), width: "100%", marginTop: 12, fontFamily: "monospace" }} /><Button type="button" onClick={() => void navigator.clipboard?.writeText("00020126")} style={{ ...secondaryButton(), width: "100%", marginTop: 10 }}>Copiar código Pix</Button></div></div></section>,
    },
    boleto_payment: {
      label: "Pagamento via boleto",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, dueInDays: { type: "number", label: "Vencimento em dias", min: 1, max: 30 } },
      defaultProps: { title: "Pague com boleto", description: "O pedido será confirmado após a compensação bancária.", dueInDays: 3 },
      render: ({ title, description, dueInDays }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ marginTop: 22, padding: 20, border: "1px solid var(--checkout-border)", borderRadius: 14, background: "var(--checkout-muted)" }}><strong>Vencimento em {dueInDays} dias</strong><div style={{ height: 42, marginTop: 16, background: "repeating-linear-gradient(90deg, var(--checkout-text) 0 2px, transparent 2px 5px)", opacity: .42 }} /></div><Button type="button" style={{ ...secondaryButton(), width: "100%", marginTop: 12 }}>Gerar boleto</Button></section>,
    },
    shipping_address: {
      label: "Dados de entrega",
      fields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" } },
      defaultProps: { title: "Dados de entrega", description: "Informe onde o pedido deve ser entregue." },
      render: ({ title, description }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gap: 16, marginTop: 24 }}><div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) 2fr", gap: 14 }}><CheckoutInput label="CEP" name="shippingPostalCode" autoComplete="postal-code" placeholder="00000-000" /><CheckoutInput label="Rua" name="shippingStreet" autoComplete="address-line1" placeholder="Nome da rua" /></div><div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 1fr) 2fr", gap: 14 }}><CheckoutInput label="Número" name="shippingNumber" placeholder="123" /><CheckoutInput label="Complemento" name="shippingComplement" autoComplete="address-line2" placeholder="Apto, bloco..." /></div><div style={{ display: "grid", gridTemplateColumns: "2fr minmax(90px, 1fr)", gap: 14 }}><CheckoutInput label="Cidade" name="shippingCity" autoComplete="address-level2" placeholder="Sua cidade" /><CheckoutInput label="Estado" name="shippingState" autoComplete="address-level1" placeholder="UF" /></div></div></section>,
    },
    shipping_methods: {
      label: "Frete",
      fields: { title: { type: "text", label: "Título" }, economyLabel: { type: "text", label: "Frete econômico" }, expressLabel: { type: "text", label: "Frete expresso" } },
      defaultProps: { title: "Frete", economyLabel: "Entrega econômica", expressLabel: "Entrega expressa" },
      render: ({ title, economyLabel, expressLabel }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>Selecione a opção que funciona melhor para você.</p><div style={{ display: "grid", gap: 10, marginTop: 22 }}><ShippingOption value="economy" title={economyLabel} detail="5 a 8 dias úteis" price="R$ 12,90" defaultChecked /><ShippingOption value="express" title={expressLabel} detail="2 a 3 dias úteis" price="R$ 24,90" /></div></section>,
    },
    coupon_field: {
      label: "Cupom de desconto",
      fields: { title: { type: "text", label: "Título" }, placeholder: { type: "text", label: "Placeholder" }, buttonLabel: { type: "text", label: "Texto do botão" } },
      defaultProps: { title: "Tem um cupom?", placeholder: "Digite o código", buttonLabel: "Aplicar" },
      render: ({ title, placeholder, buttonLabel }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, marginTop: 18 }}><input name="coupon" placeholder={placeholder} style={{ ...inputControl(), width: "100%" }} /><Button type="button" style={secondaryButton()}>{buttonLabel}</Button></div></section>,
    },
    security_badges: {
      label: "Selos de segurança",
      fields: { title: { type: "text", label: "Título" }, showEncryption: { type: "radio", label: "Criptografia", options: booleanOptions }, showGuarantee: { type: "radio", label: "Garantia", options: booleanOptions }, showPrivacy: { type: "radio", label: "Privacidade", options: booleanOptions } },
      defaultProps: { title: "Compra protegida", showEncryption: true, showGuarantee: true, showPrivacy: true },
      render: ({ title, showEncryption, showGuarantee, showPrivacy }) => <section style={{ ...fullWidth(), textAlign: "center", padding: "28px 0" }}><h2 style={{ ...checkoutHeading(), fontSize: 18 }}>{title}</h2><div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 16 }}>{showEncryption && <TrustBadge label="Dados criptografados" />}{showGuarantee && <TrustBadge label="Compra garantida" />}{showPrivacy && <TrustBadge label="Privacidade protegida" />}</div></section>,
    },
    footer: {
      label: "Rodapé",
      fields: { text: { type: "text", label: "Texto", contentEditable: true }, showSecurity: { type: "radio", label: "Selo de segurança", options: [{ label: "Exibir", value: true }, { label: "Ocultar", value: false }] } },
      defaultProps: { text: "Pagamento seguro processado pelo Astro.", showSecurity: true },
      render: ({ text, showSecurity }) => <footer style={{ ...fullWidth(), padding: "28px 16px", textAlign: "center", fontSize: 12, lineHeight: 1.6, opacity: .62 }}><p style={{ margin: 0 }}>{text}</p>{showSecurity && <p style={{ margin: "8px 0 0" }}>🔒 Ambiente protegido e pagamento criptografado</p>}</footer>,
    },
  },
};

type Palette = { background: string; surface: string; text: string; muted: string; border: string };
const palettes: Record<GrayTone, { light: Palette; dark: Palette }> = {
  neutral: {
    light: { background: "#f7f7fb", surface: "#ffffff", text: "#202235", muted: "#f4f4f8", border: "#e4e4ec" },
    dark: { background: "#111318", surface: "#1b1e25", text: "#f5f7fa", muted: "#252932", border: "#343945" },
  },
  gray: {
    light: { background: "#f3f4f6", surface: "#ffffff", text: "#1f2937", muted: "#f3f4f6", border: "#dfe2e7" },
    dark: { background: "#111827", surface: "#1f2937", text: "#f9fafb", muted: "#293548", border: "#374151" },
  },
  zinc: {
    light: { background: "#f4f4f5", surface: "#ffffff", text: "#27272a", muted: "#f4f4f5", border: "#e4e4e7" },
    dark: { background: "#18181b", surface: "#27272a", text: "#fafafa", muted: "#303034", border: "#3f3f46" },
  },
  slate: {
    light: { background: "#f1f5f9", surface: "#ffffff", text: "#1e293b", muted: "#f1f5f9", border: "#dbe3ec" },
    dark: { background: "#0f172a", surface: "#1e293b", text: "#f8fafc", muted: "#27364a", border: "#334155" },
  },
};

function resolvePalette(theme: BuilderRootProps) {
  const tone = palettes[theme.grayTone] ?? palettes.neutral;
  if (theme.themeMode === "system") return systemPalette(tone.light, tone.dark);
  const preset = theme.themeMode === "dark" ? tone.dark : tone.light;
  if (theme.themeMode === "light" && theme.grayTone === "neutral") {
    return { ...preset, background: safeColor(theme.backgroundColor, preset.background), surface: safeColor(theme.surfaceColor, preset.surface), text: safeColor(theme.textColor, preset.text) };
  }
  return preset;
}
function systemPalette(light: Palette, dark: Palette): Palette { return { background: `light-dark(${light.background}, ${dark.background})`, surface: `light-dark(${light.surface}, ${dark.surface})`, text: `light-dark(${light.text}, ${dark.text})`, muted: `light-dark(${light.muted}, ${dark.muted})`, border: `light-dark(${light.border}, ${dark.border})` }; }
function variables(theme: BuilderRootProps) { const palette = resolvePalette(theme); return { "--checkout-bg": palette.background, "--checkout-surface": palette.surface, "--checkout-text": palette.text, "--checkout-muted": palette.muted, "--checkout-border": palette.border, "--checkout-accent": safeColor(theme.accentColor, "#7065e8"), "--checkout-radius": radiusValue(theme.radius), "--checkout-shadow": shadowValue(theme.shadow), "--checkout-component-gap": `${spacingValue(theme.componentGap)}px`, "--checkout-group-bg": theme.inputGroupStyle === "outlined" ? "transparent" : "var(--checkout-surface)", "--checkout-group-border": theme.inputGroupStyle === "outlined" ? "color-mix(in srgb, var(--checkout-text) 24%, var(--checkout-border))" : "var(--checkout-border)", "--checkout-group-border-width": theme.inputGroupStyle === "outlined" ? "1.5px" : "1px", "--checkout-group-shadow": theme.inputGroupStyle === "outlined" ? "none" : "var(--checkout-shadow)" } as React.CSSProperties; }
function fontStack(font: FontPreset) { return { system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", geist: "Geist, Inter, system-ui, sans-serif", arial: "Arial, Helvetica, sans-serif", georgia: "Georgia, 'Times New Roman', serif", serif: "'Iowan Old Style', Baskerville, 'Times New Roman', serif", mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace" }[font] ?? "system-ui, sans-serif"; }
function fullWidth(): React.CSSProperties { return { width: "100%", minWidth: 0, boxSizing: "border-box" }; }
function card(): React.CSSProperties { return { width: "100%", minWidth: 0, boxSizing: "border-box", background: "var(--checkout-surface)", border: "1px solid var(--checkout-border)", borderRadius: "var(--checkout-radius)", boxShadow: "var(--checkout-shadow)", color: "var(--checkout-text)" }; }
function checkoutCard(): React.CSSProperties { return { width: "100%", minWidth: 0, boxSizing: "border-box", background: "var(--checkout-group-bg)", border: "var(--checkout-group-border-width) solid var(--checkout-group-border)", borderRadius: "var(--checkout-radius)", boxShadow: "var(--checkout-group-shadow)", color: "var(--checkout-text)" }; }
function heading(): React.CSSProperties { return { margin: 0, fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.15, letterSpacing: "-.035em" }; }
function checkoutHeading(): React.CSSProperties { return { margin: 0, fontSize: 22, fontWeight: 750, lineHeight: 1.25, letterSpacing: "-.025em" }; }
function checkoutDescription(): React.CSSProperties { return { margin: "8px 0 0", fontSize: 14, lineHeight: 1.65, opacity: .68 }; }
function primaryButton(): React.CSSProperties { return { display: "inline-flex", justifyContent: "center", marginTop: 26, border: 0, borderRadius: 12, background: "var(--checkout-accent)", color: "white", padding: "15px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 24px color-mix(in srgb, var(--checkout-accent) 22%, transparent)" }; }
function secondaryButton(): React.CSSProperties { return { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, border: "1px solid var(--checkout-border)", borderRadius: 10, background: "var(--checkout-surface)", color: "var(--checkout-text)", padding: "0 16px", fontSize: 13, fontWeight: 750, cursor: "pointer" }; }
function numberBadge(): React.CSSProperties { return { display: "grid", width: 38, height: 38, placeItems: "center", borderRadius: 999, background: "color-mix(in srgb, var(--checkout-accent) 14%, white)", color: "var(--checkout-accent)", fontWeight: 850 }; }
function qrPlaceholder(): React.CSSProperties { return { display: "grid", aspectRatio: "1", placeItems: "center", border: "10px solid var(--checkout-surface)", borderRadius: 12, background: "repeating-conic-gradient(var(--checkout-text) 0 25%, var(--checkout-surface) 0 50%) 0 / 18px 18px", boxShadow: "0 0 0 1px var(--checkout-border)", color: "var(--checkout-accent)", fontWeight: 900 }; }
function inputControl(): React.CSSProperties { return { boxSizing: "border-box", minHeight: 46, border: "1px solid var(--checkout-border)", borderRadius: 11, outline: "none", background: "var(--checkout-surface)", color: "var(--checkout-text)", padding: "0 13px", font: "inherit", fontSize: 14 }; }
function inputLabel(): React.CSSProperties { return { minWidth: 0, display: "grid", gap: 7, color: "var(--checkout-text)", fontSize: 12, fontWeight: 700 }; }
function CheckoutInput({ label, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label style={inputLabel()}><span>{label}</span><input {...input} style={{ ...inputControl(), width: "100%" }} /></label>; }
function PaymentOption({ value, icon, title, detail, defaultChecked = false }: { value: string; icon: string; title: string; detail: string; defaultChecked?: boolean }) { return <label style={{ display: "flex", alignItems: "center", gap: 11, minHeight: 72, border: "1px solid var(--checkout-border)", borderRadius: 12, padding: 12, background: "var(--checkout-surface)", cursor: "pointer" }}><input type="radio" name="paymentMethod" value={value} defaultChecked={defaultChecked} style={{ accentColor: "var(--checkout-accent)" }} /><span style={{ display: "grid", width: 34, height: 34, placeItems: "center", borderRadius: 9, background: "var(--checkout-muted)", color: "var(--checkout-accent)", fontWeight: 900 }}>{icon}</span><span><strong style={{ display: "block", fontSize: 13 }}>{title}</strong><small style={{ opacity: .58 }}>{detail}</small></span></label>; }
function ShippingOption({ value, title, detail, price, defaultChecked = false }: { value: string; title: string; detail: string; price: string; defaultChecked?: boolean }) { return <label style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--checkout-border)", borderRadius: 12, padding: 15, cursor: "pointer" }}><input type="radio" name="shippingMethod" value={value} defaultChecked={defaultChecked} style={{ accentColor: "var(--checkout-accent)" }} /><span style={{ flex: 1 }}><strong style={{ display: "block", fontSize: 13 }}>{title}</strong><small style={{ opacity: .6 }}>{detail}</small></span><strong style={{ fontSize: 13 }}>{price}</strong></label>; }
function summaryRow(): React.CSSProperties { return { display: "flex", justifyContent: "space-between", gap: 18 }; }
function TrustBadge({ label }: { label: string }) { return <span style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--checkout-border)", borderRadius: 999, background: "var(--checkout-surface)", padding: "9px 13px", fontSize: 12, fontWeight: 700 }}><span style={{ color: "var(--checkout-accent)" }}>✓</span>{label}</span>; }
function radiusValue(size: SizePreset) { return { xs: "4px", sm: "8px", md: "12px", lg: "18px", xl: "26px" }[size] ?? "12px"; }
function shadowValue(size: ShadowPreset) { return { none: "none", xs: "0 2px 8px rgba(30,31,48,.04)", sm: "0 10px 30px rgba(30,31,48,.06)", md: "0 18px 48px rgba(30,31,48,.09)", lg: "0 26px 70px rgba(30,31,48,.13)" }[size] ?? "none"; }
function widthValue(size: WidthPreset) { return { sm: 760, md: 920, lg: 1120, xl: 1320, full: 1440 }[size] ?? 1120; }
function spacingValue(size: SizePreset) { return { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 }[size] ?? 20; }
function slotStyle(gap: SizePreset) { return { "--checkout-component-gap": `${spacingValue(gap)}px`, width: "100%", minWidth: 0, boxSizing: "border-box", display: "grid", alignContent: "start", alignItems: "stretch", gap: spacingValue(gap) } as React.CSSProperties; }
function logoSize(size: SizePreset) { return { xs: 72, sm: 104, md: 144, lg: 192, xl: 256 }[size] ?? 144; }
function logoRadiusValue(radius: LogoRadius) { return { none: 0, sm: 8, md: 16, lg: 28, full: "50%" }[radius] ?? 16; }
function safeColor(value: string, fallback: string) { return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function safeHttpsUrl(value: string) { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function isProtectedCheckoutForm(id: unknown) { return id === "form-required" || id === "form-initial"; }
function formatDeadline(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Defina uma data válida" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(date); }
