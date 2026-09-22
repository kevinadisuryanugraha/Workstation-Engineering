import { pgTable, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  deliveryId: varchar('delivery_id', { length: 100 }).notNull().unique(), // X-GitHub-Delivery
  event: varchar('event', { length: 50 }).notNull(), // push, pull_request, etc.
  // Story 23.1 (CC-8): provider sumber delivery — data lama otomatis GITHUB.
  provider: varchar('provider', { length: 20 }).default('GITHUB').notNull(),
  status: varchar('status', { length: 30 }).default('PENDING').notNull(), // PENDING, PROCESSED, FAILED
  payload: jsonb('payload'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => [
  index('webhook_delivery_id_idx').on(table.deliveryId),
  index('webhook_status_idx').on(table.status),
]);

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
