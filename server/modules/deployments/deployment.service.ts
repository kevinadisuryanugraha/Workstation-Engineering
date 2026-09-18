import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/client.ts';
import { deployments, Deployment, NewDeployment } from '../../db/schema/deployments.ts';
import { getJwtSecret } from '../../config/auth.ts';
import { auditService } from '../audit/audit.service.ts';
import { NotFoundError } from '../projects/project.service.ts';

export interface CreateDeploymentInput {
  projectId: string;
  environment: 'DEV' | 'STAGING' | 'PRODUCTION';
  serverName: string;
  version: string;
  commitSha?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
}

export interface RollbackInput {
  deploymentId: string;
  targetVersion: string;
  serverName?: string;
  reason: string;
}

export class DeploymentService {
  async listDeployments(projectId?: string): Promise<Deployment[]> {
    try {
      if (projectId) {
        return await db
          .select()
          .from(deployments)
          .where(eq(deployments.projectId, projectId))
          .orderBy(desc(deployments.createdAt));
      }
      return await db.select().from(deployments).orderBy(desc(deployments.createdAt));
    } catch (err) {
      return [];
    }
  }

  async createDeployment(
    input: CreateDeploymentInput,
    actorName: string,
    actorId = 'system',
    correlationId = 'system'
  ): Promise<Deployment> {
    const newRecord: NewDeployment = {
      projectId: input.projectId,
      environment: input.environment,
      serverName: input.serverName,
      version: input.version,
      commitSha: input.commitSha || null,
      status: input.status || 'SUCCESS',
      deployedBy: actorName,
      completedAt: new Date(),
    };

    const inserted = await db.insert(deployments).values(newRecord).returning();
    const created = inserted[0];

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'DEPLOYMENT_EXECUTED',
      targetEntity: 'deployments',
      targetId: created.id,
      details: {
        environment: created.environment,
        version: created.version,
        commitSha: created.commitSha,
        status: created.status,
      },
      correlationId,
    });

    return created;
  }

  /**
   * Authorizes and records an emergency rollback (Story 6.2).
   * Generates cryptographic HMAC signature and writes to audit log.
   */
  async rollbackDeployment(
    input: RollbackInput,
    actorName: string,
    actorRole: string,
    actorId = 'system',
    correlationId = 'system'
  ): Promise<{ deployment: Deployment; signature: string }> {
    const original = await db
      .select()
      .from(deployments)
      .where(eq(deployments.id, input.deploymentId))
      .limit(1);

    if (original.length === 0) {
      throw new NotFoundError(`Deployment '${input.deploymentId}' not found`);
    }

    const orig = original[0];

    // Compute tamper-evident HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`rollback:${input.deploymentId}:${input.targetVersion}:${Date.now()}`)
      .digest('hex');

    const rollbackRecord: NewDeployment = {
      projectId: orig.projectId,
      environment: orig.environment,
      serverName: input.serverName || orig.serverName,
      version: input.targetVersion,
      status: 'ROLLED_BACK',
      deployedBy: actorName,
      rollbackReason: input.reason,
      completedAt: new Date(),
    };

    const inserted = await db.insert(deployments).values(rollbackRecord).returning();
    const created = inserted[0];

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'DEPLOYMENT_ROLLBACK_AUTHORIZED',
      targetEntity: 'deployments',
      targetId: created.id,
      details: {
        previousDeploymentId: orig.id,
        targetVersion: input.targetVersion,
        reason: input.reason,
        authorizedRole: actorRole,
        cryptographicSignature: signature,
      },
      correlationId,
    });

    return { deployment: created, signature };
  }
}

export const deploymentService = new DeploymentService();
