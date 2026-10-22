import { redirect } from 'next/navigation';

/** O pagamento é uma aba do workspace do checkout. */
export default async function CheckoutPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/checkouts/${encodeURIComponent(id)}?tab=payment`);
}
