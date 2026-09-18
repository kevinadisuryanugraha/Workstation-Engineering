import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { projects } from './projects.ts';

export const deployments = pgTable('deployments', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  environment: varchar('environment', { length: 30 }).notNull(), // DEV, STAGING, PRODUCTION
  serverName: varchar('server_name', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(), // e.g. v1.0.0
  commitSha: varchar('commit_sha', { length: 40 }),
  status: varchar('status', { length: 30 }).default('PENDING').notNull(), // PENDING, IN_PROGRESS, SUCCESS, FAILED, ROLLED_BACK
  deployedBy: varchar('deployed_by', { length: 150 }).notNull(),
  rollbackReason: varchar('rollback_reason', { length: 255 }),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('deploy_project_id_idx').on(table.projectId),
  index('deploy_environment_idx').on(table.environment),
  index('deploy_status_idx').on(table.status),
  index('deploy_commit_sha_idx').on(table.commitSha),
]);

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
