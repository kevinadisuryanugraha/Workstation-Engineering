import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { incidentEvents, IncidentEvent, NewIncidentEvent } from '../../db/schema/incident_events.ts';

/**
 * Incident timeline service (Story 13.3).
 * Append-only: rows are only inserted — no update/delete API or code path exists.
 */

export interface RecordEventInput {
  incidentId: string;
  type: NewIncidentEvent['type'];
  message: string;
  actorName: string;
  actorUserId?: string | null;
  correlationId?: string;
}

export class IncidentEventsService {
  /** Appends one immutable timeline event (AC 13.3.1). */
  async record(input: RecordEventInput): Promise<IncidentEvent> {
    const rows = await db
      .insert(incidentEvents)
      .values({
        incidentId: input.incidentId,
        type: input.type,
        message: input.message,
        actorName: input.actorName,
        actorUserId: input.actorUserId ?? null,
        correlationId: input.correlationId ?? 'system',
      })
      .returning();
    return rows[0];
  }

  /** Chronological timeline for one incident (AC 13.3.3) — strictly scoped by incidentId. */
  async list(incidentId: string): Promise<IncidentEvent[]> {
    return db
      .select()
      .from(incidentEvents)
      .where(eq(incidentEvents.incidentId, incidentId))
      .orderBy(asc(incidentEvents.createdAt));
  }
}

export const incidentEventsService = new IncidentEventsService();

/** Maps a lifecycle status to its timeline event type (AC 13.3.2). */
export function statusToEventType(status: string): 'action' | 'mitigation' | 'resolution' {
  if (status === 'MITIGATED') return 'mitigation';
  if (status === 'RESOLVED') return 'resolution';
  return 'action';
}
