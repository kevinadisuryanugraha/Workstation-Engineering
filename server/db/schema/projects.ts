import { pgTable, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { organizations } from './organizations.ts';

export const projects = pgTable('projects', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar('organization_id', { length: 36 }).references(() => organizations.id),
  key: varchar('key', { length: 20 }).notNull().unique(), // e.g. WRK
  name: varchar('name', { length: 150 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  description: text('description'),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'), // PLANNING, ACTIVE, ON_HOLD, AT_RISK, COMPLETED, ARCHIVED
  progress: integer('progress').default(0).notNull(),
  health: integer('health').default(100).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('projects_key_idx').on(table.key),
  index('projects_status_idx').on(table.status),
]);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
