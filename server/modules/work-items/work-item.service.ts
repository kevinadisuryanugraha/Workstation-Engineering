import { workItemRepository, WorkItemRepository } from './work-item.repository.ts';
import { projectRepository } from '../projects/project.repository.ts';
import { CreateWorkItemInput, UpdateWorkItemInput, FilterWorkItemInput } from './work-item.schema.ts';
import { WorkItem, NewWorkItem } from '../../db/schema/work_items.ts';
import { auditService } from '../audit/audit.service.ts';
import { sprintService, AssignmentValidationError } from '../sprints/sprint.service.ts';
import { NotFoundError } from '../projects/project.service.ts';
import { acceptanceCriteriaService } from './acceptance-criteria.service.ts';

// ─── Story 22.1 (CC-7, Master PRD §11.4): Debt Registry helpers ───────────

export type DebtAgingBucket = 'FRESH' | 'AGING' | 'STALE' | 'CRITICAL';

export interface DebtRegistryItem {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  ownerId: string | null;
  milestoneId: string | null;
  estimateHours: number | null;
  debtOrigin: string | null;
  debtImpact: string | null;
  debtSourceRef: string | null;
  createdAt: string;
  agingDays: number;
  agingBucket: DebtAgingBucket;
}

export interface DebtRegistrySummary {
  total: number;
  open: number;
  byStatus: Record<string, number>;
  byOrigin: Record<string, number>;
  byImpact: Record<string, number>;
  byAgingBucket: Record<DebtAgingBucket, number>;
}

/** Aging hari penuh sejak dibuat (UTC, floor) — murni agar test deterministik. */
export function computeAgingDays(createdAt: Date | string, now: Date = new Date()): number {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const diffMs = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

/** Bucket aging: FRESH 0–30, AGING 31–90, STALE 91–180, CRITICAL >180. */
export function computeAgingBucket(agingDays: number): DebtAgingBucket {
  if (agingDays <= 30) return 'FRESH';
  if (agingDays <= 90) return 'AGING';
  if (agingDays <= 180) return 'STALE';
  return 'CRITICAL';
}

const DEBT_OPEN_STATUSES = new Set(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'READY_FOR_TEST']);

function tally(items: DebtRegistryItem[], pick: (i: DebtRegistryItem) => string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const v = pick(item);
    if (v) out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

export function summarizeDebts(items: DebtRegistryItem[]): DebtRegistrySummary {
  const byAgingBucket: Record<DebtAgingBucket, number> = { FRESH: 0, AGING: 0, STALE: 0, CRITICAL: 0 };
  for (const item of items) byAgingBucket[item.agingBucket] += 1;
  return {
    total: items.length,
    open: items.filter((i) => DEBT_OPEN_STATUSES.has(i.status)).length,
    byStatus: tally(items, (i) => i.status),
    byOrigin: tally(items, (i) => i.debtOrigin),
    byImpact: tally(items, (i) => i.debtImpact),
    byAgingBucket,
  };
}


export class GateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GateValidationError';
  }
}

export class WorkItemService {
  constructor(private repo: WorkItemRepository = workItemRepository) {}

  async listWorkItems(filters: FilterWorkItemInput): Promise<{ items: WorkItem[]; total: number }> {
    return this.repo.findMany(filters);
  }

  /**
   * Story 22.1 (CC-7, Master PRD §11.4): registry debt — item TECH_DEBT
   * dengan aging terkomputasi server-side + ringkasan agregat.
   */
  async listDebts(
    filters: { projectId?: string; status?: string; origin?: string; impact?: string },
    now: Date = new Date()
  ): Promise<{ items: DebtRegistryItem[]; summary: DebtRegistrySummary }> {
    const rows = await this.repo.findDebts(filters);
    const items: DebtRegistryItem[] = rows.map((row) => {
      const agingDays = computeAgingDays(row.createdAt, now);
      return {
        id: row.id,
        key: row.key,
        projectId: row.projectId,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        ownerId: row.assigneeId,
        milestoneId: row.milestoneId,
        estimateHours: row.estimateHours,
        debtOrigin: row.debtOrigin,
        debtImpact: row.debtImpact,
        debtSourceRef: row.debtSourceRef,
        createdAt: (row.createdAt as Date).toISOString(),
        agingDays,
        agingBucket: computeAgingBucket(agingDays),
      };
    });
    return { items, summary: summarizeDebts(items) };
  }

  async getWorkItemById(id: string): Promise<WorkItem> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw new NotFoundError(`Work item with ID '${id}' not found`);
    }
    return item;
  }

  async createWorkItem(
    input: CreateWorkItemInput,
    actorId: string,
    actorName: string,
    correlationId = 'system'
  ): Promise<WorkItem> {
    const project = await projectRepository.findById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${input.projectId}' not found`);
    }

    const seq = await this.repo.getNextSequenceForProject(input.projectId);
    const key = `${project.key}-${seq}`;

    const newRecord: NewWorkItem = {
      key,
      projectId: input.projectId,
      title: input.title,
      description: input.description || null,
      type: input.type,
      priority: input.priority,
      status: input.status,
      assigneeId: input.assigneeId || null,
      estimateHours: input.estimateHours || null,
      // Story 22.1 (CC-7): field registry debt — zod sudah menormalkan
      // (field dibuang otomatis untuk type non-TECH_DEBT).
      debtOrigin: input.debtOrigin ?? null,
      debtImpact: input.debtImpact ?? null,
      debtSourceRef: input.debtSourceRef ?? null,
    };

    const item = await this.repo.create(newRecord);

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'WORK_ITEM_CREATED',
      targetEntity: 'work_items',
      targetId: item.id,
      details: { key: item.key, title: item.title, priority: item.priority },
      correlationId,
    });

    return item;
  }

  async updateWorkItem(
    id: string,
    input: UpdateWorkItemInput,
    actorId: string,
    actorName: string,
    correlationId = 'system'
  ): Promise<WorkItem> {
    const existing = await this.getWorkItemById(id);

    // Gate validation for DONE status (Story 2.2)
    if (input.status === 'DONE' && existing.status !== 'DONE') {
      const acCheck = await acceptanceCriteriaService.areAllCriteriaCompleted(id);
      if (!acCheck.allPassed) {
        const override = input.overrideReason;
        if (!override || typeof override !== 'string' || override.trim().length < 10) {
          throw new GateValidationError(
            `Cannot mark work item as DONE: ${acCheck.incompleteCount} of ${acCheck.totalCount} acceptance criteria are incomplete. An authorized overrideReason (min 10 characters) is required.`
          );
        }

        await auditService.logEvent({
          actorId,
          actorName,
          action: 'WORK_ITEM_STATUS_OVERRIDE',
          targetEntity: 'work_items',
          targetId: id,
          details: { overrideReason: override, incompleteCount: acCheck.incompleteCount },
          correlationId,
        });
      }
    }

    // Story 14.1 (AC #4): validasi target sprint/milestone sebelum assign
    if (input.sprintId !== undefined || input.milestoneId !== undefined) {
      await sprintService.assertAssignmentTargets(input.sprintId, input.milestoneId);
    }

    const { overrideReason, ...dataToUpdate } = input;
    const updated = await this.repo.update(id, dataToUpdate);
    if (!updated) {
      throw new NotFoundError(`Work item with ID '${id}' not found`);
    }

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'WORK_ITEM_UPDATED',
      targetEntity: 'work_items',
      targetId: id,
      details: {
        statusBefore: existing.status,
        statusAfter: updated.status,
      },
      correlationId,
    });

    return updated;
  }

  async deleteWorkItem(
    id: string,
    actorId: string,
    actorName: string,
    correlationId = 'system'
  ): Promise<boolean> {
    const existing = await this.getWorkItemById(id);

    const deleted = await this.repo.delete(id);
    if (deleted) {
      await auditService.logEvent({
        actorId,
        actorName,
        action: 'WORK_ITEM_DELETED',
        targetEntity: 'work_items',
        targetId: id,
        details: { key: existing.key, title: existing.title },
        correlationId,
      });
    }

    return deleted;
  }
}

export const workItemService = new WorkItemService();
