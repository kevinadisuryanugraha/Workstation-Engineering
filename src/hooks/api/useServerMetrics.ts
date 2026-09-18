import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';

/**
 * Story 9.3 — Server health data hook.
 * Reads agent telemetry ingested by the Workstation Linux Server Agent (Epic 9).
 */

export interface ServerMetricLatest {
  cpuUsage: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryFree: number;
  disks: Array<{ filesystem?: string; mount?: string; total: number; used: number; available?: number; usePercent?: number }>;
  recordedAt: string;
}

export interface ServerHealthEntry {
  serverName: string;
  stale: boolean;
  latest: ServerMetricLatest;
}

export interface ServerHealthFeed {
  servers: ServerHealthEntry[];
  count: number;
}

export function useServerMetrics(options: { enabled?: boolean; refetchIntervalMs?: number } = {}) {
  return useQuery({
    queryKey: ['serverMetrics'],
    queryFn: () => apiRequest<ServerHealthFeed>('/api/v1/server-metrics'),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs ?? 30_000,
    staleTime: 15_000,
    retry: 1,
  });
}
