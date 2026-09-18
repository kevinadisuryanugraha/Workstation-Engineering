import { pgTable, varchar, doublePrecision, uniqueIndex, index, text } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * AI recommendations (Story 16.3 — FR-020, Master PRD §11.3).
 * Conversion to work item is idempotent via unique converted_work_item_key.
 */
export const aiRecommendations = pgTable('ai_recommendations', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: varchar('snapshot_id', { length: 36 }).notNull(),
  scanRef: varchar('scan_ref', { length: 40 }).notNull(),
  recRef: varchar('rec_ref', { length: 30 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  reason: text('reason'),
  expectedImpact: varchar('expected_impact', { length: 255 }),
  effortEstimate: varchar('effort_estimate', { length: 60 }),
  affectedModule: varchar('affected_module', { length: 150 }),
  confidence: doublePrecision('confidence').notNull().default(0),
  convertedWorkItemKey: varchar('converted_work_item_key', { length: 30 }),
}, (table) => [
  uniqueIndex('ai_recommendations_converted_uq').on(table.convertedWorkItemKey),
  index('ai_recommendations_snapshot_idx').on(table.snapshotId),
]);

export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type NewAiRecommendation = typeof aiRecommendations.$inferInsert;
