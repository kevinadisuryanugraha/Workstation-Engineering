import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkItemService, GateValidationError } from '../server/modules/work-items/work-item.service.ts';
import { acceptanceCriteriaService } from '../server/modules/work-items/acceptance-criteria.service.ts';

describe('Acceptance Criteria & DoD Gate Tests', () => {
  let mockRepo: any;
  let service: WorkItemService;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'wi-1',
        title: 'Feature Task',
        status: 'IN_PROGRESS',
        key: 'WRK-10',
      }),
      update: vi.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
    };
    service = new WorkItemService(mockRepo as any);
  });

  it('rejects transition to DONE if acceptance criteria are incomplete and no overrideReason provided', async () => {
    vi.spyOn(acceptanceCriteriaService, 'areAllCriteriaCompleted').mockResolvedValueOnce({
      allPassed: false,
      incompleteCount: 2,
      totalCount: 3,
    });

    await expect(
      service.updateWorkItem('wi-1', { status: 'DONE' }, 'usr-1', 'Developer')
    ).rejects.toThrow(GateValidationError);
  });

  it('allows transition to DONE if 100% acceptance criteria are verified', async () => {
    vi.spyOn(acceptanceCriteriaService, 'areAllCriteriaCompleted').mockResolvedValueOnce({
      allPassed: true,
      incompleteCount: 0,
      totalCount: 3,
    });

    const result = await service.updateWorkItem('wi-1', { status: 'DONE' }, 'usr-1', 'Developer');
    expect(result.status).toBe('DONE');
  });

  it('allows transition to DONE with authorized overrideReason (min 10 chars)', async () => {
    vi.spyOn(acceptanceCriteriaService, 'areAllCriteriaCompleted').mockResolvedValueOnce({
      allPassed: false,
      incompleteCount: 1,
      totalCount: 2,
    });

    const result = await service.updateWorkItem(
      'wi-1',
      { status: 'DONE', overrideReason: 'Emergency production release authorized by VP' },
      'usr-lead',
      'Tech Lead'
    );
    expect(result.status).toBe('DONE');
  });
});
