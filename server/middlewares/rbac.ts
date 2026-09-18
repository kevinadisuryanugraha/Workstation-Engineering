import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate.ts';
import { Permission, UserRole } from '../constants/permissions.ts';

/**
 * Validates that the authenticated user possesses all required permissions.
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Unauthorized: Authentication required before checking permissions',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const userPermissions = req.user.permissions || [];
    const missingPermissions = requiredPermissions.filter((perm) => !userPermissions.includes(perm));

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'RBAC_ACCESS_DENIED',
          message: `Forbidden: Current role '${req.user.role}' lacks required permissions`,
          details: {
            currentRole: req.user.role,
            requiredPermissions,
            missingPermissions,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Validates that the authenticated user's role is in the allowed list.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Unauthorized: Authentication required before checking role',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'RBAC_ROLE_DENIED',
          message: `Forbidden: Current role '${req.user.role}' does not have clearance for this operation`,
          details: {
            currentRole: req.user.role,
            allowedRoles,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}
