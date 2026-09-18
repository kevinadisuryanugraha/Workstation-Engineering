import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { tickets } from './tickets.ts';

export const ticketHistory = pgTable('ticket_history', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketId: varchar('ticket_id', { length: 36 }).notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  actorId: varchar('actor_id', { length: 36 }).notNull(),
  actorName: varchar('actor_name', { length: 150 }).notNull(),
  fieldChanged: varchar('field_changed', { length: 50 }).notNull(),
  oldValue: varchar('old_value', { length: 255 }),
  newValue: varchar('new_value', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('ticket_hist_ticket_id_idx').on(table.ticketId),
]);

export type TicketHistory = typeof ticketHistory.$inferSelect;
export type NewTicketHistory = typeof ticketHistory.$inferInsert;
