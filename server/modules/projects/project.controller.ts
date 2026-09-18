import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { projectService, ConflictError, NotFoundError } from './project.service.ts';
import { createProjectSchema, updateProjectSchema } from './project.schema.ts';

export async function listProjectsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const projects = await projectService.listProjects();
    res.json({
      success: true,
      data: projects,
      meta: {
        total: projects.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to list projects' },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getProjectByIdHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const project = await projectService.getProjectById(id);
    res.json({
      success: true,
      data: project,
      timestamp: new Date().toISOString(),
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

export async function createProjectHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid project payload',
          details: parsed.error.issues,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const actorId = req.user?.userId || 'unknown';
    const actorName = req.user?.name || 'System';
    const correlationId = req.correlationId || 'system';

    const project = await projectService.createProject(parsed.data, actorId, actorName, correlationId);
    res.status(201).json({
      success: true,
      data: project,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: error.message },
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

export async function updateProjectHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid project update payload',
          details: parsed.error.issues,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const actorId = req.user?.userId || 'unknown';
    const actorName = req.user?.name || 'System';
    const correlationId = req.correlationId || 'system';

    const updated = await projectService.updateProject(id, parsed.data, actorId, actorName, correlationId);
    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
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
