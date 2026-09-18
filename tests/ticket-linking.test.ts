import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvidenceService } from '../server/modules/tickets/evidence.service.ts';
import { ticketRepository } from '../server/modules/tickets/ticket.repository.ts';
import { workItemRepository } from '../server/modules/work-items/work-item.repository.ts';
import { workItemService } from '../server/modules/work-items/work-item.service.ts';

describe('Ticket ↔ Work Item Linking Unit Tests', () => {
  let service: EvidenceService;

  beforeEach(() => {
    service = new EvidenceService();
  });

  it('links existing ticket to work item and creates evidence link', async () => {
    vi.spyOn(ticketRepository, 'findById').mockResolvedValueOnce({
      id: 'tck-1',
      key: 'TCK-10',
      title: 'Crash on payment',
    } as any);

    vi.spyOn(workItemRepository, 'findById').mockResolvedValueOnce({
      id: 'wi-1',
      key: 'WRK-20',
      title: 'Fix payment crash',
    } as any);

    vi.spyOn(service, 'linkTicketToWorkItem').mockResolvedValueOnce({
      id: 'ev-1',
      ticketId: 'tck-1',
      workItemId: 'wi-1',
      commitSha: null,
      prId: null,
      deploymentId: null,
      createdAt: new Date(),
    });

    const link = await service.linkTicketToWorkItem('tck-1', 'wi-1');
    expect(link.ticketId).toBe('tck-1');
    expect(link.workItemId).toBe('wi-1');
  });

  it('creates work item automatically from ticket', async () => {
    vi.spyOn(ticketRepository, 'findById').mockResolvedValueOnce({
      id: 'tck-2',
      key: 'TCK-11',
      projectId: 'prj-1',
      title: 'Memory leak',
      priority: 'P1',
    } as any);

    vi.spyOn(workItemService, 'createWorkItem').mockResolvedValueOnce({
      id: 'wi-2',
      key: 'WRK-30',
      title: '[Ticket TCK-11] Memory leak',
    } as any);

    vi.spyOn(service, 'linkTicketToWorkItem').mockResolvedValueOnce({
      id: 'ev-2',
      ticketId: 'tck-2',
      workItemId: 'wi-2',
      commitSha: null,
      prId: null,
      deploymentId: null,
      createdAt: new Date(),
    });

    const result = await service.createWorkItemFromTicket('tck-2', 'usr-1', 'Dev', 'corr-1');
    expect(result.workItem.id).toBe('wi-2');
    expect(result.link.ticketId).toBe('tck-2');
  });
});
