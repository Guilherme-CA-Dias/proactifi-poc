import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConnections, useIntegrationApp, useAction, IntegrationElementProvider, DataInput, IntegrationAppClientProvider } from "@integration-app/react";
import type { NodeDialogProps, WorkflowNode, Action } from '../types/workflow';
import { getIntegrationName } from '../utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { fetchIntegrationToken } from '@/lib/auth';
import { authenticatedFetcher } from '@/lib/fetch-utils';

export function NodeDialog({ mode, node, open, onClose, onSubmit, workflowNodes }: NodeDialogProps) {
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
    actionId: '',
    inputMapping: {},
    type: 'action',
    flowKey: ''
  });
  const [fieldMappings, setFieldMappings] = useState<any[]>([]);
  const [selectedFieldMapping, setSelectedFieldMapping] = useState<string>("");
  const [isLoadingFieldMappings, setIsLoadingFieldMappings] = useState(false);

  // Prepare variables for DataInput (outputs from previous nodes)
  const variablesSchema = (workflowNodes || [])
    .filter((n: WorkflowNode) => n.id !== node?.id) // Include both triggers and actions
    .reduce((acc: any, n: WorkflowNode) => {
      // Use the output mapping from the node if available
      if (n.outputMapping) {
        acc[n.id] = {
          ...n.outputMapping,
          title: `${n.name} (${n.type})`,
          description: `Output from ${n.name}`
        };
      }
      return acc;
    }, {});

  const variablesSchemaDataSchema = {
    type: 'object',
    properties: variablesSchema
  };

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
  const integrationOptions = connections?.map((conn: any) => ({
    value: conn.id,
    label: conn.name || conn.integration?.key || ''
  })) || [];

  // Add handleIntegrationChange
  const handleIntegrationChange = async (connectionId: string) => {
    // Skip if placeholder is selected
    if (connectionId === "placeholder") {
      setFormData((prev: any) => ({
        ...prev,
        connectionId: '',
        integrationKey: '',
        actionKey: ''
      }));
      return;
    }

    const connection = connections?.find((conn: any) => conn.id === connectionId);
    const integrationKey = connection?.integration?.key || '';

    setFormData((prev: any) => ({
      ...prev,
      connectionId,
      integrationKey,
      actionKey: ''
    }));

    // Fetch field mappings for the selected connection
    setIsLoadingFieldMappings(true);
    setFieldMappings([]);
    setSelectedFieldMapping("");
    try {
      if (integrationKey) {
        const token = await fetchIntegrationToken();
        const res = await fetch(`https://api.integration.app/integrations/${integrationKey}/field-mappings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const response = await res.json();
        const mappings = response?.items || response || [];
        setFieldMappings(Array.isArray(mappings) ? mappings : []);
      }
    } catch (error) {
      setFieldMappings([]);
    } finally {
      setIsLoadingFieldMappings(false);
    }

    try {
      setIsLoadingActions(true);
      const response = await integrationApp
        .integration(integrationKey)
        .actions
        .list();
      
      // Handle paginated response - extract items array
      const actionsList = response?.items || response || [];
      setActions(Array.isArray(actionsList) ? actionsList : []);
    } catch (error) {
      console.error('Failed to load actions:', error);
      // Set empty array on error to prevent map errors
      setActions([]);
    } finally {
      setIsLoadingActions(false);
    }
  };

  // Add handleActionChange
  const handleActionChange = async (actionKey: string) => {
    // Skip if placeholder is selected
    if (actionKey === "placeholder") {
      setFormData((prev: any) => ({ ...prev, actionKey: '', actionId: '', outputMapping: undefined }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, actionKey, actionId: '', outputMapping: undefined }));
    const foundAction = actions.find((a: Action) => a.key === actionKey);
    if (!formData.name && foundAction) {
      setFormData((prev: any) => ({
        ...prev,
        actionKey,
        actionId: foundAction.id,
        name: `${getIntegrationName(connections?.find((c: any) => c.id === prev.connectionId))} ${foundAction.name || foundAction.key}`
      }));
    }

    // Fetch and store the output schema for this action
    if (foundAction && foundAction.id && formData.connectionId) {
      try {
        const actionData = await integrationApp.action(foundAction.id).get();
        if (actionData.defaultOutputSchema) {
          setFormData((prev: any) => ({
            ...prev,
            actionId: foundAction.id,
            outputMapping: actionData.defaultOutputSchema
          }));
        }
      } catch (error) {
        console.error('Failed to fetch action output schema:', error);
      }
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
        actionId: node.actionId || '',
        inputMapping: node.inputMapping,
        outputMapping: node.outputMapping,
        type: 'action',
        flowKey: node.flowKey || ''
      } : {
        name: '',
        integrationKey: '',
        connectionId: '',
        actionKey: '',
        actionId: '',
        inputMapping: {},
        outputMapping: undefined,
        type: 'action',
        flowKey: ''
      });
      setActions([]);
      
      // Load actions if we're editing a node and have connection info
      if (mode === 'configure' && node && node.integrationKey && node.connectionId) {
        handleIntegrationChange(node.connectionId);
      }
    }
  }, [open, mode, node]);

  // Effect to fetch outputMapping for existing nodes when actions are loaded
  useEffect(() => {
    if (mode === 'configure' && node && formData.actionKey && formData.actionId && actions.length > 0 && !formData.outputMapping) {
      // Fetch the output schema for the existing action
      const fetchExistingActionSchema = async () => {
        try {
          const actionData = await integrationApp.action(formData.actionId).get();
          if (actionData.defaultOutputSchema) {
            setFormData((prev: any) => ({
              ...prev,
              outputMapping: actionData.defaultOutputSchema
            }));
          }
        } catch (error) {
          console.error('Failed to fetch existing action output schema:', error);
        }
      };
      
      fetchExistingActionSchema();
    }
  }, [mode, node, formData.actionKey, formData.actionId, actions.length, formData.outputMapping, integrationApp]);

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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
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
                        {integrationOptions.map((option: { value: string; label: string }) => (
                          <SelectItem key={`integration-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Field Mapping Dropdown and Button - moved above action selection */}
                  {formData.connectionId && !isLoadingFieldMappings && fieldMappings.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Field Mapping</label>
                      <Select
                        value={selectedFieldMapping || "placeholder"}
                        onValueChange={setSelectedFieldMapping}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Field Mapping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder">Select Field Mapping</SelectItem>
                          {fieldMappings.map((mapping: any) => (
                            <SelectItem key={mapping.key} value={mapping.key}>
                              {mapping.name || mapping.key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedFieldMapping && selectedFieldMapping !== "placeholder" && (
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={async () => {
                            await integrationApp
                              .connection(formData.connectionId)
                              .fieldMapping(selectedFieldMapping)
                              .openConfiguration();
                          }}
                        >
                          Open Field Mapping Configuration
                        </Button>
                      )}
                    </div>
                  )}
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
                        {Array.isArray(actions) && actions.map((action: Action) => (
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
                          onChange={(value: any) => setFormData((prev: any) => ({
                            ...prev,
                            inputMapping: value
                          }))}
                          variablesSchema={variablesSchemaDataSchema}
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
                onClick={() => {
                  onSubmit(formData);
                }}
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