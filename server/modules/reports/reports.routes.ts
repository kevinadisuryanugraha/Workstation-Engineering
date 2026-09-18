import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { buildPeriodSummary } from './reports.repository.ts';
import { generateIdReport } from './idGenerator.ts';

/**
 * Reports routes (Story 10.1 / 10.2).
 * GET /api/v1/reports/summary       → aggregated KPI JSON
 * GET /api/v1/reports/summary/text  → Bahasa Indonesia management summary (Markdown)
 *
 * RBAC: PERM_AUDIT_LOGS_VIEW — Tech Lead, Project Manager, Manager, Admins.
 * Developer & Viewer are rejected 403 (same clearance class as audit viewer, Story 7.2).
 */

const DEFAULT_PERIOD_DAYS = 7;
const MAX_PERIOD_DAYS = 365;

function resolvePeriod(query: {
  from?: string;
  to?: string;
  days?: string;
}): { from: Date; to: Date } | { error: string } {
  const now = new Date();

  // Fast period selector: ?days=7|30 (used by the ReportView UI)
  if (!query.from && !query.to && query.days) {
    const days = Number.parseInt(query.days, 10);
    if (!Number.isFinite(days) || days <= 0 || days > MAX_PERIOD_DAYS) {
      return { error: `days must be a positive integer up to ${MAX_PERIOD_DAYS}` };
    }
    return { from: new Date(now.getTime() - days * 24 * 3600 * 1000), to: now };
  }

  if (!query.from && !query.to) {
    return { from: new Date(now.getTime() - DEFAULT_PERIOD_DAYS * 24 * 3600 * 1000), to: now };
  }

  const { from: rawFrom, to: rawTo } = query;
  if (!rawFrom || !rawTo) {
    return { error: 'Both from and to are required when specifying a period (ISO 8601)' };
  }
  const from = new Date(rawFrom);
  const to = new Date(rawTo);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { error: 'from and to must be valid ISO 8601 timestamps' };
  }
  if (from.getTime() >= to.getTime()) {
    return { error: 'from must be earlier than to' };
  }
  return { from, to };
}

export const reportsRouter = Router();

reportsRouter.get(
  '/summary',
  requirePermission('PERM_AUDIT_LOGS_VIEW'),
  async (req: AuthenticatedRequest, res: Response) => {
    const period = resolvePeriod(req.query as { from?: string; to?: string; days?: string });
    if ('error' in period) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: period.error },
        timestamp: new Date().toISOString(),
      });
    }

    const summary = await buildPeriodSummary(period.from, period.to);
    return res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  }
);

reportsRouter.get(
  '/summary/text',
  requirePermission('PERM_AUDIT_LOGS_VIEW'),
  async (req: AuthenticatedRequest, res: Response) => {
    const period = resolvePeriod(req.query as { from?: string; to?: string; days?: string });
    if ('error' in period) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: period.error },
        timestamp: new Date().toISOString(),
      });
    }

    const summary = await buildPeriodSummary(period.from, period.to);
    const report = generateIdReport(summary);
    return res.json({
      success: true,
      data: {
        report,
        format: 'markdown',
        language: 'id-ID',
        from: summary.from,
        to: summary.to,
        generatedAt: summary.generatedAt,
        requestedBy: req.user?.name,
      },
      timestamp: new Date().toISOString(),
    });
  }
);
