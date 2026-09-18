import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { WorkItem, Ticket } from '../../types.ts';

export interface MyWorkFeed {
  userId: string;
  userName: string;
  role: string;
  workItems: WorkItem[];
  tickets: Ticket[];
  recentActivity: any[];
  summary: {
    activeWorkItemsCount: number;
    activeTicketsCount: number;
  };
}

export function useMyWork(projectId?: string) {
  return useQuery({
    queryKey: ['myWork', projectId],
    queryFn: () => {
      const url = projectId ? `/api/v1/my-work?projectId=${projectId}` : '/api/v1/my-work';
      return apiRequest<MyWorkFeed>(url);
    },
    staleTime: 15000,
  });
}
