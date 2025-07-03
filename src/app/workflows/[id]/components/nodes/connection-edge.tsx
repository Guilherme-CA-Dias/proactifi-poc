import { getBezierPath } from '@xyflow/react';
import { Plus } from 'lucide-react';
import type { ConnectionEdgeProps } from '../types/workflow';

import { EDGE_PLUS_SIZE, EDGE_PLUS_ICON_SIZE } from '../constants';

export function ConnectionEdge({ 
  source, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  data 
}: ConnectionEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourceX-2,
    sourceY,
    targetX: targetX-2,
    targetY,
    curvature: 0
  });

  const handleAddBlock = () => {
    const sourceId = source.replace('block-', '');
    data.createNewNode(sourceId);
  };

  return (
    <g className="react-flow__edge">
      <path
        className="react-flow__edge-path stroke-gray-300 dark:stroke-gray-600"
        d={edgePath}
        strokeWidth={2}
      />
      <foreignObject
        width={EDGE_PLUS_SIZE}
        height={EDGE_PLUS_SIZE}
        x={labelX - EDGE_PLUS_SIZE/2}
        y={labelY - EDGE_PLUS_SIZE/2}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button
          className="absolute w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg cursor-pointer"
          style={{ width: EDGE_PLUS_SIZE, height: EDGE_PLUS_SIZE }}
          onClick={(event) => {
            event.stopPropagation();
            handleAddBlock();
          }}
        >
          <Plus className="w-3 h-3" style={{ width: EDGE_PLUS_ICON_SIZE, height: EDGE_PLUS_ICON_SIZE }} />
        </button>
      </foreignObject>
    </g>
  );
} 