import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Agent authentication middleware (Story 9.2).
 * Workstation agents authenticate with a shared bearer token (AGENT_INGEST_TOKEN),
 * verified in constant time — separate from user JWT auth (no RBAC overlap).
 */

export function getAgentIngestToken(): string | null {
  const token = process.env.AGENT_INGEST_TOKEN;
  return token && token.trim().length > 0 ? token.trim() : null;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Still perform a comparison to keep timing roughly constant
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function agentAuth(req: Request, res: Response, next: NextFunction) {
  const expected = getAgentIngestToken();

  if (process.env.NODE_ENV === 'production' && !expected) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'AGENT_INGEST_NOT_CONFIGURED',
        message: 'Server rejects agent traffic: AGENT_INGEST_TOKEN is not configured',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (!expected) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'AGENT_INGEST_NOT_CONFIGURED',
        message: 'AGENT_INGEST_TOKEN is not configured; agent ingestion is disabled',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const authHeader = req.headers['authorization'];
  const provided = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  if (!provided || !safeEqual(provided, expected)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AGENT_AUTH_FAILED',
        message: 'Unauthorized: valid agent bearer token required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
}
