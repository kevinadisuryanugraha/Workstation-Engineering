import { Router } from 'express';
import {
  listTicketsHandler,
  getTicketByIdHandler,
  createTicketHandler,
  triageTicketHandler,
  resolveTicketHandler,
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

export const ticketRouter = router;
