import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { organizations } from './organizations.ts';

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar('organization_id', { length: 36 }).references(() => organizations.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('Developer'),
  avatar: varchar('avatar', { length: 10 }).notNull().default('U'),
  team: varchar('team', { length: 100 }).notNull().default('Engineering'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
