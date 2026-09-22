import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { workItems, WorkItem, NewWorkItem } from '../../db/schema/work_items.ts';
import { FilterWorkItemInput } from './work-item.schema.ts';

export class WorkItemRepository {
  async findMany(filters: FilterWorkItemInput): Promise<{ items: WorkItem[]; total: number }> {
    try {
      const conditions = [];
      if (filters.projectId) {
        conditions.push(eq(workItems.projectId, filters.projectId));
      }
      if (filters.status) {
        conditions.push(eq(workItems.status, filters.status));
      }
      if (filters.assigneeId) {
        conditions.push(eq(workItems.assigneeId, filters.assigneeId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const offset = (filters.page - 1) * filters.limit;

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(workItems)
          .where(whereClause)
          .orderBy(desc(workItems.createdAt))
          .limit(filters.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(workItems)
          .where(whereClause),
      ]);

      const total = Number(countResult[0]?.count || 0);
      return { items, total };
    } catch (err) {
      console.warn('[WorkItemRepository] DB query failed, returning empty result:', err);
      return { items: [], total: 0 };
    }
  }

  async findById(id: string): Promise<WorkItem | null> {
    try {
      const results = await db.select().from(workItems).where(eq(workItems.id, id)).limit(1);
      return results.length > 0 ? results[0] : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Story 22.1 (CC-7, Master PRD §11.4): daftar debt registry — work item
   * type='TECH_DEBT' dengan filter opsional, terurut created_at terlama dulu
   * (aging terlama di atas).
   */
  async findDebts(
    filters: { projectId?: string; status?: string; origin?: string; impact?: string }
  ): Promise<WorkItem[]> {
    try {
      const conditions = [eq(workItems.type, 'TECH_DEBT')];
      if (filters.projectId) conditions.push(eq(workItems.projectId, filters.projectId));
      if (filters.status) conditions.push(eq(workItems.status, filters.status));
      if (filters.origin) conditions.push(eq(workItems.debtOrigin, filters.origin));
      if (filters.impact) conditions.push(eq(workItems.debtImpact, filters.impact));

      return await db
        .select()
        .from(workItems)
        .where(and(...conditions))
        .orderBy(workItems.createdAt);
    } catch (err) {
      console.warn('[WorkItemRepository] DB query debts failed, returning empty result:', err);
      return [];
    }
  }

  async getNextSequenceForProject(projectId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(workItems)
        .where(eq(workItems.projectId, projectId));
      return Number(result[0]?.count || 0) + 1;
    } catch (err) {
      return 1;
    }
  }

  async create(data: NewWorkItem): Promise<WorkItem> {
    const inserted = await db.insert(workItems).values(data).returning();
    return inserted[0];
  }

  async update(id: string, data: Partial<NewWorkItem>): Promise<WorkItem | null> {
    const updated = await db
      .update(workItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workItems.id, id))
      .returning();
    return updated.length > 0 ? updated[0] : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(workItems).where(eq(workItems.id, id)).returning();
    return result.length > 0;
  }
}

export const workItemRepository = new WorkItemRepository();
