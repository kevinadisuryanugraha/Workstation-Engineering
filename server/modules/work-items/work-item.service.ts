import { workItemRepository, WorkItemRepository } from './work-item.repository.ts';
import { projectRepository } from '../projects/project.repository.ts';
import { CreateWorkItemInput, UpdateWorkItemInput, FilterWorkItemInput } from './work-item.schema.ts';
import { WorkItem, NewWorkItem } from '../../db/schema/work_items.ts';
import { auditService } from '../audit/audit.service.ts';
import { NotFoundError } from '../projects/project.service.ts';
import { acceptanceCriteriaService } from './acceptance-criteria.service.ts';

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
