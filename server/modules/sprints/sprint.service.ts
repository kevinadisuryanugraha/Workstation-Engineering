import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { sprints, Sprint, NewSprint } from '../../db/schema/sprints.ts';
export type { Sprint, NewSprint };
import { milestones as milestonesTable, Milestone } from '../../db/schema/milestones.ts';
export type { Milestone };
import { workItems } from '../../db/schema/work_items.ts';

/**
 * Sprint & milestone management (Story 14.1/14.2 — FR-017).
 * Aturan inti: hanya SATU sprint ACTIVE per project (dijaga di sini, bukan index).
 */

export const SPRINT_STATUSES = ['PLANNED', 'ACTIVE', 'CLOSED'] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

export class SprintValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SprintValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Validasi target assignment dari work-item update (AC 14.1.4). */
export class AssignmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssignmentValidationError';
  }
}

export interface SprintBoardItem {
  key: string;
  title: string;
  status: string;
  type: string;
}

export interface SprintBoard {
  sprint: Sprint;
  planned: SprintBoardItem[];
  completed: SprintBoardItem[];
  carryOver: SprintBoardItem[];
  counts: { planned: number; completed: number; carryOver: number };
  completionPercent: number;
}

export class SprintService {
  async byId(id: string): Promise<Sprint | null> {
    const rows = await db.select().from(sprints).where(eq(sprints.id, id)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async listByProject(projectId: string): Promise<Sprint[]> {
    return db.select().from(sprints).where(eq(sprints.projectId, projectId)).orderBy(desc(sprints.createdAt));
  }

  /** Validasi target sprint/milestone saat work item di-update (dipanggil work-item service). */
  async assertAssignmentTargets(sprintId?: string | null, milestoneId?: string | null): Promise<void> {
    if (sprintId) {
      const rows = await db.select({ id: sprints.id }).from(sprints).where(eq(sprints.id, sprintId)).limit(1);
      if (rows.length === 0) throw new AssignmentValidationError(`Sprint '${sprintId}' not found`);
    }
    if (milestoneId) {
      const rows = await db.select({ id: milestonesTable.id }).from(milestonesTable).where(eq(milestonesTable.id, milestoneId)).limit(1);
      if (rows.length === 0) throw new AssignmentValidationError(`Milestone '${milestoneId}' not found`);
    }
  }

  async createSprint(input: {
    projectId: string;
    name: string;
    goal?: string;
    startDate?: Date;
    endDate?: Date;
    status?: SprintStatus;
  }): Promise<Sprint> {
    const status = input.status ?? 'PLANNED';
    if (status === 'ACTIVE') {
      await this.assertNoOtherActive(input.projectId, null);
    }
    const rows = await db.insert(sprints).values({ ...input, status }).returning();
    return rows[0];
  }

  async updateSprint(
    id: string,
    patch: Partial<Pick<NewSprint, 'name' | 'goal' | 'startDate' | 'endDate' | 'status'>>
  ): Promise<Sprint> {
    const existing = await this.byId(id);
    if (!existing) throw new NotFoundError(`Sprint '${id}' not found`);

    const newStatus = (patch.status ?? existing.status) as SprintStatus;

    // Validasi transisi: CLOSED hanya dari ACTIVE; ACTIVE unik per project (AC 14.1.5)
    if (existing.status === 'CLOSED' && patch.status && patch.status !== 'CLOSED') {
      throw new SprintValidationError('CLOSED sprint tidak dapat dibuka kembali');
    }
    if (newStatus === 'ACTIVE' && existing.status !== 'ACTIVE') {
      if (existing.status === 'CLOSED') {
        throw new SprintValidationError('CLOSED sprint tidak dapat dibuka kembali');
      }
      await this.assertNoOtherActive(existing.projectId, id);
    }

    const rows = await db.update(sprints).set({ ...patch, status: newStatus, updatedAt: new Date() }).where(eq(sprints.id, id)).returning();
    return rows[0];
  }

  private async assertNoOtherActive(projectId: string, excludeSprintId: string | null): Promise<void> {
    const actives = await db
      .select({ id: sprints.id })
      .from(sprints)
      .where(and(eq(sprints.projectId, projectId), eq(sprints.status, 'ACTIVE')));
    const others = actives.filter((a) => a.id !== excludeSprintId);
    if (others.length > 0) {
      throw new SprintValidationError('Project ini sudah memiliki sprint ACTIVE — tutup (CLOSED) sprint aktif terlebih dahulu.');
    }
  }

  // ===== Milestones =====
  async createMilestone(input: { projectId: string; name: string; description?: string; targetDate?: Date }): Promise<Milestone> {
    const rows = await db.insert(milestonesTable).values(input).returning();
    return rows[0];
  }

  async listMilestones(projectId: string): Promise<Milestone[]> {
    return db.select().from(milestonesTable).where(eq(milestonesTable.projectId, projectId)).orderBy(asc(milestonesTable.targetDate));
  }

  // ===== Board (Story 14.2) =====
  /**
   * Sprint board explainable (AC 14.2.1, 14.2.2):
   * DONE → completed; sprint CLOSED & belum DONE → carry-over; selain itu planned.
   */
  async board(sprintId: string): Promise<SprintBoard> {
    const sprint = await this.byId(sprintId);
    if (!sprint) throw new NotFoundError(`Sprint '${sprintId}' not found`);

    const items = await db
      .select({ key: workItems.key, title: workItems.title, status: workItems.status, type: workItems.type })
      .from(workItems)
      .where(and(eq(workItems.sprintId, sprintId), isNotNull(workItems.key)))
      .orderBy(asc(workItems.key));

    const mapped: SprintBoardItem[] = items.map((i) => ({ key: i.key, title: i.title, status: i.status, type: i.type }));
    return classifySprintBoard(sprint, mapped);
  }

  /** Ringkasan board per sprint untuk daftar project (AC 14.2.3). */
  async projectSprintSummaries(projectId: string): Promise<Array<{ sprint: Sprint; completionPercent: number; itemCount: number }>> {
    const list = await this.listByProject(projectId);
    const result = [];
    for (const sprint of list) {
      const rows = await db
        .select({
          total: sql<number>`count(*)`,
          done: sql<number>`count(*) filter (where ${workItems.status} = 'DONE')`,
        })
        .from(workItems)
        .where(eq(workItems.sprintId, sprint.id));
      const total = Number(rows[0]?.total ?? 0);
      const done = Number(rows[0]?.done ?? 0);
      result.push({ sprint, completionPercent: total === 0 ? 0 : Math.round((done / total) * 100), itemCount: total });
    }
    return result;
  }
}

export const sprintService = new SprintService();
void isNotNull;

/** Pure classification (Story 14.2 / AC #2, #5) — exported for tests. */
export function classifySprintBoard(sprint: Sprint, items: SprintBoardItem[]): SprintBoard {
  const completed = items.filter((i) => i.status === 'DONE');
  const notDone = items.filter((i) => i.status !== 'DONE');
  const carryOver = sprint.status === 'CLOSED' ? notDone : [];
  const planned = sprint.status === 'CLOSED' ? items.filter((i) => i.status === 'DONE') : items;
  const total = items.length;
  const completionPercent = total === 0 ? 0 : Math.round((completed.length / total) * 100);

  return {
    sprint,
    planned,
    completed,
    carryOver,
    counts: { planned: planned.length, completed: completed.length, carryOver: carryOver.length },
    completionPercent,
  };
}
