import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { serverMetrics, NewServerMetric, ServerMetric } from '../../db/schema/server_metrics.ts';

/**
 * Server metrics service (Story 9.2) — ingestion + read queries for agent telemetry.
 */

export interface ServiceProbeInput {
  name: string;
  kind: 'http' | 'tcp';
  target: string;
  healthy: boolean;
  latencyMs: number | null;
  checkedAt: string;
}

export interface AgentSample {
  serverName: string;
  cpu: number;
  memory: { total: number; used: number; free: number };
  disks: Array<{ filesystem?: string; mount?: string; total: number; used: number; available?: number; usePercent?: number }>;
  recordedAt: string;
  services?: ServiceProbeInput[]; // Story 11.2 — optional for agent backward compatibility
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validates a single agent sample; throws ValidationError on any contract breach. */
export function validateAgentSample(raw: unknown): AgentSample {
  const s = raw as Record<string, any>;
  if (!s || typeof s !== 'object') throw new ValidationError('Sample must be an object');
  if (typeof s.serverName !== 'string' || s.serverName.trim().length === 0 || s.serverName.length > 150) {
    throw new ValidationError('serverName is required (1-150 chars)');
  }
  if (!isFiniteNumber(s.cpu) || s.cpu < 0 || s.cpu > 100) {
    throw new ValidationError('cpu must be a number between 0 and 100');
  }
  const memory = s.memory || {};
  if (!isFiniteNumber(memory.total) || memory.total < 0) throw new ValidationError('memory.total must be a non-negative number');
  if (!isFiniteNumber(memory.used) || memory.used < 0) throw new ValidationError('memory.used must be a non-negative number');
  if (!isFiniteNumber(memory.free) || memory.free < 0) throw new ValidationError('memory.free must be a non-negative number');
  if (!Array.isArray(s.disks)) throw new ValidationError('disks must be an array');
  for (const d of s.disks) {
    if (!isFiniteNumber(d.total) || d.total < 0) throw new ValidationError('disk.total must be a non-negative number');
    if (!isFiniteNumber(d.used) || d.used < 0) throw new ValidationError('disk.used must be a non-negative number');
  }
  // Story 11.2 — optional services validation (AC #2)
  let services: ServiceProbeInput[] | undefined;
  if (s.services !== undefined) {
    if (!Array.isArray(s.services)) throw new ValidationError('services must be an array when present');
    services = s.services.map((raw: any) => {
      if (!raw || typeof raw !== 'object') throw new ValidationError('each service must be an object');
      if (typeof raw.name !== 'string' || raw.name.trim().length === 0) throw new ValidationError('service.name is required');
      if (raw.kind !== 'http' && raw.kind !== 'tcp') throw new ValidationError('service.kind must be http or tcp');
      if (typeof raw.target !== 'string' || raw.target.trim().length === 0) throw new ValidationError('service.target is required');
      if (typeof raw.healthy !== 'boolean') throw new ValidationError('service.healthy must be a boolean');
      if (raw.latencyMs !== null && !isFiniteNumber(raw.latencyMs)) throw new ValidationError('service.latencyMs must be a number or null');
      if (typeof raw.checkedAt !== 'string' || Number.isNaN(Date.parse(raw.checkedAt))) throw new ValidationError('service.checkedAt must be a valid ISO timestamp');
      return { name: raw.name.trim(), kind: raw.kind, target: raw.target.trim(), healthy: raw.healthy, latencyMs: raw.latencyMs, checkedAt: raw.checkedAt };
    });
  }
  const recordedAt = typeof s.recordedAt === 'string' ? s.recordedAt : null;
  if (!recordedAt || Number.isNaN(Date.parse(recordedAt))) {
    throw new ValidationError('recordedAt must be a valid ISO 8601 timestamp');
  }
  return {
    serverName: s.serverName.trim(),
    cpu: s.cpu,
    memory: { total: memory.total, used: memory.used, free: memory.free },
    disks: s.disks,
    services,
    recordedAt,
  };
}

function toRow(sample: AgentSample): NewServerMetric {
  return {
    serverName: sample.serverName,
    cpuUsage: sample.cpu,
    memoryTotal: sample.memory.total,
    memoryUsed: sample.memory.used,
    memoryFree: sample.memory.free,
    disks: sample.disks,
    services: sample.services ?? [],
    recordedAt: new Date(sample.recordedAt),
  };
}

export class ServerMetricsService {
  /**
   * Persists a batch of samples atomically (AC 9.2.2).
   * Duplicate (serverName, recordedAt) pairs are skipped — agent retries are idempotent.
   */
  async ingestBatch(samples: unknown[]): Promise<{ inserted: number; skipped: number }> {
    if (!Array.isArray(samples) || samples.length === 0) {
      throw new ValidationError('Body must contain a non-empty "samples" array');
    }
    const validated = samples.map(validateAgentSample);

    const rows = await db.transaction(async (tx) => {
      return tx
        .insert(serverMetrics)
        .values(validated.map(toRow))
        .onConflictDoNothing({ target: [serverMetrics.serverName, serverMetrics.recordedAt] })
        .returning({ id: serverMetrics.id });
    });

    return { inserted: rows.length, skipped: validated.length - rows.length };
  }

  /** Latest sample per monitored server + freshness flag (stale = older than 2x interval). */
  async latestPerServer(staleAfterMs = 120_000): Promise<Array<{ serverName: string; latest: ServerMetric; stale: boolean }>> {
    const latestRows = await db
      .select()
      .from(serverMetrics)
      .orderBy(serverMetrics.serverName, desc(serverMetrics.recordedAt));

    const byServer = new Map<string, ServerMetric>();
    for (const row of latestRows) {
      if (!byServer.has(row.serverName)) byServer.set(row.serverName, row);
    }

    const now = Date.now();
    return Array.from(byServer.values()).map((latest) => ({
      serverName: latest.serverName,
      latest,
      stale: now - new Date(latest.recordedAt).getTime() > staleAfterMs,
    }));
  }

  /** Metric history for one server within a time window (AC 9.3.2). */
  async history(serverName: string, from: Date, to: Date): Promise<ServerMetric[]> {
    return db
      .select()
      .from(serverMetrics)
      .where(
        and(
          eq(serverMetrics.serverName, serverName),
          gte(serverMetrics.recordedAt, from),
          lte(serverMetrics.recordedAt, to)
        )
      )
      .orderBy(desc(serverMetrics.recordedAt))
      .limit(2000);
  }

  /** Number of distinct monitored servers (used by reports). */
  async countMonitoredServers(): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(distinct ${serverMetrics.serverName})` })
      .from(serverMetrics);
    return Number(rows[0]?.count ?? 0);
  }
}

export const serverMetricsService = new ServerMetricsService();
