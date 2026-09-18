import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';

/**
 * Story 13.3 — Live incident feed for the Incident Room.
 */

export interface IncidentSlaDimension {
  targetMinutes: number;
  status: 'PENDING' | 'MET' | 'BREACHED';
  actualMinutes: number | null;
  overdueMinutes: number;
}

export interface IncidentSla {
  response: IncidentSlaDimension;
  resolution: IncidentSlaDimension;
}

export interface IncidentDto {
  id: string;
  code: string;
  title: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  environment: 'Production' | 'Staging';
  serverName: string;
  impact: string;
  commanderName: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'MITIGATED' | 'RESOLVED';
  relatedTicketCode: string | null;
  detectedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  sla: IncidentSla;
}

export interface IncidentEventDto {
  id: string;
  incidentId: string;
  type: 'alert' | 'action' | 'mitigation' | 'resolution' | 'note';
  message: string;
  actorName: string;
  createdAt: string;
}

export function useIncidents(options: { enabled?: boolean; refetchIntervalMs?: number } = {}) {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: () =>
      apiRequest<{ items: IncidentDto[]; page: number; limit: number; total: number }>('/api/v1/incidents?limit=50'),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs ?? 30_000,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useIncidentEvents(incidentId: string | null, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['incidentEvents', incidentId],
    queryFn: () => apiRequest<{ events: IncidentEventDto[]; count: number }>(`/api/v1/incidents/${incidentId}/events`),
    enabled: (options.enabled ?? true) && Boolean(incidentId),
    staleTime: 10_000,
  });
}
