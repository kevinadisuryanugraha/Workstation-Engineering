import { pgTable, varchar, timestamp, index, uniqueIndex, doublePrecision, jsonb } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * Server telemetry samples ingested from Workstation Linux Agent daemons (Epic 9).
 * One row per (serverName, recordedAt) — unique pair makes agent retry batches idempotent.
 */
export const serverMetrics = pgTable('server_metrics', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  serverName: varchar('server_name', { length: 150 }).notNull(),
  cpuUsage: doublePrecision('cpu_usage').notNull(), // percent 0-100
  memoryTotal: doublePrecision('memory_total').notNull(), // bytes
  memoryUsed: doublePrecision('memory_used').notNull(), // bytes
  memoryFree: doublePrecision('memory_free').notNull(), // bytes
  disks: jsonb('disks').notNull(), // [{ filesystem, mount, total, used, available, usePercent }]
  // Story 11.2 — service probe results (nullable for backward compatibility with pre-11 rows)
  services: jsonb('services'), // [{ name, kind, target, healthy, latencyMs, checkedAt }]
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('server_metrics_server_recorded_uq').on(table.serverName, table.recordedAt),
  index('server_metrics_server_recorded_idx').on(table.serverName, table.recordedAt),
]);

export type ServerMetric = typeof serverMetrics.$inferSelect;
export type NewServerMetric = typeof serverMetrics.$inferInsert;
