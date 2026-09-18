import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketService } from '../server/modules/tickets/ticket.service.ts';
import { TicketRepository } from '../server/modules/tickets/ticket.repository.ts';
import { projectRepository } from '../server/modules/projects/project.repository.ts';

describe('Tickets Service Unit Tests', () => {
  let mockRepo: any;
  let service: TicketService;

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      findById: vi.fn().mockResolvedValue(null),
      getNextSequenceForProject: vi.fn().mockResolvedValue(101),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'tck-1', ...data })),
      update: vi.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
    };
    service = new TicketService(mockRepo as any);
  });

  it('creates ticket with status NEW and separate severity/priority', async () => {
    vi.spyOn(projectRepository, 'findById').mockResolvedValueOnce({
      id: 'prj-1',
      key: 'WRK',
      name: 'Workstation',
    } as any);

    const input = {
      projectId: 'prj-1',
      title: 'Database connection timeout on peak hours',
      type: 'PERFORMANCE' as const,
      severity: 'Critical' as const,
      priority: 'P0' as const,
    };

    const result = await service.createTicket(input as any, 'usr-qa', 'QA Specialist');
    expect(result.key).toBe('TCK-101');
    expect(result.status).toBe('NEW');
    expect(result.severity).toBe('Critical');
    expect(result.priority).toBe('P0');
  });

  it('triages ticket to ASSIGNED when assignee is set', async () => {
    mockRepo.findById.mockResolvedValueOnce({
      id: 'tck-1',
      status: 'NEW',
      title: 'Bug',
    });

    const result = await service.triageTicket(
      'tck-1',
      { assigneeId: 'usr-dev-1', priority: 'P1' },
      'usr-lead',
      'Tech Lead'
    );

    expect(mockRepo.update).toHaveBeenCalledWith('tck-1', expect.objectContaining({
      assigneeId: 'usr-dev-1',
      status: 'ASSIGNED',
      priority: 'P1',
    }));
  });

  it('resolves ticket and records resolution text', async () => {
    mockRepo.findById.mockResolvedValueOnce({
      id: 'tck-1',
      status: 'IN_PROGRESS',
      title: 'Bug',
    });

    await service.resolveTicket(
      'tck-1',
      { resolution: 'Optimized pool configuration and added index on key' },
      'usr-lead',
      'Tech Lead'
    );

    expect(mockRepo.update).toHaveBeenCalledWith('tck-1', expect.objectContaining({
      status: 'RESOLVED',
      resolution: 'Optimized pool configuration and added index on key',
    }));
  });
});
