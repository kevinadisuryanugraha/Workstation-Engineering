import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../modules/auth/auth.crypto.ts';
import { Permission, SERVER_ROLE_PERMISSIONS } from '../constants/permissions.ts';
import { userService } from '../modules/users/users.service.ts';

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
 * CLOSES SEC-01 (Story 8.2): Rejects tokens whose token_version no longer matches
 * the authoritative value in PostgreSQL (instant revocation on logout / role change).
 */
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

  // ===== SEC-01: Instant token revocation via token_version =====
  const claimVersion = typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0; // legacy tokens (pre-8.2) carry no claim -> treated as version 0
  const currentVersion = await userService.resolveTokenVersion(payload.userId);

  if (currentVersion !== null) {
    // Authoritative DB value available: strict equality required
    if (claimVersion !== currentVersion) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_REVOKED',
          message: 'Unauthorized: Token has been revoked (stale token_version). Please sign in again.',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } else if (claimVersion < 1) {
    // Directory-only user or degraded DB: still reject legacy tokens without a version claim
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_REVOKED',
        message: 'Unauthorized: Legacy token without token_version is not accepted. Please sign in again.',
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
