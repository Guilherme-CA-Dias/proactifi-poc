import { ZapIcon } from 'lucide-react';
import { BaseNode } from './base-node';
import { WorkflowNode } from '../types/workflow';

interface TriggerNodeProps {
  data: {
    isEmpty?: boolean;
    onClick?: () => void;
    label?: string;
    node?: WorkflowNode;
    onDelete?: (nodeId: string) => void;
  };
  selected?: boolean;
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  if (data.isEmpty) {
    return (
      <BaseNode
        selected={selected}
        icon={<ZapIcon className="w-5 h-5 text-gray-400" />}
        title="Add Trigger"
        subtitle="Start your workflow with a trigger"
        onClick={data.onClick}
        showTargetHandle={false}
        className="border-dashed bg-opacity-50"
      />
    );
  }

  return (
    <BaseNode
      selected={selected}
      icon={<ZapIcon className="w-5 h-5 text-yellow-500" />}
      title={data.label || ''}
      subtitle="Workflow Trigger"
      node={data.node}
      onDelete={data.onDelete}
      showTargetHandle={false}
    />
  );
} 