import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConnections, useIntegrationApp, useAction, IntegrationElementProvider, DataInput, IntegrationAppClientProvider } from "@integration-app/react";
import type { NodeDialogProps, WorkflowNode, Action } from '../types/workflow';
import { getIntegrationName } from '../utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';

export function NodeDialog({ mode, node, open, onClose, onSubmit }: NodeDialogProps) {
  const { connections, loading: isLoadingConnections } = useConnections();
  const integrationApp = useIntegrationApp();
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isLoadingActionSchema, setIsLoadingActionSchema] = useState(false);
  const [formData, setFormData] = useState<Omit<WorkflowNode, 'id'>>({
    name: '',
    integrationKey: '',
    connectionId: '',
    actionKey: '',
    inputMapping: {},
    type: 'action',
    flowKey: ''
  });

  // Update useAction to use undefined instead of null
  const { action } = useAction(
    formData.actionKey && formData.integrationKey
      ? {
        key: formData.actionKey,
        integrationKey: formData.integrationKey,
      }
      : undefined
  );
  // Add integrationOptions
  const integrationOptions = connections?.map(conn => ({
    value: conn.id,
    label: conn.name || conn.integration?.key || ''
  })) || [];

  // Add handleIntegrationChange
  const handleIntegrationChange = async (connectionId: string) => {
    // Skip if placeholder is selected
    if (connectionId === "placeholder") {
      setFormData(prev => ({
        ...prev,
        connectionId: '',
        integrationKey: '',
        actionKey: ''
      }));
      return;
    }

    const connection = connections?.find(conn => conn.id === connectionId);
    const integrationKey = connection?.integration?.key || '';

    setFormData(prev => ({
      ...prev,
      connectionId,
      integrationKey,
      actionKey: ''
    }));

    try {
      setIsLoadingActions(true);
      const actionsList = await integrationApp
        .integration(integrationKey)
        .actions
        .list();
      setActions(actionsList);
    } catch (error) {
      console.error('Failed to load actions:', error);
    } finally {
      setIsLoadingActions(false);
    }
  };

  // Add handleActionChange
  const handleActionChange = async (actionKey: string) => {
    // Skip if placeholder is selected
    if (actionKey === "placeholder") {
      setFormData(prev => ({ ...prev, actionKey: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, actionKey }));
    const action = actions.find(a => a.key === actionKey);
    if (!formData.name && action) {
      setFormData(prev => ({
        ...prev,
        actionKey,
        name: `${getIntegrationName(connections?.find(c => c.id === prev.connectionId))} ${action.name || action.key}`
      }));
    }

    // Set loading state for action schema
    setIsLoadingActionSchema(true);
    try {
      // Simulate a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsLoadingActionSchema(false);
    }
  };

  // Initialize form data based on mode
  useEffect(() => {
    if (open) {
      setFormData(mode === 'configure' && node ? {
        name: node.name,
        integrationKey: node.integrationKey,
        connectionId: node.connectionId,
        actionKey: node.actionKey,
        inputMapping: node.inputMapping,
        type: 'action',
        flowKey: node.flowKey || ''
      } : {
        name: '',
        integrationKey: '',
        connectionId: '',
        actionKey: '',
        inputMapping: {},
        type: 'action',
        flowKey: ''
      });
      setActions([]);
    }
  }, [open, mode, node]);

  // ... rest of the dialog logic ...

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] w-[800px] max-h-[90vh] flex flex-col p-0 overflow-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{mode === 'configure' ? 'Edit Node' : 'Add Node'}</DialogTitle>
          <DialogDescription>
            {mode === 'configure'
              ? 'Modify the settings for this workflow node.'
              : 'Configure a new node for your workflow.'}
          </DialogDescription>
        </DialogHeader>
        {/* <DropdownPortalBoundary> */}
        <div>
          <div className="flex-1 overflow-y-auto px-6 relative z-0">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
              {mode === 'create' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Integration</label>
                    <Select
                      value={formData.connectionId || "placeholder"}
                      onValueChange={handleIntegrationChange}
                      disabled={isLoadingConnections}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Integration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Select Integration</SelectItem>
                        {integrationOptions.map(option => (
                          <SelectItem key={`integration-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Action</label>
                    <Select
                      value={formData.actionKey || "placeholder"}
                      onValueChange={handleActionChange}
                      disabled={isLoadingActions || !formData.connectionId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Select Action</SelectItem>
                        {actions.map(action => (
                          <SelectItem key={`action-${action.key}`} value={action.key}>
                            {action.name || action.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Integration</label>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm text-gray-500">
                      {formData.integrationKey}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Action</label>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm text-gray-500">
                      {formData.actionKey}
                    </div>
                  </div>
                </>
              )}
              {action?.inputSchema && formData.connectionId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Input Schema</label>
                  {isLoadingActionSchema ? (
                    <div className="space-y-2">
                      <div className="h-10 w-full rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
                      <div className="h-10 w-full rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
                      <div className="h-10 w-full rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    </div>
                  ) : (
                    <IntegrationAppClientProvider client={integrationApp}>
                      <IntegrationElementProvider
                        integrationId={formData.integrationKey}
                        connectionId={formData.connectionId}
                      >
                        <DataInput
                          schema={action?.inputSchema}
                          value={formData.inputMapping}
                          onChange={(value) => setFormData(prev => ({
                            ...prev,
                            inputMapping: value
                          }))}
                        />
                      </IntegrationElementProvider>
                    </IntegrationAppClientProvider>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-auto border-t bg-white dark:bg-gray-950 p-6 relative ">
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => onSubmit(formData)}
                disabled={!formData.name || (mode === 'create' && (!formData.connectionId || !formData.actionKey))}
              >
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
        {/* </DropdownPortalBoundary> */}

      </DialogContent>
    </Dialog>
  );
} 