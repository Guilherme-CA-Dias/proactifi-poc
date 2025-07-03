import { EdgeProps, getBezierPath } from '@xyflow/react';

export function SimpleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX: sourceX-2.5,
    sourceY,
    sourcePosition,
    targetX: targetX-2.5,
    targetY,
    targetPosition,
  });

  return (
    <path
      d={edgePath}
      className="react-flow__edge-path"
      strokeWidth={2}
      stroke="#b1b1b7"
      style={style}
      markerEnd={markerEnd}
    />
  );
} 