import { Router } from 'express';
import {
  listTicketsHandler,
  getTicketByIdHandler,
  createTicketHandler,
  triageTicketHandler,
  resolveTicketHandler,
  linkWorkItemHandler,
  createWorkItemFromTicketHandler,
  getTicketEvidenceHandler,
  addTicketCommentHandler,
  getTicketTimelineHandler,
} from './ticket.controller.ts';
import { authenticateToken } from '../../middlewares/authenticate.ts';
import { requirePermission } from '../../middlewares/rbac.ts';

const router = Router();

// All ticketing routes require authentication
router.use(authenticateToken);

// GET /api/v1/tickets - list with filters & pagination
router.get('/', listTicketsHandler);

// GET /api/v1/tickets/:id - single ticket
router.get('/:id', getTicketByIdHandler);

// POST /api/v1/tickets - create ticket (requires PERM_TICKET_CREATE)
router.post('/', requirePermission('PERM_TICKET_CREATE'), createTicketHandler);

// PATCH /api/v1/tickets/:id/triage - triage ticket (requires PERM_TICKET_UPDATE)
router.patch('/:id/triage', requirePermission('PERM_TICKET_UPDATE'), triageTicketHandler);

// POST /api/v1/tickets/:id/resolve - resolve ticket (requires PERM_TICKET_RESOLVE)
router.post('/:id/resolve', requirePermission('PERM_TICKET_RESOLVE'), resolveTicketHandler);

// Evidence & Linking Sub-routes (Story 4.2)
router.get('/:id/evidence', getTicketEvidenceHandler);
router.post('/:id/link-work-item', requirePermission('PERM_TICKET_UPDATE'), linkWorkItemHandler);
router.post('/:id/create-work-item', requirePermission('PERM_WORK_ITEM_CREATE'), createWorkItemFromTicketHandler);

// Comments & Timeline Sub-routes (Story 4.3)
router.get('/:id/timeline', getTicketTimelineHandler);
router.post('/:id/comments', requirePermission('PERM_TICKET_UPDATE'), addTicketCommentHandler);

export const ticketRouter = router;
