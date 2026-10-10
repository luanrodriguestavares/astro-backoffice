import { redirect } from 'next/navigation';

/** As regras viraram o fluxo visual; links antigos levam ao editor. */
export default function RoutingRulesPage() {
    redirect('/orchestration');
}
