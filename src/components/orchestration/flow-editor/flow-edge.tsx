'use client';

import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    useReactFlow,
    type Edge,
    type EdgeProps,
} from '@xyflow/react';
import { memo, useState } from 'react';

import { Icon } from '@/components/ui/icon';

export type FlowCanvasEdge = Edge<
    { label: string; tone: string; sim?: 'on' | 'off' | undefined },
    'flow'
>;

/** Ligação com o rótulo da saída (verdadeiro, falhou, Pix…) no meio do caminho. */
export const FlowEdge = memo(function FlowEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
}: EdgeProps<FlowCanvasEdge>) {
    const { deleteElements } = useReactFlow();
    const [hovered, setHovered] = useState(false);
    const [path, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.35,
    });
    const sim = data?.sim;
    const showDelete = hovered || selected;
    return (
        <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <BaseEdge
                id={id}
                path={path}
                markerEnd={markerEnd}
                className="flow-edge-path"
                interactionWidth={22}
                data-tone={data?.tone}
                data-sim={sim}
            />
            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan pointer-events-auto absolute flex items-center gap-1"
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {data?.label && (
                        <span
                            className="flow-pill rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold shadow-sm"
                            data-tone={data.tone}
                            style={sim === 'off' ? { opacity: 0.35 } : undefined}
                        >
                            {data.label}
                        </span>
                    )}
                    {showDelete && (
                        <button
                            type="button"
                            aria-label="Remover ligação"
                            title="Remover ligação"
                            onClick={() => void deleteElements({ edges: [{ id }] })}
                            className="flow-pill grid size-5 place-items-center rounded-full shadow-sm transition hover:text-danger"
                        >
                            <Icon name="trash" className="size-3" />
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </g>
    );
});
