import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { EngineeringEvent } from '../../types.ts';

/**
 * Story 18.4 (CC-5) — Audit ledger client hook + DTO→event-feed adapter.
 *
 * Sumber data nyata: GET /api/v1/audit-logs (Story 7.2, append-only ADR-007).
 * Adapter memetakan log audit (bahasa sistem) ke kontrak feed UI
 * `EngineeringEvent` — aksi yang tak dikenali dipetakan jujur ke
 * `SYSTEM_AUDIT`, bukan dipaksakan ke kategori lain.
 */

export interface AuditLogDto {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: unknown;
  ipAddress: string | null;
  correlationId: string;
  createdAt: string;
}

/** Petakan action audit ke tipe event UI yang paling dekat; sisanya SYSTEM_AUDIT. */
export function mapAuditType(action: string): EngineeringEvent['type'] {
  const a = action.toUpperCase();
  if (a.includes('TICKET')) return a.includes('RESOLVED') ? 'TICKET_RESOLVED' : 'TICKET_CREATED';
  if (a.includes('TASK') || a.includes('WORK_ITEM') || a.includes('WORK-ITEM')) return 'TASK_UPDATED';
  if (a.includes('ROLLBACK') || a.includes('DEPLOY')) return 'DEPLOYMENT_SUCCESS';
  if (a.includes('INCIDENT')) return a.includes('RESOLVED') ? 'INCIDENT_RESOLVED' : 'INCIDENT_TRIGGERED';
  if (a.includes('AI_') || a.includes('SCAN')) return 'AI_SCAN_COMPLETED'; // "AI_" — bukan "AI" polos ("FAILED" mengandung "AI"!)
  if (a.includes('RELEASE')) return 'RELEASE_CREATED';
  if (a.includes('COMMIT') || a.includes('PUSH')) return 'CODE_COMMITTED';
  if (a.startsWith('PR') || a.includes('_PR_') || a.includes('PULL_REQUEST')) return 'PR_CREATED';
  return 'SYSTEM_AUDIT';
}

export function mapAuditLogDto(dto: AuditLogDto): EngineeringEvent {
  return {
    id: dto.id,
    type: mapAuditType(dto.action),
    actor: dto.actorName,
    source: 'audit-log',
    timestamp: dto.createdAt,
    title: `${dto.action} → ${dto.targetEntity}`,
    descriptionTechnical: `${dto.targetEntity}#${dto.targetId} · correlation ${dto.correlationId}`,
    descriptionManagement: `Aksi ${dto.action} oleh ${dto.actorName} pada ${dto.targetEntity}.`,
    evidenceRef: dto.correlationId,
  };
}

export interface AuditLogsPayload {
  items: AuditLogDto[];
  meta: { page: number; limit: number; total: number };
}

export function useAuditLogs(
  params: { page?: number; limit?: number } = {},
  options: { enabled?: boolean } = {}
) {
  const { page = 1, limit = 50 } = params;
  return useQuery({
    queryKey: ['auditLogs', page, limit],
    queryFn: () => apiRequest<AuditLogsPayload>(`/api/v1/audit-logs?page=${page}&limit=${limit}`),
    enabled: options.enabled ?? true,
    staleTime: 15_000,
  });
}
