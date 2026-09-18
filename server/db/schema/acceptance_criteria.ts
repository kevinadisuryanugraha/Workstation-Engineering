import { pgTable, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { workItems } from './work_items.ts';
import { users } from './users.ts';

export const acceptanceCriteria = pgTable('acceptance_criteria', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  workItemId: varchar('work_item_id', { length: 36 }).notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedBy: varchar('completed_by', { length: 36 }).references(() => users.id),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('ac_work_item_id_idx').on(table.workItemId),
  index('ac_is_completed_idx').on(table.isCompleted),
]);

export type AcceptanceCriterion = typeof acceptanceCriteria.$inferSelect;
export type NewAcceptanceCriterion = typeof acceptanceCriteria.$inferInsert;
