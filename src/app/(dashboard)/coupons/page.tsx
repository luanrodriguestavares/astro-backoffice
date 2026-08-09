import { CouponCreate } from '@/components/coupons/coupon-create';
import { CouponScopeEdit } from '@/components/coupons/coupon-scope-edit';
import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable, SummaryCard, date, money } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import { currentPermissions } from '@/lib/auth/permissions';
import type { Checkout, Product } from '@/lib/api/types';

type Coupon = {
    id: string;
    name: string;
    code: string;
    discountType: string;
    discountValue: number;
    currency: string | null;
    status: string;
    expiresAt: string | null;
    version: number;
    scope: { type: 'checkout' | 'product'; id: string; name: string } | null;
};

export default async function CouponsPage() {
    const permissions = await currentPermissions();
    const canWrite = permissions.has('products.write');
    const [coupons, checkouts, products] = await Promise.all([
        apiFetch<Coupon[]>('/api/v1/coupons'),
        apiFetch<Checkout[]>('/api/v1/checkouts'),
        apiFetch<Product[]>('/api/v1/products?limit=100'),
    ]);
    const active = coupons.filter((coupon) => coupon.status === 'active');
    const expiring = active.filter((coupon) => coupon.expiresAt !== null);
    return (
        <div data-tour="coupons-page">
            <PageHeader
                eyebrow="Vendas"
                title="Cupons"
                description="Consulte promoções e regras de desconto disponíveis nos checkouts."
                actions={
                    canWrite ? <CouponCreate checkouts={checkouts} products={products} /> : undefined
                }
            />
            <section data-tour="coupon-summary" className="mb-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Cupons cadastrados"
                    value={String(coupons.length)}
                    detail="Total na organização"
                    icon="tag"
                />
                <SummaryCard
                    label="Cupons ativos"
                    value={String(active.length)}
                    detail="Disponíveis nos checkouts"
                    icon="check"
                />
                <SummaryCard
                    label="Com data de expiração"
                    value={String(expiring.length)}
                    detail="Cupons ativos com vencimento"
                    icon="clock"
                />
            </section>
            <div data-tour="coupon-list">
                <ResourceTable
                    title="Cupons e promoções"
                    description="Regras de desconto configuradas para sua operação"
                    rows={coupons}
                    empty="Nenhum cupom cadastrado."
                    columns={[
                    { label: 'Cupom', value: (row) => row.name },
                    { label: 'Código', value: (row) => row.code, mono: true },
                    {
                        label: 'Desconto',
                        value: (row) =>
                            row.discountType === 'percentage'
                                ? `${row.discountValue / 100}%`
                                : money(row.discountValue, row.currency ?? 'BRL'),
                    },
                    { label: 'Status', value: (row) => row.status },
                    {
                        label: 'Aplicado em',
                        value: (row) =>
                            row.scope === null
                                ? 'Sem escopo — indisponível'
                                : `${row.scope.type === 'checkout' ? 'Checkout' : 'Produto'}: ${row.scope.name}`,
                        ...(canWrite
                            ? {
                                  render: (row: Coupon) => (
                                      <CouponScopeEdit
                                          coupon={row}
                                          checkouts={checkouts}
                                          products={products}
                                      />
                                  ),
                              }
                            : {}),
                    },
                    { label: 'Expira em', value: (row) => date(row.expiresAt) },
                    ]}
                />
            </div>
        </div>
    );
}
