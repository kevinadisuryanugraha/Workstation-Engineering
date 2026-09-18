import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { incidentService, InvalidTransitionError, IncidentNotFoundError } from './incident.service.ts';
import { incidentEventsService } from './incident.events.ts';
import { computeIncidentSla } from './incident.sla.ts';

/** Story 13.2 (AC #3): attach the computed SLA picture to an incident row. */
function withSla(incident: any) {
  return {
    ...incident,
    sla: computeIncidentSla(
      incident.severity,
      new Date(incident.detectedAt),
      incident.acknowledgedAt ? new Date(incident.acknowledgedAt) : null,
      incident.resolvedAt ? new Date(incident.resolvedAt) : null
    ),
  };
}
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from '../../db/schema/incidents.ts';

/**
 * Incident routes (Story 13.1).
 * POST   /api/v1/incidents              → PERM_INCIDENT_DECLARE
 * PATCH  /api/v1/incidents/:id/status   → PERM_INCIDENT_COMMAND
 * GET    /api/v1/incidents, /:id        → PERM_VIEW_DASHBOARD
 */

function actor(req: AuthenticatedRequest) {
  return { userId: req.user?.userId, name: req.user?.name ?? 'unknown' };
}

export const incidentRouter = Router();

incidentRouter.post('/', requirePermission('PERM_INCIDENT_DECLARE'), async (req: AuthenticatedRequest, res: Response) => {
  const { title, severity, environment, serverName, impact, relatedTicketCode, runbookUrl, detectedAt } = req.body ?? {};

  const missing = ['title', 'severity', 'environment', 'impact'].filter((f) => !(req.body as any)?.[f]);
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: `Missing required fields: ${missing.join(', ')}` },
      timestamp: new Date().toISOString(),
    });
  }
  if (!INCIDENT_SEVERITIES.includes(severity)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: `severity must be one of: ${INCIDENT_SEVERITIES.join(', ')}` },
      timestamp: new Date().toISOString(),
    });
  }
  if (!['Production', 'Staging'].includes(environment)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'environment must be Production or Staging' },
      timestamp: new Date().toISOString(),
    });
  }
  if (detectedAt && Number.isNaN(new Date(detectedAt).getTime())) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'detectedAt must be a valid ISO 8601 timestamp' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const created = await incidentService.declare(
      {
        title,
        severity,
        environment,
        serverName,
        impact,
        relatedTicketCode,
        runbookUrl,
        detectedAt: detectedAt ? new Date(detectedAt) : undefined,
      },
      actor(req),
      (req.correlationId as string) || 'system'
    );

    return res.status(201).json({ success: true, data: created, timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'DECLARE_FAILED', message: err instanceof Error ? err.message : 'Failed to declare incident' },
      timestamp: new Date().toISOString(),
    });
  }
});

incidentRouter.patch('/:id/status', requirePermission('PERM_INCIDENT_COMMAND'), async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status || !INCIDENT_STATUSES.includes(status as any)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: `status must be one of: ${INCIDENT_STATUSES.join(', ')}` },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const updated = await incidentService.transition(req.params.id, status as any, actor(req), (req.correlationId as string) || 'system');
    return res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  } catch (err) {
    if (err instanceof IncidentNotFoundError) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
    if (err instanceof InvalidTransitionError) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TRANSITION', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
    throw err;
  }
});

incidentRouter.get('/', requirePermission('PERM_VIEW_DASHBOARD'), async (req: AuthenticatedRequest, res: Response) => {
  const { status, severity, page, limit } = req.query as Record<string, string | undefined>;
  const result = await incidentService.list({
    status,
    severity,
    page: page ? Number.parseInt(page, 10) : undefined,
    limit: limit ? Number.parseInt(limit, 10) : undefined,
  });
  return res.json({ success: true, data: { ...result, items: result.items.map(withSla) }, timestamp: new Date().toISOString() });
});

incidentRouter.get('/:id', requirePermission('PERM_VIEW_DASHBOARD'), async (req: AuthenticatedRequest, res: Response) => {
  const incident = await incidentService.byId(req.params.id);
  if (!incident) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Incident not found' },
      timestamp: new Date().toISOString(),
    });
  }
  return res.json({ success: true, data: withSla(incident), timestamp: new Date().toISOString() });
});

// GET /api/v1/incidents/:id/events — immutable chronological timeline (Story 13.3 / AC #3)
incidentRouter.get('/:id/events', requirePermission('PERM_VIEW_DASHBOARD'), async (req: AuthenticatedRequest, res: Response) => {
  const events = await incidentEventsService.list(req.params.id);
  return res.json({ success: true, data: { events, count: events.length }, timestamp: new Date().toISOString() });
});

// POST /api/v1/incidents/:id/events — append a manual note (Story 13.3 / AC #2)
incidentRouter.post('/:id/events', requirePermission('PERM_VIEW_DASHBOARD'), async (req: AuthenticatedRequest, res: Response) => {
  const { message, type } = req.body as { message?: string; type?: string };
  if (!message || message.trim().length === 0 || message.length > 500) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'message is required (1-500 chars)' },
      timestamp: new Date().toISOString(),
    });
  }
  const eventType = type ?? 'note';
  if (!['alert', 'action', 'mitigation', 'resolution', 'note'].includes(eventType)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'type must be alert, action, mitigation, resolution, or note' },
      timestamp: new Date().toISOString(),
    });
  }
  const created = await incidentEventsService.record({
    incidentId: req.params.id,
    type: eventType as any,
    message: message.trim(),
    actorName: req.user?.name ?? 'unknown',
    actorUserId: req.user?.userId ?? null,
    correlationId: (req.correlationId as string) || 'system',
  });
  return res.status(201).json({ success: true, data: created, timestamp: new Date().toISOString() });
});
