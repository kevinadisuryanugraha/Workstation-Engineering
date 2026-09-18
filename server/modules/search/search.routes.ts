import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { safeAsync } from '../../middlewares/safeAsync.ts';
import { searchService } from './search.service.ts';

/**
 * Global search route (Story 15.2 — FR-018).
 */
export const searchRouter = Router();

searchRouter.get(
  '/',
  requirePermission('PERM_VIEW_DASHBOARD'),
  safeAsync(async (req: AuthenticatedRequest, res: Response) => {
    const q = ((req.query.q as string) ?? '').trim();
    if (q.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'q must be at least 2 characters' },
        timestamp: new Date().toISOString(),
      });
    }
    const { results, total } = await searchService.search(q);
    return res.json({ success: true, data: { query: q, results, total }, timestamp: new Date().toISOString() });
  })
);
