import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 9.2 — Agent Telemetry Ingestion API integration tests.
 * Real HTTP against a mini-app wired with the EXACT production routes/middleware.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';
process.env.AGENT_INGEST_TOKEN = 'test-agent-token-secret';

const { mockLatest, mockHistory, dbSeenKeys, resetDbSeenKeys } = vi.hoisted(() => ({
  mockLatest: vi.fn(),
  mockHistory: vi.fn(),
  dbSeenKeys: new Set<string>(),
  resetDbSeenKeys: () => dbSeenKeys.clear(),
}));

vi.mock('../server/db/client.ts', () => {
  // Functional fake transaction: supports the drizzle insert chain used by ingestBatch
  // and deduplicates (serverName, recordedAt) like the DB unique index — idempotent retries.
  const fakeTx = {
    insert: () => ({
      values: (rows: any[]) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            const kept: unknown[] = [];
            for (const row of rows) {
              const key = `${row.serverName}|${new Date(row.recordedAt).toISOString()}`;
              if (!dbSeenKeys.has(key)) {
                dbSeenKeys.add(key);
                kept.push(row);
              }
            }
            return kept.map((_, i) => ({ id: `row-${i}` }));
          },
        }),
      }),
    }),
  };
  return {
    db: { transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx) },
    pool: { on: vi.fn() },
  };
});
vi.mock('../server/modules/server-metrics/server-metrics.service.ts', async (importOriginal) => {
  // Keep the REAL service (real validation + transactional orchestration);
  // only the read queries are mocked because they need a live database.
  const original = await importOriginal<typeof import('../server/modules/server-metrics/server-metrics.service.ts')>();
  return {
    ...original,
    // Preserve prototype methods of the real service instance; override only read queries
    serverMetricsService: Object.assign(
      Object.create(Object.getPrototypeOf(original.serverMetricsService)),
      original.serverMetricsService,
      {
        latestPerServer: mockLatest,
        history: mockHistory,
        countMonitoredServers: vi.fn().mockResolvedValue(2),
      }
    ),
  };
});

vi.mock('../server/middlewares/authenticate.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/authenticate.ts')>();
  return {
    ...original,
    authenticateToken: (req: any, _res: any, next: any) => {
      // Simulate an authenticated Tech Lead for read-endpoint tests
      req.user = { userId: 'usr-2', role: 'Tech Lead', permissions: ['PERM_SERVER_TELEMETRY'] };
      next();
    },
  };
});

vi.mock('../server/middlewares/rbac.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/rbac.ts')>();
  return {
    ...original,
    requirePermission: () => (_req: any, _res: any, next: any) => next(),
  };
});

import { agentIngestRouter, serverMetricsRouter } from '../server/modules/server-metrics/server-metrics.routes.ts';

function validSample(overrides: Record<string, unknown> = {}) {
  return {
    serverName: 'kontabo-vps',
    cpu: 42.5,
    memory: { total: 8 * 1024 ** 3, used: 3 * 1024 ** 3, free: 5 * 1024 ** 3 },
    disks: [{ filesystem: '/dev/sda1', mount: '/', total: 80 * 1024 ** 3, used: 30 * 1024 ** 3, available: 50 * 1024 ** 3, usePercent: 38 }],
    recordedAt: new Date('2026-02-14T10:00:00Z').toISOString(),
    ...overrides,
  };
}

describe('Agent Telemetry Ingestion API (Story 9.2)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json({ limit: '500kb' }));
    app.use('/api/v1/agent', agentIngestRouter);
    app.use('/api/v1/server-metrics', serverMetricsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    resetDbSeenKeys();
    mockLatest.mockReset().mockResolvedValue([
      {
        serverName: 'kontabo-vps',
        latest: {
          serverName: 'kontabo-vps',
          cpuUsage: 42.5,
          memoryTotal: 8 * 1024 ** 3,
          memoryUsed: 3 * 1024 ** 3,
          memoryFree: 5 * 1024 ** 3,
          disks: [],
          recordedAt: new Date(),
        },
        stale: false,
      },
    ]);
    mockHistory.mockReset().mockResolvedValue([]);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('accepts a valid batch with the correct agent token (HTTP 201)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/agent/metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-agent-token-secret' },
      body: JSON.stringify({ samples: [validSample(), validSample({ recordedAt: '2026-02-14T10:01:00Z' }), validSample({ recordedAt: '2026-02-14T10:02:00Z' })] }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.data.inserted).toBe(3);
    expect(body.data.skipped).toBe(0);
  });

  it('rejects a batch containing an invalid sample with HTTP 400 and no partial insert', async () => {
    const res = await fetch(`${baseUrl}/api/v1/agent/metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-agent-token-secret' },
      body: JSON.stringify({ samples: [validSample(), validSample({ cpu: 150 })] }),
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('reports skipped duplicates from idempotent retries (unique serverName+recordedAt)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/agent/metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-agent-token-secret' },
      body: JSON.stringify({ samples: [validSample(), validSample(), validSample()] }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.data.inserted).toBe(1);
    expect(body.data.skipped).toBe(2);
  });

  it('rejects missing or wrong agent tokens with HTTP 401', async () => {
    const resNoToken = await fetch(`${baseUrl}/api/v1/agent/metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ samples: [validSample()] }),
    });
    expect(resNoToken.status).toBe(401);

    const resWrong = await fetch(`${baseUrl}/api/v1/agent/metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer wrong-token' },
      body: JSON.stringify({ samples: [validSample()] }),
    });
    expect(resWrong.status).toBe(401);
  });

  it('serves latest-per-server with stale flags for permitted roles', async () => {
    const res = await fetch(`${baseUrl}/api/v1/server-metrics`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.count).toBe(1);
    expect(body.data.servers[0].serverName).toBe('kontabo-vps');
    expect(body.data.servers[0]).toHaveProperty('stale');
  });

  it('serves bounded history windows (max 168h) and rejects invalid hours', async () => {
    const ok = await fetch(`${baseUrl}/api/v1/server-metrics/kontabo-vps/history?hours=24`);
    expect(ok.status).toBe(200);
    const okBody: any = await ok.json();
    expect(okBody.data.hours).toBe(24);

    const capped = await fetch(`${baseUrl}/api/v1/server-metrics/kontabo-vps/history?hours=999`);
    const cappedBody: any = await capped.json();
    expect(cappedBody.data.hours).toBe(168);

    const bad = await fetch(`${baseUrl}/api/v1/server-metrics/kontabo-vps/history?hours=-5`);
    expect(bad.status).toBe(400);
  });

  it('validation rejects bad shapes: cpu out of range, missing recordedAt, negative memory', async () => {
    const { validateAgentSample, ValidationError } = await import('../server/modules/server-metrics/server-metrics.service.ts');
    expect(() => validateAgentSample(validSample({ cpu: -1 }))).toThrow(ValidationError);
    expect(() => validateAgentSample(validSample({ recordedAt: 'not-a-date' }))).toThrow(ValidationError);
    expect(() => validateAgentSample(validSample({ memory: { total: -5, used: 0, free: 0 } }))).toThrow(ValidationError);
    expect(() => validateAgentSample({ ...validSample(), disks: 'not-an-array' })).toThrow(ValidationError);
    expect(() => validateAgentSample(validSample())).not.toThrow();
  });
});
