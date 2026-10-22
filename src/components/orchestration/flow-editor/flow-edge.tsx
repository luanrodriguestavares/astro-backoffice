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
    {
        label: string;
        labels?: string[];
        tone: string;
        sim?: 'on' | 'off' | undefined;
        locked?: boolean;
        triggerId?: string;
        triggerIds?: string[];
        labelTitle?: string;
    },
    'flow'
>;

const PILL_HEIGHT = 20;
const PILL_GAP = 4;
const DELETE_GAP = 14;
const PATH_SAMPLES = 240;

/** Largura aproximada do badge (10.5px semibold + px-2.5). */
function estimatePillWidth(label: string) {
    return label.length * 6.2 + 22;
}

/** Amostra a cúbica "M sx,sy C c1 c2 t" devolvida pelo getBezierPath. */
function samplePath(path: string) {
    const n = (path.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
    if (n.length < 8) return null;
    const [x0, y0, x1, y1, x2, y2, x3, y3] = n as [number, number, number, number, number, number, number, number];
    return Array.from({ length: PATH_SAMPLES + 1 }, (_, i) => {
        const t = i / PATH_SAMPLES;
        const u = 1 - t;
        const a = u * u * u;
        const b = 3 * u * u * t;
        const c = 3 * u * t * t;
        const d = t * t * t;
        return { x: a * x0 + b * x1 + c * x2 + d * x3, y: a * y0 + b * y1 + c * y2 + d * y3 };
    });
}

/**
 * Distribui os badges ao longo da curva com o centro de cada um sobre a linha:
 * numa ligação vertical ficam empilhados, numa horizontal lado a lado, e
 * acompanham a curvatura no meio do caminho.
 */
function placeLabelsOnPath(path: string, labels: string[], labelX: number, labelY: number) {
    const points = samplePath(path);
    if (!points || labels.length <= 1) {
        return labels.map((label) => ({ label, x: labelX, y: labelY }));
    }
    const widths = labels.map(estimatePillWidth);
    const layout = (start: number) => {
        const indices = [start];
        for (let i = 1; i < labels.length; i++) {
            const prev = points[indices[i - 1]!]!;
            const minDx = (widths[i - 1]! + widths[i]!) / 2 + PILL_GAP;
            const minDy = PILL_HEIGHT + PILL_GAP;
            let j = indices[i - 1]!;
            while (j < PATH_SAMPLES) {
                const p = points[j]!;
                if (Math.abs(p.x - prev.x) >= minDx || Math.abs(p.y - prev.y) >= minDy) break;
                j++;
            }
            indices.push(j);
        }
        return indices;
    };
    const center = PATH_SAMPLES / 2;
    let indices = layout(center);
    // Recentraliza o grupo no meio da ligação (a curva não é uniforme, então ajusta duas vezes).
    for (let pass = 0; pass < 2; pass++) {
        const mid = (indices[0]! + indices.at(-1)!) / 2;
        const start = Math.max(0, Math.round(indices[0]! - (mid - center)));
        indices = layout(start);
    }
    return labels.map((label, i) => ({ label, ...points[indices[i]!]! }));
}

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
    const showDelete = !data?.locked && (hovered || selected);
    const labels = data?.labels ?? (data?.label ? [data.label] : []);
    const placed = placeLabelsOnPath(path, labels, labelX, labelY);
    const last = placed.at(-1);
    const deleteAt = last
        ? { x: last.x + estimatePillWidth(last.label) / 2 + DELETE_GAP, y: last.y }
        : { x: labelX, y: labelY };
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
                {placed.map(({ label, x, y }, index) => (
                    <span
                        key={`${label}:${String(index)}`}
                        className="flow-pill nodrag nopan pointer-events-auto absolute whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold shadow-sm"
                        data-tone={data?.tone}
                        title={label}
                        style={{
                            transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                            ...(sim === 'off' ? { opacity: 0.35 } : undefined),
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        {label}
                    </span>
                ))}
                {showDelete && (
                    <button
                        type="button"
                        aria-label="Remover ligação"
                        title="Remover ligação"
                        onClick={() => void deleteElements({ edges: [{ id }] })}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        className="flow-pill nodrag nopan pointer-events-auto absolute grid size-5 place-items-center rounded-full shadow-sm transition hover:text-danger"
                        style={{
                            transform: `translate(-50%, -50%) translate(${deleteAt.x}px, ${deleteAt.y}px)`,
                        }}
                    >
                        <Icon name="trash" className="size-3" />
                    </button>
                )}
            </EdgeLabelRenderer>
        </g>
    );
});
