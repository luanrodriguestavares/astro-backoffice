export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ProblemDetails {
  code?: string;
  status: number;
  detail: string;
  requestId?: string;
}

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; name: string; email: string };
  organization?: { id: string };
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

export interface Organization {
  id: string;
  legalName?: string;
  displayName?: string;
  slug?: string;
  status?: string;
  defaultCurrency?: string;
  timezone?: string;
  locale?: string;
  version?: number;
}

export interface GatewayConnection {
  id: string;
  provider: "mock" | "stripe" | "mercado_pago" | "abacate_pay";
  name: string;
  environment: "sandbox" | "production";
  status: string;
  publicConfiguration: Record<string, unknown>;
  capabilities: Record<string, unknown>;
  capabilitiesFetchedAt: string;
  capabilitiesExpiresAt: string | null;
  credentialsConfigured: boolean;
  externalAccountId: string | null;
  lastTestedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  webhookPathToken?: string;
  webhookSecret?: string;
  webhookUrl?: string;
}

export interface Product {
  id: string;
  type: "digital" | "physical" | "service" | "saas";
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  imageFileId: string | null;
  status: "draft" | "active" | "inactive";
  inventoryMode: string;
  deliveryMode: string;
  metadata: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Price {
  id: string;
  productId?: string;
  name: string;
  pricingType: "one_time" | "recurring" | "free" | "custom";
  amountMinor: number;
  currency: string;
  recurringInterval: string | null;
  recurringIntervalCount: number | null;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  locale: string;
  timezone: string | null;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  version: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string | null;
  customerId: string;
  gatewayConnectionId: string;
  status: string;
  amountMinor: number;
  currency: string;
  capturedMinor: number;
  refundedMinor: number;
  paymentMethod: string;
  approvedAt: string | null;
  createdAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  amountMinor: number;
  currency: string;
  status: string;
  reason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  priceId: string;
  status: string;
  currency: string;
  amountMinor: number;
  interval: string;
  intervalCount: number;
  nextBillingAt: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  joinedAt: string | null;
}
export interface OrganizationInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}

export type CheckoutSectionType =
  | "hero"
  | "image"
  | "video"
  | "text"
  | "features"
  | "benefits"
  | "testimonials"
  | "faq"
  | "guarantee"
  | "countdown"
  | "product_summary"
  | "checkout_form"
  | "order_summary"
  | "custom_fields"
  | "footer";

export interface CheckoutDocument {
  schemaVersion: 1;
  theme: Record<string, unknown>;
  layout: Record<string, unknown>;
  sections: {
    id: string;
    type: CheckoutSectionType;
    visible: boolean;
    props: Record<string, unknown>;
  }[];
  settings: Record<string, unknown>;
  seo: Record<string, unknown>;
}

export interface Checkout {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "paused" | "archived";
  checkoutType: "single_product" | "multi_product";
  defaultCurrency: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutDraft {
  document: CheckoutDocument;
  revision: number;
  updatedAt: string;
}
export interface CheckoutPublication {
  id: string;
  checkoutId: string;
  status: string;
  checksum: string;
  publishedAt: string;
}
