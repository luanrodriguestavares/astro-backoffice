export interface NavigationAccessRequirement {
    readonly permission?: string;
    readonly feature?: string;
}

export interface BillingNavigationAccess {
    readonly active: boolean;
    readonly features: readonly string[];
}

export function canAccessNavigationItem(
    item: NavigationAccessRequirement,
    permissions: ReadonlySet<string>,
    billing: BillingNavigationAccess,
): boolean {
    return (
        (item.permission === undefined || permissions.has(item.permission)) &&
        (item.feature === undefined || (billing.active && billing.features.includes(item.feature)))
    );
}
