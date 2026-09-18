import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Resilient async route wrapper (degraded-mode hardening).
 *
 * The platform is designed to degrade gracefully when PostgreSQL is unreachable
 * (services log & fall back). This wrapper completes that contract at the HTTP
 * boundary: DB failures become clean HTTP 503 DATABASE_UNAVAILABLE responses
 * instead of unhandled rejections that would kill the process.
 */

const DB_ERROR_CODES = ['ECONNREFUSED', 'ETIMEDOUT', '28P01', '3D000', '42P01', '42501', '57P01'];

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export function safeAsync(handler: AsyncHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err: any) {
      const isDbError =
        DB_ERROR_CODES.includes(err?.code) || /Failed query|ECONNREFUSED|password authentication/i.test(err?.message ?? '');

      if (res.headersSent) {
        return next(err);
      }

      if (isDbError) {
        return res.status(503).json({
          success: false,
          error: {
            code: 'DATABASE_UNAVAILABLE',
            message: 'Layanan database tidak tersedia. Periksa koneksi PostgreSQL (DATABASE_URL).',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
