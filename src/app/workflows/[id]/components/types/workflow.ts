import { Node, Edge } from '@xyflow/react';
import { DataSchema } from '@integration-app/sdk';

export interface WorkflowNode {
  id: string;
  name: string;
  type: 'trigger' | 'action';
  integrationKey: string;
  connectionId: string;
  flowKey: string;
  parametersSchema?: DataSchema;
  instanceKey?: string;
  actionKey?: string;
  actionId?: string;
  inputMapping: Record<string, unknown>;
  outputSchema?: DataSchema;
  outputMapping?: DataSchema;
  lastExecutedAt?: string;
  executionStatus?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface FlowBlock {
  data: {
    label: string;
    node: WorkflowNode;
    onDelete: (nodeId: string) => void;
  };
  id: string;
  selected: boolean;
}

export interface WorkflowEdge extends Edge {
  data: {
    createNewNode: (afterId: string) => void;
  };
}

export interface NodeDialogProps {
  mode: 'create' | 'configure';
  node?: WorkflowNode | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (node: Omit<WorkflowNode, 'id'>) => void;
  workflowNodes?: WorkflowNode[];
}

export interface PlusNodeProps {
  data: {
    parentId: string;
    createNewNode: (afterId: string) => void;
  };
}

export interface ConnectionEdgeProps {
  id: string;
  source: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data: {
    createNewNode: (afterId: string) => void;
  };
}

export type FlowNode = Node<{
  label: string;
  node: WorkflowNode;
  onDelete: (nodeId: string) => void;
}>;

export interface Action {
  key: string;
  name: string;
  inputSchema?: DataSchema;
} 