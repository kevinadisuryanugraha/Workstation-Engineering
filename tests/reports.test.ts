import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 10.1 — Operational Report Aggregation API.
 * The drizzle client is replaced with a FIFO fake: each select() call resolves the
 * next registered row set, in the deterministic order used by buildPeriodSummary.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { queue, popNextRows } = vi.hoisted(() => ({
  queue: [] as any[][],
  popNextRows: () => {
    const next = queue.shift();
    return Array.isArray(next) ? next : [];
  },
}));

function makeChain(): any {
  const chain: any = {
    where: () => chain,
    groupBy: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    then: (res: any, rej: any) => Promise.resolve(popNextRows()).then(res, rej),
    catch: (rej: any) => Promise.resolve(popNextRows()).catch(rej),
  };
  return chain;
}

vi.mock('../server/db/client.ts', () => ({
  db: { select: () => ({ from: () => makeChain() }) },
  pool: { on: vi.fn() },
}));

vi.mock('../server/middlewares/authenticate.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/authenticate.ts')>();
  return {
    ...original,
    authenticateToken: (req: any, _res: any, next: any) => {
      req.user = { userId: 'usr-4', role: 'Manager', permissions: ['PERM_AUDIT_LOGS_VIEW'] };
      next();
    },
  };
});

import { buildPeriodSummary } from '../server/modules/reports/reports.repository.ts';
import { reportsRouter } from '../server/modules/reports/reports.routes.ts';
import { requirePermission } from '../server/middlewares/rbac.ts';
import { SERVER_ROLE_PERMISSIONS } from '../server/constants/permissions.ts';

function seedDefaultRows(): void {
  queue.length = 0;
  queue.push(
    [{ label: 'NEW', count: 2 }, { label: 'RESOLVED', count: 1 }], // tickets byStatus
    [{ label: 'High', count: 1 }, { label: 'Medium', count: 2 }], // tickets bySeverity
    [{ label: 'DONE', count: 1 }, { label: 'IN_PROGRESS', count: 2 }], // work items byStatus
    [{ label: 'TASK', count: 2 }, { label: 'BUG', count: 1 }], // work items byType
    [{ label: 'PRODUCTION', count: 1 }, { label: 'DEV', count: 1 }], // deployments byEnv
    [{ count: 1 }], // rollbacks
    [{ count: 2 }], // deployment total
    [{ label: 'AUTH_LOGIN_SUCCESS', count: 10 }, { label: 'DEPLOYMENT_EXECUTED', count: 4 }], // audit top
    [{ count: 25 }] // audit total
  );
}

describe('Report Aggregation (Story 10.1 / AC #2, #4, #5)', () => {
  it('aggregates exact numbers across tickets, work items, deployments, and audit', async () => {
    seedDefaultRows();
    const summary = await buildPeriodSummary(new Date('2026-02-07T00:00:00Z'), new Date('2026-02-14T00:00:00Z'));

    expect(summary.tickets.total).toBe(3);
    expect(summary.tickets.byStatus).toEqual([{ label: 'NEW', count: 2 }, { label: 'RESOLVED', count: 1 }]);
    expect(summary.tickets.bySeverity.map((s) => s.label)).toContain('High');

    expect(summary.workItems.total).toBe(3);
    expect(summary.workItems.byType.map((t) => t.label)).toContain('BUG');

    expect(summary.deployments.total).toBe(2);
    expect(summary.deployments.rollbacks).toBe(1);
    expect(summary.deployments.byEnvironment.map((e) => e.label)).toContain('PRODUCTION');

    expect(summary.audit.total).toBe(25);
    expect(summary.audit.topActions[0]).toEqual({ label: 'AUTH_LOGIN_SUCCESS', count: 10 });
  });

  it('includes period metadata (from, to, generatedAt)', async () => {
    seedDefaultRows();
    const from = new Date('2026-02-07T00:00:00Z');
    const to = new Date('2026-02-14T00:00:00Z');
    const summary = await buildPeriodSummary(from, to);
    expect(summary.from).toBe(from.toISOString());
    expect(summary.to).toBe(to.toISOString());
    expect(new Date(summary.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it('reports zero totals when there is no data (no crash, no mock-specific leak)', async () => {
    queue.length = 0;
    queue.push([], [], [], [], [], [{ count: 0 }], [{ count: 0 }], [], [{ count: 0 }]);
    const summary = await buildPeriodSummary(new Date(), new Date());
    expect(summary.tickets.total).toBe(0);
    expect(summary.deployments.rollbacks).toBe(0);
    expect(summary.audit.total).toBe(0);
  });
});

describe('Reports RBAC (Story 10.1 / AC #1)', () => {
  function makeRes() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  }

  it('Developer is rejected 403 for reports endpoints', () => {
    const req: any = { user: { role: 'Developer', permissions: SERVER_ROLE_PERMISSIONS['Developer'] } };
    const res = makeRes();
    const next = vi.fn();
    requirePermission('PERM_AUDIT_LOGS_VIEW')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('Viewer is rejected 403; Manager passes', () => {
    const viewer = makeRes();
    requirePermission('PERM_AUDIT_LOGS_VIEW')(
      { user: { role: 'Viewer', permissions: SERVER_ROLE_PERMISSIONS['Viewer'] } } as any,
      viewer,
      vi.fn()
    );
    expect(viewer.status).toHaveBeenCalledWith(403);

    const next = vi.fn();
    requirePermission('PERM_AUDIT_LOGS_VIEW')(
      { user: { role: 'Manager', permissions: SERVER_ROLE_PERMISSIONS['Manager'] } } as any,
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();
  });
});

describe('Reports API period validation (Story 10.1 / AC #3)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    // Inject an authenticated Manager so the real requirePermission check passes
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-4', role: 'Manager', permissions: SERVER_ROLE_PERMISSIONS['Manager'] };
      next();
    });
    app.use('/api/v1/reports', reportsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('rejects from >= to with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/summary?from=2026-02-14T00:00:00Z&to=2026-02-07T00:00:00Z`);
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects non-ISO garbage with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/summary?from=bukan-tanggal&to=2026-02-14T00:00:00Z`);
    expect(res.status).toBe(400);
  });

  it('from without to is rejected (period must be complete when specified)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/summary?from=2026-02-07T00:00:00Z`);
    expect(res.status).toBe(400);
  });
});
