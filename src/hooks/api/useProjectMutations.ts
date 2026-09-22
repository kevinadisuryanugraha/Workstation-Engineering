import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { Project } from '../../types.ts';

export interface CreateProjectPayload {
  name: string;
  key: string;
  tagline?: string;
  description?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'AT_RISK' | 'COMPLETED' | 'ARCHIVED';
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      apiRequest<any>('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
