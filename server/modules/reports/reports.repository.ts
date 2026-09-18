import { and, gte, lte, sql, eq, isNotNull, desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { tickets } from '../../db/schema/tickets.ts';
import { workItems } from '../../db/schema/work_items.ts';
import { deployments } from '../../db/schema/deployments.ts';
import { auditLogs } from '../../db/schema/audit_logs.ts';

/**
 * Reports repository (Story 10.1) — SQL aggregate queries (COUNT/GROUP BY)
 * for operational KPIs within a period. No fetch-all counting (NFR-001 p95 < 150ms).
 */

interface CountRow {
  label: string;
  count: number;
}

async function countGroupBy(
  table: any,
  labelColumn: any,
  dateColumn: any,
  from: Date,
  to: Date
): Promise<CountRow[]> {
  const rows = await db
    .select({ label: labelColumn, count: sql<number>`count(*)` })
    .from(table)
    .where(and(gte(dateColumn, from), lte(dateColumn, to)))
    .groupBy(labelColumn);
  return rows.map((r) => ({ label: String(r.label), count: Number(r.count) }));
}

export interface PeriodReportSummary {
  from: string;
  to: string;
  generatedAt: string;
  tickets: {
    byStatus: CountRow[];
    bySeverity: CountRow[];
    total: number;
  };
  workItems: {
    byStatus: CountRow[];
    byType: CountRow[];
    total: number;
  };
  deployments: {
    byEnvironment: CountRow[];
    total: number;
    rollbacks: number;
  };
  audit: {
    topActions: CountRow[];
    total: number;
  };
}

export class ReportsRepository {
  async ticketStatusCounts(from: Date, to: Date): Promise<CountRow[]> {
    return countGroupBy(tickets, tickets.status, tickets.createdAt, from, to);
  }
  async ticketSeverityCounts(from: Date, to: Date): Promise<CountRow[]> {
    return countGroupBy(tickets, tickets.severity, tickets.createdAt, from, to);
  }
  async workItemStatusCounts(from: Date, to: Date): Promise<CountRow[]> {
    return countGroupBy(workItems, workItems.status, workItems.createdAt, from, to);
  }
  async workItemTypeCounts(from: Date, to: Date): Promise<CountRow[]> {
    return countGroupBy(workItems, workItems.type, workItems.createdAt, from, to);
  }
  async deploymentEnvCounts(from: Date, to: Date): Promise<CountRow[]> {
    return countGroupBy(deployments, deployments.environment, deployments.startedAt, from, to);
  }
  async deploymentRollbackCount(from: Date, to: Date): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(deployments)
      .where(
        and(
          gte(deployments.startedAt, from),
          lte(deployments.startedAt, to),
          eq(deployments.status, 'ROLLED_BACK')
        )
      );
    return Number(rows[0]?.count ?? 0);
  }
  async deploymentTotal(from: Date, to: Date): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(deployments)
      .where(and(gte(deployments.startedAt, from), lte(deployments.startedAt, to)));
    return Number(rows[0]?.count ?? 0);
  }
  async auditTopActions(from: Date, to: Date, limit = 5): Promise<CountRow[]> {
    const rows = await db
      .select({ label: auditLogs.action, count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(gte(auditLogs.createdAt, from), lte(auditLogs.createdAt, to)))
      .groupBy(auditLogs.action)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
    return rows.map((r) => ({ label: String(r.label), count: Number(r.count) }));
  }
  async auditTotal(from: Date, to: Date): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(gte(auditLogs.createdAt, from), lte(auditLogs.createdAt, to)));
    return Number(rows[0]?.count ?? 0);
  }
}

export const reportsRepository = new ReportsRepository();

/** Aggregates all KPIs for the period into one summary object (AC 10.1.2, 10.1.5). */
export async function buildPeriodSummary(from: Date, to: Date): Promise<PeriodReportSummary> {
  const [
    ticketStatus,
    ticketSeverity,
    workItemStatus,
    workItemType,
    deploymentEnv,
    rollbackCount,
    deploymentTotal,
    auditTop,
    auditTotal,
  ] = await Promise.all([
    reportsRepository.ticketStatusCounts(from, to),
    reportsRepository.ticketSeverityCounts(from, to),
    reportsRepository.workItemStatusCounts(from, to),
    reportsRepository.workItemTypeCounts(from, to),
    reportsRepository.deploymentEnvCounts(from, to),
    reportsRepository.deploymentRollbackCount(from, to),
    reportsRepository.deploymentTotal(from, to),
    reportsRepository.auditTopActions(from, to, 5),
    reportsRepository.auditTotal(from, to),
  ]);

  const sum = (rows: CountRow[]) => rows.reduce((acc, r) => acc + r.count, 0);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    generatedAt: new Date().toISOString(),
    tickets: { byStatus: ticketStatus, bySeverity: ticketSeverity, total: sum(ticketStatus) },
    workItems: { byStatus: workItemStatus, byType: workItemType, total: sum(workItemStatus) },
    deployments: { byEnvironment: deploymentEnv, total: deploymentTotal, rollbacks: rollbackCount },
    audit: { topActions: auditTop, total: auditTotal },
  };
}

// Kept for potential direct status filtering use; prevents unused import lint noise
void isNotNull;
