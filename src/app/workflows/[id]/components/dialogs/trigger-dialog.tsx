import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkflowNode } from "../types/workflow";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { getIntegrationName } from "../utils";
import { Connection, DataInput, Flow, useConnections, useIntegrationApp } from "@integration-app/react";
import { DataSchema } from "@integration-app/sdk";

interface TriggerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (node: Omit<WorkflowNode, 'id'>) => void;
  node?: WorkflowNode;
  mode?: 'create' | 'edit';
}

interface TriggerState {
  connection?: Connection;
  flow?: Flow;
  parameters: Record<string, unknown>;
  name: string;
  triggers: Flow[];
  isSaving: boolean;
}

const initialState: TriggerState = {
  connection: undefined,
  flow: undefined,
  parameters: {},
  name: '',
  triggers: [],
  isSaving: false,
};

export function TriggerDialog({ open, onClose, onSubmit, node, mode = 'create' }: TriggerDialogProps) {
  const [state, setState] = useState<TriggerState>(initialState);
  const { items: connections } = useConnections();
  const integrationApp = useIntegrationApp();
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setState(initialState);
    }
  }, [open]);

  // Load data based on mode and connection
  useEffect(() => {
    let mounted = true;
    
    const loadFlows = async (connection: Connection) => {
      if (!connection?.integration?.id) return;
      
      try {
        const triggersList = await integrationApp
          .integration(connection.integration.id)
          .flows.list();

        if (!mounted) return;

        // In edit mode, also load the trigger parameters
        if (mode === 'edit' && node?.flowKey) {
          const trigger = triggersList.find(t => t.key === node.flowKey);
          if (trigger?.id) {
            try {
              const customerFlow = await integrationApp
                .connection(connection.id)
                .flow(trigger.id)
                .get();

              if (!mounted) return;
              
              setState({
                connection,
                triggers: triggersList as Flow[],
                flow: trigger,
                parameters: customerFlow.parameters || {},
                name: node.name,
                isSaving: false
              });
            } catch (error) {
              console.error('Failed to load trigger parameters:', error);
              if (mounted) {
                setState(prev => ({
                  ...prev,
                  connection,
                  triggers: triggersList as Flow[],
                }));
              }
            }
          }
        } else {
          // In create mode or when changing connection, just update the triggers
          setState(prev => ({
            ...prev,
            triggers: triggersList as Flow[],
          }));
        }
      } catch (error) {
        console.error('Failed to load flows:', error);
      }
    };

    // Load flows when connection changes or in edit mode
    if (state.connection) {
      loadFlows(state.connection);
    } else if (mode === 'edit' && node) {
      const connection = connections?.find(c => c.id === node.connectionId);
      if (connection) {
        setState(prev => ({ ...prev, connection, name: node.name }));
        loadFlows(connection);
      }
    }

    return () => {
      mounted = false;
    };
  }, [state.connection?.id, mode, node, open, integrationApp]);

  const handleIntegrationChange = (connectionId: string) => {
    const connection = connections?.find(c => c.id === connectionId);
    if (!connection?.integration?.id) return;

    setState(prev => ({
      ...prev,
      connection,
      flow: undefined,
      parameters: {},
      name: mode === 'edit' ? prev.name : '',
      triggers: [], // Clear triggers before loading new ones
    }));
  };

  const handleTriggerChange = async (triggerKey: string) => {
    const trigger = state.triggers.find(t => t.key === triggerKey);
    if (!trigger?.id || !state.connection?.id) return;

    setState(prev => ({
      ...prev,
      flow: trigger,
      parameters: {}, // Clear parameters before loading new ones
    }));

    if (mode !== 'edit') {
      const connectionName = getIntegrationName(state.connection);
      const triggerName = trigger.name || trigger.key;
      setState(prev => ({
        ...prev,
        name: `${connectionName} - ${triggerName}`,
      }));
    }

    try {
      const customerFlow = await integrationApp
        .connection(state.connection.id)
        .flow(trigger.id)
        .get();

      setState(prev => ({
        ...prev,
        parameters: customerFlow.parameters || {},
      }));
    } catch (error) {
      console.error('Failed to load trigger parameters:', error);
    }
  };

  const handleParameterChange = (parameters: Record<string, unknown>) => {
    setState(prev => ({ ...prev, parameters }));
  };

  const handleSubmit = async () => {
    if (!state.connection?.id || !state.flow?.id) return;

    setState(prev => ({ ...prev, isSaving: true }));
    try {
      await integrationApp
        .connection(state.connection.id)
        .flow(state.flow.id)
        .patch({ parameters: state.parameters });

      onSubmit({
        name: state.name,
        type: 'trigger',
        integrationKey: state.connection.integration?.key || "",
        connectionId: state.connection.id,
        flowKey: state.flow.key,
        parametersSchema: state.flow.parametersSchema as DataSchema,
        instanceKey: node?.instanceKey || "12",
        actionKey: state.flow.key,
        inputMapping: node?.inputMapping || {}
      });

      setState(initialState);
    } catch (error) {
      console.error('Failed to save trigger:', error);
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Helper function to ensure schema is properly formatted
  const getFormattedSchema = (schema: DataSchema): DataSchema => {
    if (!schema) return schema;
    
    // If schema is an array, wrap it in an object
    if (Array.isArray(schema)) {
      return {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: schema[0]
          }
        }
      };
    }
    
    // If schema is already an object, return as is
    if (typeof schema === 'object' && schema !== null) {
      return schema;
    }
    
    // If schema is a primitive type, wrap it in an object
    return {
      type: 'object',
      properties: {
        value: {
          type: typeof schema === 'string' ? 'string' : 
                typeof schema === 'number' ? 'number' : 
                typeof schema === 'boolean' ? 'boolean' : 'string'
        }
      }
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] w-[800px] max-h-[90vh] flex flex-col p-0 overflow-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{mode === 'edit' ? 'Edit Trigger' : 'Add Trigger'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Modify the trigger settings for your workflow.'
              : 'Configure a new trigger for your workflow.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                value={state.name}
                onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter trigger name"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="integration" className="text-sm font-medium">Integration</label>
              <select
                id="integration"
                value={state.connection?.id || ''}
                onChange={(e) => handleIntegrationChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select integration</option>
                {connections?.map(connection => (
                  <option key={connection.id} value={connection.id}>
                    {getIntegrationName(connection)}
                  </option>
                ))}
              </select>
            </div>
            {state.connection && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="trigger" className="text-sm font-medium">Trigger</label>
                  <select
                    id="trigger"
                    value={state.flow?.key || ''}
                    onChange={(e) => handleTriggerChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select trigger</option>
                    {state.triggers.map((trigger) => (
                      <option key={trigger.key} value={trigger.key}>
                        {trigger.name || trigger.key}
                      </option>
                    ))}
                  </select>
                </div>

                {state.flow && (
                  <div className="grid gap-2">
                    <label htmlFor="parameters" className="text-sm font-medium">
                      Configure Parameters
                    </label>
                    <DataInput
                      schema={getFormattedSchema(state.flow.parametersSchema as DataSchema)}
                      value={state.parameters}
                      onChange={handleParameterChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!state.name || !state.connection || !state.flow || state.isSaving}
          >
            {state.isSaving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add Trigger')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 