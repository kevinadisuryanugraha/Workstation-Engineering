import { Response } from 'express';
import { eq, and, ne, desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { workItems } from '../../db/schema/work_items.ts';
import { tickets } from '../../db/schema/tickets.ts';
import { auditLogs } from '../../db/schema/audit_logs.ts';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';

export async function getMyWorkHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
    }

    const projectId = req.query.projectId as string | undefined;

    // Build work item filters: assigned to user, active (not DONE, not CANCELLED)
    const wiConditions = [
      eq(workItems.assigneeId, userId),
      ne(workItems.status, 'DONE'),
      ne(workItems.status, 'CANCELLED'),
    ];
    if (projectId) {
      wiConditions.push(eq(workItems.projectId, projectId));
    }

    // Build ticket filters: assigned to user, active (not RESOLVED, not CLOSED)
    const tckConditions = [
      eq(tickets.assigneeId, userId),
      ne(tickets.status, 'RESOLVED'),
      ne(tickets.status, 'CLOSED'),
    ];
    if (projectId) {
      tckConditions.push(eq(tickets.projectId, projectId));
    }

    // Execute parallel queries (< 150ms)
    const [assignedWorkItems, assignedTickets, recentActivity] = await Promise.all([
      db
        .select()
        .from(workItems)
        .where(and(...wiConditions))
        .orderBy(desc(workItems.createdAt))
        .limit(20)
        .catch(() => []),
      db
        .select()
        .from(tickets)
        .where(and(...tckConditions))
        .orderBy(desc(tickets.createdAt))
        .limit(20)
        .catch(() => []),
      db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.actorId, userId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(10)
        .catch(() => []),
    ]);

    res.json({
      success: true,
      data: {
        userId,
        userName: req.user?.name,
        role: req.user?.role,
        workItems: assignedWorkItems,
        tickets: assignedTickets,
        recentActivity,
        summary: {
          activeWorkItemsCount: assignedWorkItems.length,
          activeTicketsCount: assignedTickets.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to aggregate developer workspace' },
      timestamp: new Date().toISOString(),
    });
  }
}
