import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { projects } from './projects.ts';

/**
 * Milestones (Story 14.1 — FR-017, Master PRD §4/§5).
 */
export const milestones = pgTable('milestones', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  name: varchar('name', { length: 150 }).notNull(),
  description: varchar('description', { length: 500 }),
  targetDate: timestamp('target_date', { withTimezone: true }),
  status: varchar('status', { length: 15 }).notNull().default('OPEN'), // OPEN | CLOSED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('milestones_project_status_idx').on(table.projectId, table.status),
]);

export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
