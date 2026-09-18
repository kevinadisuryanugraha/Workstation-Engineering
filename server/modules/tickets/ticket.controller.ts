import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { ticketService } from './ticket.service.ts';
import { createTicketSchema, triageTicketSchema, filterTicketSchema, resolveTicketSchema } from './ticket.schema.ts';
import { NotFoundError } from '../projects/project.service.ts';

export async function listTicketsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const filters = filterTicketSchema.parse(req.query);
    const result = await ticketService.listTickets(filters);

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
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to list tickets' },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getTicketByIdHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const ticket = await ticketService.getTicketById(id);
    res.json({
      success: true,
      data: ticket,
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

export async function createTicketHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid ticket payload',
          details: parsed.error.issues,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const requesterId = req.user?.userId || 'unknown';
    const requesterName = req.user?.name || 'Anonymous';
    const correlationId = req.correlationId || 'system';

    const ticket = await ticketService.createTicket(parsed.data, requesterId, requesterName, correlationId);
    res.status(201).json({
      success: true,
      data: ticket,
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

export async function triageTicketHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const parsed = triageTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid triage payload',
          details: parsed.error.issues,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const actorId = req.user?.userId || 'unknown';
    const actorName = req.user?.name || 'System';
    const correlationId = req.correlationId || 'system';

    const updated = await ticketService.triageTicket(id, parsed.data, actorId, actorName, correlationId);
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

export async function resolveTicketHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const parsed = resolveTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Resolution explanation is required to resolve ticket',
          details: parsed.error.issues,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const actorId = req.user?.userId || 'unknown';
    const actorName = req.user?.name || 'System';
    const correlationId = req.correlationId || 'system';

    const updated = await ticketService.resolveTicket(id, parsed.data, actorId, actorName, correlationId);
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
