import { ensureAuth } from './auth';
import { DataSchema } from '@integration-app/sdk';

export const getAuthHeaders = () => {
  const auth = ensureAuth();
  return {
    'x-auth-id': auth.customerId,
    'x-customer-name': auth.customerName || '',
    'token': auth.token
  };
};

export const authenticatedFetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export const updateNodeOutputSchema = async (
  workflowId: string,
  nodeId: string,
  outputSchema: DataSchema,
  executionStatus: 'pending' | 'running' | 'completed' | 'failed' = 'completed'
) => {
  const res = await fetch(`/api/workflows/${workflowId}/nodes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      nodeId,
      outputSchema,
      executionStatus,
      lastExecutedAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const error = new Error('Failed to update node output schema') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json();
}; 