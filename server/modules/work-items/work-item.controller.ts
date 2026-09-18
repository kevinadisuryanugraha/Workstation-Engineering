import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { workItemService } from './work-item.service.ts';
import { createWorkItemSchema, updateWorkItemSchema, filterWorkItemSchema } from './work-item.schema.ts';
import { NotFoundError } from '../projects/project.service.ts';

export async function listWorkItemsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const filters = filterWorkItemSchema.parse(req.query);
    const result = await workItemService.listWorkItems(filters);

    res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to list work items' },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getWorkItemByIdHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const item = await workItemService.getWorkItemById(id);
    res.json({
      success: true,
      data: item,
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

export async function createWorkItemHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = createWorkItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid work item input',
          details: parsed.error.issues,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const actorId = req.user?.userId || 'unknown';
    const actorName = req.user?.name || 'System';
    const correlationId = req.correlationId || 'system';

    const item = await workItemService.createWorkItem(parsed.data, actorId, actorName, correlationId);
    res.status(201).json({
      success: true,
      data: item,
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

export async function updateWorkItemHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const parsed = updateWorkItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid work item update payload',
          details: parsed.error.issues,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const actorId = req.user?.userId || 'unknown';
    const actorName = req.user?.name || 'System';
    const correlationId = req.correlationId || 'system';

    const updated = await workItemService.updateWorkItem(id, parsed.data, actorId, actorName, correlationId);
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

export async function deleteWorkItemHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const actorId = req.user?.userId || 'unknown';
    const actorName = req.user?.name || 'System';
    const correlationId = req.correlationId || 'system';

    const deleted = await workItemService.deleteWorkItem(id, actorId, actorName, correlationId);
    res.json({
      success: true,
      data: { deleted },
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
