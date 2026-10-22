import { redirect } from 'next/navigation';

/** O fluxo de pagamento vive em cada checkout; a orquestração mostra desempenho e taxas. */
export default function OrchestrationPage() {
    redirect('/orchestration/performance');
}
