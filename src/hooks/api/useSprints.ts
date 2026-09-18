import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';

/**
 * Story 14.2 — Sprint board & list hooks.
 */

export interface SprintSummary {
  sprint: {
    id: string;
    name: string;
    goal: string | null;
    status: 'PLANNED' | 'ACTIVE' | 'CLOSED';
    startDate: string | null;
    endDate: string | null;
  };
  completionPercent: number;
  itemCount: number;
}

export function useProjectSprints(projectId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['projectSprints', projectId],
    queryFn: () => apiRequest<{ sprints: SprintSummary[]; count: number }>(`/api/v1/sprints/project/${projectId}`),
    enabled: (options.enabled ?? true) && Boolean(projectId),
    staleTime: 20_000,
  });
}
