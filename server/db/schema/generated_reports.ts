import { pgTable, varchar, timestamp, index, text } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * Immutable archive of generated management reports (Story 12.1).
 * Append-only: regeneration creates a new row; there is no update/delete path.
 */
export const generatedReports = pgTable('generated_reports', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: varchar('type', { length: 10 }).notNull(), // DAILY | WEEKLY | MONTHLY
  periodFrom: timestamp('period_from', { withTimezone: true }).notNull(),
  periodTo: timestamp('period_to', { withTimezone: true }).notNull(),
  language: varchar('language', { length: 10 }).notNull().default('id-ID'),
  contentMarkdown: text('content_markdown').notNull(),
  generatedBy: varchar('generated_by', { length: 36 }),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('generated_reports_type_generated_idx').on(table.type, table.generatedAt),
]);

export type GeneratedReport = typeof generatedReports.$inferSelect;
export type NewGeneratedReport = typeof generatedReports.$inferInsert;
