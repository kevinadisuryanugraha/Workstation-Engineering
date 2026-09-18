import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { authService } from './auth.service.ts';
import { userService } from '../users/users.service.ts';

export async function loginHandler(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const correlationId = req.correlationId || 'unknown';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Email and password are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const result = await authService.login(email, password, ipAddress, correlationId);
  if (!result) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Invalid credentials or user not found in organization directory',
      },
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
}

export async function meHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
      permissions: req.user.permissions,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function logoutHandler(req: AuthenticatedRequest, res: Response) {
  // SEC-01 (Story 8.2): rotate token_version so every previously issued JWT for this
  // user dies instantly — the stateless token can no longer be replayed after logout.
  let tokenRevoked = false;
  if (req.user?.userId) {
    tokenRevoked = await userService.bumpTokenVersion(req.user.userId, 'USER_LOGOUT', req.user.userId);
  }

  res.json({
    success: true,
    data: {
      message: 'Session terminated successfully',
      user: req.user?.email,
      tokenRevoked,
    },
    timestamp: new Date().toISOString(),
  });
}
