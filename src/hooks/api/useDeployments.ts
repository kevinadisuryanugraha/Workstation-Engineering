import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { Deployment } from '../../types.ts';

/**
 * Story 18.2 (CC-5) — Deployments client hook + DTO→UI mapper.
 *
 * Sumber data nyata: GET /api/v1/deployments (Story 6.1, endpoint eksisting
 * — TIDAK diubah story ini). Mapper pure & testable; field tampilan tanpa
 * padanan API memakai placeholder JUJUR, bukan nilai fabricated.
 */

export interface DeploymentDto {
  id: string;
  projectId: string;
  environment: string; // DEV | STAGING | PRODUCTION (| UAT)
  serverName: string;
  version: string;
  commitSha: string | null;
  status: string; // PENDING | IN_PROGRESS | SUCCESS | FAILED | ROLLED_BACK
  deployedBy: string;
  rollbackReason: string | null;
  startedAt: string;
  completedAt: string | null;
}

const ENV_MAP: Record<string, Deployment['environment']> = {
  DEV: 'Development',
  STAGING: 'Staging',
  UAT: 'UAT',
  PRODUCTION: 'Production',
};

const STATUS_MAP: Record<string, Deployment['status']> = {
  PENDING: 'RUNNING',
  IN_PROGRESS: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK',
};

export function mapDeploymentDto(dto: DeploymentDto): Deployment {
  return {
    id: dto.id,
    // Kode tampilan diturunkan dari id nyata (stabil, bukan karangan).
    code: `DEP-${dto.id.slice(0, 4).toUpperCase()}`,
    projectId: dto.projectId,
    environment: ENV_MAP[dto.environment] ?? 'Staging',
    server: dto.serverName,
    version: dto.version,
    commitSha: dto.commitSha ?? '',
    actor: dto.deployedBy,
    startedAt: dto.startedAt,
    completedAt: dto.completedAt ?? '',
    status: STATUS_MAP[dto.status] ?? 'RUNNING',
    // Deployment gates belum dimodelkan di DB — kosong jujur.
    gates: [],
    logsSummary: dto.rollbackReason ?? '',
  };
}

export function useDeployments(projectId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['deployments', projectId],
    queryFn: () =>
      apiRequest<DeploymentDto[]>(
        projectId ? `/api/v1/deployments?projectId=${projectId}` : '/api/v1/deployments'
      ),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}
