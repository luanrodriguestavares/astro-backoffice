import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable, date, money } from '@/components/ui/resource-table';
import { apiFetch } from '@/lib/api/server';
import type { Refund } from '@/lib/api/types';
import { refundStatusLabels } from '@/lib/payments/refunds';

export default async function RefundsPage() {
    const refunds = await apiFetch<Refund[]>('/api/v1/refunds');
    return (
        <>
            <PageHeader
                eyebrow="Financeiro"
                title="Reembolsos"
                description="Consulte devoluções solicitadas e concluídas. Para reembolsar, abra o pagamento e use Reembolsar."
                actions={
                    <ButtonLink href="/payments" variant="primary">
                        <Icon name="refund" className="size-4" /> Reembolsar um pagamento
                    </ButtonLink>
                }
            />
            <ResourceTable
                rows={refunds}
                empty="Nenhum reembolso ainda. Para devolver uma venda, abra o pagamento em Pagamentos e clique em Reembolsar."
                columns={[
                    { label: 'Reembolso', value: (row) => row.id, mono: true },
                    { label: 'Pagamento', value: (row) => row.paymentId, mono: true },
                    { label: 'Valor', value: (row) => money(row.amountMinor, row.currency) },
                    {
                        label: 'Status',
                        value: (row) => refundStatusLabels[row.status] ?? row.status,
                    },
                    {
                        label: 'Detalhe',
                        // Falha mostra o motivo do gateway; parado em processamento há mais de
                        // 2 dias pede conferência no gateway; os demais, o motivo informado.
                        value: (row) =>
                            row.status === 'failed' || row.failureCode === 'refund_outcome_unknown'
                                ? (row.failureMessage ?? 'O gateway recusou o reembolso.')
                                : stalled(row)
                                  ? `Em processamento há ${String(daysSince(row.createdAt))} dias. Confira no painel do gateway.`
                                  : row.reason,
                    },
                    { label: 'Data', value: (row) => date(row.createdAt) },
                ]}
            />
        </>
    );
}

const STALLED_AFTER_DAYS = 2;

function daysSince(value: string) {
    return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

function stalled(row: { status: string; createdAt: string }) {
    return (
        (row.status === 'requested' || row.status === 'processing') &&
        daysSince(row.createdAt) >= STALLED_AFTER_DAYS
    );
}
