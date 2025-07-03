import type { Action } from './types/workflow';

export const getActionName = (action: Action | undefined) => {
  return action?.name || action?.key || '';
};

export const getIntegrationName = (connection: any) => {
  return connection?.name || connection?.integration?.key || '';
}; 