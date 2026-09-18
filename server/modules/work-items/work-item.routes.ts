import { Router } from 'express';
import {
  listWorkItemsHandler,
  getWorkItemByIdHandler,
  createWorkItemHandler,
  updateWorkItemHandler,
  deleteWorkItemHandler,
} from './work-item.controller.ts';
import { authenticateToken } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';

const router = Router();

// All work items routes require authentication
router.use(authenticateToken);

// GET /api/v1/work-items - list with filters & pagination
router.get('/', listWorkItemsHandler);

// GET /api/v1/work-items/:id - single work item
router.get('/:id', getWorkItemByIdHandler);

// POST /api/v1/work-items - create work item
router.post('/', requirePermission('PERM_WORK_ITEM_CREATE'), createWorkItemHandler);

// PUT /api/v1/work-items/:id - update work item
router.put('/:id', requirePermission('PERM_WORK_ITEM_UPDATE'), updateWorkItemHandler);

// DELETE /api/v1/work-items/:id - delete work item
router.delete('/:id', requirePermission('PERM_WORK_ITEM_DELETE'), deleteWorkItemHandler);

export const workItemRouter = router;
