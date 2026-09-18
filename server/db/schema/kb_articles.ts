import { pgTable, varchar, text, timestamp, integer, index, jsonb } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * Knowledge Base (Story 15.1 — FR-018, Master PRD §19).
 * Articles are versioned: every update appends a row to kb_article_versions.
 */
export const kbArticles = pgTable('kb_articles', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  tags: jsonb('tags').notNull().default([]), // string[]
  version: integer('version').notNull().default(1),
  ownerName: varchar('owner_name', { length: 150 }).notNull(),
  sourceTicketKey: varchar('source_ticket_key', { length: 30 }),
  projectId: varchar('project_id', { length: 36 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('kb_articles_title_idx').on(table.title),
]);

export type KbArticle = typeof kbArticles.$inferSelect;
export type NewKbArticle = typeof kbArticles.$inferInsert;

export const kbArticleVersions = pgTable('kb_article_versions', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  articleId: varchar('article_id', { length: 36 }).notNull(),
  version: integer('version').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  updatedBy: varchar('updated_by', { length: 150 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('kb_versions_article_idx').on(table.articleId, table.version),
]);

export type KbArticleVersion = typeof kbArticleVersions.$inferSelect;
export type NewKbArticleVersion = typeof kbArticleVersions.$inferInsert;
