import type {
    CheckoutEnvironment,
    CheckoutPaymentMethod,
    GatewayConnection,
} from '@/lib/api/types';

export const paymentMethods: readonly CheckoutPaymentMethod[] = ['card', 'pix', 'boleto'];
export const requiredCheckoutComponents = [
    'product_summary',
    'checkout_form',
    'payment_methods',
] as const;

export type RequiredCheckoutComponent = (typeof requiredCheckoutComponents)[number];

export function connectionSupports(
    connection: GatewayConnection,
    method: CheckoutPaymentMethod,
): boolean {
    const payments = recordValue(connection.capabilities.payments);
    const methods = recordValue(payments?.methods);
    return methods !== undefined && recordValue(methods[method]) !== undefined;
}

export function selectableConnections(
    connections: readonly GatewayConnection[],
    method: CheckoutPaymentMethod,
    environment: CheckoutEnvironment,
) {
    return connections.filter(
        (connection) =>
            connection.status === 'active' &&
            connection.environment === environment &&
            connectionSupports(connection, method),
    );
}

export function enabledPaymentMethods(content: readonly { type: string; props: unknown }[]) {
    const enabled = new Set<CheckoutPaymentMethod>();
    for (const component of flattenComponents(content)) {
        const props = recordValue(component.props);
        if (component.type === 'payment_methods') {
            if (props?.showCard !== false) enabled.add('card');
            if (props?.showPix !== false) enabled.add('pix');
            if (props?.showBoleto !== false) enabled.add('boleto');
        }
    }
    return [...enabled];
}

export function presentRequiredComponents(
    content: readonly { type: string; props: unknown }[],
): RequiredCheckoutComponent[] {
    const present = new Set(flattenComponents(content).map(({ type }) => type));
    return requiredCheckoutComponents.filter((type) => present.has(type));
}

export function checkoutReadinessIssues({
    content,
    environment,
    flowGatewayIds,
    connections,
}: {
    content: readonly { type: string; props: unknown }[];
    environment: CheckoutEnvironment;
    /** Por forma: gateways do fluxo que a cobram, na ordem em que a venda os encontra. */
    flowGatewayIds: Readonly<Partial<Record<CheckoutPaymentMethod, readonly string[]>>>;
    connections: readonly GatewayConnection[];
}) {
    const present = presentRequiredComponents(content);
    const methods = enabledPaymentMethods(content);
    const issues: string[] = requiredCheckoutComponents
        .filter((type) => !present.includes(type))
        .map((type) => `component:${type}`);
    if (methods.length === 0) issues.push('payment:no_method');
    for (const method of methods) {
        const candidates = selectableConnections(connections, method, environment);
        if (candidates.length === 0) {
            issues.push(`payment:${method}:unavailable`);
            continue;
        }
        if (
            environment === 'production' &&
            !(flowGatewayIds[method] ?? []).some((id) =>
                candidates.some((candidate) => candidate.id === id),
            )
        )
            issues.push(`payment:${method}:binding`);
    }
    return issues;
}

function flattenComponents(
    content: readonly { type: string; props: unknown }[],
): { type: string; props: unknown }[] {
    const result: { type: string; props: unknown }[] = [];
    const visited = new Set<object>();
    const visit = (value: unknown) => {
        if (typeof value !== 'object' || value === null || visited.has(value)) return;
        visited.add(value);
        if (
            'type' in value &&
            typeof value.type === 'string' &&
            'props' in value &&
            typeof value.props === 'object' &&
            value.props !== null
        ) {
            result.push({ type: value.type, props: value.props });
            visit(value.props);
            return;
        }
        for (const nested of Array.isArray(value) ? value : Object.values(value)) visit(nested);
    };
    visit(content);
    return result;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}
