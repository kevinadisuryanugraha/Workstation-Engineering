import { pgTable, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { projects } from './projects.ts';

/**
 * Sprints (Story 14.1 — FR-017, Master PRD §5).
 * Satu sprint ACTIVE per project — dijaga di service layer.
 */
export const sprints = pgTable('sprints', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  name: varchar('name', { length: 100 }).notNull(),
  goal: varchar('goal', { length: 500 }),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: varchar('status', { length: 15 }).notNull().default('PLANNED'), // PLANNED | ACTIVE | CLOSED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('sprints_project_status_idx').on(table.projectId, table.status),
  uniqueIndex('sprints_project_name_uq').on(table.projectId, table.name),
]);

export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;
