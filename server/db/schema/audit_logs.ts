import { pgTable, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * Immutable Append-Only Audit Trail (ADR-007, Story 7.1)
 * This table records all sensitive system mutations and is append-only (no update/delete).
 */
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: varchar('actor_id', { length: 36 }).notNull(),
  actorName: varchar('actor_name', { length: 150 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  targetEntity: varchar('target_entity', { length: 50 }).notNull(),
  targetId: varchar('target_id', { length: 100 }).notNull(),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  correlationId: varchar('correlation_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('audit_logs_actor_idx').on(table.actorId),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_created_at_idx').on(table.createdAt),
  index('audit_logs_correlation_idx').on(table.correlationId),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
