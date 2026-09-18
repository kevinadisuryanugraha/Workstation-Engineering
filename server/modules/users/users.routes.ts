import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { userService } from './users.service.ts';
import { UserRole } from '../../constants/permissions.ts';

/**
 * Users admin routes (Story 8.2 — SEC-01).
 * Role changes rotate token_version so stale tokens with old permissions die instantly.
 */

const VALID_ROLES: UserRole[] = [
  'Super Admin',
  'Organization Admin',
  'Manager',
  'Project Manager',
  'Tech Lead',
  'Developer',
  'QA',
  'Support',
  'Viewer',
];

export const userRouter = Router();

// PATCH /api/v1/users/:id/role — requires PERM_USER_MANAGEMENT
userRouter.patch('/:id/role', requirePermission('PERM_USER_MANAGEMENT'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body as { role?: string };

  if (!role || !VALID_ROLES.includes(role as UserRole)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: `Field 'role' is required and must be one of: ${VALID_ROLES.join(', ')}`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  const result = await userService.setUserRole(id, role as UserRole, req.user?.userId ?? 'system');
  if (!result) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found in persistent user directory',
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    success: true,
    data: {
      user: result,
      tokenVersionRotated: true,
      message: 'Role updated and all previously issued tokens revoked instantly',
    },
    timestamp: new Date().toISOString(),
  });
});
