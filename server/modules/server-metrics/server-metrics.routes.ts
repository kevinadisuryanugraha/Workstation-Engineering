import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { agentAuth } from '../../middlewares/agentAuth.ts';
import { serverMetricsService, ValidationError } from './server-metrics.service.ts';
import { safeAsync } from '../../middlewares/safeAsync.ts';

/**
 * Server metrics routes (Story 9.2 / Story 9.3).
 *
 * - POST /api/v1/agent/metrics        → agent-token auth (shared secret, no JWT)
 * - GET  /api/v1/server-metrics       → RBAC PERM_SERVER_TELEMETRY (Developer+)
 * - GET  /api/v1/server-metrics/:serverName/history → RBAC PERM_SERVER_TELEMETRY
 */

const DEFAULT_AGENT_INTERVAL_MS = 60_000;
const MAX_HISTORY_HOURS = 168;

export const serverMetricsRouter = Router();
export const agentIngestRouter = Router();

// ===== Agent ingestion (bearer token shared secret) =====
agentIngestRouter.post('/metrics', agentAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as { samples?: unknown } | unknown[];
    const samples = Array.isArray(body) ? body : body?.samples;
    const result = await serverMetricsService.ingestBatch(Array.isArray(samples) ? samples : []);
    return res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: 'INGEST_FAILED', message: 'Failed to persist telemetry batch' },
      timestamp: new Date().toISOString(),
    });
  }
});

// ===== Read APIs (RBAC-protected) =====
serverMetricsRouter.get('/', requirePermission('PERM_SERVER_TELEMETRY'), safeAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const staleAfterMs = Number.parseInt(process.env.AGENT_INTERVAL_SECONDS || '', 10) > 0
    ? Number.parseInt(process.env.AGENT_INTERVAL_SECONDS!, 10) * 2 * 1000
    : DEFAULT_AGENT_INTERVAL_MS * 2;

  const servers = await serverMetricsService.latestPerServer(staleAfterMs);
  return res.json({
    success: true,
    data: {
      servers: servers.map(({ serverName, latest, stale }) => ({
        serverName,
        stale,
        latest: {
          cpuUsage: latest.cpuUsage,
          memoryTotal: latest.memoryTotal,
          memoryUsed: latest.memoryUsed,
          memoryFree: latest.memoryFree,
          disks: latest.disks,
          services: (latest.services as unknown) ?? [], // Story 11.2 (AC #3): legacy rows -> []
          recordedAt: latest.recordedAt,
        },
      })),
      count: servers.length,
    },
    timestamp: new Date().toISOString(),
  });
}));

serverMetricsRouter.get('/:serverName/history', requirePermission('PERM_SERVER_TELEMETRY'), safeAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { serverName } = req.params;
  let hours = Number.parseInt((req.query.hours as string) || '24', 10);
  if (!Number.isFinite(hours) || hours <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'hours must be a positive integer' },
      timestamp: new Date().toISOString(),
    });
  }
  hours = Math.min(hours, MAX_HISTORY_HOURS);

  const to = new Date();
  const from = new Date(to.getTime() - hours * 3600 * 1000);
  const samples = await serverMetricsService.history(serverName, from, to);

  return res.json({
    success: true,
    data: {
      serverName,
      from: from.toISOString(),
      to: to.toISOString(),
      hours,
      samples,
      count: samples.length,
    },
    timestamp: new Date().toISOString(),
  });
}));
