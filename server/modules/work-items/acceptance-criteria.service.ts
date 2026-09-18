import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { acceptanceCriteria, AcceptanceCriterion, NewAcceptanceCriterion } from '../../db/schema/acceptance_criteria.ts';
import { NotFoundError } from '../projects/project.service.ts';

export class AcceptanceCriteriaService {
  async getByWorkItemId(workItemId: string): Promise<AcceptanceCriterion[]> {
    try {
      return await db
        .select()
        .from(acceptanceCriteria)
        .where(eq(acceptanceCriteria.workItemId, workItemId));
    } catch (err) {
      return [];
    }
  }

  async addCriterion(workItemId: string, text: string): Promise<AcceptanceCriterion> {
    const newRecord: NewAcceptanceCriterion = {
      workItemId,
      text,
      isCompleted: false,
    };
    const inserted = await db.insert(acceptanceCriteria).values(newRecord).returning();
    return inserted[0];
  }

  async toggleCriterion(
    criterionId: string,
    isCompleted: boolean,
    userId: string
  ): Promise<AcceptanceCriterion> {
    const updated = await db
      .update(acceptanceCriteria)
      .set({
        isCompleted,
        completedBy: isCompleted ? userId : null,
        completedAt: isCompleted ? new Date() : null,
      })
      .where(eq(acceptanceCriteria.id, criterionId))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundError(`Acceptance criterion '${criterionId}' not found`);
    }

    return updated[0];
  }

  /**
   * Validates if all acceptance criteria for a work item are completed.
   * Required before transitioning to DONE status.
   */
  async areAllCriteriaCompleted(workItemId: string): Promise<{ allPassed: boolean; incompleteCount: number; totalCount: number }> {
    const items = await this.getByWorkItemId(workItemId);
    if (items.length === 0) {
      return { allPassed: true, incompleteCount: 0, totalCount: 0 };
    }

    const incomplete = items.filter((i) => !i.isCompleted);
    return {
      allPassed: incomplete.length === 0,
      incompleteCount: incomplete.length,
      totalCount: items.length,
    };
  }
}

export const acceptanceCriteriaService = new AcceptanceCriteriaService();
