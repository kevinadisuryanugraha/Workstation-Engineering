import { Response } from 'express';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { auditLogs } from '../../db/schema/audit_logs.ts';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';

export async function listAuditLogsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { actorId, action, targetEntity, correlationId } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (typeof actorId === 'string' && actorId) {
      conditions.push(eq(auditLogs.actorId, actorId));
    }
    if (typeof action === 'string' && action) {
      conditions.push(eq(auditLogs.action, action));
    }
    if (typeof targetEntity === 'string' && targetEntity) {
      conditions.push(eq(auditLogs.targetEntity, targetEntity));
    }
    if (typeof correlationId === 'string' && correlationId) {
      conditions.push(eq(auditLogs.correlationId, correlationId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total: items.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to query audit logs' },
      timestamp: new Date().toISOString(),
    });
  }
}
