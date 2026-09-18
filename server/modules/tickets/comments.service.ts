import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { ticketComments, TicketComment, NewTicketComment } from '../../db/schema/ticket_comments.ts';
import { ticketHistory, TicketHistory, NewTicketHistory } from '../../db/schema/ticket_history.ts';
import { ticketRepository } from './ticket.repository.ts';
import { NotFoundError } from '../projects/project.service.ts';

export interface TimelineItem {
  id: string;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'FIELD_CHANGE';
  authorId: string;
  authorName?: string;
  content?: string;
  fieldChanged?: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: Date;
}

export class CommentsService {
  async addComment(ticketId: string, authorId: string, content: string): Promise<TicketComment> {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError(`Ticket '${ticketId}' not found`);

    const newRecord: NewTicketComment = {
      ticketId,
      authorId,
      content,
    };

    const inserted = await db.insert(ticketComments).values(newRecord).returning();
    return inserted[0];
  }

  async recordHistory(entry: NewTicketHistory): Promise<TicketHistory> {
    const inserted = await db.insert(ticketHistory).values(entry).returning();
    return inserted[0];
  }

  async getTimeline(ticketId: string): Promise<TimelineItem[]> {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError(`Ticket '${ticketId}' not found`);

    try {
      const [comments, history] = await Promise.all([
        db.select().from(ticketComments).where(eq(ticketComments.ticketId, ticketId)),
        db.select().from(ticketHistory).where(eq(ticketHistory.ticketId, ticketId)),
      ]);

      const timeline: TimelineItem[] = [];

      for (const c of comments) {
        timeline.push({
          id: c.id,
          type: 'COMMENT',
          authorId: c.authorId,
          content: c.content,
          createdAt: c.createdAt,
        });
      }

      for (const h of history) {
        timeline.push({
          id: h.id,
          type: h.fieldChanged === 'status' ? 'STATUS_CHANGE' : 'FIELD_CHANGE',
          authorId: h.actorId,
          authorName: h.actorName,
          fieldChanged: h.fieldChanged,
          oldValue: h.oldValue,
          newValue: h.newValue,
          createdAt: h.createdAt,
        });
      }

      // Sort chronological ascending (created_at ASC)
      return timeline.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      return [];
    }
  }
}

export const commentsService = new CommentsService();
