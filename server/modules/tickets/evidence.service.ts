import { eq, or } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { evidenceLinks, EvidenceLink, NewEvidenceLink } from '../../db/schema/evidence_links.ts';
import { ticketRepository } from './ticket.repository.ts';
import { workItemRepository } from '../work-items/work-item.repository.ts';
import { workItemService } from '../work-items/work-item.service.ts';
import { NotFoundError } from '../projects/project.service.ts';

export class EvidenceService {
  async linkTicketToWorkItem(ticketId: string, workItemId: string): Promise<EvidenceLink> {
    const [ticket, workItem] = await Promise.all([
      ticketRepository.findById(ticketId),
      workItemRepository.findById(workItemId),
    ]);

    if (!ticket) throw new NotFoundError(`Ticket '${ticketId}' not found`);
    if (!workItem) throw new NotFoundError(`Work item '${workItemId}' not found`);

    const newRecord: NewEvidenceLink = {
      ticketId,
      workItemId,
    };

    const inserted = await db.insert(evidenceLinks).values(newRecord).returning();
    return inserted[0];
  }

  async createWorkItemFromTicket(
    ticketId: string,
    actorId: string,
    actorName: string,
    correlationId: string
  ): Promise<{ workItem: any; link: EvidenceLink }> {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError(`Ticket '${ticketId}' not found`);

    const workItem = await workItemService.createWorkItem(
      {
        projectId: ticket.projectId,
        title: `[Ticket ${ticket.key}] ${ticket.title}`,
        description: ticket.description || undefined,
        type: 'BUG',
        priority: ticket.priority as any,
        status: 'READY',
      },
      actorId,
      actorName,
      correlationId
    );

    const link = await this.linkTicketToWorkItem(ticketId, workItem.id);
    return { workItem, link };
  }

  async getTicketEvidence(ticketId: string): Promise<EvidenceLink[]> {
    try {
      return await db
        .select()
        .from(evidenceLinks)
        .where(eq(evidenceLinks.ticketId, ticketId));
    } catch (err) {
      return [];
    }
  }

  async getWorkItemEvidence(workItemId: string): Promise<EvidenceLink[]> {
    try {
      return await db
        .select()
        .from(evidenceLinks)
        .where(eq(evidenceLinks.workItemId, workItemId));
    } catch (err) {
      return [];
    }
  }
}

export const evidenceService = new EvidenceService();
