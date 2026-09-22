import { pgTable, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { projects } from './projects.ts';
import { sprints } from './sprints.ts';
import { milestones } from './milestones.ts';
import { users } from './users.ts';

export const workItems = pgTable('work_items', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar('key', { length: 20 }).notNull().unique(), // e.g. WRK-1
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('TASK'), // EPIC, FEATURE, TASK, SUBTASK, BUG, TECH_DEBT
  priority: varchar('priority', { length: 10 }).notNull().default('P2'), // P0, P1, P2, P3
  status: varchar('status', { length: 30 }).notNull().default('BACKLOG'), // BACKLOG, READY, IN_PROGRESS, IN_REVIEW, READY_FOR_TEST, DONE, CANCELLED
  assigneeId: varchar('assignee_id', { length: 36 }).references(() => users.id),
  estimateHours: integer('estimate_hours'),
  sprintId: varchar('sprint_id', { length: 36 }).references(() => sprints.id),
  milestoneId: varchar('milestone_id', { length: 36 }).references(() => milestones.id),
  // Story 22.1 (CC-7, Master PRD §11.4): kolom registry debt — hanya bermakna saat type = 'TECH_DEBT'.
  // Prinsip §11.4: AI tidak boleh menciptakan debt sebagai fakta tanpa evidence (debt_source_ref wajib bila origin AI_SCAN).
  debtOrigin: varchar('debt_origin', { length: 30 }), // AI_SCAN, TECH_LEAD_AUDIT, CODE_REVIEW, MANUAL, INCIDENT
  debtImpact: varchar('debt_impact', { length: 10 }), // HIGH, MEDIUM, LOW
  debtSourceRef: varchar('debt_source_ref', { length: 120 }), // mis. "SCAN-001/REC-03" — jejak evidence
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('work_items_project_id_idx').on(table.projectId),
  index('work_items_assignee_id_idx').on(table.assigneeId),
  index('work_items_status_idx').on(table.status),
  index('work_items_key_idx').on(table.key),
  index('work_items_debt_origin_idx').on(table.debtOrigin),
]);

export type WorkItem = typeof workItems.$inferSelect;
export type NewWorkItem = typeof workItems.$inferInsert;
