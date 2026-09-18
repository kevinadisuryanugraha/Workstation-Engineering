import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { tickets, Ticket, NewTicket } from '../../db/schema/tickets.ts';
import { FilterTicketInput } from './ticket.schema.ts';

export class TicketRepository {
  async findMany(filters: FilterTicketInput): Promise<{ items: Ticket[]; total: number }> {
    try {
      const conditions = [];
      if (filters.projectId) {
        conditions.push(eq(tickets.projectId, filters.projectId));
      }
      if (filters.status) {
        conditions.push(eq(tickets.status, filters.status));
      }
      if (filters.severity) {
        conditions.push(eq(tickets.severity, filters.severity));
      }
      if (filters.priority) {
        conditions.push(eq(tickets.priority, filters.priority));
      }
      if (filters.assigneeId) {
        conditions.push(eq(tickets.assigneeId, filters.assigneeId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (filters.page - 1) * filters.limit;

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(tickets)
          .where(whereClause)
          .orderBy(desc(tickets.createdAt))
          .limit(filters.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(tickets)
          .where(whereClause),
      ]);

      const total = Number(countResult[0]?.count || 0);
      return { items, total };
    } catch (err) {
      console.warn('[TicketRepository] DB query failed, returning empty result:', err);
      return { items: [], total: 0 };
    }
  }

  async findById(id: string): Promise<Ticket | null> {
    try {
      const results = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
      return results.length > 0 ? results[0] : null;
    } catch (err) {
      return null;
    }
  }

  async getNextSequenceForProject(projectId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.projectId, projectId));
      return Number(result[0]?.count || 0) + 1;
    } catch (err) {
      return 1;
    }
  }

  async create(data: NewTicket): Promise<Ticket> {
    const inserted = await db.insert(tickets).values(data).returning();
    return inserted[0];
  }

  async update(id: string, data: Partial<NewTicket>): Promise<Ticket | null> {
    const updated = await db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updated.length > 0 ? updated[0] : null;
  }
}

export const ticketRepository = new TicketRepository();
