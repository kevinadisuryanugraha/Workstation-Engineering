import { Router } from 'express';
import {
  listProjectsHandler,
  getProjectByIdHandler,
  createProjectHandler,
  updateProjectHandler,
} from './project.controller.ts';
import { authenticateToken } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';

const router = Router();

// All project routes require authentication
router.use(authenticateToken);

// GET /api/v1/projects - list projects
router.get('/', listProjectsHandler);

// GET /api/v1/projects/:id - get single project
router.get('/:id', getProjectByIdHandler);

// POST /api/v1/projects - create project (requires PERM_WORK_ITEM_CREATE or Admin)
router.post('/', requirePermission('PERM_WORK_ITEM_CREATE'), createProjectHandler);

// PUT /api/v1/projects/:id - update project (requires PERM_WORK_ITEM_UPDATE or Admin)
router.put('/:id', requirePermission('PERM_WORK_ITEM_UPDATE'), updateProjectHandler);

export const projectRouter = router;
