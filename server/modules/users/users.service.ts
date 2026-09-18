import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema/users.ts';
import { UserRole } from '../../constants/permissions.ts';
import { auditService } from '../audit/audit.service.ts';

/**
 * Users module (Story 8.2 — SEC-01).
 * Owns token_version lifecycle: resolution, rotation on logout, and rotation on role change.
 */

export class UserService {
  /**
   * Resolves the current token_version for a user directly from PostgreSQL.
   * Returns null when the user is not persisted in the database (directory-only user)
   * or when the database is unreachable (degraded stateless mode).
   */
  async resolveTokenVersion(userId: string): Promise<number | null> {
    try {
      const rows = await db
        .select({ tokenVersion: users.tokenVersion })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (rows.length === 0) return null;
      return rows[0].tokenVersion;
    } catch {
      // DB unreachable: authentication falls back to claim-shape validation only
      return null;
    }
  }

  /**
   * Rotates token_version (+1). All previously issued JWTs for this user die instantly (SEC-01).
   * Best-effort: returns false (instead of throwing) for directory-only users or DB outages.
   */
  async bumpTokenVersion(userId: string, reason: string, actorId = 'system'): Promise<boolean> {
    try {
      const updated = await db
        .update(users)
        .set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({ id: users.id, tokenVersion: users.tokenVersion });

      if (updated.length === 0) return false;

      await auditService.logEvent({
        actorId,
        actorName: actorId,
        action: 'AUTH_TOKEN_REVOKED',
        targetEntity: 'users',
        targetId: userId,
        details: { reason, newTokenVersion: updated[0].tokenVersion },
        correlationId: 'system',
      }).catch(() => undefined);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Updates a user role server-side and rotates token_version so that
   * old tokens carrying the previous role/permissions become invalid immediately.
   */
  async setUserRole(
    userId: string,
    newRole: UserRole,
    actorId = 'system'
  ): Promise<{ id: string; role: UserRole } | null> {
    try {
      const updated = await db
        .update(users)
        .set({
          role: newRole,
          tokenVersion: sql`${users.tokenVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({ id: users.id, role: users.role });

      if (updated.length === 0) return null;

      await auditService.logEvent({
        actorId,
        actorName: actorId,
        action: 'AUTH_ROLE_CHANGED',
        targetEntity: 'users',
        targetId: userId,
        details: { newRole, tokenVersionRotated: true },
        correlationId: 'system',
      }).catch(() => undefined);

      return updated[0] as { id: string; role: UserRole };
    } catch {
      return null;
    }
  }
}

export const userService = new UserService();
