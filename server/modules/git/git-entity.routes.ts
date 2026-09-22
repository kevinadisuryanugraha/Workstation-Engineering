import { Router } from 'express';
import { authenticateToken } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { safeAsync } from '../../middlewares/safeAsync.ts';
import { gitEntityService, parseLimit } from './git-entity.service.ts';
import { repositoryRegistryRouter } from './repository.registry.ts';

/**
 * Git entities read routes (Story 18.1 — CC-5).
 *
 * Read-only API di atas hasil ingest webhook (Story 5.1/5.2).
 * Permission mengikuti gating nav Git Intelligence: PERM_VIEW_ENGINEERING.
 * Jalur ingest webhook (POST /api/v1/webhooks/github) TIDAK tersentuh.
 */

export const gitEntityRouter = Router();

// Semua route read memerlukan JWT (kontras dengan ingest webhook yang
// diproteksi HMAC signature, bukan JWT).
gitEntityRouter.use(authenticateToken);

// Story 23.1 (CC-8): Repository Registry multi-provider (GET list + POST register).
// Terpasang di bawah /api/v1/git → /api/v1/git/repositories. Auth JWT diwarisi.
gitEntityRouter.use(repositoryRegistryRouter);

// GET /api/v1/git/commits?projectId=&limit=
gitEntityRouter.get(
  '/commits',
  requirePermission('PERM_VIEW_ENGINEERING'),
  safeAsync(async (req, res) => {
    const items = await gitEntityService.listCommits({
      projectId: (req.query.projectId as string) || undefined,
      limit: parseLimit(req.query.limit),
    });
    res.json({
      success: true,
      data: items,
      meta: { total: items.length },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/v1/git/pull-requests?projectId=&limit=
gitEntityRouter.get(
  '/pull-requests',
  requirePermission('PERM_VIEW_ENGINEERING'),
  safeAsync(async (req, res) => {
    const items = await gitEntityService.listPullRequests({
      projectId: (req.query.projectId as string) || undefined,
      limit: parseLimit(req.query.limit),
    });
    res.json({
      success: true,
      data: items,
      meta: { total: items.length },
      timestamp: new Date().toISOString(),
    });
  })
);
