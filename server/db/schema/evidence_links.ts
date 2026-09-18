import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import { tickets } from './tickets.ts';
import { workItems } from './work_items.ts';

export const evidenceLinks = pgTable('evidence_links', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketId: varchar('ticket_id', { length: 36 }).references(() => tickets.id, { onDelete: 'cascade' }),
  workItemId: varchar('work_item_id', { length: 36 }).references(() => workItems.id, { onDelete: 'cascade' }),
  commitSha: varchar('commit_sha', { length: 40 }),
  prId: varchar('pr_id', { length: 50 }),
  deploymentId: varchar('deployment_id', { length: 36 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('evidence_ticket_id_idx').on(table.ticketId),
  index('evidence_work_item_id_idx').on(table.workItemId),
  index('evidence_commit_sha_idx').on(table.commitSha),
]);

export type EvidenceLink = typeof evidenceLinks.$inferSelect;
export type NewEvidenceLink = typeof evidenceLinks.$inferInsert;
