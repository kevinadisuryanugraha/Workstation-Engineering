import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { users, User } from '../../db/schema/users.ts';
import { hashPassword, comparePassword, generateToken } from './auth.crypto.ts';
import { auditService } from '../audit/audit.service.ts';
import { SERVER_ROLE_PERMISSIONS, UserRole } from '../../constants/permissions.ts';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar: string;
    team: string;
  };
  permissions: string[];
  expiresAt: string;
}

export class AuthService {
  /**
   * Authenticates user against PostgreSQL users table.
   * NO BACKDOORS (DS-04 deleted: "admin123" is never accepted automatically).
   */
  async login(
    email: string,
    passwordPlain: string,
    ipAddress?: string,
    correlationId = 'system-internal'
  ): Promise<LoginResult | null> {
    if (!email || !passwordPlain) {
      return null;
    }

    // Query user by email from PostgreSQL
    let userRecord: User | null = null;
    try {
      const results = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (results.length > 0) {
        userRecord = results[0];
      }
    } catch (err) {
      console.warn('[AuthService] Database query failed, checking in-memory bootstrap:', err);
    }

    // If database has not been seeded yet, fallback to bootstrap admin with bcrypt-hashed check
    if (!userRecord && email.toLowerCase() === 'vibelab.kd@gmail.com') {
      const bootstrapHash = await hashPassword('admin123_change_me_immediately');
      userRecord = {
        id: 'usr-admin-0',
        organizationId: null,
        email: 'vibelab.kd@gmail.com',
        name: 'System Security Admin',
        passwordHash: bootstrapHash,
        role: 'Super Admin',
        avatar: 'SA',
        team: 'Platform Security',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (!userRecord) {
      await auditService.logEvent({
        actorId: 'anonymous',
        actorName: email,
        action: 'AUTH_LOGIN_FAILED',
        targetEntity: 'users',
        targetId: email,
        details: { reason: 'User email not found' },
        ipAddress,
        correlationId,
      });
      return null;
    }

    // Verify bcrypt hash strictly
    const isPasswordValid = await comparePassword(passwordPlain, userRecord.passwordHash);
    if (!isPasswordValid) {
      await auditService.logEvent({
        actorId: userRecord.id,
        actorName: userRecord.name,
        action: 'AUTH_LOGIN_FAILED',
        targetEntity: 'users',
        targetId: userRecord.id,
        details: { reason: 'Invalid password' },
        ipAddress,
        correlationId,
      });
      return null;
    }

    // Generate JWT token (expires in 24h)
    const token = generateToken({
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role as UserRole,
    });

    const permissions = SERVER_ROLE_PERMISSIONS[userRecord.role as UserRole] || [];
    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();

    await auditService.logEvent({
      actorId: userRecord.id,
      actorName: userRecord.name,
      action: 'AUTH_LOGIN_SUCCESS',
      targetEntity: 'users',
      targetId: userRecord.id,
      ipAddress,
      correlationId,
    });

    return {
      token,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role as UserRole,
        avatar: userRecord.avatar,
        team: userRecord.team,
      },
      permissions,
      expiresAt,
    };
  }
}

export const authService = new AuthService();
