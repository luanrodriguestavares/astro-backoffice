import type { BuilderData, BuilderRootProps } from "@/components/checkout-builder/config";
import type { CheckoutDocument, CheckoutSectionType } from "@/lib/api/types";

const supported = new Set<CheckoutSectionType>(["hero", "image", "text", "benefits", "testimonials", "faq", "guarantee", "countdown", "product_summary", "checkout_form", "order_summary", "footer"]);

export function documentToPuck(document: CheckoutDocument): BuilderData {
  const theme = document.theme;
  const layout = document.layout;
  return {
    root: { props: { backgroundColor: stringValue(theme.backgroundColor, "#f7f7fb"), surfaceColor: stringValue(theme.surfaceColor, "#ffffff"), textColor: stringValue(theme.textColor, "#202235"), accentColor: stringValue(theme.accentColor, "#7065e8"), radius: numberValue(theme.radius, 16), maxWidth: numberValue(layout.maxWidth, 1120) } },
    content: document.sections.filter((section) => section.visible && supported.has(section.type)).map((section) => ({ type: section.type, props: { ...section.props, id: section.id } })),
  } as BuilderData;
}

export function puckToDocument(data: BuilderData, previous: CheckoutDocument): CheckoutDocument {
  const rootContainer = data.root as { props?: Partial<BuilderRootProps> } & Partial<BuilderRootProps>;
  const root = rootContainer.props ?? rootContainer;
  return {
    schemaVersion: 1,
    theme: { backgroundColor: safeColor(root.backgroundColor, "#f7f7fb"), surfaceColor: safeColor(root.surfaceColor, "#ffffff"), textColor: safeColor(root.textColor, "#202235"), accentColor: safeColor(root.accentColor, "#7065e8"), radius: clamp(root.radius, 0, 40, 16) },
    layout: { ...previous.layout, maxWidth: clamp(root.maxWidth, 720, 1440, 1120) },
    sections: data.content.filter((component) => supported.has(component.type as CheckoutSectionType)).slice(0, 50).map((component, index) => { const props = { ...component.props } as Record<string, unknown>; const id = typeof props.id === "string" ? props.id : `${component.type}-${index + 1}`; delete props.id; return { id, type: component.type as CheckoutSectionType, visible: true, props }; }),
    settings: previous.settings,
    seo: previous.seo,
  };
}

function stringValue(value: unknown, fallback: string) { return typeof value === "string" ? value : fallback; }
function numberValue(value: unknown, fallback: number) { return typeof value === "number" ? value : fallback; }
function safeColor(value: unknown, fallback: string) { return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function clamp(value: unknown, min: number, max: number, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }
