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
            if (props?.showCard === true) enabled.add('card');
            if (props?.showPix === true) enabled.add('pix');
            if (props?.showBoleto === true) enabled.add('boleto');
        }
        if (component.type === 'card_payment') enabled.add('card');
        if (component.type === 'pix_payment') enabled.add('pix');
        if (component.type === 'boleto_payment') enabled.add('boleto');
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
    bindings,
    connections,
}: {
    content: readonly { type: string; props: unknown }[];
    environment: CheckoutEnvironment;
    bindings: Partial<Record<CheckoutPaymentMethod, string>>;
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
        if (environment === 'production' && !candidates.some(({ id }) => id === bindings[method]))
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
