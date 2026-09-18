import { pgTable, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * Incident management (Story 13.1 — Epic 13).
 * Severity & status vocabulary matches the client `Incident` contract
 * (src/types.ts) so the Incident Room UI consumes live data without rewrite.
 */

export const INCIDENT_SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'MITIGATED', 'RESOLVED'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const incidents = pgTable('incidents', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: varchar('code', { length: 15 }).notNull().unique(), // INC-00042
  title: varchar('title', { length: 200 }).notNull(),
  severity: varchar('severity', { length: 10 }).notNull(),
  environment: varchar('environment', { length: 20 }).notNull(), // Production | Staging
  serverName: varchar('server_name', { length: 150 }).notNull().default('—'),
  impact: varchar('impact', { length: 500 }).notNull(),
  commanderUserId: varchar('commander_user_id', { length: 36 }),
  commanderName: varchar('commander_name', { length: 150 }).notNull(),
  relatedTicketCode: varchar('related_ticket_code', { length: 30 }),
  runbookUrl: varchar('runbook_url', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('INVESTIGATING'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('incidents_status_idx').on(table.status),
  index('incidents_severity_idx').on(table.severity),
  uniqueIndex('incidents_code_uq').on(table.code),
]);

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
