import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { WorkItem, WorkItemStatus } from '../../types.ts';

export function useWorkItems(projectId?: string) {
  return useQuery({
    queryKey: ['workItems', projectId],
    queryFn: () => {
      const url = projectId ? `/api/v1/work-items?projectId=${projectId}` : '/api/v1/work-items';
      return apiRequest<WorkItem[]>(url);
    },
    staleTime: 30000,
  });
}

export function useUpdateWorkItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, overrideReason }: { id: string; status: WorkItemStatus; overrideReason?: string }) =>
      apiRequest<WorkItem>(`/api/v1/work-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, overrideReason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: ['myWork'] });
    },
  });
}
