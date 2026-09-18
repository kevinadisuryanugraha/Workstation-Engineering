import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { deploymentService } from './deployment.service.ts';
import { NotFoundError } from '../projects/project.service.ts';

export async function listDeploymentsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const projectId = req.query.projectId as string | undefined;
    const items = await deploymentService.listDeployments(projectId);
    res.json({
      success: true,
      data: items,
      meta: { total: items.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function createDeploymentHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, environment, serverName, version, commitSha, status } = req.body;

    if (!projectId || !environment || !serverName || !version) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'projectId, environment, serverName, and version are required' },
        timestamp: new Date().toISOString(),
      });
    }

    const actorName = req.user?.name || 'System Runner';
    const actorId = req.user?.userId || 'system';
    const correlationId = req.correlationId || 'system';

    const deployment = await deploymentService.createDeployment(
      { projectId, environment, serverName, version, commitSha, status },
      actorName,
      actorId,
      correlationId
    );

    res.status(201).json({
      success: true,
      data: deployment,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function rollbackDeploymentHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { deploymentId, targetVersion, server, reason } = req.body;

    if (!deploymentId || !targetVersion) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'deploymentId and targetVersion are required' },
        timestamp: new Date().toISOString(),
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'A rollback reason (min 10 characters) is mandatory' },
        timestamp: new Date().toISOString(),
      });
    }

    const actorName = req.user?.name || 'Authorized Lead';
    const actorRole = req.user?.role || 'Tech Lead';
    const actorId = req.user?.userId || 'lead';
    const correlationId = req.correlationId || 'system';

    const result = await deploymentService.rollbackDeployment(
      { deploymentId, targetVersion, serverName: server, reason: reason.trim() },
      actorName,
      actorRole,
      actorId,
      correlationId
    );

    res.json({
      success: true,
      action: 'DEPLOYMENT_ROLLBACK_AUTHORIZED',
      data: result.deployment,
      authorizedBy: actorName,
      userRole: actorRole,
      cryptographicSignature: result.signature,
      auditTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
    });
  }
}
