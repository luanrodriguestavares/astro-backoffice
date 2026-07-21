import type { CheckoutDocument } from "@/lib/api/types";

export const blankCheckoutDocument: CheckoutDocument = {
  schemaVersion: 1,
  theme: {
    backgroundColor: "#f7f7fb",
    surfaceColor: "#ffffff",
    textColor: "#202235",
    accentColor: "#7065e8",
    themePreset: "light",
    fontFamily: "system",
    radius: "md",
    shadow: "sm",
  },
  layout: { maxWidth: "lg" },
  sections: [],
  settings: { showPoweredBy: true },
  seo: { title: "", description: "" },
};

export const defaultCheckoutDocument: CheckoutDocument = {
  schemaVersion: 1,
  theme: { themePreset: "light", fontFamily: "system", backgroundColor: "#f7f7fb", surfaceColor: "#ffffff", textColor: "#202235", accentColor: "#7065e8", radius: "md", shadow: "sm" },
  layout: { maxWidth: "lg" },
  sections: [
    { id: "hero-initial", type: "hero", visible: true, props: { eyebrow: "Oferta especial", title: "Transforme seus resultados hoje", description: "Uma solução completa, simples e segura para você avançar.", buttonLabel: "Quero começar agora", alignment: "center" } },
    { id: "benefits-initial", type: "benefits", visible: true, props: { title: "Tudo o que você precisa", items: [{ title: "Acesso imediato", description: "Comece assim que o pagamento for confirmado." }, { title: "Compra segura", description: "Seus dados são processados com segurança." }, { title: "Suporte dedicado", description: "Conte com ajuda sempre que precisar." }] } },
    { id: "guarantee-initial", type: "guarantee", visible: true, props: { title: "Garantia de 7 dias", description: "Experimente sem riscos. Se não fizer sentido para você, solicite o reembolso dentro do prazo.", days: 7 } },
    { id: "product-initial", type: "product_summary", visible: true, props: { title: "Resumo da sua compra", description: "Confira o produto e o valor antes de continuar." } },
    { id: "form-initial", type: "checkout_form", visible: true, props: { title: "Seus dados", description: "Preencha as informações para concluir a compra.", buttonLabel: "Finalizar compra" } },
    { id: "order-initial", type: "order_summary", visible: true, props: { title: "Total do pedido" } },
    { id: "footer-initial", type: "footer", visible: true, props: { text: "Pagamento seguro processado pelo Astro.", showSecurity: true } },
  ],
  settings: { showPoweredBy: true },
  seo: { title: "Checkout seguro", description: "Finalize sua compra com segurança." },
};
