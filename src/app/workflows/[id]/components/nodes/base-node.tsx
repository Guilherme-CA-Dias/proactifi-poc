import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { WorkflowNode } from '../types/workflow';
import { TrashIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface BaseNodeProps {
  selected?: boolean;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  node?: WorkflowNode;
  onDelete?: (nodeId: string) => void;
  onClick?: () => void;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  className?: string;
}

export function BaseNode({ 
  selected, 
  icon, 
  title, 
  subtitle,
  node,
  onDelete,
  onClick,
  showSourceHandle = true,
  showTargetHandle = true,
  className = ''
}: BaseNodeProps) {
  const baseClasses = `
    flex items-center p-4 rounded-lg border-2 bg-white w-[400px] h-[80px]
    ${selected ? 'border-blue-500' : 'border-gray-200'}
    ${onClick ? 'cursor-pointer hover:border-gray-400' : ''}
    ${className}
  `;

  return (
    <div className="relative">
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!opacity-0 !top-0 !pointer-events-none"
          style={{ 
            top: 0,
            left: '50%',
            width: '1px',
            height: '1px',
            transform: 'none',
            border: 'none',
            borderRadius: 0,
            background: 'transparent'
          }}
        />
      )}
      <div 
        className={baseClasses}
        onClick={onClick}
      >
        <div className={"flex items-center justify-between w-full"}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="flex-grow">
              <div className="text-sm font-medium text-gray-900">{title}</div>
              {subtitle && (
                <div className="text-sm text-gray-500">{subtitle}</div>
              )}
            </div>
          </div>
          {onDelete && node && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!opacity-0 !bottom-0 !pointer-events-none"
          style={{ 
            bottom: 0,
            left: '50%',
            width: '1px',
            height: '1px',
            transform: 'none',
            border: 'none',
            borderRadius: 0,
            background: 'transparent'
          }}
        />
      )}
    </div>
  );
} 