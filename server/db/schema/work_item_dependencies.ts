import { pgTable, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { workItems } from './work_items.ts';

export const workItemDependencies = pgTable('work_item_dependencies', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockedWorkItemId: varchar('blocked_work_item_id', { length: 36 }).notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  blockerWorkItemId: varchar('blocker_work_item_id', { length: 36 }).notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('work_item_dep_pair_unique').on(table.blockedWorkItemId, table.blockerWorkItemId),
]);

export type WorkItemDependency = typeof workItemDependencies.$inferSelect;
export type NewWorkItemDependency = typeof workItemDependencies.$inferInsert;
