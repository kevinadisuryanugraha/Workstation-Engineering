import { Router } from 'express';
import { listAuditLogsHandler } from './audit.controller.ts';
import { authenticateToken } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';

const router = Router();

// Requires authentication and audit log viewing permission
router.use(authenticateToken);
router.get('/', requirePermission('PERM_AUDIT_LOGS_VIEW'), listAuditLogsHandler);

export const auditRouter = router;
