import { Icon } from '@/components/ui/icon';
import type { RouteStep } from '@/lib/orchestration/strategy';

/** A rota em chips: quem cobra primeiro, quem é reserva, como a venda se divide. */
export function RouteDiagram({
    steps,
    compact = false,
}: {
    steps: RouteStep[];
    compact?: boolean;
}) {
    if (steps.length === 0) return null;
    return (
        <ol className="ce-route" data-compact={compact || undefined}>
            {steps.map((step, index) => (
                <li key={index} className="ce-route-step">
                    {index > 0 && <Icon name="arrow-right" className="ce-route-arrow size-3" />}
                    {step.kind === 'split' ? (
                        <div className="ce-route-split">
                            {step.branches.map((branch) => (
                                <span key={branch.name} className="ce-route-chip">
                                    <em>{branch.percentage}%</em>
                                    {branch.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="ce-route-group">
                            {!compact && (
                                <small>
                                    {step.kind === 'custom' ? 'Gateways do fluxo' : step.label}
                                </small>
                            )}
                            <div>
                                {step.names.map((name, position) => (
                                    <span
                                        key={`${name}-${String(position)}`}
                                        className="ce-route-chip"
                                    >
                                        {step.kind === 'gateways' && step.names.length > 1 && (
                                            <em>{position + 1}</em>
                                        )}
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </li>
            ))}
        </ol>
    );
}
