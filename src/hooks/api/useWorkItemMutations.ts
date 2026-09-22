import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { WorkItemStatus, WorkItemType } from '../../types.ts';

/**
 * Story 24.1 (CC-9) — Work Item CRUD Mutations Hooks.
 *
 * Mengirim pembuatan & pembaruan work item langsung ke REST API PostgreSQL
 * dan menginvalidasi query cache `workItems` saat sukses.
 */

export interface CreateWorkItemPayload {
  projectId: string;
  title: string;
  description?: string;
  type?: WorkItemType | string;
  priority?: string;
  status?: WorkItemStatus | string;
  estimateHours?: number;
  assigneeId?: string | null;
}

export interface UpdateWorkItemPayload {
  title?: string;
  description?: string;
  type?: WorkItemType | string;
  priority?: string;
  status?: WorkItemStatus | string;
  estimateHours?: number;
  assigneeId?: string | null;
}

export function useCreateWorkItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkItemPayload) =>
      apiRequest<any>('/api/v1/work-items', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
    },
  });
}

export function useUpdateWorkItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWorkItemPayload }) =>
      apiRequest<any>(`/api/v1/work-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
    },
  });
}
