"use client";

import { Button } from "@/components/ui/button";

import type { Config, Data, Slot } from "@puckeditor/core";
import { useEffect, useState } from "react";

import { ColorPickerField } from "@/components/checkout-builder/color-picker-field";

type BuilderProps = {
  hero: { layout: HeroLayout; eyebrow: string; title: string; description: string; buttonLabel: string; imageUrl: string };
  text: { title: string; content: string; alignment: "left" | "center" };
  image: { url: string; alt: string; caption: string };
  video: { url: string; title: string; caption: string; posterUrl: string; aspectRatio: VideoRatio; autoplay: boolean; controls: boolean };
  logo: { url: string; alt: string; alignment: "left" | "center" | "right"; size: SizePreset; radius: LogoRadius; overlapBanner: boolean };
  banner: { imageUrl: string; alt: string; aspectRatio: BannerRatio; fit: "cover" | "contain" };
  grid: { columns: "1" | "2" | "3"; columnGap: SizePreset; itemGap: SizePreset; padding: SizePreset; column1: Slot; column2: Slot; column3: Slot };
  benefits: { layout: BenefitsLayout; title: string; items: { title: string; description: string }[] };
  testimonials: { layout: TestimonialsLayout; title: string; items: { quote: string; name: string; role: string }[] };
  faq: { layout: FaqLayout; title: string; items: { question: string; answer: string }[] };
  guarantee: { layout: GuaranteeLayout; title: string; description: string; days: number };
  countdown: { layout: CountdownLayout; title: string; deadline: string };
  product_summary: { layout: ProductLayout; title: string; description: string };
  checkout_form: { layout: FormLayout; title: string; description: string; buttonLabel: string; showPhone: boolean; showDocument: boolean };
  order_summary: { layout: SummaryLayout; title: string };
  payment_methods: { layout: PaymentLayout; title: string; description: string; showCard: boolean; showPix: boolean; showBoleto: boolean };
  card_payment: { layout: CardPaymentLayout; title: string; description: string; showInstallments: boolean };
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
type FontPreset = "system" | "geist" | "inter" | "montserrat" | "poppins" | "roboto" | "open-sans" | "lato" | "arial" | "georgia" | "serif" | "mono";
type SizePreset = "xs" | "sm" | "md" | "lg" | "xl";
type WidthPreset = "sm" | "md" | "lg" | "xl" | "full";
type ShadowPreset = "none" | "xs" | "sm" | "md" | "lg";
type LogoRadius = "none" | "sm" | "md" | "lg" | "full";
type BannerRatio = "4/1" | "3/1" | "2/1" | "16/9" | "1/1" | "4/5";
type VideoRatio = "16/9" | "4/3" | "1/1" | "9/16";
type InputGroupStyle = "filled" | "outlined";
type HeroLayout = "choose" | "centered" | "split" | "compact";
type CountdownLayout = "cards" | "banner" | "minimal";
type BenefitsLayout = "cards" | "list" | "steps";
type TestimonialsLayout = "cards" | "featured" | "compact";
type FaqLayout = "accordion" | "cards" | "split";
type GuaranteeLayout = "horizontal" | "seal" | "banner";
type ProductLayout = "card" | "compact" | "detailed";
type FormLayout = "card" | "compact" | "plain";
type SummaryLayout = "card" | "receipt" | "highlight";
type PaymentLayout = "cards" | "list" | "segmented";
type CardPaymentLayout = "standard" | "compact" | "visual";

export type BuilderRootProps = { themeMode: ThemeMode; grayTone: GrayTone; fontFamily: FontPreset; backgroundColor: string; surfaceColor: string; textColor: string; accentColor: string; radius: SizePreset; shadow: ShadowPreset; maxWidth: WidthPreset; componentGap: SizePreset; pagePadding: SizePreset; inputGroupStyle: InputGroupStyle };
export type BuilderData = Data<BuilderProps, BuilderRootProps>;

const alignment = [{ label: "Esquerda", value: "left" }, { label: "Centralizado", value: "center" }] as const;
const booleanOptions = [{ label: "Exibir", value: true }, { label: "Ocultar", value: false }] as const;
const sizeOptions = [{ label: "XS", value: "xs" }, { label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "XL", value: "xl" }] as const;
const shadowOptions = [{ label: "Sem sombra", value: "none" }, ...sizeOptions.slice(0, 4)] as const;
const colorField = (label: string) => ({ type: "custom" as const, label, render: ({ name, value, onChange, field }: { name: string; value: string; onChange: (value: string) => void; field: { label?: string } }) => <ColorPickerField name={name} label={field.label} value={value} onChange={onChange} /> });
const heroLayoutField = {
  type: "custom" as const,
  label: "Template da apresentação",
  render: ({ value, onChange }: { value: HeroLayout; onChange: (value: HeroLayout) => void }) => <HeroLayoutPicker value={value} onChange={onChange} />,
};
const countdownLayoutField = {
  type: "custom" as const,
  label: "Template do cronômetro",
  render: ({ value, onChange }: { value: CountdownLayout; onChange: (value: CountdownLayout) => void }) => <CountdownLayoutPicker value={value} onChange={onChange} />,
};
const benefitsLayoutField = templateField<BenefitsLayout>("Template dos benefícios", [{ value: "cards", label: "Cartões", description: "Benefícios em grade." }, { value: "list", label: "Lista", description: "Leitura vertical objetiva." }, { value: "steps", label: "Etapas", description: "Fluxo numerado." }]);
const testimonialsLayoutField = templateField<TestimonialsLayout>("Template dos depoimentos", [{ value: "cards", label: "Cartões", description: "Depoimentos com o mesmo peso." }, { value: "featured", label: "Destaque", description: "Um relato principal em evidência." }, { value: "compact", label: "Compacto", description: "Prova social mais discreta." }]);
const faqLayoutField = templateField<FaqLayout>("Template das perguntas", [{ value: "accordion", label: "Acordeão", description: "Respostas abertas sob demanda." }, { value: "cards", label: "Cartões", description: "Perguntas e respostas sempre visíveis." }, { value: "split", label: "Dividido", description: "Título lateral e perguntas à direita." }]);
const guaranteeLayoutField = templateField<GuaranteeLayout>("Template da garantia", [{ value: "horizontal", label: "Horizontal", description: "Selo e texto lado a lado." }, { value: "seal", label: "Selo central", description: "Garantia como destaque principal." }, { value: "banner", label: "Faixa", description: "Bloco forte usando a cor do tema." }]);
const productLayoutField = templateField<ProductLayout>("Template dos itens", [{ value: "card", label: "Cartão", description: "Resumo completo do produto." }, { value: "compact", label: "Compacto", description: "Produto e preço em uma linha." }, { value: "detailed", label: "Detalhado", description: "Visual de recibo com quantidade." }]);
const formLayoutField = templateField<FormLayout>("Template dos dados", [{ value: "card", label: "Cartão", description: "Formulário tradicional." }, { value: "compact", label: "Compacto", description: "Campos básicos lado a lado." }, { value: "plain", label: "Sem caixa", description: "Integração leve com a página." }]);
const summaryLayoutField = templateField<SummaryLayout>("Template do resumo", [{ value: "card", label: "Cartão", description: "Resumo equilibrado." }, { value: "receipt", label: "Recibo", description: "Linhas e total em formato fiscal." }, { value: "highlight", label: "Total destacado", description: "Valor final ganha prioridade." }]);
const paymentLayoutField = templateField<PaymentLayout>("Template do pagamento", [{ value: "cards", label: "Cartões", description: "Métodos visuais em grade." }, { value: "list", label: "Lista", description: "Opções amplas e descritivas." }, { value: "segmented", label: "Segmentado", description: "Seletor compacto em uma faixa." }]);
const cardPaymentLayoutField = templateField<CardPaymentLayout>("Template dos dados de pagamento", [{ value: "standard", label: "Padrão", description: "Campos amplos e confortáveis." }, { value: "compact", label: "Compacto", description: "Ocupa menos espaço na página." }, { value: "visual", label: "Cartão visual", description: "Prévia do cartão ao lado dos campos." }]);
const checkoutPageStyles = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lato:wght@400;700;900&family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Roboto:wght@400;500;700;900&display=swap");
  [data-checkout-page] input,
  [data-checkout-page] select,
  [data-checkout-page] textarea {
    transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
  }
  [data-checkout-page] input:focus,
  [data-checkout-page] input:focus-visible,
  [data-checkout-page] select:focus,
  [data-checkout-page] select:focus-visible,
  [data-checkout-page] textarea:focus,
  [data-checkout-page] textarea:focus-visible {
    border-color: var(--checkout-accent) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--checkout-accent) 18%, transparent) !important;
    outline: none !important;
  }
  [data-checkout-page] button {
    transition: filter 150ms ease, transform 150ms ease, box-shadow 150ms ease;
  }
  [data-checkout-page] button:hover {
    filter: brightness(.88);
    transform: translateY(-1px);
  }
  [data-checkout-page] button:active {
    filter: brightness(.8);
    transform: translateY(0);
  }
  [data-checkout-page] .checkout-primary-button:hover {
    background: color-mix(in srgb, var(--checkout-accent) 82%, black) !important;
    filter: none;
    box-shadow: 0 13px 28px color-mix(in srgb, var(--checkout-accent) 30%, transparent) !important;
  }
  [data-checkout-page] .checkout-payment-option {
    transition: border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
  }
  [data-checkout-page] .checkout-payment-option:hover {
    border-color: color-mix(in srgb, var(--checkout-accent) 48%, var(--checkout-border)) !important;
    transform: translateY(-1px);
  }
  [data-checkout-page] .checkout-payment-option:has(input:checked) {
    border-color: var(--checkout-accent) !important;
    background: color-mix(in srgb, var(--checkout-accent) 8%, var(--checkout-surface)) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--checkout-accent) 13%, transparent);
  }
  [data-checkout-page] [data-puck-overlay] {
    --puck-color-selection-border: var(--checkout-accent);
  }
  .checkout-page-content > * {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: grid;
    align-items: stretch;
    gap: var(--checkout-component-gap);
  }
`;

export const checkoutBuilderConfig: Config<BuilderProps, BuilderRootProps> = {
  categories: {
    content: { title: "Conteúdo", components: ["hero", "logo", "banner", "video", "text", "image", "benefits", "testimonials", "faq", "guarantee", "countdown"], defaultExpanded: false },
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
      fontFamily: { type: "select", label: "Tipografia", options: [{ label: "Sistema", value: "system" }, { label: "Geist", value: "geist" }, { label: "Inter", value: "inter" }, { label: "Montserrat", value: "montserrat" }, { label: "Poppins", value: "poppins" }, { label: "Roboto", value: "roboto" }, { label: "Open Sans", value: "open-sans" }, { label: "Lato", value: "lato" }, { label: "Arial", value: "arial" }, { label: "Georgia", value: "georgia" }, { label: "Serif clássica", value: "serif" }, { label: "Monoespaçada", value: "mono" }] },
      backgroundColor: colorField("Cor do fundo"), surfaceColor: colorField("Cor dos componentes"), textColor: colorField("Cor do texto"), accentColor: colorField("Cor principal"),
      radius: { type: "select", label: "Arredondamento dos cantos", options: sizeOptions },
      shadow: { type: "select", label: "Sombra", options: shadowOptions },
      maxWidth: { type: "select", label: "Largura", options: [{ label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "XL", value: "xl" }, { label: "Total", value: "full" }] },
      componentGap: { type: "select", label: "Espaçamento entre componentes", options: sizeOptions },
      pagePadding: { type: "select", label: "Margem interna da página", options: sizeOptions },
      inputGroupStyle: { type: "select", label: "Estilo dos blocos de checkout", options: [{ label: "Fundo preenchido", value: "filled" }, { label: "Fundo vazado com borda", value: "outlined" }] },
    },
    defaultProps: { themeMode: "light", grayTone: "neutral", fontFamily: "system", backgroundColor: "#f7f7fb", surfaceColor: "#ffffff", textColor: "#202235", accentColor: "#7065e8", radius: "md", shadow: "sm", maxWidth: "lg", componentGap: "md", pagePadding: "lg", inputGroupStyle: "filled" },
    render: ({ children, ...theme }) => { const palette = resolvePalette(theme); return <div data-checkout-page style={{ ...variables(theme), colorScheme: theme.themeMode === "system" ? "light dark" : theme.themeMode, minHeight: "100vh", background: palette.background, color: palette.text, fontFamily: fontStack(theme.fontFamily), padding: spacingValue(theme.pagePadding) }}><style>{checkoutPageStyles}</style><main className="checkout-page-content" style={{ width: "100%", maxWidth: widthValue(theme.maxWidth), margin: "0 auto", display: "grid", alignItems: "stretch", gap: spacingValue(theme.componentGap) }}>{children}</main></div>; },
  },
  components: {
    hero: {
      label: "Apresentação",
      fields: { layout: heroLayoutField, eyebrow: { type: "text", label: "Chamada superior", contentEditable: true }, title: { type: "textarea", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, buttonLabel: { type: "text", label: "Texto do botão" }, imageUrl: { type: "text", label: "Imagem do template (opcional)" } },
      defaultProps: { layout: "choose", eyebrow: "Oferta especial", title: "Uma transformação começa aqui", description: "Apresente de forma clara o principal resultado que seu produto entrega.", buttonLabel: "Quero começar", imageUrl: "" },
      render: ({ layout, eyebrow, title, description, buttonLabel, imageUrl }) => <HeroSection layout={layout ?? "centered"} eyebrow={eyebrow} title={title} description={description} buttonLabel={buttonLabel} imageUrl={imageUrl} />,
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
    video: {
      label: "Player de vídeo",
      fields: { url: { type: "text", label: "URL do YouTube, Vimeo ou vídeo HTTPS" }, title: { type: "text", label: "Título acessível" }, caption: { type: "text", label: "Legenda" }, posterUrl: { type: "text", label: "Capa HTTPS (vídeo direto)" }, aspectRatio: { type: "select", label: "Formato", options: [{ label: "Paisagem · 16:9", value: "16/9" }, { label: "Clássico · 4:3", value: "4/3" }, { label: "Quadrado · 1:1", value: "1/1" }, { label: "Vertical · 9:16", value: "9/16" }] }, autoplay: { type: "radio", label: "Reprodução automática", options: booleanOptions }, controls: { type: "radio", label: "Controles", options: booleanOptions } },
      defaultProps: { url: "", title: "Vídeo de apresentação", caption: "", posterUrl: "", aspectRatio: "16/9", autoplay: false, controls: true },
      render: ({ url, title, caption, posterUrl, aspectRatio, autoplay, controls }) => <VideoPlayer url={url} title={title} caption={caption} posterUrl={posterUrl} aspectRatio={aspectRatio ?? "16/9"} autoplay={autoplay ?? false} controls={controls ?? true} />,
    },
    benefits: {
      label: "Benefícios",
      fields: { layout: benefitsLayoutField, title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Benefícios", min: 1, max: 6, arrayFields: { title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" } }, defaultItemProps: { title: "Novo benefício", description: "Descreva este benefício." }, getItemSummary: (item) => item.title } },
      defaultProps: { layout: "cards", title: "Por que escolher esta oferta?", items: [{ title: "Resultado rápido", description: "Comece imediatamente com um caminho claro." }, { title: "Método comprovado", description: "Siga um processo estruturado e objetivo." }, { title: "Suporte de verdade", description: "Tenha ajuda quando precisar." }] },
      render: ({ layout, title, items }) => <BenefitsSection layout={layout ?? "cards"} title={title} items={items} />,
    },
    testimonials: {
      label: "Depoimentos",
      fields: { layout: testimonialsLayoutField, title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Depoimentos", min: 1, max: 6, arrayFields: { quote: { type: "textarea", label: "Depoimento" }, name: { type: "text", label: "Nome" }, role: { type: "text", label: "Identificação" } }, defaultItemProps: { quote: "Essa experiência mudou minha forma de trabalhar.", name: "Cliente", role: "Cliente verificado" }, getItemSummary: (item) => item.name } },
      defaultProps: { layout: "cards", title: "Quem já comprou recomenda", items: [{ quote: "Consegui colocar tudo em prática rapidamente e os resultados apareceram.", name: "Marina Costa", role: "Cliente verificada" }, { quote: "Conteúdo direto, organizado e muito mais completo do que eu esperava.", name: "Rafael Lima", role: "Cliente verificado" }] },
      render: ({ layout, title, items }) => <TestimonialsSection layout={layout ?? "cards"} title={title} items={items} />,
    },
    faq: {
      label: "Perguntas frequentes",
      fields: { layout: faqLayoutField, title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Perguntas", min: 1, max: 10, arrayFields: { question: { type: "text", label: "Pergunta" }, answer: { type: "textarea", label: "Resposta" } }, defaultItemProps: { question: "Nova pergunta", answer: "Escreva a resposta." }, getItemSummary: (item) => item.question } },
      defaultProps: { layout: "accordion", title: "Perguntas frequentes", items: [{ question: "Como recebo o acesso?", answer: "Você receberá as instruções logo após a confirmação do pagamento." }, { question: "O pagamento é seguro?", answer: "Sim. O pagamento é processado diretamente por um gateway homologado." }] },
      render: ({ layout, title, items }) => <FaqSection layout={layout ?? "accordion"} title={title} items={items} />,
    },
    guarantee: {
      label: "Garantia",
      fields: { layout: guaranteeLayoutField, title: { type: "text", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, days: { type: "number", label: "Dias", min: 0, max: 365 } },
      defaultProps: { layout: "horizontal", title: "Garantia de 7 dias", description: "Experimente com tranquilidade. Se não fizer sentido, solicite o reembolso dentro do prazo.", days: 7 },
      render: ({ layout, title, description, days }) => <GuaranteeSection layout={layout ?? "horizontal"} title={title} description={description} days={days} />,
    },
    countdown: {
      label: "Contagem regressiva",
      fields: { layout: countdownLayoutField, title: { type: "text", label: "Título", contentEditable: true }, deadline: { type: "text", label: "Data limite (ISO)" } },
      defaultProps: { layout: "cards", title: "Esta condição termina em breve", deadline: "2026-12-31T23:59:59-03:00" },
      render: ({ layout, title, deadline }) => <CountdownSection layout={layout ?? "cards"} title={title} deadline={deadline} />,
    },
    product_summary: {
      label: "Itens do carrinho",
      fields: { layout: productLayoutField, title: { type: "text", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true } },
      defaultProps: { layout: "card", title: "Itens do carrinho", description: "Confira o produto selecionado e suas condições." },
      render: ({ layout, title, description }) => <ProductSection layout={layout ?? "card"} title={title} description={description} />,
    },
    checkout_form: {
      label: "Dados pessoais",
      resolvePermissions: (data) => ({ delete: !isProtectedCheckoutForm(data.props.id) }),
      fields: { layout: formLayoutField, title: { type: "text", label: "Título", contentEditable: true }, description: { type: "textarea", label: "Descrição", contentEditable: true }, buttonLabel: { type: "text", label: "Texto do botão" }, showPhone: { type: "radio", label: "Telefone opcional", options: booleanOptions }, showDocument: { type: "radio", label: "CPF/CNPJ opcional", options: booleanOptions } },
      defaultProps: { layout: "card", title: "Dados pessoais", description: "Preencha as informações para concluir a compra.", buttonLabel: "Finalizar compra", showPhone: false, showDocument: false },
      render: ({ layout, title, description, buttonLabel, showPhone, showDocument }) => <CheckoutFormSection layout={layout ?? "card"} title={title} description={description} buttonLabel={buttonLabel} showPhone={showPhone ?? false} showDocument={showDocument ?? false} />,
    },
    order_summary: {
      label: "Resumo do pedido",
      fields: { layout: summaryLayoutField, title: { type: "text", label: "Título", contentEditable: true } },
      defaultProps: { layout: "card", title: "Resumo do pedido" },
      render: ({ layout, title }) => <OrderSummarySection layout={layout ?? "card"} title={title} />,
    },
    payment_methods: {
      label: "Formas de pagamento",
      fields: { layout: paymentLayoutField, title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, showCard: { type: "radio", label: "Cartão", options: booleanOptions }, showPix: { type: "radio", label: "Pix", options: booleanOptions }, showBoleto: { type: "radio", label: "Boleto", options: booleanOptions } },
      defaultProps: { layout: "cards", title: "Formas de pagamento", description: "Escolha uma forma de pagamento segura.", showCard: true, showPix: true, showBoleto: true },
      render: ({ layout, title, description, showCard, showPix, showBoleto }) => <PaymentMethodsSection layout={layout ?? "cards"} title={title} description={description} showCard={showCard} showPix={showPix} showBoleto={showBoleto} />,
    },
    card_payment: {
      label: "Dados de pagamento",
      fields: { layout: cardPaymentLayoutField, title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Descrição" }, showInstallments: { type: "radio", label: "Parcelamento", options: booleanOptions } },
      defaultProps: { layout: "standard", title: "Dados de pagamento", description: "Suas informações são protegidas e criptografadas.", showInstallments: true },
      render: ({ layout, title, description, showInstallments }) => <CardPaymentSection layout={layout ?? "standard"} title={title} description={description} showInstallments={showInstallments} />,
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
      render: ({ title, description }) => <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gap: 16, marginTop: 24 }}><div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) 2fr", gap: 14 }}><CheckoutInput required label="CEP *" name="shippingPostalCode" autoComplete="postal-code" placeholder="00000-000" /><CheckoutInput required label="Rua *" name="shippingStreet" autoComplete="address-line1" placeholder="Nome da rua" /></div><div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 1fr) 2fr", gap: 14 }}><CheckoutInput required label="Número *" name="shippingNumber" placeholder="123" /><CheckoutInput label="Complemento" name="shippingComplement" autoComplete="address-line2" placeholder="Apto, bloco..." /></div><CheckoutInput required label="Bairro *" name="shippingDistrict" placeholder="Seu bairro" /><div style={{ display: "grid", gridTemplateColumns: "2fr minmax(90px, 1fr)", gap: 14 }}><CheckoutInput required label="Cidade *" name="shippingCity" autoComplete="address-level2" placeholder="Sua cidade" /><CheckoutInput required label="Estado *" name="shippingState" autoComplete="address-level1" placeholder="UF" /></div></div></section>,
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

type TemplateOption<T extends string> = { value: T; label: string; description: string };
function templateField<T extends string>(label: string, options: TemplateOption<T>[]) {
  return {
    type: "custom" as const,
    label,
    render: ({ value, onChange }: { value: T; onChange: (value: T) => void }) => <TemplatePicker value={value} options={options} onChange={onChange} />,
  };
}

function TemplatePicker<T extends string>({ value, options, onChange }: { value: T; options: TemplateOption<T>[]; onChange: (value: T) => void }) {
  return <div className="checkout-hero-layout-picker">{options.map((option, index) => <button key={option.value} type="button" className="checkout-hero-layout-option" data-selected={(value ?? options[0].value) === option.value} aria-pressed={(value ?? options[0].value) === option.value} onClick={() => onChange(option.value)}><span style={{ display: "grid", height: 54, gridTemplateColumns: index === 1 ? "1fr" : "repeat(3, 1fr)", alignItems: "center", gap: 4, border: "1px solid #e5e3ee", borderRadius: 8, background: index === 2 ? "#7566ea" : "#f8f7ff", padding: 7 }}>{[1, 2, 3].map((item) => <i key={item} style={{ display: "block", height: index === 1 ? 7 : 28, borderRadius: 4, background: index === 2 ? "rgb(255 255 255 / 76%)" : item === 1 ? "#b7aff8" : "#ddd9f5" }} />)}</span><span><strong style={{ display: "block", fontSize: 12 }}>{option.label}</strong><small style={{ display: "block", marginTop: 3, color: "#717185", fontSize: 10, lineHeight: 1.35 }}>{option.description}</small></span></button>)}</div>;
}

type BenefitItem = { title: string; description: string };
function BenefitsSection({ layout, title, items }: { layout: BenefitsLayout; title: string; items: BenefitItem[] }) {
  if (layout === "list") return <section style={{ ...card(), padding: "clamp(28px, 5vw, 48px)" }}><h2 style={heading()}>{title}</h2><div style={{ display: "grid", gap: 0, marginTop: 24 }}>{items.map((item, index) => <div key={`${item.title}-${index}`} style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr)", gap: 14, padding: "18px 0", borderTop: "1px solid var(--checkout-border)" }}><span style={{ ...numberBadge(), width: 36, height: 36 }}>✓</span><div><strong style={{ fontSize: 15 }}>{item.title}</strong><p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.6, opacity: .66 }}>{item.description}</p></div></div>)}</div></section>;
  if (layout === "steps") return <section style={{ ...fullWidth(), padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginTop: 28 }}>{items.map((item, index) => <article key={`${item.title}-${index}`} style={{ position: "relative", padding: 24, borderTop: "3px solid var(--checkout-accent)", background: "color-mix(in srgb, var(--checkout-accent) 5%, var(--checkout-surface))", borderRadius: "0 0 var(--checkout-radius) var(--checkout-radius)" }}><span style={{ color: "var(--checkout-accent)", fontSize: 12, fontWeight: 850 }}>0{index + 1}</span><h3 style={{ margin: "12px 0 0", fontSize: 17 }}>{item.title}</h3><p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, opacity: .66 }}>{item.description}</p></article>)}</div></section>;
  return <section style={{ ...fullWidth(), padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 28 }}>{items.map((item, index) => <article key={`${item.title}-${index}`} style={{ ...card(), padding: 24 }}><span style={numberBadge()}>{index + 1}</span><h3 style={{ margin: "18px 0 0", fontSize: 18 }}>{item.title}</h3><p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.65, opacity: .68 }}>{item.description}</p></article>)}</div></section>;
}

type TestimonialItem = { quote: string; name: string; role: string };
function TestimonialsSection({ layout, title, items }: { layout: TestimonialsLayout; title: string; items: TestimonialItem[] }) {
  if (layout === "featured" && items.length) return <section style={{ ...fullWidth(), padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(240px,.65fr)", gap: 16, marginTop: 28 }}><TestimonialCard item={items[0]} featured />{items.length > 1 && <div style={{ display: "grid", gap: 16 }}>{items.slice(1).map((item, index) => <TestimonialCard key={`${item.name}-${index}`} item={item} />)}</div>}</div></section>;
  if (layout === "compact") return <section style={{ ...card(), padding: 28 }}><h2 style={{ ...checkoutHeading(), fontSize: 18 }}>{title}</h2><div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 20 }}>{items.map((item, index) => <blockquote key={`${item.name}-${index}`} style={{ minWidth: 220, flex: 1, margin: 0 }}><p style={{ margin: 0, fontSize: 13, lineHeight: 1.65 }}>&ldquo;{item.quote}&rdquo;</p><footer style={{ marginTop: 10, fontSize: 11, opacity: .62 }}>{item.name} · {item.role}</footer></blockquote>)}</div></section>;
  return <section style={{ ...fullWidth(), padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 28 }}>{items.map((item, index) => <TestimonialCard key={`${item.name}-${index}`} item={item} />)}</div></section>;
}
function TestimonialCard({ item, featured = false }: { item: TestimonialItem; featured?: boolean }) { return <blockquote style={{ ...card(), margin: 0, padding: featured ? 36 : 28, background: featured ? "color-mix(in srgb, var(--checkout-accent) 8%, var(--checkout-surface))" : "var(--checkout-surface)" }}><span style={{ color: "var(--checkout-accent)", fontSize: 30, lineHeight: 1 }}>“</span><p style={{ margin: "8px 0 0", fontSize: featured ? 20 : 16, lineHeight: 1.7 }}>{item.quote}</p><footer style={{ marginTop: 20 }}><strong style={{ fontSize: 14 }}>{item.name}</strong><span style={{ display: "block", marginTop: 3, fontSize: 12, opacity: .6 }}>{item.role}</span></footer></blockquote>; }

type FaqItem = { question: string; answer: string };
function FaqSection({ layout, title, items }: { layout: FaqLayout; title: string; items: FaqItem[] }) {
  if (layout === "cards") {
    return <section style={{ ...fullWidth(), padding: "32px 0" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 28 }}>{items.map((item, index) => <article key={`${item.question}-${index}`} style={{ ...card(), padding: 24 }}><span style={{ display: "grid", width: 34, height: 34, placeItems: "center", borderRadius: 10, background: "color-mix(in srgb, var(--checkout-accent) 12%, var(--checkout-muted))", color: "var(--checkout-accent)", fontWeight: 850 }}>?</span><h3 style={{ margin: "16px 0 0", fontSize: 17, lineHeight: 1.4 }}>{item.question}</h3><p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.7, opacity: .68 }}>{item.answer}</p></article>)}</div></section>;
  }

  const questions = <div>{items.map((item, index) => <details key={`${item.question}-${index}`} style={{ borderTop: index === 0 ? "1px solid var(--checkout-border)" : 0, borderBottom: "1px solid var(--checkout-border)", padding: "18px 2px" }}><summary style={{ cursor: "pointer", fontWeight: 750, lineHeight: 1.45 }}>{item.question}</summary><p style={{ margin: "12px 24px 0 0", fontSize: 14, lineHeight: 1.7, opacity: .7 }}>{item.answer}</p></details>)}</div>;
  if (layout === "split") {
    return <section style={{ ...card(), display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "clamp(28px, 6vw, 72px)", alignItems: "start", padding: "clamp(28px, 5vw, 52px)" }}><div><span style={heroEyebrow()}>Tire suas dúvidas</span><h2 style={{ ...heading(), marginTop: 12 }}>{title}</h2><p style={{ margin: "14px 0 0", maxWidth: 390, fontSize: 14, lineHeight: 1.7, opacity: .64 }}>Encontre respostas rápidas antes de concluir sua compra.</p></div>{questions}</section>;
  }
  return <section style={{ ...card(), padding: "clamp(28px, 5vw, 52px)" }}><h2 style={{ ...heading(), textAlign: "center" }}>{title}</h2><div style={{ maxWidth: 800, margin: "28px auto 0" }}>{questions}</div></section>;
}

function VideoPlayer({ url, title, caption, posterUrl, aspectRatio, autoplay, controls }: { url: string; title: string; caption: string; posterUrl: string; aspectRatio: VideoRatio; autoplay: boolean; controls: boolean }) {
  const source = resolveVideoSource(url, autoplay, controls);
  return (
    <figure style={{ ...card(), margin: 0, overflow: "hidden", padding: 10 }}>
      <div style={{ position: "relative", aspectRatio, overflow: "hidden", borderRadius: "calc(var(--checkout-radius) - 6px)", background: "#11131c" }}>
        {source?.kind === "embed" && <iframe title={title || "Vídeo"} src={source.url} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />}
        {source?.kind === "direct" && <video title={title || "Vídeo"} src={source.url} poster={safeHttpsUrl(posterUrl) ? posterUrl : undefined} autoPlay={autoplay} muted={autoplay} controls={controls} playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#08090d" }} />}
        {!source && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", textAlign: "center", background: "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--checkout-accent) 32%, #171923), #0d0e14 72%)" }}><div><span style={{ display: "grid", width: 64, height: 64, margin: "0 auto", placeItems: "center", border: "1px solid rgb(255 255 255 / 24%)", borderRadius: "50%", background: "var(--checkout-accent)", boxShadow: "0 14px 34px color-mix(in srgb, var(--checkout-accent) 38%, transparent)", fontSize: 24 }}>▶</span><strong style={{ display: "block", marginTop: 16, fontSize: 15 }}>Adicione seu vídeo</strong><small style={{ display: "block", marginTop: 5, opacity: .62 }}>YouTube, Vimeo ou arquivo HTTPS</small></div></div>}
      </div>
      {caption && <figcaption style={{ padding: "12px 8px 4px", textAlign: "center", fontSize: 13, lineHeight: 1.5, opacity: .65 }}>{caption}</figcaption>}
    </figure>
  );
}

function resolveVideoSource(value: string, autoplay: boolean, controls: boolean): { kind: "embed" | "direct"; url: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (host === "youtube.com" || host === "m.youtube.com") id = url.searchParams.get("v") ?? (url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ?? "");
    if (/^[\w-]{6,20}$/.test(id)) return { kind: "embed", url: `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}&rel=0` };
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const vimeoId = url.pathname.split("/").filter(Boolean).findLast((part) => /^\d+$/.test(part));
      if (vimeoId) return { kind: "embed", url: `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}` };
    }
    return { kind: "direct", url: url.toString() };
  } catch {
    return null;
  }
}

function GuaranteeSection({ layout, title, description, days }: { layout: GuaranteeLayout; title: string; description: string; days: number }) {
  if (layout === "seal") return <section style={{ ...card(), padding: "clamp(32px,6vw,58px)", textAlign: "center" }}><span style={{ display: "grid", width: 94, height: 94, margin: "0 auto", placeItems: "center", border: "2px solid var(--checkout-accent)", borderRadius: "50%", background: "color-mix(in srgb,var(--checkout-accent) 9%,var(--checkout-surface))", color: "var(--checkout-accent)", fontSize: 28, fontWeight: 900 }}>{days}<small style={{ display: "block", marginTop: -24, fontSize: 9, textTransform: "uppercase" }}>dias</small></span><h2 style={{ margin: "22px 0 0", fontSize: 25 }}>{title}</h2><p style={{ maxWidth: 680, margin: "10px auto 0", lineHeight: 1.65, opacity: .68 }}>{description}</p></section>;
  if (layout === "banner") return <section style={{ ...fullWidth(), display: "flex", alignItems: "center", gap: 24, borderRadius: "var(--checkout-radius)", background: "linear-gradient(135deg,var(--checkout-accent),color-mix(in srgb,var(--checkout-accent) 70%,#17152d))", color: "#fff", padding: "clamp(26px,5vw,46px)", boxShadow: "var(--checkout-shadow)" }}><span style={{ fontSize: 42, fontWeight: 900 }}>{days}</span><div><h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2><p style={{ margin: "7px 0 0", lineHeight: 1.6, opacity: .78 }}>{description}</p></div></section>;
  return <section style={{ ...card(), display: "flex", alignItems: "center", gap: 24, padding: 28, border: "1px solid color-mix(in srgb, var(--checkout-accent) 28%, white)" }}><span style={{ ...numberBadge(), width: 64, height: 64, fontSize: 20 }}>{days}</span><div><h2 style={{ margin: 0, fontSize: 23 }}>{title}</h2><p style={{ margin: "8px 0 0", lineHeight: 1.65, opacity: .7 }}>{description}</p></div></section>;
}

function ProductSection({ layout, title, description }: { layout: ProductLayout; title: string; description: string }) {
  const item = <><div style={{ display: "grid", width: 62, aspectRatio: "1", placeItems: "center", borderRadius: 13, background: "color-mix(in srgb,var(--checkout-accent) 12%,var(--checkout-muted))", color: "var(--checkout-accent)", fontSize: 22 }}>◇</div><div><strong style={{ display: "block", fontSize: 15 }}>Produto selecionado</strong><span style={{ display: "block", marginTop: 4, fontSize: 12, opacity: .58 }}>1 unidade</span></div><strong style={{ marginLeft: "auto", fontSize: 20 }}>R$ —</strong></>;
  if (layout === "compact") return <section style={{ ...checkoutCard(), display: "flex", alignItems: "center", gap: 14, padding: 18 }}>{item}</section>;
  if (layout === "detailed") return <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 18, marginTop: 20, padding: "18px 0", borderBlock: "1px dashed var(--checkout-border)", fontSize: 13 }}><strong>Produto selecionado</strong><span style={{ opacity: .6 }}>Qtd. 1</span><strong>R$ —</strong></div><p style={{ margin: "14px 0 0", fontSize: 12, opacity: .58 }}>{description}</p></section>;
  return <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, paddingTop: 22, borderTop: "1px solid var(--checkout-border)" }}>{item}</div></section>;
}

function CheckoutFormSection({ layout, title, description, buttonLabel, showPhone, showDocument }: { layout: FormLayout; title: string; description: string; buttonLabel: string; showPhone: boolean; showDocument: boolean }) {
  const fields = <><CheckoutInput required label="Nome completo *" name="customerName" autoComplete="name" placeholder="Digite seu nome" /><CheckoutInput required label="E-mail *" name="customerEmail" type="email" autoComplete="email" placeholder="voce@email.com" />{showPhone && <CheckoutInput label="Telefone" name="customerPhone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" />}{showDocument && <CheckoutInput label="CPF/CNPJ" name="customerDocument" placeholder="000.000.000-00" />}</>;
  return <form onSubmit={(event) => event.preventDefault()} style={{ ...(layout === "plain" ? fullWidth() : checkoutCard()), padding: layout === "plain" ? "12px 0" : 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gridTemplateColumns: layout === "compact" ? "repeat(auto-fit,minmax(220px,1fr))" : "1fr", gap: 16, marginTop: 24 }}>{fields}</div><p style={{ margin: "16px 0 0", fontSize: 10, lineHeight: 1.5, opacity: .58 }}>Ao continuar, você concorda com os <u>Termos de uso</u> e a <u>Política de privacidade</u>.</p><Button type="submit" className="checkout-primary-button" style={{ ...primaryButton(), width: "100%", marginTop: 16 }}>{buttonLabel}</Button><p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 10, opacity: .5 }}>🔒 Pagamento e dados protegidos</p></form>;
}

function OrderSummarySection({ layout, title }: { layout: SummaryLayout; title: string }) {
  const rows = <div style={{ display: "grid", gap: 13, fontSize: 14 }}><div style={summaryRow()}><span style={{ opacity: .64 }}>Subtotal</span><span>R$ —</span></div><div style={summaryRow()}><span style={{ opacity: .64 }}>Desconto</span><span>R$ 0,00</span></div><div style={summaryRow()}><span style={{ opacity: .64 }}>Frete</span><span>A calcular</span></div></div>;
  if (layout === "receipt") return <aside style={{ ...checkoutCard(), padding: 28, borderStyle: "dashed" }}><h2 style={checkoutHeading()}>{title}</h2><div style={{ marginTop: 20, paddingBlock: 18, borderBlock: "1px dashed var(--checkout-border)" }}>{rows}</div><div style={{ ...summaryRow(), marginTop: 18, fontSize: 21, fontWeight: 850 }}><span>Total</span><span>R$ —</span></div></aside>;
  if (layout === "highlight") return <aside style={{ ...checkoutCard(), overflow: "hidden" }}><div style={{ padding: 24 }}><h2 style={checkoutHeading()}>{title}</h2><div style={{ marginTop: 20 }}>{rows}</div></div><div style={{ display: "flex", justifyContent: "space-between", background: "var(--checkout-accent)", color: "#fff", padding: "20px 24px", fontSize: 22, fontWeight: 850 }}><span>Total</span><span>R$ —</span></div></aside>;
  return <aside style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><div style={{ marginTop: 20 }}>{rows}</div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--checkout-border)", fontSize: 21, fontWeight: 850 }}><span>Total</span><span>R$ —</span></div></aside>;
}

function PaymentMethodsSection({ layout, title, description, showCard, showPix, showBoleto }: { layout: PaymentLayout; title: string; description: string; showCard: boolean; showPix: boolean; showBoleto: boolean }) {
  const options = [{ show: showCard, value: "card", icon: "▣", title: "Cartão de crédito", detail: "Pague com segurança e parcele sua compra" }, { show: showPix, value: "pix", icon: "◇", title: "Pix", detail: "Aprovação imediata e pagamento por QR Code" }, { show: showBoleto, value: "boleto", icon: "▤", title: "Boleto bancário", detail: "Compensação em até 3 dias úteis" }].filter((item) => item.show);
  return <section style={{ ...checkoutCard(), padding: 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ display: "grid", gridTemplateColumns: layout === "cards" ? "repeat(auto-fit,minmax(190px,1fr))" : "1fr", gap: layout === "segmented" ? 0 : 10, marginTop: 22, padding: layout === "segmented" ? 5 : 0, border: layout === "segmented" ? "1px solid var(--checkout-border)" : 0, borderRadius: layout === "segmented" ? 14 : 0, background: layout === "segmented" ? "var(--checkout-muted)" : "transparent" }}>{options.map((option, index) => <PaymentOption key={option.value} {...option} compact={layout === "segmented"} defaultChecked={index === 0} />)}</div><p style={{ display: "flex", alignItems: "center", gap: 6, margin: "14px 0 0", fontSize: 10, opacity: .54 }}><span style={{ color: "var(--checkout-accent)" }}>✓</span> Ambiente protegido e dados criptografados</p></section>;
}

function CardPaymentFields({ compact = false, showInstallments }: { compact?: boolean; showInstallments: boolean }) {
  return (
    <div style={{ display: "grid", gap: compact ? 12 : 16 }}>
      <CheckoutInput required label="Número do cartão *" name="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" />
      <CheckoutInput required label="Nome impresso no cartão *" name="cardName" autoComplete="cc-name" placeholder="Como está no cartão" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: compact ? 10 : 14 }}>
        <CheckoutInput required label="Validade *" name="cardExpiry" autoComplete="cc-exp" placeholder="MM/AA" />
        <CheckoutInput required label="CVV *" name="cardCvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
        {showInstallments && <label style={inputLabel()}><span>Parcelas</span><select name="installments" defaultValue="1" style={inputControl()}><option value="1">1x sem juros</option><option value="2">2x sem juros</option><option value="3">3x sem juros</option></select></label>}
      </div>
    </div>
  );
}

function CardPaymentSection({ layout, title, description, showInstallments }: { layout: CardPaymentLayout; title: string; description: string; showInstallments: boolean }) {
  if (layout === "visual") {
    return (
      <section style={{ ...checkoutCard(), padding: 28 }}>
        <h2 style={checkoutHeading()}>{title}</h2>
        <p style={checkoutDescription()}>{description}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 28, alignItems: "center", marginTop: 24 }}>
          <div aria-hidden="true" style={{ display: "flex", aspectRatio: "1.58", flexDirection: "column", justifyContent: "space-between", borderRadius: 20, background: "linear-gradient(135deg, var(--checkout-accent), color-mix(in srgb, var(--checkout-accent) 48%, #111322))", boxShadow: "0 20px 44px color-mix(in srgb, var(--checkout-accent) 24%, transparent)", color: "#fff", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ width: 38, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f6d77b,#c99b32)" }} /><span style={{ fontSize: 20, opacity: .8 }}>◒</span></div>
            <strong style={{ fontSize: "clamp(16px, 2.2vw, 22px)", letterSpacing: ".12em" }}>•••• •••• •••• 4242</strong>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 10, textTransform: "uppercase" }}><span><small style={{ display: "block", opacity: .64 }}>Nome no cartão</small><b style={{ display: "block", marginTop: 4, letterSpacing: ".08em" }}>SEU NOME</b></span><span><small style={{ display: "block", opacity: .64 }}>Validade</small><b style={{ display: "block", marginTop: 4 }}>MM/AA</b></span></div>
          </div>
          <CardPaymentFields compact showInstallments={showInstallments} />
        </div>
      </section>
    );
  }

  return <section style={{ ...checkoutCard(), padding: layout === "compact" ? 22 : 28 }}><h2 style={checkoutHeading()}>{title}</h2><p style={checkoutDescription()}>{description}</p><div style={{ marginTop: layout === "compact" ? 18 : 24 }}><CardPaymentFields compact={layout === "compact"} showInstallments={showInstallments} /></div></section>;
}

const heroLayouts: { value: Exclude<HeroLayout, "choose">; name: string; description: string }[] = [
  { value: "centered", name: "Centralizado", description: "Título em destaque e CTA central." },
  { value: "split", name: "Dividido", description: "Conteúdo de um lado e imagem do outro." },
  { value: "compact", name: "Compacto", description: "Mensagem curta com CTA lateral." },
];

function HeroLayoutPicker({ value, onChange }: { value: HeroLayout; onChange: (value: HeroLayout) => void }) {
  const selected = value ?? "choose";
  return (
    <div className="checkout-hero-layout-picker">
      {heroLayouts.map((layout) => (
        <button
          key={layout.value}
          type="button"
          className="checkout-hero-layout-option"
          data-selected={selected === layout.value}
          aria-pressed={selected === layout.value}
          onClick={() => onChange(layout.value)}
        >
          <span className="checkout-hero-layout-preview" data-layout={layout.value}><span /></span>
          <span>
            <strong style={{ display: "block", fontSize: 12 }}>{layout.name}</strong>
            <small style={{ display: "block", marginTop: 3, color: "#717185", fontSize: 10, lineHeight: 1.35 }}>{layout.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function HeroSection({ layout, eyebrow, title, description, buttonLabel, imageUrl }: { layout: HeroLayout; eyebrow: string; title: string; description: string; buttonLabel: string; imageUrl: string }) {
  const content = (
    <>
      <p style={heroEyebrow()}>{eyebrow}</p>
      <h1 style={{ margin: "14px 0 0", fontSize: "clamp(34px, 5vw, 62px)", lineHeight: 1.04, letterSpacing: "-.045em" }}>{title}</h1>
      <p style={{ margin: "18px 0 0", maxWidth: 680, fontSize: 17, lineHeight: 1.7, opacity: .72 }}>{description}</p>
    </>
  );

  if (layout === "choose") {
    return (
      <section style={{ ...card(), display: "grid", minHeight: 220, placeItems: "center", border: "1.5px dashed color-mix(in srgb, var(--checkout-accent) 42%, var(--checkout-border))", padding: 32, textAlign: "center" }}>
        <div>
          <span style={{ display: "grid", width: 44, height: 44, margin: "0 auto", placeItems: "center", borderRadius: 13, background: "color-mix(in srgb, var(--checkout-accent) 12%, var(--checkout-surface))", color: "var(--checkout-accent)", fontSize: 20 }}>▤</span>
          <strong style={{ display: "block", marginTop: 14, fontSize: 18 }}>Escolha um template de apresentação</strong>
          <span style={{ display: "block", marginTop: 6, fontSize: 13, opacity: .64 }}>Use o primeiro campo do painel lateral para começar.</span>
        </div>
      </section>
    );
  }

  if (layout === "split") {
    return (
      <section style={{ ...card(), display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", alignItems: "stretch", overflow: "hidden" }}>
        <div style={{ alignSelf: "center", padding: "clamp(34px, 6vw, 68px)" }}>
          {content}
          <Button type="button" className="checkout-primary-button" style={primaryButton()}>{buttonLabel}</Button>
        </div>
        <div
          role={safeHttpsUrl(imageUrl) ? "img" : undefined}
          aria-label={safeHttpsUrl(imageUrl) ? "Imagem da apresentação" : undefined}
          style={{
            minHeight: 360,
            margin: 18,
            overflow: "hidden",
            borderRadius: "calc(var(--checkout-radius) - 4px)",
            background: safeHttpsUrl(imageUrl)
              ? `url(${JSON.stringify(imageUrl)}) center / cover no-repeat`
              : "radial-gradient(circle at 70% 22%, color-mix(in srgb, var(--checkout-accent) 48%, transparent), transparent 32%), linear-gradient(145deg, color-mix(in srgb, var(--checkout-accent) 16%, var(--checkout-muted)), var(--checkout-muted))",
          }}
        />
      </section>
    );
  }

  if (layout === "compact") {
    return (
      <section style={{ ...card(), display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24, overflow: "hidden", padding: "clamp(28px, 5vw, 48px)" }}>
        <div style={{ minWidth: "min(100%, 320px)", flex: "1 1 560px" }}>
          <p style={heroEyebrow()}>{eyebrow}</p>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.08, letterSpacing: "-.04em" }}>{title}</h1>
          <p style={{ margin: "13px 0 0", maxWidth: 720, fontSize: 15, lineHeight: 1.65, opacity: .7 }}>{description}</p>
        </div>
        <Button type="button" className="checkout-primary-button" style={{ ...primaryButton(), flex: "0 0 auto", marginTop: 0 }}>{buttonLabel}</Button>
      </section>
    );
  }

  return (
    <section style={{ ...card(), position: "relative", overflow: "hidden", padding: "clamp(36px, 7vw, 88px) 24px", textAlign: "center" }}>
      <div style={{ position: "absolute", width: 280, height: 280, borderRadius: 999, background: "var(--checkout-accent)", opacity: .1, filter: "blur(24px)", right: -80, top: -100 }} />
      <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
        {content}
        <Button type="button" className="checkout-primary-button" style={primaryButton()}>{buttonLabel}</Button>
      </div>
    </section>
  );
}

const countdownLayouts: { value: CountdownLayout; name: string; description: string }[] = [
  { value: "cards", name: "Blocos", description: "Unidades separadas em cartões." },
  { value: "banner", name: "Faixa de destaque", description: "Fundo colorido e alto contraste." },
  { value: "minimal", name: "Minimalista", description: "Linha compacta e elegante." },
];

function CountdownLayoutPicker({ value, onChange }: { value: CountdownLayout; onChange: (value: CountdownLayout) => void }) {
  return (
    <div className="checkout-hero-layout-picker">
      {countdownLayouts.map((layout) => (
        <button
          key={layout.value}
          type="button"
          className="checkout-hero-layout-option"
          data-selected={(value ?? "cards") === layout.value}
          aria-pressed={(value ?? "cards") === layout.value}
          onClick={() => onChange(layout.value)}
        >
          <CountdownTemplatePreview layout={layout.value} />
          <span>
            <strong style={{ display: "block", fontSize: 12 }}>{layout.name}</strong>
            <small style={{ display: "block", marginTop: 3, color: "#717185", fontSize: 10, lineHeight: 1.35 }}>{layout.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function CountdownTemplatePreview({ layout }: { layout: CountdownLayout }) {
  if (layout === "banner") {
    return <span style={{ display: "grid", height: 54, gridTemplateColumns: "1fr repeat(3, 12px)", alignItems: "center", gap: 4, borderRadius: 8, background: "#7566ea", padding: 7 }}><i style={{ width: 28, height: 4, borderRadius: 9, background: "white", opacity: .8 }} />{[1, 2, 3].map((item) => <i key={item} style={{ height: 20, borderRadius: 3, background: "white", opacity: .9 }} />)}</span>;
  }
  if (layout === "minimal") {
    return <span style={{ display: "flex", height: 54, alignItems: "center", gap: 5, border: "1px solid #e5e3ee", borderRadius: 8, background: "#fff", padding: 7 }}><i style={{ width: 13, height: 13, borderRadius: 99, background: "#7566ea" }} /><i style={{ width: 24, height: 4, borderRadius: 9, background: "#c8c4dd" }} /><i style={{ width: 25, height: 8, marginLeft: "auto", borderRadius: 4, background: "#7566ea" }} /></span>;
  }
  return <span style={{ display: "grid", height: 54, gridTemplateColumns: "repeat(4, 1fr)", gap: 3, border: "1px solid #e5e3ee", borderRadius: 8, background: "#f8f7ff", padding: 7 }}>{[1, 2, 3, 4].map((item) => <i key={item} style={{ borderRadius: 4, background: "#ddd8ff", boxShadow: "inset 0 -5px 0 rgb(117 102 234 / 22%)" }} />)}</span>;
}

function CountdownSection({ layout, title, deadline }: { layout: CountdownLayout; title: string; deadline: string }) {
  const [remaining, setRemaining] = useState<CountdownTime>({ valid: true, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => setRemaining(countdownTime(deadline));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [deadline]);

  if (!remaining.valid) {
    return <section style={{ ...card(), padding: 28, textAlign: "center" }}><strong>{title}</strong><p style={{ margin: "8px 0 0", color: "var(--checkout-accent)", fontSize: 14 }}>Defina uma data válida.</p></section>;
  }

  const units = [
    { value: remaining.days, label: "Dias" },
    { value: remaining.hours, label: "Horas" },
    { value: remaining.minutes, label: "Min" },
    { value: remaining.seconds, label: "Seg" },
  ];

  if (layout === "banner") {
    return (
      <section style={{ ...fullWidth(), display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 22, overflow: "hidden", borderRadius: "var(--checkout-radius)", background: "linear-gradient(135deg, var(--checkout-accent), color-mix(in srgb, var(--checkout-accent) 72%, #17152d))", boxShadow: "var(--checkout-shadow)", color: "#fff", padding: "clamp(24px, 4vw, 38px)" }}>
        <div><span style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", opacity: .72 }}>Oferta por tempo limitado</span><h2 style={{ margin: "7px 0 0", fontSize: "clamp(20px, 3vw, 30px)", letterSpacing: "-.03em" }}>{title}</h2></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{units.map((unit) => <TimeUnit key={unit.label} {...unit} inverted />)}</div>
      </section>
    );
  }

  if (layout === "minimal") {
    return (
      <section style={{ ...card(), display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, padding: 22 }}>
        <span style={{ display: "grid", width: 44, height: 44, flex: "0 0 44px", placeItems: "center", borderRadius: 999, background: "color-mix(in srgb, var(--checkout-accent) 12%, var(--checkout-surface))", color: "var(--checkout-accent)", fontSize: 20 }}>◷</span>
        <div style={{ minWidth: 180, flex: "1 1 280px" }}><h2 style={{ margin: 0, fontSize: 17, letterSpacing: "-.02em" }}>{title}</h2><span style={{ display: "block", marginTop: 4, fontSize: 12, opacity: .58 }}>{formatDeadline(deadline)}</span></div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, color: "var(--checkout-accent)", fontVariantNumeric: "tabular-nums", fontWeight: 850 }}>{units.map((unit, index) => <span key={unit.label} style={{ display: "contents" }}><span style={{ fontSize: 20 }}>{twoDigits(unit.value)}<small style={{ marginLeft: 2, fontSize: 9, textTransform: "uppercase", opacity: .62 }}>{unit.label.slice(0, 1)}</small></span>{index < units.length - 1 && <span style={{ opacity: .35 }}>:</span>}</span>)}</div>
      </section>
    );
  }

  return (
    <section style={{ ...card(), padding: "clamp(26px, 5vw, 42px)", textAlign: "center" }}>
      <span style={{ color: "var(--checkout-accent)", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>Não deixe para depois</span>
      <h2 style={{ margin: "8px 0 0", fontSize: "clamp(21px, 3vw, 30px)", letterSpacing: "-.03em" }}>{title}</h2>
      <div style={{ display: "grid", maxWidth: 620, gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, margin: "24px auto 0" }}>{units.map((unit) => <TimeUnit key={unit.label} {...unit} />)}</div>
      <span style={{ display: "block", marginTop: 16, fontSize: 11, opacity: .5 }}>{formatDeadline(deadline)}</span>
    </section>
  );
}

function TimeUnit({ value, label, inverted = false }: { value: number; label: string; inverted?: boolean }) {
  return <span style={{ display: "grid", minWidth: 62, border: inverted ? "1px solid rgb(255 255 255 / 24%)" : "1px solid var(--checkout-border)", borderRadius: 12, background: inverted ? "rgb(255 255 255 / 12%)" : "var(--checkout-muted)", padding: "12px 9px", textAlign: "center", backdropFilter: inverted ? "blur(8px)" : undefined }}><strong style={{ fontSize: 23, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{twoDigits(value)}</strong><small style={{ marginTop: 6, fontSize: 9, fontWeight: 750, letterSpacing: ".08em", textTransform: "uppercase", opacity: .6 }}>{label}</small></span>;
}

type CountdownTime = { valid: boolean; days: number; hours: number; minutes: number; seconds: number };
function countdownTime(deadline: string): CountdownTime {
  const end = new Date(deadline).getTime();
  if (!Number.isFinite(end)) return { valid: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const total = Math.max(0, Math.floor((end - Date.now()) / 1000));
  return { valid: true, days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}
function twoDigits(value: number) { return String(value).padStart(2, "0"); }

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
function fontStack(font: FontPreset) { return { system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", geist: "Geist, Inter, system-ui, sans-serif", inter: "Inter, 'Segoe UI', system-ui, sans-serif", montserrat: "Montserrat, Avenir, 'Segoe UI', sans-serif", poppins: "Poppins, Montserrat, 'Segoe UI', sans-serif", roboto: "Roboto, Arial, sans-serif", "open-sans": "'Open Sans', Arial, sans-serif", lato: "Lato, 'Segoe UI', sans-serif", arial: "Arial, Helvetica, sans-serif", georgia: "Georgia, 'Times New Roman', serif", serif: "'Iowan Old Style', Baskerville, 'Times New Roman', serif", mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace" }[font] ?? "system-ui, sans-serif"; }
function fullWidth(): React.CSSProperties { return { width: "100%", minWidth: 0, boxSizing: "border-box" }; }
function card(): React.CSSProperties { return { width: "100%", minWidth: 0, boxSizing: "border-box", background: "var(--checkout-surface)", border: "1px solid var(--checkout-border)", borderRadius: "var(--checkout-radius)", boxShadow: "var(--checkout-shadow)", color: "var(--checkout-text)" }; }
function checkoutCard(): React.CSSProperties { return { width: "100%", minWidth: 0, boxSizing: "border-box", background: "var(--checkout-group-bg)", border: "var(--checkout-group-border-width) solid var(--checkout-group-border)", borderRadius: "var(--checkout-radius)", boxShadow: "var(--checkout-group-shadow)", color: "var(--checkout-text)" }; }
function heading(): React.CSSProperties { return { margin: 0, fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.15, letterSpacing: "-.035em" }; }
function checkoutHeading(): React.CSSProperties { return { margin: 0, fontSize: 22, fontWeight: 750, lineHeight: 1.25, letterSpacing: "-.025em" }; }
function checkoutDescription(): React.CSSProperties { return { margin: "8px 0 0", fontSize: 14, lineHeight: 1.65, opacity: .68 }; }
function heroEyebrow(): React.CSSProperties { return { margin: 0, color: "var(--checkout-accent)", fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }; }
function primaryButton(): React.CSSProperties { return { display: "inline-flex", justifyContent: "center", marginTop: 26, border: 0, borderRadius: 12, background: "var(--checkout-accent)", color: "white", padding: "15px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 24px color-mix(in srgb, var(--checkout-accent) 22%, transparent)" }; }
function secondaryButton(): React.CSSProperties { return { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, border: "1px solid var(--checkout-border)", borderRadius: 10, background: "var(--checkout-surface)", color: "var(--checkout-text)", padding: "0 16px", fontSize: 13, fontWeight: 750, cursor: "pointer" }; }
function numberBadge(): React.CSSProperties { return { display: "grid", width: 38, height: 38, placeItems: "center", borderRadius: 999, background: "color-mix(in srgb, var(--checkout-accent) 14%, white)", color: "var(--checkout-accent)", fontWeight: 850 }; }
function qrPlaceholder(): React.CSSProperties { return { display: "grid", aspectRatio: "1", placeItems: "center", border: "10px solid var(--checkout-surface)", borderRadius: 12, background: "repeating-conic-gradient(var(--checkout-text) 0 25%, var(--checkout-surface) 0 50%) 0 / 18px 18px", boxShadow: "0 0 0 1px var(--checkout-border)", color: "var(--checkout-accent)", fontWeight: 900 }; }
function inputControl(): React.CSSProperties { return { boxSizing: "border-box", minHeight: 46, border: "1px solid var(--checkout-border)", borderRadius: 11, outline: "none", background: "var(--checkout-surface)", color: "var(--checkout-text)", padding: "0 13px", font: "inherit", fontSize: 14 }; }
function inputLabel(): React.CSSProperties { return { minWidth: 0, display: "grid", gap: 7, color: "var(--checkout-text)", fontSize: 12, fontWeight: 700 }; }
function CheckoutInput({ label, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label style={inputLabel()}><span>{label}</span><input {...input} style={{ ...inputControl(), width: "100%" }} /></label>; }
function PaymentOption({ value, icon, title, detail, compact = false, defaultChecked = false }: { value: string; icon: string; title: string; detail: string; compact?: boolean; defaultChecked?: boolean }) { return <label className="checkout-payment-option" style={{ display: "flex", minWidth: 0, alignItems: "center", gap: compact ? 8 : 12, minHeight: compact ? 54 : 82, border: compact ? "1px solid transparent" : "1px solid var(--checkout-border)", borderRadius: compact ? 10 : 13, padding: compact ? "9px 10px" : 14, background: compact ? "transparent" : "var(--checkout-surface)", cursor: "pointer" }}><input type="radio" name="paymentMethod" value={value} defaultChecked={defaultChecked} style={{ flex: "0 0 auto", accentColor: "var(--checkout-accent)" }} /><span style={{ display: "grid", width: compact ? 30 : 40, height: compact ? 30 : 40, flex: `0 0 ${compact ? 30 : 40}px`, placeItems: "center", borderRadius: compact ? 8 : 11, background: "color-mix(in srgb,var(--checkout-accent) 10%,var(--checkout-muted))", color: "var(--checkout-accent)", fontSize: compact ? 14 : 18, fontWeight: 900 }}>{icon}</span><span style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: compact ? 12 : 14 }}>{title}</strong>{!compact && <small style={{ display: "block", marginTop: 3, fontSize: 11, lineHeight: 1.35, opacity: .58 }}>{detail}</small>}</span></label>; }
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
