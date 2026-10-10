export interface ApiEnvelope<T> {
    data: T;
    meta?: Record<string, unknown>;
}

export interface ProblemDetails {
    code?: string;
    status: number;
    detail: string;
    requestId?: string;
    meta?: Record<string, unknown>;
}

export interface SessionData {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; name: string; email: string; emailVerified: boolean };
    organization?: { id: string };
}

export interface CurrentUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
}

export interface PlatformAdminSession {
    role: 'super_admin';
}

export interface PlatformAdminOverview {
    organizations: { total: number; active: number; suspended: number };
    users: { total: number; active: number; blocked: number };
    subscriptions: { trialing: number; active: number; pastDue: number };
    roadmap: { pending: number; published: number };
}

export interface PlatformAdminOrganization {
    id: string;
    displayName: string;
    legalName: string;
    slug: string;
    status: string;
    createdAt: string;
    memberCount: number;
    planCode: string | null;
    subscriptionStatus: string | null;
    periodEndsAt: string | null;
}

export interface PlatformAdminUser {
    id: string;
    name: string;
    email: string;
    status: string;
    emailVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    organizations: {
        id: string;
        displayName: string;
        slug: string;
        membershipStatus: string;
    }[];
}

export interface PlatformAdminEntitlement {
    feature: string;
    enabled: boolean;
    limit: number | null;
    resetPeriod: string;
    metadata: Record<string, unknown>;
}

export interface PlatformAdminPlan {
    id: string;
    code: string;
    name: string;
    description: string | null;
    audience: string | null;
    pricingType: 'fixed' | 'custom';
    priceMinor: number;
    currency: string;
    billingInterval: string;
    status: string;
    sortOrder: number;
    version: number;
    entitlements: PlatformAdminEntitlement[];
}

export interface PlatformBillingSummary {
    billingConfigured: boolean;
    subscription: {
        id: string;
        status: string;
        planCode: string;
        planName: string;
        priceMinor: number;
        currency: string;
        currentPeriodStartsAt: string;
        currentPeriodEndsAt: string;
        gracePeriodEndsAt: string | null;
        checkoutUrl: string | null;
        checkoutStatus: string | null;
        paymentMethod: string | null;
        billingProvider: string | null;
        providerSubscriptionId: string | null;
        cancelAtPeriodEnd: boolean;
    };
    plans: Array<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        audience: string | null;
        pricingType: 'fixed' | 'custom';
        priceMinor: number;
        currency: string;
        billingInterval: string;
    }>;
    usage: Array<{
        feature: string;
        enabled: boolean;
        limit: number | null;
        resetPeriod: string;
        metadata: Record<string, unknown>;
        used: number;
        remaining: number | null;
        usagePercent: number | null;
    }>;
    history: Array<{
        id: string;
        type: string;
        status: string;
        amountMinor: number;
        currency: string;
        paymentMethod: string | null;
        receiptUrl: string | null;
        failureReason: string | null;
        occurredAt: string;
    }>;
}

export interface CustomDomain {
    id: string;
    hostname: string;
    status: 'pending_verification' | 'active' | 'verification_failed' | 'disabled';
    cnameTarget: string;
    checkoutId: string;
    checkoutName: string;
    verifiedAt: string | null;
    lastCheckedAt: string | null;
    verificationError: string | null;
    createdAt: string;
}

export type TrackingProvider = 'meta' | 'google' | 'tiktok';
export type TrackingEventName =
    'checkout.viewed' | 'checkout.started' | 'payment.info_added' | 'purchase.completed';

export interface TrackingDestination {
    id: string;
    name: string;
    provider: TrackingProvider;
    externalId: string;
    credentialsConfigured: boolean;
    browserEnabled: boolean;
    serverEnabled: boolean;
    checkoutScope: 'all_checkouts' | 'selected_checkouts';
    checkoutIds: string[];
    enabledEvents: TrackingEventName[];
    configuration: Record<string, unknown>;
    status: 'active' | 'disabled';
    lastDeliveryAt: string | null;
    lastFailureAt: string | null;
    lastFailureReason: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TrackingDelivery {
    id: string;
    destinationId: string;
    destinationName: string;
    provider: TrackingProvider;
    eventName: string;
    eventId: string;
    status: 'pending' | 'delivering' | 'delivered' | 'failed';
    attemptCount: number;
    responseStatus: number | null;
    errorMessage: string | null;
    deliveredAt: string | null;
    createdAt: string;
}

export interface PlatformAdminAuditEntry {
    id: string;
    actorName: string | null;
    actorEmail: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    reason: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
}

export interface PaginatedAdminResult<T> {
    items: T[];
    total: number;
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
    accentTheme?: 'astro' | 'blue' | 'violet' | 'orange' | 'green' | 'rose';
    canManageAppearance?: boolean;
    permissions?: string[];
    version?: number;
}

export interface GatewayConnection {
    id: string;
    provider: 'mock' | 'stripe' | 'mercado_pago' | 'abacate_pay';
    name: string;
    environment: 'sandbox' | 'production';
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
    feeSchedule?: GatewayFeeSchedule;
    version: number;
    createdAt: string;
    updatedAt: string;
    webhookPathToken?: string;
    webhookSecret?: string;
    webhookUrl?: string;
}

export interface Product {
    id: string;
    type: 'digital' | 'physical' | 'service' | 'saas';
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    imageFileId: string | null;
    status: 'draft' | 'active' | 'inactive';
    inventoryMode: string;
    deliveryMode: string;
    metadata: Record<string, unknown>;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface MediaFileUsage {
    type: 'product';
    id: string;
    name: string;
}

export interface MediaFile {
    id: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
    checksum: string;
    status: string;
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
    usages: MediaFileUsage[];
}

export interface MediaFolder {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface StorageUsage {
    usedBytes: number;
    limitBytes: number;
    availableBytes: number;
}

export type RoadmapStage = 'backlog' | 'planned' | 'in_progress' | 'completed';

export interface RoadmapIdea {
    id: string;
    title: string;
    description: string;
    stage: RoadmapStage;
    position: number;
    likesCount: number;
    likedByMe: boolean;
    adminEdited: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    version: number;
}

export interface RoadmapSubmission extends RoadmapIdea {
    moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface RoadmapModerationIdea extends RoadmapSubmission {
    submittedTitle: string;
    submittedDescription: string;
    submitterName: string;
    organizationName: string;
}

export interface RoadmapDashboard {
    canModerate: boolean;
    board: RoadmapIdea[];
    mySubmissions: RoadmapSubmission[];
    moderationQueue: RoadmapModerationIdea[];
}

export interface Price {
    id: string;
    productId?: string;
    name: string;
    pricingType: 'one_time' | 'recurring' | 'free' | 'custom';
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
    routing?: PaymentRoutingDecision;
    failureCode?: string | null;
    failureCategory?: string | null;
    failureMessage?: string | null;
    cardBrand?: string | null;
    cardBin?: string | null;
    cardCountry?: string | null;
    cardFunding?: string | null;
}

export interface FeeEntry {
    percentBps: number;
    fixedMinor: number;
}

export type GatewayFeeSchedule = Partial<Record<RoutingPaymentMethod, FeeEntry>>;

interface ApprovalOutcome {
    approved: number;
    declined: number;
    pending: number;
    approvalRate: number | null;
}

export interface GatewayInsights {
    periodDays: number;
    summary: {
        approved: number;
        declined: number;
        approvalRate: number | null;
        routed: number;
        routedByFlow: number;
        recoveredByFailover: number;
    };
    gateways: (ApprovalOutcome & {
        gatewayConnectionId: string;
        attempts: number;
        failovers: number;
        technicalFailures: number;
        avgLatencyMs: number | null;
        p95LatencyMs: number | null;
    })[];
    methods: (ApprovalOutcome & { paymentMethod: string })[];
    brands: (ApprovalOutcome & { brand: string })[];
    bins: (ApprovalOutcome & { bin: string; brand: string | null })[];
    declineReasons: { category: string; count: number; retry: string }[];
}

export interface PaymentRoutingDecision {
    source?: 'flow' | 'checkout' | 'default';
    /** Versão publicada do fluxo que decidiu e os nós percorridos. */
    flowVersion?: number;
    path?: string[];
    candidates?: string[];
    failovers?: { from: string; to: string; code: string; category?: string; at: string }[];
}

export type RoutingPaymentMethod = 'card' | 'pix' | 'boleto' | 'bank_transfer';

export type FlowConditionField =
    'paymentMethod' | 'amount' | 'currency' | 'environment' | 'checkout' | 'product';

export type FlowCondition =
    | {
          id: string;
          field: 'paymentMethod';
          operator: 'in' | 'not_in';
          values: RoutingPaymentMethod[];
      }
    | {
          id: string;
          field: 'amount';
          operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between' | 'not_between';
          amountMinor: number;
          amountToMinor?: number;
      }
    | { id: string; field: 'currency'; operator: 'in' | 'not_in'; values: string[] }
    | {
          id: string;
          field: 'environment';
          operator: 'in' | 'not_in';
          values: ('sandbox' | 'production')[];
      }
    | { id: string; field: 'checkout'; operator: 'in' | 'not_in'; values: string[] }
    | { id: string; field: 'product'; operator: 'any_in' | 'all_in' | 'none_in'; values: string[] };

export interface FlowConditionGroup {
    combinator: 'and' | 'or';
    conditions: FlowCondition[];
}

interface FlowNodeBase {
    id: string;
    position: { x: number; y: number };
    name?: string;
    notes?: string;
    /** Seção do editor onde o bloco foi colocado; só organiza o quadro. */
    sectionId?: string;
}

export type FlowNode = FlowNodeBase &
    (
        | { type: 'trigger'; config: Record<string, never> }
        | { type: 'condition'; config: FlowConditionGroup }
        | {
              type: 'switch';
              config: { cases: (FlowConditionGroup & { id: string; label: string })[] };
          }
        | { type: 'split'; config: { percentage: number } }
        | { type: 'gateway'; config: { gatewayConnectionId: string | null } }
        | { type: 'cheapest'; config: { gatewayConnectionIds: string[] } }
        | { type: 'checkout_default'; config: Record<string, never> }
        | { type: 'success'; config: Record<string, never> }
        | { type: 'failed'; config: Record<string, never> }
        | { type: 'note'; config: { text: string; width?: number; height?: number } }
        | {
              type: 'section';
              config: { title: string; color: SectionColor; width: number; height: number };
          }
        | { type: 'event_trigger'; config: { event: FlowEvent } }
        | { type: 'send_webhook'; config: { webhookEndpointId: string | null } }
        | {
              type: 'send_email';
              config: {
                  recipients: 'customer' | 'team' | 'custom';
                  emails: string[];
                  subject: string;
                  body: string;
              };
          }
    );

export type SectionColor = 'neutral' | 'lime' | 'blue' | 'violet' | 'orange' | 'pink';

export type FlowEvent =
    | 'payment.approved.v1'
    | 'payment.failed.v1'
    | 'payment.refunded.v1'
    | 'payment.canceled.v1'
    | 'order.created.v1'
    | 'checkout.session.expired.v1';

export interface WebhookEndpointSummary {
    id: string;
    name?: string;
    url: string;
    status: string;
}

export type FlowNodeType = FlowNode['type'];

export interface FlowEdge {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
}

export interface FlowGraph {
    nodes: FlowNode[];
    edges: FlowEdge[];
    viewport?: { x: number; y: number; zoom: number };
}

export interface FlowIssue {
    nodeId?: string;
    severity: 'error' | 'warning';
    message: string;
}

export interface GatewayFlow {
    id: string | null;
    name: string;
    status: 'active' | 'inactive';
    draft: FlowGraph;
    published: FlowGraph | null;
    publishedAt: string | null;
    publishedVersion: number;
    version: number;
    updatedAt: string | null;
    issues: FlowIssue[];
}

export interface FlowSimulation {
    path: string[];
    edges: string[];
    end: 'failed' | 'success' | 'open';
    attempts: {
        nodeId: string;
        gatewayConnectionId: string | null;
        name: string;
        skipped?: string;
    }[];
    actions: SimulatedAction[];
    /** Ações depois de "Pagamento aprovado" / "Pagamento recusado" no caminho simulado. */
    afterSuccess: SimulatedAction[];
    afterFailure: SimulatedAction[];
}

export interface SimulatedAction {
    nodeId: string;
    kind: 'webhook' | 'email';
    name: string;
    skipped?: string;
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
    role: string;
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

export interface InvitableRole {
    code: 'administrator' | 'developer' | 'finance' | 'editor' | 'support' | 'viewer';
    name: string;
    description: string;
    permissions: string[];
}

export type CheckoutSectionType =
    | 'hero'
    | 'logo'
    | 'banner'
    | 'grid'
    | 'image'
    | 'video'
    | 'heading_text'
    | 'paragraph_text'
    | 'text'
    | 'features'
    | 'benefits'
    | 'testimonials'
    | 'faq'
    | 'guarantee'
    | 'countdown'
    | 'plan_comparison'
    | 'data_table'
    | 'stats'
    | 'before_after'
    | 'client_logos'
    | 'floating_cta'
    | 'spacer_divider'
    | 'order_bump'
    | 'product_summary'
    | 'checkout_form'
    | 'order_summary'
    | 'payment_methods'
    | 'card_payment'
    | 'pix_payment'
    | 'boleto_payment'
    | 'shipping_address'
    | 'shipping_methods'
    | 'coupon_field'
    | 'security_badges'
    | 'custom_fields'
    | 'footer';

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
    settings: CheckoutSettings;
    seo: Record<string, unknown>;
}

export type CheckoutPaymentMethod = 'card' | 'pix' | 'boleto';

export type CheckoutEnvironment = 'sandbox' | 'production';

/** Um gateway (formato antigo) ou a cascata: principal seguido das contingências. */
export type CheckoutGatewayBinding = string | string[];

export interface CheckoutSettings extends Record<string, unknown> {
    environment?: CheckoutEnvironment;
    paymentGatewayBindings?: Partial<Record<CheckoutPaymentMethod, CheckoutGatewayBinding>>;
}

export interface Checkout {
    id: string;
    name: string;
    slug: string;
    status: 'draft' | 'published' | 'paused' | 'archived';
    checkoutType: 'single_product' | 'multi_product';
    defaultCurrency: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    /** Itens do checkout; vem só no detalhe (GET /checkouts/:id). */
    products?: CheckoutProductPrice[];
}

export interface CheckoutProductPrice {
    productId: string;
    productName: string;
    priceId: string;
    priceName: string;
    pricingType: string;
    amountMinor: number;
    currency: string;
    recurringInterval: string | null;
    recurringIntervalCount: number | null;
    isDefault: boolean;
}

export interface CheckoutDraft {
    document: CheckoutDocument;
    revision: number;
    updatedAt: string;
}

export interface CheckoutVersion {
    id: string;
    versionNumber: number;
    checksum: string;
    createdAt: string;
}

export interface CheckoutPublication {
    id: string;
    checkoutId: string;
    status: string;
    checksum: string;
    publishedAt: string;
}
