export type LogOutcome = 'success' | 'failure' | 'warning' | 'info' | 'automatic';

export type LogCategory =
    | 'status'
    | 'routing'
    | 'attempt'
    | 'gateway'
    | 'refund'
    | 'cancellation'
    | 'reconciliation'
    | 'gateway_webhook'
    | 'customer_webhook';

export interface LogPage<T> {
    data: T[];
    meta: { nextCursor: string | null };
}

export interface GatewayReference {
    id: string;
    name: string;
    provider: string;
}

export interface TimelineEvent {
    id: string;
    type: string;
    category: LogCategory;
    outcome: LogOutcome;
    source: string;
    summary: string;
    occurredAt: string;
    httpStatus: number | null;
    durationMs: number | null;
    errorCode: string | null;
    errorMessage: string | null;
    requestId: string | null;
    correlationId: string | null;
    paymentIntentId: string;
    paymentId: string | null;
    attemptId: string | null;
    refundId: string | null;
    gatewayConnectionId: string | null;
    gatewayEventId: string | null;
    webhookDeliveryId: string | null;
    actor: { id: string; name: string } | null;
    details?: Record<string, unknown>;
}

export interface PaymentTimeline {
    intent: {
        id: string;
        status: string;
        amountMinor: number;
        currency: string;
        paymentMethod: string;
        orderId: string | null;
        correlationId: string | null;
        routing: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
    };
    payment: {
        id: string;
        status: string;
        providerPaymentId: string;
        gateway: GatewayReference | null;
    } | null;
    attempts: {
        id: string;
        attemptNumber: number;
        status: string;
        gateway: GatewayReference | null;
        providerPaymentId: string | null;
        failureCode: string | null;
        failureCategory: string | null;
        failureMessage: string | null;
        latencyMs: number | null;
        startedAt: string;
        completedAt: string | null;
    }[];
    events: TimelineEvent[];
}

export interface WebhookDeliveryLog {
    id: string;
    endpoint: { id: string; name: string; url: string };
    eventId: string;
    eventType: string;
    status: string;
    paymentIntentId: string | null;
    attemptCount: number;
    replayCount: number;
    lastResponseStatus: number | null;
    lastErrorCode: string | null;
    lastErrorMessage: string | null;
    lastDurationMs: number | null;
    lastAttemptAt: string | null;
    nextAttemptAt: string | null;
    deliveredAt: string | null;
    createdAt: string;
}

export interface WebhookDeliveryDetail extends WebhookDeliveryLog {
    lastReplayedAt: string | null;
    payload: Record<string, unknown>;
    attempts: {
        attemptNumber: number;
        requestHeaders: Record<string, string>;
        responseStatus: number | null;
        responseHeaders: Record<string, string>;
        responseBodyExcerpt: unknown;
        durationMs: number | null;
        errorCode: string | null;
        errorMessage: string | null;
        attemptedAt: string;
    }[];
}

export interface GatewayEventLog {
    id: string;
    provider: string;
    gateway: GatewayReference | null;
    providerEventId: string | null;
    eventType: string | null;
    processingStatus: string;
    paymentIntentId: string | null;
    receivedAt: string;
    processedAt: string | null;
    errorMessage: string | null;
}

export interface GatewayEventDetail extends GatewayEventLog {
    headers: Record<string, unknown>;
    payload: Record<string, unknown>;
}

export interface ApiRequestLog {
    id: string;
    requestId: string;
    correlationId: string | null;
    method: string;
    route: string;
    path: string;
    statusCode: number;
    durationMs: number;
    actorType: 'user' | 'api_key';
    actorId: string | null;
    errorCode: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    occurredAt: string;
}

export interface LogSearchMatch {
    kind: 'payment' | 'webhook_delivery' | 'gateway_event' | 'request';
    id: string;
    label: string;
    paymentIntentId: string | null;
    occurredAt: string | null;
}
