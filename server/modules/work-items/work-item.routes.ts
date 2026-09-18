import { Router } from 'express';
import {
  listWorkItemsHandler,
  getWorkItemByIdHandler,
  createWorkItemHandler,
  updateWorkItemHandler,
  deleteWorkItemHandler,
  listAcceptanceCriteriaHandler,
  addAcceptanceCriterionHandler,
  toggleAcceptanceCriterionHandler,
} from './work-item.controller.ts';
import {
  listDependenciesHandler,
  addDependencyHandler,
  removeDependencyHandler,
} from './dependency.controller.ts';
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

// Acceptance Criteria Sub-routes (Story 2.2)
router.get('/:id/acceptance-criteria', listAcceptanceCriteriaHandler);
router.post('/:id/acceptance-criteria', requirePermission('PERM_WORK_ITEM_UPDATE'), addAcceptanceCriterionHandler);
router.patch('/:id/acceptance-criteria/:criterionId', requirePermission('PERM_WORK_ITEM_UPDATE'), toggleAcceptanceCriterionHandler);

// Dependencies Sub-routes (Story 2.3)
router.get('/:id/dependencies', listDependenciesHandler);
router.post('/:id/dependencies', requirePermission('PERM_WORK_ITEM_UPDATE'), addDependencyHandler);
router.delete('/:id/dependencies/:dependencyId', requirePermission('PERM_WORK_ITEM_UPDATE'), removeDependencyHandler);

export const workItemRouter = router;
