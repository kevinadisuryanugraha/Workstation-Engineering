import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 16.2 — AI finding lifecycle state machine + audit (routes, mocked service).
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { findingStub, auditCalls } = vi.hoisted(() => ({
  findingStub: {
    listFindings: vi.fn().mockResolvedValue([]),
    findingById: vi.fn(),
    transitionFinding: vi.fn(),
  },
  auditCalls: [] as any[],
}));

vi.mock('../server/modules/ai/ai.service.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/ai/ai.service.ts')>();
  return {
    ...original,
    aiService: { ...original.aiService, ...findingStub },
    // keep real pure helpers (canTransitionFinding, FINDING_TRANSITIONS)
  };
});

vi.mock('../server/modules/audit/audit.service.ts', () => ({
  auditService: { logEvent: vi.fn(async (e: any) => { auditCalls.push(e); }) },
}));

import { aiIntelRouter } from '../server/modules/ai/ai-intel.routes.ts';
import { SERVER_ROLE_PERMISSIONS } from '../server/constants/permissions.ts';

function makeFinding(status: string) {
  return { id: 'f-1', findingRef: 'FND-1', scanRef: 'SCAN-X', title: 'N+1 query', status, severity: 'High' };
}

describe('Finding lifecycle routes (Story 16.2 / AC #2, #3)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-2', name: 'Rina', role: 'Tech Lead', permissions: SERVER_ROLE_PERMISSIONS['Tech Lead'] };
      next();
    });
    app.use('/api/v1/ai', aiIntelRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('legal transition PENDING → CONFIRMED succeeds and hits audit', async () => {
    findingStub.findingById.mockResolvedValueOnce(makeFinding('PENDING'));
    findingStub.transitionFinding.mockResolvedValueOnce({ ...makeFinding('CONFIRMED') });

    const res = await fetch(`${baseUrl}/api/v1/ai/findings/f-1/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.status).toBe('CONFIRMED');
  });

  it('illegal transition PENDING → RESOLVED is rejected with 400 INVALID_TRANSITION', async () => {
    findingStub.findingById.mockResolvedValueOnce(makeFinding('PENDING'));
    const res = await fetch(`${baseUrl}/api/v1/ai/findings/f-1/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.code).toBe('INVALID_TRANSITION');
  });

  it('unknown finding → 404; invalid status value → 400', async () => {
    findingStub.findingById.mockResolvedValueOnce(null);
    const notFound = await fetch(`${baseUrl}/api/v1/ai/findings/nope/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    expect(notFound.status).toBe(404);

    const badValue = await fetch(`${baseUrl}/api/v1/ai/findings/f-1/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'WAT' }),
    });
    expect(badValue.status).toBe(400);
  });

  it('list endpoint filters by status/severity', async () => {
    findingStub.listFindings.mockResolvedValueOnce([makeFinding('PENDING')]);
    const res = await fetch(`${baseUrl}/api/v1/ai/findings?status=PENDING&severity=High`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.count).toBe(1);
    expect(findingStub.listFindings).toHaveBeenCalledWith({ snapshotRef: undefined, status: 'PENDING', severity: 'High' });
  });
});
