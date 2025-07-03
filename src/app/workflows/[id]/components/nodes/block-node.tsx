import { BoxIcon } from 'lucide-react';
import { BaseNode } from './base-node';
import { WorkflowNode } from '../types/workflow';

interface BlockNodeProps {
  data: {
    label: string;
    node: WorkflowNode;
    onDelete: (nodeId: string) => void;
  };
  selected?: boolean;
}

export function BlockNode({ data, selected }: BlockNodeProps) {
  return (
    <BaseNode
      selected={selected}
      icon={<BoxIcon className="w-5 h-5 text-blue-500" />}
      title={data.label}
      subtitle={data.node.integrationKey}
      node={data.node}
      onDelete={data.onDelete}
    />
  );
} 