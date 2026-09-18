import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { Ticket } from '../../types.ts';

export function useTickets(projectId?: string) {
  return useQuery({
    queryKey: ['tickets', projectId],
    queryFn: () => {
      const url = projectId ? `/api/v1/tickets?projectId=${projectId}` : '/api/v1/tickets';
      return apiRequest<Ticket[]>(url);
    },
    staleTime: 30000,
  });
}

export function useTriageTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assigneeId, priority, status }: { id: string; assigneeId?: string; priority?: string; status?: string }) =>
      apiRequest<Ticket>(`/api/v1/tickets/${id}/triage`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId, priority, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['myWork'] });
    },
  });
}
