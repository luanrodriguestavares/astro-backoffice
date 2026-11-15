import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "astro-backoffice",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-15",
    domains: ["app.astroengine.com.br"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      ASTRO_API_URL: bindings.text("https://api.astroengine.com.br"),
      GATEWAY_PROVIDERS_ENABLED: bindings.text("stripe,mercado_pago"),
      NEXT_PUBLIC_CHECKOUT_URL: bindings.text("https://checkout.astroengine.com.br"),
      NEXT_PUBLIC_FILES_ENABLED: bindings.text("false"),
      NEXT_PUBLIC_LANDING_URL: bindings.text("https://astroengine.com.br"),
    },
  }),
});
