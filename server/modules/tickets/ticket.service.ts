import { ticketRepository, TicketRepository } from './ticket.repository.ts';
import { projectRepository } from '../projects/project.repository.ts';
import { CreateTicketInput, TriageTicketInput, FilterTicketInput, ResolveTicketInput } from './ticket.schema.ts';
import { Ticket, NewTicket } from '../../db/schema/tickets.ts';
import { auditService } from '../audit/audit.service.ts';
import { NotFoundError } from '../projects/project.service.ts';

export class TicketService {
  constructor(private repo: TicketRepository = ticketRepository) {}

  async listTickets(filters: FilterTicketInput): Promise<{ items: Ticket[]; total: number }> {
    return this.repo.findMany(filters);
  }

  async getTicketById(id: string): Promise<Ticket> {
    const ticket = await this.repo.findById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID '${id}' not found`);
    }
    return ticket;
  }

  async createTicket(
    input: CreateTicketInput,
    requesterId: string,
    requesterName: string,
    correlationId = 'system'
  ): Promise<Ticket> {
    const project = await projectRepository.findById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${input.projectId}' not found`);
    }

    const seq = await this.repo.getNextSequenceForProject(input.projectId);
    const key = `TCK-${seq}`;

    const newRecord: NewTicket = {
      key,
      projectId: input.projectId,
      requesterId,
      title: input.title,
      description: input.description || null,
      type: input.type,
      severity: input.severity,
      priority: input.priority,
      status: 'NEW',
      assigneeId: input.assigneeId || null,
    };

    const ticket = await this.repo.create(newRecord);

    await auditService.logEvent({
      actorId: requesterId,
      actorName: requesterName,
      action: 'TICKET_CREATED',
      targetEntity: 'tickets',
      targetId: ticket.id,
      details: { key: ticket.key, title: ticket.title, severity: ticket.severity, priority: ticket.priority },
      correlationId,
    });

    return ticket;
  }

  async triageTicket(
    id: string,
    input: TriageTicketInput,
    actorId: string,
    actorName: string,
    correlationId = 'system'
  ): Promise<Ticket> {
    const existing = await this.getTicketById(id);

    const updatePayload: Partial<NewTicket> = {
      ...input,
      // If status wasn't explicitly provided but assignee is set, transition from NEW to ASSIGNED
      status: input.status || (existing.status === 'NEW' && input.assigneeId ? 'ASSIGNED' : existing.status),
    };

    const updated = await this.repo.update(id, updatePayload);
    if (!updated) {
      throw new NotFoundError(`Ticket with ID '${id}' not found`);
    }

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'TICKET_TRIAGED',
      targetEntity: 'tickets',
      targetId: id,
      details: {
        statusBefore: existing.status,
        statusAfter: updated.status,
        priority: updated.priority,
        assigneeId: updated.assigneeId,
      },
      correlationId,
    });

    return updated;
  }

  async resolveTicket(
    id: string,
    input: ResolveTicketInput,
    actorId: string,
    actorName: string,
    correlationId = 'system'
  ): Promise<Ticket> {
    await this.getTicketById(id);

    const updated = await this.repo.update(id, {
      status: 'RESOLVED',
      resolution: input.resolution,
      resolvedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundError(`Ticket with ID '${id}' not found`);
    }

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'TICKET_RESOLVED',
      targetEntity: 'tickets',
      targetId: id,
      details: { resolution: input.resolution },
      correlationId,
    });

    return updated;
  }
}

export const ticketService = new TicketService();
