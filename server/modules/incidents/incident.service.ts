import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { incidents, Incident, INCIDENT_STATUSES, IncidentStatus, NewIncident } from '../../db/schema/incidents.ts';
import { auditService } from '../audit/audit.service.ts';
import { incidentEventsService, statusToEventType } from './incident.events.ts';

/**
 * Incident lifecycle service (Story 13.1).
 * Declaration, validated status machine, and read queries.
 * SLA computation lives in incident.sla.ts (Story 13.2);
 * timeline events in Story 13.3 — this file stays the lifecycle authority.
 */

/** Forward-only, single-step lifecycle (AC 13.1.3). */
export const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus | null> = {
  INVESTIGATING: 'IDENTIFIED',
  IDENTIFIED: 'MONITORING',
  MONITORING: 'MITIGATED',
  MITIGATED: 'RESOLVED',
  RESOLVED: null,
};

export class InvalidTransitionError extends Error {
  constructor(public from: IncidentStatus, public to: IncidentStatus) {
    super(`Invalid incident status transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export class IncidentNotFoundError extends Error {
  constructor() {
    super('Incident not found');
    this.name = 'IncidentNotFoundError';
  }
}

/** Pure state-machine check — exported for tests and the SLA/UI layer. */
export function canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  return INCIDENT_TRANSITIONS[from] === to;
}

export interface DeclareIncidentInput {
  title: string;
  severity: string;
  environment: string;
  serverName?: string;
  impact: string;
  relatedTicketCode?: string;
  runbookUrl?: string;
  detectedAt?: Date;
}

export class IncidentService {
  /**
   * Declares an incident with a unique sequential INC-NNNNN code (AC 13.1.2).
   */
  async declare(input: DeclareIncidentInput, actor: { userId?: string; name: string }, correlationId = 'system'): Promise<Incident> {
    // Sequential unique code inside a transaction to avoid races
    const code = await db.transaction(async (tx) => {
      const latest = await tx
        .select({ code: incidents.code })
        .from(incidents)
        .orderBy(desc(incidents.code))
        .limit(1);
      const lastNumber = latest.length > 0 ? Number.parseInt(latest[0].code.split('-')[1], 10) : 0;
      return `INC-${String(lastNumber + 1).padStart(5, '0')}`;
    });

    const rows = await db
      .insert(incidents)
      .values({
        code,
        title: input.title,
        severity: input.severity,
        environment: input.environment,
        serverName: input.serverName ?? '—',
        impact: input.impact,
        commanderUserId: actor.userId ?? null,
        commanderName: actor.name,
        relatedTicketCode: input.relatedTicketCode ?? null,
        runbookUrl: input.runbookUrl ?? null,
        status: 'INVESTIGATING',
        detectedAt: input.detectedAt ?? new Date(),
      } satisfies NewIncident)
      .returning();

    const created = rows[0];

    // Story 13.3 (AC #2): declaration opens the timeline with an alert event
    await incidentEventsService.record({
      incidentId: created.id,
      type: 'alert',
      message: `Incident ${code} declared: ${input.title}`,
      actorName: actor.name,
      actorUserId: actor.userId ?? null,
      correlationId,
    }).catch(() => undefined);

    await auditService.logEvent({
      actorId: actor.userId ?? 'system',
      actorName: actor.name,
      action: 'INCIDENT_DECLARED',
      targetEntity: 'incidents',
      targetId: created.id,
      details: { code, severity: input.severity, environment: input.environment },
      correlationId,
    }).catch(() => undefined);

    return created;
  }

  /**
   * Applies one validated lifecycle step (AC 13.1.3). Server-authoritative:
   * skips and backwards moves are rejected. acknowledgedAt is stamped on the
   * first IDENTIFIED transition (consumed by the SLA engine, Story 13.2);
   * resolvedAt is stamped on RESOLVED.
   */
  async transition(
    incidentId: string,
    toStatus: IncidentStatus,
    actor: { userId?: string; name: string },
    correlationId = 'system',
    now: Date = new Date()
  ): Promise<Incident> {
    const existing = await db.select().from(incidents).where(eq(incidents.id, incidentId)).limit(1);
    if (existing.length === 0) throw new IncidentNotFoundError();

    const from = existing[0].status as IncidentStatus;
    if (!canTransition(from, toStatus)) throw new InvalidTransitionError(from, toStatus);

    const patch: Partial<NewIncident> = { status: toStatus, updatedAt: now };
    if (toStatus === 'IDENTIFIED' && !existing[0].acknowledgedAt) patch.acknowledgedAt = now;
    if (toStatus === 'RESOLVED') patch.resolvedAt = now;

    const updated = await db.update(incidents).set(patch).where(eq(incidents.id, incidentId)).returning();

    // Story 13.3 (AC #2): every transition writes an immutable timeline event
    await incidentEventsService.record({
      incidentId,
      type: statusToEventType(toStatus),
      message: `Status changed ${from} → ${toStatus}`,
      actorName: actor.name,
      actorUserId: actor.userId ?? null,
      correlationId,
    }).catch(() => undefined);

    await auditService.logEvent({
      actorId: actor.userId ?? 'system',
      actorName: actor.name,
      action: 'INCIDENT_STATUS_CHANGED',
      targetEntity: 'incidents',
      targetId: incidentId,
      details: { code: existing[0].code, from, to: toStatus },
      correlationId,
    }).catch(() => undefined);

    return updated[0];
  }

  async list(filters: { status?: string; severity?: string; page?: number; limit?: number }): Promise<{ items: Incident[]; page: number; limit: number; total: number }> {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);

    const conditions = [];
    if (filters.status) conditions.push(eq(incidents.status, filters.status));
    if (filters.severity) conditions.push(eq(incidents.severity, filters.severity));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(incidents)
      .where(where)
      .orderBy(desc(incidents.detectedAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(where);

    return { items, page, limit, total: Number(totalRows[0]?.count ?? 0) };
  }

  async byId(id: string): Promise<Incident | null> {
    const rows = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }
}

export const incidentService = new IncidentService();
void INCIDENT_STATUSES;
