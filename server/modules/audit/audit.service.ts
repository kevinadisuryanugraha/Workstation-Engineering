import { db } from '../../db/client.ts';
import { auditLogs, NewAuditLog } from '../../db/schema/audit_logs.ts';

export interface AuditEntryInput {
  actorId: string;
  actorName: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  correlationId: string;
}

export class AuditService {
  /**
   * Records an audit entry append-only.
   * Never mutates or deletes previous records (ADR-007).
   */
  async logEvent(entry: AuditEntryInput): Promise<void> {
    try {
      const record: NewAuditLog = {
        actorId: entry.actorId,
        actorName: entry.actorName,
        action: entry.action,
        targetEntity: entry.targetEntity,
        targetId: entry.targetId,
        details: entry.details || null,
        ipAddress: entry.ipAddress || null,
        correlationId: entry.correlationId,
      };

      await db.insert(auditLogs).values(record);
    } catch (error: any) {
      // In development or when DB is not reachable, warn cleanly
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[AuditService Warning] Database write skipped (${error?.message || 'DB disconnected'}). Action: ${entry.action}`);
      } else {
        console.error('[AuditService Error] Failed to write audit log to database:', error);
      }
    }
  }
}

export const auditService = new AuditService();
