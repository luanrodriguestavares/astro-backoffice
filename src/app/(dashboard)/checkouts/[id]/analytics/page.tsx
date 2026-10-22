import { redirect } from 'next/navigation';

/** A jornada por página fica em Analytics de funis; o checkout já vem selecionado. */
export default async function CheckoutAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/checkouts/analytics?checkout=${encodeURIComponent(id)}`);
}
