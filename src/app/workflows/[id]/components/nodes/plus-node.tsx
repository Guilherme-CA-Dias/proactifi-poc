import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import type { PlusNodeProps } from '../types/workflow';

const INITIAL_PLUS_SIZE = 48;
const INITIAL_PLUS_ICON_SIZE = 24;
const FINAL_PLUS_SIZE = 24;
const FINAL_PLUS_ICON_SIZE = 16;
const NODE_WIDTH = 400;

export function PlusNode({ data }: PlusNodeProps) {
  const handleAddBlock = () => {
    const parentId = data.parentId === 'root' ? '0' : data.parentId.replace('block-', '');
    data.createNewNode(parentId);
  };

  const isInitial = data.parentId === 'root';
  const buttonSize = isInitial ? INITIAL_PLUS_SIZE : FINAL_PLUS_SIZE;
  const iconSize = isInitial ? INITIAL_PLUS_ICON_SIZE : FINAL_PLUS_ICON_SIZE;

  return (
    <div className="relative" style={{ width: NODE_WIDTH }}>
      {!isInitial && <Handle type="target" position={Position.Top}           className="!opacity-0 !top-0 !pointer-events-none"
          style={{ 
            top: 0,
            left: '50%',
            width: '1px',
            height: '1px',
            transform: 'none',
            border: 'none',
            borderRadius: 0,
            background: 'transparent'
          }} />}
      <button
        className="rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg mx-auto"
        style={{ width: buttonSize, height: buttonSize }}
        onClick={(event) => {
          event.stopPropagation();
          handleAddBlock();
        }}
      >
        <Plus style={{ width: iconSize, height: iconSize }} />
      </button>
    </div>
  );
} 