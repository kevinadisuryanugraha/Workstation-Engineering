import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { buildPeriodSummary } from './reports.repository.ts';
import { generateIdReport } from './idGenerator.ts';
import { generatedReportsService, REPORT_TYPES, ReportType } from './generated-reports.service.ts';
import { safeAsync } from '../../middlewares/safeAsync.ts';

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
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
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
));

reportsRouter.get(
  '/summary/text',
  requirePermission('PERM_AUDIT_LOGS_VIEW'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
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
));

// ===== Scheduled report archives (Story 12.1) =====

// POST /api/v1/reports/generate — generate & archive DAILY/WEEKLY/MONTHLY report
reportsRouter.post(
  '/generate',
  requirePermission('PERM_AUDIT_LOGS_VIEW'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { type } = req.body as { type?: string };
    if (!type || !REPORT_TYPES.includes(type as ReportType)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: `type is required and must be one of: ${REPORT_TYPES.join(', ')}` },
        timestamp: new Date().toISOString(),
      });
    }

    const report = await generatedReportsService.generate(type as ReportType, req.user?.userId);
    return res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  }
));

// GET /api/v1/reports/history — archived report list (metadata + preview)
reportsRouter.get(
  '/history',
  requirePermission('PERM_AUDIT_LOGS_VIEW'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const typeParam = req.query.type as string | undefined;
    if (typeParam && !REPORT_TYPES.includes(typeParam as ReportType)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: `type must be one of: ${REPORT_TYPES.join(', ')}` },
        timestamp: new Date().toISOString(),
      });
    }
    const limitRaw = Number.parseInt((req.query.limit as string) || '20', 10);
    const history = await generatedReportsService.history(
      typeParam as ReportType | undefined,
      Number.isFinite(limitRaw) ? limitRaw : 20
    );
    return res.json({
      success: true,
      data: { reports: history, count: history.length },
      timestamp: new Date().toISOString(),
    });
  }
));

// GET /api/v1/reports/history/:id — full archived report
reportsRouter.get(
  '/history/:id',
  requirePermission('PERM_AUDIT_LOGS_VIEW'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const report = await generatedReportsService.byId(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report archive not found' },
        timestamp: new Date().toISOString(),
      });
    }
    return res.json({ success: true, data: report, timestamp: new Date().toISOString() });
  }
));
