import { pgTable, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { repositories } from './repositories.ts';

export const commits = pgTable('commits', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  repoId: varchar('repo_id', { length: 36 }).references(() => repositories.id),
  sha: varchar('sha', { length: 40 }).notNull().unique(),
  message: text('message').notNull(),
  authorName: varchar('author_name', { length: 150 }).notNull(),
  authorEmail: varchar('author_email', { length: 255 }),
  branch: varchar('branch', { length: 100 }),
  url: varchar('url', { length: 255 }),
  committedAt: timestamp('committed_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('commits_sha_idx').on(table.sha),
  index('commits_repo_id_idx').on(table.repoId),
]);

export type Commit = typeof commits.$inferSelect;
export type NewCommit = typeof commits.$inferInsert;
