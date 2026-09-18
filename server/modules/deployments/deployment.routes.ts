import { Router } from 'express';
import {
  listDeploymentsHandler,
  createDeploymentHandler,
  rollbackDeploymentHandler,
} from './deployment.controller.ts';
import { authenticateToken } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';

const router = Router();

// All deployment routes require authentication
router.use(authenticateToken);

// GET /api/v1/deployments - list deployments
router.get('/', listDeploymentsHandler);

// POST /api/v1/deployments - record new deployment (Story 6.1)
router.post('/', requirePermission('PERM_DEPLOYMENT_EXECUTE'), createDeploymentHandler);

// POST /api/v1/deployments/rollback - authorized emergency rollback (Story 6.2)
router.post('/rollback', requirePermission('PERM_DEPLOYMENT_ROLLBACK'), rollbackDeploymentHandler);

export const deploymentRouter = router;
