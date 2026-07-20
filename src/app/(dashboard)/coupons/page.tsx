import { CouponCreate } from "@/components/coupons/coupon-create";
import { PageHeader } from "@/components/ui/page-header";
import { ResourceTable, SummaryCard, date, money } from "@/components/ui/resource-table";
import { apiFetch } from "@/lib/api/server";

type Coupon = { id: string; name: string; code: string; discountType: string; discountValue: number; currency: string | null; status: string; expiresAt: string | null };

export default async function CouponsPage() {
  const coupons = await apiFetch<Coupon[]>("/api/v1/coupons");
  const active = coupons.filter((coupon) => coupon.status === "active");
  const expiring = active.filter((coupon) => coupon.expiresAt !== null);
  return <><PageHeader eyebrow="Vendas" title="Cupons" description="Consulte promoções e regras de desconto disponíveis nos checkouts." actions={<CouponCreate />} /><section className="mb-4 grid gap-3 sm:grid-cols-3"><SummaryCard label="Cupons cadastrados" value={String(coupons.length)} detail="Total na organização" icon="tag" /><SummaryCard label="Cupons ativos" value={String(active.length)} detail="Disponíveis nos checkouts" icon="check" /><SummaryCard label="Com data de expiração" value={String(expiring.length)} detail="Cupons ativos com vencimento" icon="clock" /></section><ResourceTable title="Cupons e promoções" description="Regras de desconto configuradas para sua operação" rows={coupons} empty="Nenhum cupom cadastrado." columns={[{ label: "Cupom", value: (row) => row.name }, { label: "Código", value: (row) => row.code, mono: true }, { label: "Desconto", value: (row) => row.discountType === "percentage" ? `${row.discountValue / 100}%` : money(row.discountValue, row.currency ?? "BRL") }, { label: "Status", value: (row) => row.status }, { label: "Expira em", value: (row) => date(row.expiresAt) }]} /></>;
}
