import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { TicketStatus, TicketType } from '../../types.ts';

/**
 * Story 24.1 (CC-9) — Ticket CRUD Mutations Hooks.
 *
 * Mengirim pembuatan & pembaruan tiket langsung ke REST API PostgreSQL
 * dan menginvalidasi query cache `tickets` saat sukses.
 */

export interface CreateTicketPayload {
  projectId: string;
  title: string;
  description?: string;
  type?: TicketType | string;
  severity?: string;
  priority?: string;
  assigneeId?: string | null;
}

export interface UpdateTicketPayload {
  status?: TicketStatus | string;
  priority?: string;
  severity?: string;
  assigneeId?: string | null;
  resolution?: string;
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      apiRequest<any>('/api/v1/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketPayload }) => {
      if (payload.status === 'RESOLVED' || payload.status === 'CLOSED') {
        return apiRequest<any>(`/api/v1/tickets/${id}/resolve`, {
          method: 'POST',
          body: JSON.stringify({ resolution: payload.resolution || 'Resolved via WORKSTATION desk' }),
        });
      }
      return apiRequest<any>(`/api/v1/tickets/${id}/triage`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
