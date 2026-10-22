import { redirect } from 'next/navigation';

/** O builder virou uma aba do workspace do checkout; links antigos abrem a aba certa. */
export default async function CheckoutBuilderPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ view?: string; settings?: string }>;
}) {
    const { id } = await params;
    const { view, settings } = await searchParams;
    const query = new URLSearchParams({ tab: view === 'flow' ? 'funnel' : 'page:checkout' });
    if (settings === 'payments') query.set('settings', 'payments');
    redirect(`/checkouts/${encodeURIComponent(id)}?${query.toString()}`);
}
