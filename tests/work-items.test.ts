import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkItemService } from '../server/modules/work-items/work-item.service.ts';
import { WorkItemRepository } from '../server/modules/work-items/work-item.repository.ts';
import { projectRepository } from '../server/modules/projects/project.repository.ts';

describe('Work Items Service Unit Tests', () => {
  let mockRepo: any;
  let service: WorkItemService;

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      findById: vi.fn().mockResolvedValue(null),
      getNextSequenceForProject: vi.fn().mockResolvedValue(101),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'wi-1', ...data })),
      update: vi.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      delete: vi.fn().mockResolvedValue(true),
    };
    service = new WorkItemService(mockRepo as any);
  });

  it('creates work item with auto-generated sequential key (e.g. WRK-101)', async () => {
    vi.spyOn(projectRepository, 'findById').mockResolvedValueOnce({
      id: 'prj-1',
      key: 'WRK',
      name: 'Workstation Project',
    } as any);

    const input = {
      projectId: 'prj-1',
      title: 'Refactor Authentication Engine',
      type: 'TASK' as const,
      priority: 'P1' as const,
      status: 'READY' as const,
    };

    const result = await service.createWorkItem(input as any, 'usr-1', 'Kevin Developer');
    expect(result.key).toBe('WRK-101');
    expect(result.title).toBe(input.title);
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      key: 'WRK-101',
      projectId: 'prj-1',
    }));
  });

  it('filters work items with pagination support', async () => {
    mockRepo.findMany.mockResolvedValueOnce({
      items: [{ id: 'wi-1', key: 'WRK-1' }],
      total: 1,
    });

    const result = await service.listWorkItems({
      projectId: 'prj-1',
      status: 'READY',
      page: 1,
      limit: 10,
    });

    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
  });
});
