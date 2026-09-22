import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { projects } from './projects.ts';

/** Story 23.1 (CC-8, Master PRD §30 Fase V2) — provider Git yang didukung. */
export const GIT_PROVIDERS = ['GITHUB', 'GITLAB', 'BITBUCKET'] as const;
export type GitProvider = (typeof GIT_PROVIDERS)[number];

export const repositories = pgTable('repositories', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  fullName: varchar('full_name', { length: 255 }).notNull(), // e.g. "org/repo"
  // Story 23.1 (CC-8): provider repo — data lama otomatis GITHUB (backward compatible).
  provider: varchar('provider', { length: 20 }).default('GITHUB').notNull(),
  defaultBranch: varchar('default_branch', { length: 100 }).default('main').notNull(),
  webhookSecret: varchar('webhook_secret', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('repo_project_id_idx').on(table.projectId),
  index('repo_full_name_idx').on(table.fullName),
]);

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
