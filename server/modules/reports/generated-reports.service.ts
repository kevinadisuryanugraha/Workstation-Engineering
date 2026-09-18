import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { generatedReports, GeneratedReport } from '../../db/schema/generated_reports.ts';
import { buildPeriodSummary } from './reports.repository.ts';
import type { PeriodReportSummary } from './reports.repository.ts';
import { generateIdReport } from './idGenerator.ts';

/**
 * Scheduled reporting engine (Story 12.1) — generates and archives
 * DAILY / WEEKLY / MONTHLY management reports (append-only history).
 */

export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const REPORT_TYPES: ReportType[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

const PERIOD_DAYS: Record<ReportType, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
};

export function resolveReportPeriod(type: ReportType, now: Date = new Date()): { from: Date; to: Date } {
  const days = PERIOD_DAYS[type];
  return {
    from: new Date(now.getTime() - days * 24 * 3600 * 1000),
    to: now,
  };
}

export class GeneratedReportsService {
  /** Generates, archives, and returns a report for the given type (with previous-period trends — Story 12.2). */
  async generate(
    type: ReportType,
    generatedBy?: string,
    now: Date = new Date()
  ): Promise<GeneratedReport & { previousPeriod?: PeriodReportSummary }> {
    const { from, to } = resolveReportPeriod(type, now);
    const durationMs = to.getTime() - from.getTime();
    const [summary, previous] = await Promise.all([
      buildPeriodSummary(from, to),
      buildPeriodSummary(new Date(from.getTime() - durationMs), from),
    ]);
    const contentMarkdown = generateIdReport(summary, { previous });

    const rows = await db
      .insert(generatedReports)
      .values({
        type,
        periodFrom: from,
        periodTo: to,
        language: 'id-ID',
        contentMarkdown,
        generatedBy: generatedBy ?? null,
      })
      .returning();

    return { ...rows[0], previousPeriod: previous };
  }

  /** Newest archives for a type (or all types when omitted) — metadata + preview only. */
  async history(type?: ReportType, limit = 20): Promise<Array<Omit<GeneratedReport, 'contentMarkdown'> & { contentPreview: string }>> {
    const baseQuery = db.select().from(generatedReports).orderBy(desc(generatedReports.generatedAt)).limit(Math.min(Math.max(limit, 1), 100));
    const rows = type
      ? await db.select().from(generatedReports).where(eq(generatedReports.type, type)).orderBy(desc(generatedReports.generatedAt)).limit(Math.min(Math.max(limit, 1), 100))
      : await baseQuery;

    return rows.map(({ contentMarkdown, ...meta }) => ({
      ...meta,
      contentPreview: contentMarkdown.slice(0, 200),
    }));
  }

  async byId(id: string): Promise<GeneratedReport | null> {
    const rows = await db.select().from(generatedReports).where(eq(generatedReports.id, id)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }
}

export const generatedReportsService = new GeneratedReportsService();
