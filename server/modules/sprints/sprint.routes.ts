import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import {
  sprintService,
  SprintValidationError,
  NotFoundError,
  AssignmentValidationError,
  SprintStatus,
} from './sprint.service';

/**
 * Sprint & milestone routes (Story 14.1/14.2 — FR-017).
 */

function guard(handler: (req: AuthenticatedRequest, res: Response) => Promise<any>) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      if (err instanceof SprintValidationError || err instanceof AssignmentValidationError) {
        return res.status(400).json({
          success: false,
          error: { code: 'SPRINT_VALIDATION_FAILED', message: err.message },
          timestamp: new Date().toISOString(),
        });
      }
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: err.message },
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err?.message ?? 'Internal error' },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new SprintValidationError(`Invalid date: ${value}`);
  return d;
}

export const sprintRouter = Router();
export const milestoneRouter = Router();

// ===== Sprints =====
sprintRouter.post(
  '/',
  requirePermission('PERM_WORK_ITEM_CREATE'),
  guard(async (req, res) => {
    const { projectId, name, goal, startDate, endDate, status } = req.body ?? {};
    if (!projectId || !name) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'projectId and name are required' }, timestamp: new Date().toISOString() });
    }
    if (status && !['PLANNED', 'ACTIVE', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'status must be PLANNED, ACTIVE, or CLOSED' }, timestamp: new Date().toISOString() });
    }
    const created = await sprintService.createSprint({
      projectId,
      name,
      goal,
      startDate: parseDate(startDate),
      endDate: parseDate(endDate),
      status: status as SprintStatus | undefined,
    });
    return res.status(201).json({ success: true, data: created, timestamp: new Date().toISOString() });
  })
);

sprintRouter.patch(
  '/:id',
  requirePermission('PERM_WORK_ITEM_UPDATE'),
  guard(async (req, res) => {
    const { name, goal, startDate, endDate, status } = req.body ?? {};
    if (status && !['PLANNED', 'ACTIVE', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'status must be PLANNED, ACTIVE, or CLOSED' }, timestamp: new Date().toISOString() });
    }
    const updated = await sprintService.updateSprint(req.params.id, {
      name,
      goal,
      startDate: parseDate(startDate),
      endDate: parseDate(endDate),
      status: status as SprintStatus | undefined,
    });
    return res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  })
);

sprintRouter.get(
  '/project/:projectId',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const summaries = await sprintService.projectSprintSummaries(req.params.projectId);
    return res.json({ success: true, data: { sprints: summaries, count: summaries.length }, timestamp: new Date().toISOString() });
  })
);

sprintRouter.get(
  '/:id/board',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const board = await sprintService.board(req.params.id);
    return res.json({ success: true, data: board, timestamp: new Date().toISOString() });
  })
);

sprintRouter.get(
  '/:id',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const sprint = await sprintService.byId(req.params.id);
    if (!sprint) throw new NotFoundError(`Sprint '${req.params.id}' not found`);
    return res.json({ success: true, data: sprint, timestamp: new Date().toISOString() });
  })
);

// ===== Milestones =====
milestoneRouter.post(
  '/',
  requirePermission('PERM_WORK_ITEM_CREATE'),
  guard(async (req, res) => {
    const { projectId, name, description, targetDate } = req.body ?? {};
    if (!projectId || !name) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'projectId and name are required' }, timestamp: new Date().toISOString() });
    }
    const created = await sprintService.createMilestone({ projectId, name, description, targetDate: parseDate(targetDate) });
    return res.status(201).json({ success: true, data: created, timestamp: new Date().toISOString() });
  })
);

milestoneRouter.get(
  '/project/:projectId',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const list = await sprintService.listMilestones(req.params.projectId);
    return res.json({ success: true, data: { milestones: list, count: list.length }, timestamp: new Date().toISOString() });
  })
);
