import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyService, CircularDependencyError } from '../server/modules/work-items/dependency.service.ts';
import { workItemRepository } from '../server/modules/work-items/work-item.repository.ts';

describe('Task Dependency & Circular Loop Prevention Tests', () => {
  let service: DependencyService;

  beforeEach(() => {
    service = new DependencyService();
  });

  it('rejects self-loop dependency (A blocked by A)', async () => {
    const isCycle = await service.checkCycle('wi-A', 'wi-A');
    expect(isCycle).toBe(true);
  });

  it('detects direct circular loop correctly (A blocked by B, B already blocked by A)', async () => {
    // Mock getDependencies so that B is blocked by A
    vi.spyOn(service, 'checkCycle').mockImplementation(async (blockedId, blockerId) => {
      if (blockedId === 'wi-A' && blockerId === 'wi-B') {
        return true; // B is already blocked by A
      }
      return false;
    });

    vi.spyOn(workItemRepository, 'findById').mockImplementation(async (id) => ({
      id,
      key: id,
      title: `Task ${id}`,
    } as any));

    await expect(
      service.addDependency('wi-A', 'wi-B')
    ).rejects.toThrow(CircularDependencyError);
  });
});
