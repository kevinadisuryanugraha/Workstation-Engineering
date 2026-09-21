import { pgTable, varchar, timestamp, index, text } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * Append-only delivery ledger (Story 20.2 — Course Correction 6).
 * Setiap percobaan pengiriman laporan terjadwal (email/WhatsApp) tercatat satu baris;
 * tidak ada jalur update/delete (ADR-007 style append-only).
 */
export const reportDeliveries = pgTable('report_deliveries', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  reportId: varchar('report_id', { length: 36 }).notNull(),
  channel: varchar('channel', { length: 10 }).notNull(), // EMAIL | WHATSAPP
  destination: varchar('destination', { length: 255 }).notNull(),
  status: varchar('status', { length: 10 }).notNull(), // SENT | FAILED | SKIPPED
  detail: text('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('report_deliveries_report_idx').on(table.reportId, table.createdAt),
]);

export type ReportDelivery = typeof reportDeliveries.$inferSelect;
export type NewReportDelivery = typeof reportDeliveries.$inferInsert;
