import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 16.3 — Recommendation → Work Item conversion (human approval, idempotent).
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { aiStub, workItemStub } = vi.hoisted(() => ({
  aiStub: {
    listRecommendations: vi.fn().mockResolvedValue([]),
    recommendationById: vi.fn(),
    markConverted: vi.fn(),
  },
  workItemStub: {
    createWorkItem: vi.fn(),
  },
}));

vi.mock('../server/modules/ai/ai.service.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/ai/ai.service.ts')>();
  return { ...original, aiService: { ...original.aiService, ...aiStub } };
});

vi.mock('../server/modules/work-items/work-item.service.ts', () => ({
  workItemService: workItemStub,
  GateValidationError: class GateValidationError extends Error {},
}));

vi.mock('../server/modules/audit/audit.service.ts', () => ({
  auditService: { logEvent: vi.fn().mockResolvedValue(undefined) },
}));

import { aiIntelRouter } from '../server/modules/ai/ai-intel.routes.ts';
import { SERVER_ROLE_PERMISSIONS } from '../server/constants/permissions.ts';

function makeRec(converted: string | null) {
  return {
    id: 'rec-1',
    snapshotId: 'snap-1',
    scanRef: 'SCAN-ABC',
    recRef: 'REC-1',
    title: 'Refactor OrderController batch query',
    reason: 'DB I/O represents 65% of latency',
    expectedImpact: 'Up to 72% p95 reduction',
    effortEstimate: '3-4 hours',
    affectedModule: 'Orders',
    confidence: 90,
    convertedWorkItemKey: converted,
  };
}

describe('Recommendation conversion (Story 16.3 / AC #3, #4, #5)', () => {
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

  it('converts a recommendation into a TECH_DEBT work item with evidence (AC #3, #5)', async () => {
    aiStub.recommendationById.mockResolvedValueOnce(makeRec(null));
    workItemStub.createWorkItem.mockResolvedValueOnce({ id: 'wi-9', key: 'WRK-110' });
    aiStub.markConverted.mockResolvedValueOnce(makeRec('WRK-110'));

    const res = await fetch(`${baseUrl}/api/v1/ai/recommendations/rec-1/convert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1' }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.data.workItemKey).toBe('WRK-110');

    const created = workItemStub.createWorkItem.mock.calls[0][0];
    expect(created.type).toBe('TECH_DEBT');
    expect(created.description).toContain('SCAN-ABC');
    expect(created.description).toContain('REC-1');
  });

  it('is idempotent: already-converted recommendation → 409 with existing key (AC #4)', async () => {
    aiStub.recommendationById.mockResolvedValueOnce(makeRec('WRK-110'));
    const res = await fetch(`${baseUrl}/api/v1/ai/recommendations/rec-1/convert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1' }),
    });
    expect(res.status).toBe(409);
    const body: any = await res.json();
    expect(body.error.code).toBe('ALREADY_CONVERTED');
  });

  it('missing projectId → 400; unknown recommendation → 404', async () => {
    const bad = await fetch(`${baseUrl}/api/v1/ai/recommendations/rec-1/convert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(bad.status).toBe(400);

    aiStub.recommendationById.mockResolvedValueOnce(null);
    const missing = await fetch(`${baseUrl}/api/v1/ai/recommendations/nope/convert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1' }),
    });
    expect(missing.status).toBe(404);
  });

  it('list marks converted recommendations', async () => {
    aiStub.listRecommendations.mockResolvedValueOnce([makeRec('WRK-110'), makeRec(null)]);
    const res = await fetch(`${baseUrl}/api/v1/ai/recommendations?snapshotRef=snap-1`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.recommendations[0].converted).toBe(true);
    expect(body.data.recommendations[1].converted).toBe(false);
  });
});
