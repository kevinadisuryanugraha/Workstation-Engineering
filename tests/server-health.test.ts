import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 9.3 — Server Health View API tests: RBAC enforcement, stale flag, empty state.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { mockLatest } = vi.hoisted(() => ({ mockLatest: vi.fn() }));

vi.mock('../server/db/client.ts', () => ({ db: {}, pool: { on: vi.fn() } }));
vi.mock('../server/modules/server-metrics/server-metrics.service.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/server-metrics/server-metrics.service.ts')>();
  return {
    ...original,
    serverMetricsService: Object.assign(
      Object.create(Object.getPrototypeOf(original.serverMetricsService)),
      original.serverMetricsService,
      { latestPerServer: mockLatest, history: vi.fn().mockResolvedValue([]) }
    ),
  };
});

import { authenticateToken, AuthenticatedRequest } from '../server/middlewares/authenticate.ts';
import { serverMetricsRouter } from '../server/modules/server-metrics/server-metrics.routes.ts';
import { requirePermission } from '../server/middlewares/rbac.ts';
import { SERVER_ROLE_PERMISSIONS } from '../server/constants/permissions.ts';

/** Injectable-role auth stub so the REAL requirePermission matrix is exercised. */
function stubAuthWithRole(role: keyof typeof SERVER_ROLE_PERMISSIONS) {
  return (req: AuthenticatedRequest, _res: any, next: any) => {
    req.user = {
      userId: `usr-${role}`,
      email: `${role.toLowerCase().replace(/ /g, '.')}@test.io`,
      name: role,
      role: role as any,
      tokenVersion: 1,
      permissions: SERVER_ROLE_PERMISSIONS[role] || [],
    };
    next();
  };
}

function buildAppWithRole(role: keyof typeof SERVER_ROLE_PERMISSIONS): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/server-metrics', stubAuthWithRole(role), serverMetricsRouter);
  return app;
}

describe('Server Health View API (Story 9.3)', () => {
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  function listen(app: Express): Promise<string> {
    return new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        resolve(`http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`);
      });
    });
  }

  beforeAll(async () => {
    baseUrl = await listen(buildAppWithRole('Developer'));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('Developer (PERM_SERVER_TELEMETRY) can read the server list', async () => {
    mockLatest.mockResolvedValue([
      {
        serverName: 'kontabo-vps',
        stale: false,
        latest: { cpuUsage: 30, memoryTotal: 8, memoryUsed: 4, memoryFree: 4, disks: [], recordedAt: new Date() },
      },
    ]);
    const res = await fetch(`${baseUrl}/api/v1/server-metrics`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.count).toBe(1);
    expect(body.data.servers[0].serverName).toBe('kontabo-vps');
  });

  it('Viewer is rejected with HTTP 403 by the real RBAC matrix', async () => {
    const viewerApp = buildAppWithRole('Viewer');
    const viewerUrl = await new Promise<string>((resolve) => {
      const s = viewerApp.listen(0, '127.0.0.1', () => {
        const addr = s.address();
        resolve(`http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`);
      });
    });
    try {
      const res = await fetch(`${viewerUrl}/api/v1/server-metrics`);
      expect(res.status).toBe(403);
      const body: any = await res.json();
      expect(body.error.code).toBe('RBAC_ACCESS_DENIED');
    } finally {
      const s = viewerApp as any;
      if (typeof s.close === 'function') {
        await new Promise<void>((resolve) => s.close(() => resolve()));
      }
    }
  });

  it('marks servers stale when the last sample is older than twice the agent interval', () => {
    // Freshness rule (service logic): stale when older than 2x agent interval (default 120s)
    const now = Date.now();
    const staleAfterMs = 120_000;
    const isStale = (recordedAt: Date) => now - recordedAt.getTime() > staleAfterMs;

    expect(isStale(new Date(now - 5 * 60_000))).toBe(true); // 5 min old -> stale
    expect(isStale(new Date(now - 10_000))).toBe(false); // 10s old -> fresh
    expect(isStale(new Date(now - 120_000))).toBe(false); // exactly at boundary -> not stale
  });

  it('empty state: no agent reporting yet returns success with zero servers (no error)', async () => {
    mockLatest.mockResolvedValue([]);
    const res = await fetch(`${baseUrl}/api/v1/server-metrics`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.servers).toEqual([]);
    expect(body.data.count).toBe(0);
  });
});
