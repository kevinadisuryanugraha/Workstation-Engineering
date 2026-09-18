import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';

/**
 * Story 10.2 — Bahasa Indonesia management report hook.
 */

export interface IdReportFeed {
  report: string;
  format: string;
  language: string;
  from: string;
  to: string;
  generatedAt: string;
  requestedBy?: string;
}

export function useIdReport(days: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['idReport', days],
    queryFn: () => apiRequest<IdReportFeed>(`/api/v1/reports/summary/text?days=${days}`),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
    retry: 1,
  });
}
