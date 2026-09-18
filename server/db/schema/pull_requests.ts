import { pgTable, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { repositories } from './repositories.ts';

export const pullRequests = pgTable('pull_requests', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  repoId: varchar('repo_id', { length: 36 }).references(() => repositories.id),
  prNumber: integer('pr_number').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  authorName: varchar('author_name', { length: 150 }).notNull(),
  sourceBranch: varchar('source_branch', { length: 100 }).notNull(),
  targetBranch: varchar('target_branch', { length: 100 }).notNull(),
  status: varchar('status', { length: 30 }).default('OPEN').notNull(), // OPEN, MERGED, CLOSED
  url: varchar('url', { length: 255 }),
  mergedAt: timestamp('merged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('pr_repo_id_idx').on(table.repoId),
  index('pr_status_idx').on(table.status),
]);

export type PullRequest = typeof pullRequests.$inferSelect;
export type NewPullRequest = typeof pullRequests.$inferInsert;
