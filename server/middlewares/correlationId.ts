import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from './authenticate.ts';

/**
 * Middleware that assigns or propagates a unique correlation ID for end-to-end request tracing.
 * Required by Story 7.1 and ADR-007.
 */
export function requestCorrelationId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const incomingId = req.headers['x-correlation-id'];
  const correlationId = typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.trim()
    : crypto.randomUUID();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  next();
}
