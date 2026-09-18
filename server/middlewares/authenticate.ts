import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../modules/auth/auth.crypto.ts';
import { Permission, SERVER_ROLE_PERMISSIONS } from '../constants/permissions.ts';

export interface AuthenticatedUser extends TokenPayload {
  permissions: Permission[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  correlationId?: string;
}

/**
 * Strict authentication middleware.
 * Verifies Bearer token.
 * CLOSES DS-01: Never falls back to a default Super Admin user.
 * CLOSES DS-02: Rejects client-forged or untrusted signature payloads.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Unauthorized: Authentication Bearer token is required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: 'Unauthorized: Invalid, tampered, or expired token',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Derive authoritative permissions strictly from server matrix (cannot be forged by client)
  const permissions = SERVER_ROLE_PERMISSIONS[payload.role] || [];

  req.user = {
    ...payload,
    permissions,
  };

  next();
}
