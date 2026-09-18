import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { workItemDependencies, WorkItemDependency, NewWorkItemDependency } from '../../db/schema/work_item_dependencies.ts';
import { workItemRepository } from './work-item.repository.ts';
import { NotFoundError } from '../projects/project.service.ts';

export class CircularDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircularDependencyError';
  }
}

export class DependencyService {
  /**
   * Retrieves dependencies where this work item is blocked by other tasks.
   */
  async getDependencies(workItemId: string): Promise<WorkItemDependency[]> {
    try {
      return await db
        .select()
        .from(workItemDependencies)
        .where(eq(workItemDependencies.blockedWorkItemId, workItemId));
    } catch (err) {
      return [];
    }
  }

  /**
   * Depth-First Search (DFS) to check if a cycle would be introduced.
   * If blockerId is reachable from blockedId, adding edge blockerId -> blockedId creates a loop!
   */
  async checkCycle(blockedId: string, blockerId: string): Promise<boolean> {
    if (blockedId === blockerId) {
      return true; // Self-loop
    }

    const visited = new Set<string>();
    const queue = [blockerId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === blockedId) {
        return true;
      }

      if (!visited.has(current)) {
        visited.add(current);

        try {
          // Find all items that are blocking 'current'
          const deps = await db
            .select()
            .from(workItemDependencies)
            .where(eq(workItemDependencies.blockedWorkItemId, current));

          for (const dep of deps) {
            if (!visited.has(dep.blockerWorkItemId)) {
              queue.push(dep.blockerWorkItemId);
            }
          }
        } catch (err) {
          // Ignore
        }
      }
    }

    return false;
  }

  async addDependency(blockedWorkItemId: string, blockerWorkItemId: string): Promise<WorkItemDependency> {
    const [blocked, blocker] = await Promise.all([
      workItemRepository.findById(blockedWorkItemId),
      workItemRepository.findById(blockerWorkItemId),
    ]);

    if (!blocked) {
      throw new NotFoundError(`Work item '${blockedWorkItemId}' not found`);
    }
    if (!blocker) {
      throw new NotFoundError(`Blocker work item '${blockerWorkItemId}' not found`);
    }

    // Check circular loop
    const hasCycle = await this.checkCycle(blockedWorkItemId, blockerWorkItemId);
    if (hasCycle) {
      throw new CircularDependencyError(
        `Circular dependency detected: adding blocker '${blocker.key}' to '${blocked.key}' would create a deadlock loop.`
      );
    }

    const newRecord: NewWorkItemDependency = {
      blockedWorkItemId,
      blockerWorkItemId,
    };

    const inserted = await db.insert(workItemDependencies).values(newRecord).returning();
    return inserted[0];
  }

  async removeDependency(dependencyId: string): Promise<boolean> {
    const result = await db
      .delete(workItemDependencies)
      .where(eq(workItemDependencies.id, dependencyId))
      .returning();
    return result.length > 0;
  }
}

export const dependencyService = new DependencyService();
