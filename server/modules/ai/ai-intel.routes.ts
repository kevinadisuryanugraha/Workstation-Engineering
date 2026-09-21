import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { safeAsync } from '../../middlewares/safeAsync.ts';
import { aiService, InvalidFindingTransitionError, canTransitionFinding } from './ai.service.ts';
import { FINDING_STATUSES } from '../../db/schema/ai_scans.ts';
import { workItemService } from '../work-items/work-item.service.ts';
import { auditService } from '../audit/audit.service.ts';

/**
 * AI intelligence routes (Epic 16 — FR-019/FR-020).
 * All endpoints require PERM_AI_SCAN_TRIGGER (human-in-the-loop AI).
 */

function actor(req: AuthenticatedRequest) {
  return { userId: req.user?.userId, name: req.user?.name ?? 'unknown' };
}

export const aiIntelRouter = Router();

// ===== Scan snapshots =====
aiIntelRouter.get(
  '/scans',
  requirePermission('PERM_AI_SCAN_TRIGGER'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, mode, limit } = req.query as Record<string, string | undefined>;
    const scans = await aiService.listScans({
      projectId,
      mode,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
    return res.json({ success: true, data: { scans, count: scans.length }, timestamp: new Date().toISOString() });
  })
);

aiIntelRouter.post(
  '/scans',
  requirePermission('PERM_AI_SCAN_TRIGGER'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { projectName, focusArea } = req.body as { projectName?: string; focusArea?: string };
    // Story 21.1: real scan REAL_GEMINI bila kunci valid, fallback demo jujur bila tidak.
    const snapshot = await aiService.scanProject({
      scannedBy: actor(req).name,
      projectName: projectName ?? null,
      focusArea: focusArea ?? null,
    });
    return res.json({
      success: true,
      data: {
        scanRef: snapshot.scanRef,
        mode: snapshot.mode,
        model: snapshot.model,
        findingsCount: Array.isArray(snapshot.findings) ? snapshot.findings.length : 0,
        recommendationsCount: Array.isArray(snapshot.recommendations) ? snapshot.recommendations.length : 0,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

aiIntelRouter.get(
  '/scans/:scanRef',
  requirePermission('PERM_AI_SCAN_TRIGGER'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const scan = await aiService.scanByRef(req.params.scanRef);
    if (!scan) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Scan snapshot not found' }, timestamp: new Date().toISOString() });
    }
    return res.json({ success: true, data: scan, timestamp: new Date().toISOString() });
  })
);

// ===== Findings =====
aiIntelRouter.get(
  '/findings',
  requirePermission('PERM_AI_SCAN_TRIGGER'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { snapshotRef, status, severity } = req.query as Record<string, string | undefined>;
    if (status && !FINDING_STATUSES.includes(status as any)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: `status must be one of: ${FINDING_STATUSES.join(', ')}` }, timestamp: new Date().toISOString() });
    }
    const findings = await aiService.listFindings({ snapshotRef, status, severity });
    return res.json({ success: true, data: { findings, count: findings.length }, timestamp: new Date().toISOString() });
  })
);

aiIntelRouter.patch(
  '/findings/:id/status',
  requirePermission('PERM_AI_SCAN_TRIGGER'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body as { status?: string };
    if (!status || !FINDING_STATUSES.includes(status as any)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: `status must be one of: ${FINDING_STATUSES.join(', ')}` }, timestamp: new Date().toISOString() });
    }

    const existing = await aiService.findingById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Finding not found' }, timestamp: new Date().toISOString() });
    }
    if (!canTransitionFinding(existing.status, status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TRANSITION', message: `Invalid finding status transition: ${existing.status} → ${status}` },
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await aiService.transitionFinding(req.params.id, status, actor(req), (req.correlationId as string) || 'system');
    return res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  })
);

// ===== Recommendation → Work Item (human approval) =====
aiIntelRouter.get(
  '/recommendations',
  requirePermission('PERM_AI_SCAN_TRIGGER'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const recommendations = await aiService.listRecommendations(req.query.snapshotRef as string | undefined);
    return res.json({
      success: true,
      data: {
        recommendations: recommendations.map((r) => ({
          ...r,
          converted: Boolean(r.convertedWorkItemKey),
        })),
        count: recommendations.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

aiIntelRouter.post(
  '/recommendations/:id/convert',
  requirePermission('PERM_WORK_ITEM_CREATE'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.body as { projectId?: string };
    if (!projectId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'projectId is required' }, timestamp: new Date().toISOString() });
    }

    const rec = await aiService.recommendationById(req.params.id);
    if (!rec) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Recommendation not found' }, timestamp: new Date().toISOString() });
    }
    if (rec.convertedWorkItemKey) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_CONVERTED', message: `Recommendation already converted to work item ${rec.convertedWorkItemKey}` },
        timestamp: new Date().toISOString(),
      });
    }

    // Human-approved conversion: create work item with evidence to the scan (AC 16.3.5)
    const workItem = await workItemService.createWorkItem(
      {
        projectId,
        title: rec.title.slice(0, 255),
        description: [
          `## Rekomendasi AI (disetujui manusia)`,
          `**Alasan:** ${rec.reason ?? '-'}`,
          `**Dampak yang diharapkan:** ${rec.expectedImpact ?? '-'}`,
          `**Estimasi effort:** ${rec.effortEstimate ?? '-'}`,
          `**Modul terdampak:** ${rec.affectedModule ?? '-'}`,
          ``,
          `**Evidence:** scan \`${rec.scanRef}\` · rekomendasi \`${rec.recRef}\` · confidence ${rec.confidence}%`,
        ].join('\n'),
        type: 'TECH_DEBT',
        priority: 'P2',
        status: 'BACKLOG',
      },
      req.user?.userId ?? 'unknown',
      req.user?.name ?? 'System',
      (req.correlationId as string) || 'system'
    );

    const marked = await aiService.markConverted(req.params.id, workItem.key);
    if (marked === 'ALREADY_CONVERTED') {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_CONVERTED', message: `Recommendation already converted to work item ${rec.convertedWorkItemKey}` },
        timestamp: new Date().toISOString(),
      });
    }

    await auditService.logEvent({
      actorId: req.user?.userId ?? 'system',
      actorName: req.user?.name ?? 'System',
      action: 'AI_RECOMMENDATION_CONVERTED',
      targetEntity: 'work_items',
      targetId: workItem.id,
      details: { scanRef: rec.scanRef, recRef: rec.recRef, workItemKey: workItem.key },
      correlationId: (req.correlationId as string) || 'system',
    }).catch(() => undefined);

    return res.status(201).json({
      success: true,
      data: { workItemKey: workItem.key, workItemId: workItem.id, recommendationId: rec.id },
      timestamp: new Date().toISOString(),
    });
  })
);
