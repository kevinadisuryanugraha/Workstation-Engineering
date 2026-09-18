import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 14.1/14.2 — Sprint management & board tests.
 * Pure classification rules + route behavior with mocked service.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { sprintStub } = vi.hoisted(() => ({
  sprintStub: {
    byId: vi.fn(),
    listByProject: vi.fn(),
    createSprint: vi.fn(),
    updateSprint: vi.fn(),
    board: vi.fn(),
    projectSprintSummaries: vi.fn(),
    listMilestones: vi.fn().mockResolvedValue([]),
    createMilestone: vi.fn(),
    assertAssignmentTargets: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../server/modules/sprints/sprint.service.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/sprints/sprint.service.ts')>();
  return { ...original, sprintService: sprintStub };
});

// Pure classification (no mocks)
import { classifySprintBoard } from '../server/modules/sprints/sprint.service.ts';
import { sprintRouter, milestoneRouter } from '../server/modules/sprints/sprint.routes.ts';
import { SERVER_ROLE_PERMISSIONS } from '../server/constants/permissions.ts';
import type { Sprint, SprintBoardItem } from '../server/modules/sprints/sprint.service.ts';

function makeSprint(status: 'PLANNED' | 'ACTIVE' | 'CLOSED'): Sprint {
  return {
    id: 'spr-1',
    projectId: 'proj-1',
    name: 'Sprint 1',
    goal: 'Deliver core',
    startDate: new Date('2026-02-10'),
    endDate: new Date('2026-02-24'),
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function item(key: string, status: string): SprintBoardItem {
  return { key, title: `Item ${key}`, status, type: 'TASK' };
}

describe('Sprint board classification (Story 14.2 — pure)', () => {
  it('ACTIVE sprint: not-done items stay planned (no carry-over)', () => {
    const board = classifySprintBoard(makeSprint('ACTIVE'), [item('WRK-1', 'DONE'), item('WRK-2', 'IN_PROGRESS')]);
    expect(board.counts).toEqual({ planned: 2, completed: 1, carryOver: 0 });
    expect(board.completionPercent).toBe(50);
    expect(board.carryOver).toHaveLength(0);
  });

  it('CLOSED sprint: not-done items become carry-over, planned shrinks to completed', () => {
    const board = classifySprintBoard(makeSprint('CLOSED'), [
      item('WRK-1', 'DONE'),
      item('WRK-2', 'IN_PROGRESS'),
      item('WRK-3', 'BACKLOG'),
    ]);
    expect(board.counts).toEqual({ planned: 1, completed: 1, carryOver: 2 });
    expect(board.completionPercent).toBe(33);
  });

  it('empty sprint → completionPercent 0 (no NaN)', () => {
    const board = classifySprintBoard(makeSprint('ACTIVE'), []);
    expect(board.completionPercent).toBe(0);
    expect(board.counts.planned).toBe(0);
  });
});

describe('Sprint routes (Story 14.1 — mocked service)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-2', name: 'Rina Wijaya', role: 'Tech Lead' , permissions: SERVER_ROLE_PERMISSIONS['Tech Lead'] };
      next();
    });
    app.use('/api/v1/sprints', sprintRouter);
    app.use('/api/v1/milestones', milestoneRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('POST /sprints rejects missing name with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/sprints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /sprints rejects invalid status with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/sprints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', name: 'S1', status: 'WAT' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /sprints creates via service and returns 201', async () => {
    sprintStub.createSprint.mockResolvedValueOnce({ id: 'spr-new', projectId: 'proj-1', name: 'Sprint 2', status: 'PLANNED' });
    const res = await fetch(`${baseUrl}/api/v1/sprints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', name: 'Sprint 2', goal: 'Stabilize' }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.data.name).toBe('Sprint 2');
    expect(sprintStub.createSprint).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'proj-1', name: 'Sprint 2' }));
  });

  it('one-ACTIVE rule violation surfaces as HTTP 400 with clear message', async () => {
    const { SprintValidationError } = await import('../server/modules/sprints/sprint.service.ts');
    sprintStub.createSprint.mockRejectedValueOnce(
      new SprintValidationError('Project ini sudah memiliki sprint ACTIVE — tutup (CLOSED) sprint aktif terlebih dahulu.')
    );
    const res = await fetch(`${baseUrl}/api/v1/sprints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', name: 'Sprint 3', status: 'ACTIVE' }),
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.code).toBe('SPRINT_VALIDATION_FAILED');
  });

  it('GET /:id/board returns the board payload', async () => {
    const boardData = {
      sprint: makeSprint('ACTIVE'),
      planned: [item('WRK-1', 'IN_PROGRESS')],
      completed: [item('WRK-2', 'DONE')],
      carryOver: [],
      counts: { planned: 2, completed: 1, carryOver: 0 },
      completionPercent: 50,
    };
    sprintStub.board.mockResolvedValueOnce(boardData);
    const res = await fetch(`${baseUrl}/api/v1/sprints/spr-1/board`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.counts.completed).toBe(1);
    expect(body.data.completionPercent).toBe(50);
  });

  it('milestones: POST requires projectId+name (400) and creates when valid', async () => {
    const bad = await fetch(`${baseUrl}/api/v1/milestones`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'No project' }),
    });
    expect(bad.status).toBe(400);

    sprintStub.createMilestone.mockResolvedValueOnce({ id: 'ms-1', projectId: 'proj-1', name: 'Beta Release', status: 'OPEN' });
    const ok = await fetch(`${baseUrl}/api/v1/milestones`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', name: 'Beta Release', targetDate: '2026-03-01' }),
    });
    expect(ok.status).toBe(201);
  });
});
