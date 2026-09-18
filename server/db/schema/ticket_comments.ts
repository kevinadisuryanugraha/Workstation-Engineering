import { pgTable, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { tickets } from './tickets.ts';
import { users } from './users.ts';

export const ticketComments = pgTable('ticket_comments', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketId: varchar('ticket_id', { length: 36 }).notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 36 }).notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('comments_ticket_id_idx').on(table.ticketId),
]);

export type TicketComment = typeof ticketComments.$inferSelect;
export type NewTicketComment = typeof ticketComments.$inferInsert;
