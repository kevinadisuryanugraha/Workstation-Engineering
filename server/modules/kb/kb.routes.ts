import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { kbService, DuplicateSlugError, KbValidationError } from './kb.service.ts';

/**
 * Knowledge Base routes (Story 15.1 — FR-018).
 */

function guard(handler: (req: AuthenticatedRequest, res: Response) => Promise<any>) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      if (err instanceof DuplicateSlugError) {
        return res.status(409).json({ success: false, error: { code: 'DUPLICATE_SLUG', message: err.message }, timestamp: new Date().toISOString() });
      }
      if (err instanceof KbValidationError) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: err.message }, timestamp: new Date().toISOString() });
      }
      return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err?.message ?? 'Internal error' }, timestamp: new Date().toISOString() });
    }
  };
}

export const kbRouter = Router();

kbRouter.post(
  '/',
  requirePermission('PERM_WORK_ITEM_UPDATE'),
  guard(async (req, res) => {
    const { title, body, tags, projectId } = req.body ?? {};
    const created = await kbService.create(
      { title, body, tags, projectId, ownerName: req.user?.name ?? 'unknown' },
      (req.correlationId as string) || 'system'
    );
    return res.status(201).json({ success: true, data: created, timestamp: new Date().toISOString() });
  })
);

kbRouter.get(
  '/',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const list = await kbService.list({ tag: req.query.tag as string | undefined, q: req.query.q as string | undefined });
    return res.json({ success: true, data: { articles: list, count: list.length }, timestamp: new Date().toISOString() });
  })
);

kbRouter.post(
  '/from-ticket',
  requirePermission('PERM_WORK_ITEM_UPDATE'),
  guard(async (req, res) => {
    const { key } = req.body as { key?: string };
    if (!key) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'key is required' }, timestamp: new Date().toISOString() });
    }
    const created = await kbService.draftFromTicket(key, req.user?.name ?? 'unknown', (req.correlationId as string) || 'system');
    return res.status(201).json({ success: true, data: created, timestamp: new Date().toISOString() });
  })
);

kbRouter.get(
  '/:slug/versions',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const versions = await kbService.versions(req.params.slug);
    if (versions.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' }, timestamp: new Date().toISOString() });
    }
    return res.json({ success: true, data: { versions, count: versions.length }, timestamp: new Date().toISOString() });
  })
);

kbRouter.get(
  '/:slug/versions/:version',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const content = await kbService.versionContent(req.params.slug, Number.parseInt(req.params.version, 10));
    if (!content) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Version not found' }, timestamp: new Date().toISOString() });
    }
    return res.json({ success: true, data: content, timestamp: new Date().toISOString() });
  })
);

kbRouter.get(
  '/:slug',
  requirePermission('PERM_VIEW_DASHBOARD'),
  guard(async (req, res) => {
    const article = await kbService.bySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' }, timestamp: new Date().toISOString() });
    }
    return res.json({ success: true, data: article, timestamp: new Date().toISOString() });
  })
);

kbRouter.patch(
  '/:slug',
  requirePermission('PERM_WORK_ITEM_UPDATE'),
  guard(async (req, res) => {
    const { title, body, tags } = req.body ?? {};
    const updated = await kbService.update(req.params.slug, { title, body, tags }, req.user?.name ?? 'unknown', (req.correlationId as string) || 'system');
    return res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  })
);
