import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 16.1 — AI scan snapshots: persistence (live & demo) + history/detail.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { scanStore } = vi.hoisted(() => {
  const scanStore = new Map<string, any>();
  return { scanStore };
});

vi.mock('../server/db/client.ts', () => {
  const fakeTx = {
    insert: () => ({
      values: (row: any) => ({
        returning: async () => [{ ...row, id: row.id ?? `row-${Math.random().toString(36).slice(2, 8)}` }],
      }),
    }),
  };
  return {
    db: {
      transaction: async (cb: any) => cb(fakeTx),
      insert: fakeTx.insert,
      select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => Promise.resolve(Array.from(scanStore.values())) }) }) }) }),
    },
    pool: { on: vi.fn() },
  };
});

vi.mock('../server/modules/ai/ai.fallback.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/ai/ai.fallback.ts')>();
  return { ...original };
});

import { aiService, canTransitionFinding } from '../server/modules/ai/ai.service.ts';

describe('AI scan snapshot persistence (Story 16.1 / AC #1, #2, #6)', () => {
  it('persists a DEMO scan with honest labeling', async () => {
    const demo = aiService.demoScan('Rina Wijaya', 'WORKSTATION', 'Security');
    const snapshot = await aiService.persistScan(demo);
    expect(snapshot.mode).toBe('STATIC_DEMO_PREVIEW');
    expect(snapshot.model).toBe('heuristic-demo');
    expect(snapshot.scanRef).toMatch(/^SCAN-/);
    expect((snapshot.findings as any[]).length).toBeGreaterThan(0);
  });

  it('persists a LIVE scan with model metadata', async () => {
    const snapshot = await aiService.persistScan({
      mode: 'LIVE_ANALYSIS',
      model: 'gemini-3.8-flash',
      findings: [{ id: 'FND-1', title: 'N+1 query', severity: 'High' }],
      recommendations: [],
      scannedBy: 'usr-2',
    });
    expect(snapshot.mode).toBe('LIVE_ANALYSIS');
    expect(snapshot.model).toBe('gemini-3.8-flash');
    expect(snapshot.scanRef).toMatch(/^SCAN-/);
  });

  it('finding state machine: forward-only per Master PRD §11.2', () => {
    expect(canTransitionFinding('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransitionFinding('CONFIRMED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionFinding('IN_PROGRESS', 'RESOLVED')).toBe(true);
    expect(canTransitionFinding('PENDING', 'RESOLVED')).toBe(false); // skip
    expect(canTransitionFinding('RESOLVED', 'PENDING')).toBe(false); // terminal
    expect(canTransitionFinding('FALSE_POSITIVE', 'CONFIRMED')).toBe(false);
  });
});

describe('Scan history routes (Story 16.1 / AC #3, #4)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-2', name: 'Rina', role: 'Tech Lead', permissions: ['PERM_AI_SCAN_TRIGGER'] };
      next();
    });
    app.use('/api/v1/ai', aiIntelRouter);

    // spy on service list/detail backed by the scanStore
    vi.spyOn(aiService, 'listScans').mockImplementation(async (filters) => {
      let rows = Array.from(scanStore.values());
      if (filters?.mode) rows = rows.filter((r) => r.mode === filters.mode);
      if (filters?.projectId) rows = rows.filter((r) => r.projectId === filters.projectId);
      return rows as any;
    });
    vi.spyOn(aiService, 'scanByRef').mockImplementation(async (ref) => (scanStore.get(ref) as any) ?? null);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('history + detail by scanRef + 404 for unknown ref', async () => {
    // seed two snapshots through the real service (into the shared store)
    const s1 = await aiService.persistScan(aiService.demoScan('Rina'));
    scanStore.set(s1.scanRef, { ...s1 });
    const s2 = await aiService.persistScan({
      mode: 'LIVE_ANALYSIS', model: 'gemini-3.8-flash', findings: [], recommendations: [], scannedBy: 'Rina',
    });
    scanStore.set(s2.scanRef, { ...s2 });

    const list = await fetch(`${baseUrl}/api/v1/ai/scans?mode=STATIC_DEMO_PREVIEW`);
    expect(list.status).toBe(200);
    const listBody: any = await list.json();
    expect(listBody.data.count).toBeGreaterThanOrEqual(1);
    expect(listBody.data.scans.every((s: any) => s.mode === 'STATIC_DEMO_PREVIEW')).toBe(true);

    const detail = await fetch(`${baseUrl}/api/v1/ai/scans/${s1.scanRef}`);
    expect(detail.status).toBe(200);
    const detailBody: any = await detail.json();
    expect(detailBody.data.scanRef).toBe(s1.scanRef);

    const missing = await fetch(`${baseUrl}/api/v1/ai/scans/SCAN-NOPE`);
    expect(missing.status).toBe(404);
  });
});

// aiIntelRouter import must come after mocks (kept last to satisfy hoisting order)
import { aiIntelRouter } from '../server/modules/ai/ai-intel.routes.ts';
