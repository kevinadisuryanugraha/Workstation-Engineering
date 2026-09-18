import { pgTable, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { projects } from './projects.ts';
import { users } from './users.ts';

export const tickets = pgTable('tickets', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar('key', { length: 20 }).notNull().unique(), // e.g. TCK-101
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  requesterId: varchar('requester_id', { length: 36 }).references(() => users.id),
  assigneeId: varchar('assignee_id', { length: 36 }).references(() => users.id),
  type: varchar('type', { length: 50 }).notNull().default('BUG'), // BUG, FEATURE_REQUEST, TECHNICAL_ISSUE, MAINTENANCE, SECURITY, PERFORMANCE, INCIDENT
  severity: varchar('severity', { length: 20 }).notNull().default('Medium'), // Critical, High, Medium, Low
  priority: varchar('priority', { length: 10 }).notNull().default('P2'), // P0, P1, P2, P3
  status: varchar('status', { length: 30 }).notNull().default('NEW'), // NEW, TRIAGED, ASSIGNED, IN_PROGRESS, IN_REVIEW, READY_FOR_TEST, TESTING, RESOLVED, CLOSED, CANCELLED
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('tickets_project_id_idx').on(table.projectId),
  index('tickets_status_idx').on(table.status),
  index('tickets_severity_idx').on(table.severity),
  index('tickets_priority_idx').on(table.priority),
  index('tickets_assignee_id_idx').on(table.assigneeId),
  index('tickets_key_idx').on(table.key),
]);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
