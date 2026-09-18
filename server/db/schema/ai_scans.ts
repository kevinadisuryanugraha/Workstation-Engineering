import { pgTable, varchar, timestamp, integer, jsonb, index, doublePrecision, text } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

/**
 * AI Intelligence persistence (Epic 16 — FR-019/FR-020, Master PRD §11).
 * Snapshots are immutable evidence; findings & recommendations are individual rows.
 */
export const AI_SCAN_MODES = ['LIVE_ANALYSIS', 'STATIC_DEMO_PREVIEW'] as const;
export type AiScanMode = (typeof AI_SCAN_MODES)[number];

export const aiScans = pgTable('ai_scans', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  scanRef: varchar('scan_ref', { length: 40 }).notNull().unique(),
  projectId: varchar('project_id', { length: 36 }),
  mode: varchar('mode', { length: 25 }).notNull(),
  model: varchar('model', { length: 50 }).notNull(),
  projectName: varchar('project_name', { length: 150 }),
  focusArea: varchar('focus_area', { length: 255 }),
  findings: jsonb('findings').notNull().default([]),
  recommendations: jsonb('recommendations').notNull().default([]),
  scannedBy: varchar('scanned_by', { length: 150 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('ai_scans_project_created_idx').on(table.projectId, table.createdAt),
  index('ai_scans_mode_idx').on(table.mode),
]);

export type AiScan = typeof aiScans.$inferSelect;
export type NewAiScan = typeof aiScans.$inferInsert;

export const FINDING_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'FALSE_POSITIVE', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED_RISK'] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const aiFindings = pgTable('ai_findings', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: varchar('snapshot_id', { length: 36 }).notNull(),
  scanRef: varchar('scan_ref', { length: 40 }).notNull(),
  findingRef: varchar('finding_ref', { length: 30 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 40 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  confidence: doublePrecision('confidence').notNull().default(0),
  affectedFile: varchar('affected_file', { length: 255 }),
  evidence: text('evidence'),
  impact: text('impact'),
  suggestedRemediation: text('suggested_remediation'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('ai_findings_snapshot_idx').on(table.snapshotId),
  index('ai_findings_status_idx').on(table.status),
]);
