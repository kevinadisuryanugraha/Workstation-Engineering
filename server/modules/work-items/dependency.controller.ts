import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { dependencyService, CircularDependencyError } from './dependency.service.ts';
import { NotFoundError } from '../projects/project.service.ts';

export async function listDependenciesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const workItemId = req.params.id as string;
    const deps = await dependencyService.getDependencies(workItemId);
    res.json({
      success: true,
      data: deps,
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

export async function addDependencyHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const blockedWorkItemId = req.params.id as string;
    const { blockerWorkItemId } = req.body;

    if (!blockerWorkItemId || typeof blockerWorkItemId !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'blockerWorkItemId is required' },
        timestamp: new Date().toISOString(),
      });
    }

    const created = await dependencyService.addDependency(blockedWorkItemId, blockerWorkItemId);
    res.status(201).json({
      success: true,
      data: created,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof CircularDependencyError) {
      return res.status(400).json({
        success: false,
        error: { code: 'CIRCULAR_DEPENDENCY', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
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

export async function removeDependencyHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const dependencyId = req.params.dependencyId as string;
    const deleted = await dependencyService.removeDependency(dependencyId);
    res.json({
      success: true,
      data: { deleted },
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
