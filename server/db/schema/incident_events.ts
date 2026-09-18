import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * Append-only incident timeline (Story 13.3 / ADR-007 pattern).
 * Rows are only ever INSERTED — there is no update or delete code path.
 */
export const INCIDENT_EVENT_TYPES = ['alert', 'action', 'mitigation', 'resolution', 'note'] as const;
export type IncidentEventType = (typeof INCIDENT_EVENT_TYPES)[number];

export const incidentEvents = pgTable('incident_events', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  incidentId: varchar('incident_id', { length: 36 }).notNull(),
  type: varchar('type', { length: 15 }).notNull(), // alert | action | mitigation | resolution | note
  message: varchar('message', { length: 500 }).notNull(),
  actorName: varchar('actor_name', { length: 150 }).notNull(),
  actorUserId: varchar('actor_user_id', { length: 36 }),
  correlationId: varchar('correlation_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('incident_events_incident_created_idx').on(table.incidentId, table.createdAt),
]);

export type IncidentEvent = typeof incidentEvents.$inferSelect;
export type NewIncidentEvent = typeof incidentEvents.$inferInsert;
