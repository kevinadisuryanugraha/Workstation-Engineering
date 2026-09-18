import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentsService } from '../server/modules/tickets/comments.service.ts';
import { ticketRepository } from '../server/modules/tickets/ticket.repository.ts';

describe('Ticket Comments & Timeline Unit Tests', () => {
  let service: CommentsService;

  beforeEach(() => {
    service = new CommentsService();
  });

  it('adds comment to ticket successfully', async () => {
    vi.spyOn(ticketRepository, 'findById').mockResolvedValueOnce({
      id: 'tck-1',
      title: 'Crash issue',
    } as any);

    vi.spyOn(service, 'addComment').mockResolvedValueOnce({
      id: 'comm-1',
      ticketId: 'tck-1',
      authorId: 'usr-dev',
      content: 'Reproduced locally on Node 22',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const comment = await service.addComment('tck-1', 'usr-dev', 'Reproduced locally on Node 22');
    expect(comment.id).toBe('comm-1');
    expect(comment.content).toContain('Reproduced locally');
  });

  it('sorts comments and history chronologically in timeline', async () => {
    vi.spyOn(ticketRepository, 'findById').mockResolvedValueOnce({
      id: 'tck-1',
      title: 'Crash issue',
    } as any);

    const time1 = new Date('2026-09-18T10:00:00Z');
    const time2 = new Date('2026-09-18T10:05:00Z');

    vi.spyOn(service, 'getTimeline').mockResolvedValueOnce([
      {
        id: 'h-1',
        type: 'STATUS_CHANGE',
        authorId: 'usr-lead',
        fieldChanged: 'status',
        oldValue: 'NEW',
        newValue: 'IN_PROGRESS',
        createdAt: time1,
      },
      {
        id: 'c-1',
        type: 'COMMENT',
        authorId: 'usr-dev',
        content: 'Working on it',
        createdAt: time2,
      },
    ]);

    const timeline = await service.getTimeline('tck-1');
    expect(timeline.length).toBe(2);
    expect(timeline[0].type).toBe('STATUS_CHANGE');
    expect(timeline[1].type).toBe('COMMENT');
  });
});
