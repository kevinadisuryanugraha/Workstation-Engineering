import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 12.1 — Generated Reports Storage & Scheduling Endpoints.
 * DB client + aggregation are faked at the module boundary; the generation,
 * archiving, and history semantics run through the REAL service.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { insertedRows } = vi.hoisted(() => ({
  insertedRows: [] as any[],
}));

vi.mock('../server/db/client.ts', () => {
  const fakeTx = {
    insert: () => ({
      values: (row: any) => ({
        returning: async () => {
          const full = { id: `rep-${insertedRows.length + 1}`, generatedAt: new Date(), language: 'id-ID', ...row };
          insertedRows.push(full);
          return [full];
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
        orderBy: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
  };
  return {
    db: {
      transaction: async (cb: any) => cb(fakeTx),
      insert: fakeTx.insert,
      select: fakeTx.select,
    },
    pool: { on: vi.fn() },
  };
});

vi.mock('../server/modules/reports/reports.repository.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/reports/reports.repository.ts')>();
  return {
    ...original,
    buildPeriodSummary: vi.fn().mockResolvedValue({
      from: '2026-02-07T00:00:00.000Z',
      to: '2026-02-14T00:00:00.000Z',
      generatedAt: new Date().toISOString(),
      tickets: { byStatus: [{ label: 'NEW', count: 2 }], bySeverity: [], total: 2 },
      workItems: { byStatus: [], byType: [], total: 0 },
      deployments: { byEnvironment: [], total: 0, rollbacks: 0 },
      audit: { topActions: [], total: 5 },
    }),
  };
});

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

vi.mock('../server/middlewares/rbac.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/rbac.ts')>();
  return { ...original, requirePermission: () => (_req: any, _res: any, next: any) => next() };
});

import { generatedReportsService, resolveReportPeriod, REPORT_TYPES } from '../server/modules/reports/generated-reports.service.ts';
import { reportsRouter } from '../server/modules/reports/reports.routes.ts';

describe('Report period resolution (Story 12.1 / AC #2)', () => {
  it('maps DAILY/WEEKLY/MONTHLY to 1/7/30-day lookback windows', () => {
    const now = new Date('2026-02-14T12:00:00Z');
    expect(resolveReportPeriod('DAILY', now).from.getTime()).toBe(now.getTime() - 1 * 24 * 3600 * 1000);
    expect(resolveReportPeriod('WEEKLY', now).from.getTime()).toBe(now.getTime() - 7 * 24 * 3600 * 1000);
    expect(resolveReportPeriod('MONTHLY', now).from.getTime()).toBe(now.getTime() - 30 * 24 * 3600 * 1000);
    expect(REPORT_TYPES).toEqual(['DAILY', 'WEEKLY', 'MONTHLY']);
  });
});

describe('Generated report archiving (Story 12.1 / AC #2, #5)', () => {
  it('generates, archives, and returns an immutable Indonesian report', async () => {
    const report = await generatedReportsService.generate('WEEKLY', 'usr-4');
    expect(report.type).toBe('WEEKLY');
    expect(report.contentMarkdown).toContain('# Laporan Manajemen Operasional');
    expect(report.contentMarkdown).toContain('Ringkasan Tiket');
    expect(insertedRows).toHaveLength(1);
  });
});

describe('Reports API endpoints (Story 12.1 / AC #2, #3)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/reports', reportsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('POST /generate rejects an invalid type with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'YEARLY' }),
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('POST /generate accepts a valid type and returns the archived report', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'DAILY' }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.data.type).toBe('DAILY');
    expect(body.data.contentMarkdown).toContain('Laporan Manajemen');
  });

  it('GET /history validates the type filter', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/history?type=NOPE`);
    expect(res.status).toBe(400);
  });
});
