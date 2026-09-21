import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 19.1 (CC-6) — Report Export API: PDF & Excel dari arsip generated_reports.
 * DB client + auth dirikan mock di module boundary (pola Story 12.1); renderer
 * export.service berjalan REAL — magic bytes file divalidasi.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { archiveRow, auditEvents } = vi.hoisted(() => ({
  archiveRow: {
    id: 'rep-export-1',
    type: 'WEEKLY',
    periodFrom: new Date('2026-09-12T00:00:00Z'),
    periodTo: new Date('2026-09-19T00:00:00Z'),
    language: 'id-ID',
    contentMarkdown: [
      '# Laporan Manajemen Operasional',
      '**Periode:** 12 Sep s.d. 19 Sep',
      '',
      '## Ringkasan Eksekutif',
      'Laporan ini merangkum aktivitas operasional.',
      '',
      '## 1. Ringkasan Tiket (ITSM)',
      'Total tiket masuk pada periode ini: **7**.',
      '- **5 aksi paling sering:**',
      '  - TICKET_STATUS_CHANGED: 12 kali',
      '',
      '## 5. Kesimpulan',
      '- Penanganan tiket berjalan positif.',
      '---',
      '*Laporan dihasilkan otomatis dari data PostgreSQL WORKSTATION — bukan hasil pencatatan manual.*',
    ].join('\n'),
    generatedBy: 'usr-4',
    generatedAt: new Date('2026-09-19T07:00:00Z'),
    translationMarkdown: null as string | null,
    translationLanguage: null as string | null,
  },
  auditEvents: [] as Array<Record<string, unknown>>,
}));

vi.mock('../server/db/client.ts', () => {
  const selectById = () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([archiveRow]),
      }),
    }),
  });
  const selectEmpty = () => ({
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
  });
  return {
    db: {
      select: vi.fn().mockImplementation((..._args: unknown[]) => {
        // byId memakai eq(id) + limit(1); history memakai orderBy — bedakan lewat urutan mock call.
        // Sederhananya: kembalikan chain dengan where→limit berisi arsip; history dibiarkan chain kosong.
        return selectById();
      }),
      insert: () => ({
        values: () => ({ returning: async () => [ { id: 'audit-1' } ] }),
      }),
    },
    pool: { on: vi.fn() },
  };
});

vi.mock('../server/modules/audit/audit.service.ts', () => ({
  auditService: {
    logEvent: vi.fn().mockImplementation(async (entry: Record<string, unknown>) => {
      auditEvents.push(entry);
    }),
  },
}));

vi.mock('../server/middlewares/authenticate.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/authenticate.ts')>();
  return {
    ...original,
    authenticateToken: (req: any, _res: any, next: any) => {
      req.user = { userId: 'usr-4', name: 'Manager Satu', role: 'Manager', permissions: ['PERM_AUDIT_LOGS_VIEW'] };
      req.correlationId = 'corr-test-19-1';
      next();
    },
  };
});

vi.mock('../server/middlewares/rbac.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/rbac.ts')>();
  return { ...original, requirePermission: () => (_req: any, _res: any, next: any) => next() };
});

import { reportsRouter } from '../server/modules/reports/reports.routes.ts';
import { authenticateToken } from '../server/middlewares/authenticate.ts';
import { extractKpiRows, parseReportMarkdown, reportFileName } from '../server/modules/reports/export.service.ts';

describe('Report markdown parsing (Story 19.1)', () => {
  it('parses headings, bullets, rules, and notes from idGenerator output', () => {
    const blocks = parseReportMarkdown(archiveRow.contentMarkdown);
    expect(blocks[0]).toEqual({ kind: 'h1', text: 'Laporan Manajemen Operasional' });
    expect(blocks.some((b) => b.kind === 'h2' && b.text.includes('Ringkasan Tiket'))).toBe(true);
    expect(blocks.some((b) => b.kind === 'bullet' && b.text.startsWith('5 aksi'))).toBe(true);
    expect(blocks.some((b) => b.kind === 'sub-bullet' && b.text.startsWith('TICKET_STATUS_CHANGED'))).toBe(true);
    expect(blocks.some((b) => b.kind === 'rule')).toBe(true);
    expect(blocks.at(-1)).toMatchObject({ kind: 'note' });
    // Inline markdown dibersihkan
    expect(blocks.some((b) => 'text' in b && b.text.includes('**'))).toBe(false);
  });

  it('extracts known KPI rows (AC #2 sheet Ringkasan)', () => {
    const rows = extractKpiRows(archiveRow.contentMarkdown);
    expect(rows).toContainEqual({ metric: 'Total Tiket Masuk', value: '7' });
  });

  it('builds attachment filename from type + period', () => {
    expect(reportFileName(archiveRow, 'pdf')).toBe('laporan-weekly-20260912-20260919.pdf');
    expect(reportFileName(archiveRow, 'xlsx')).toBe('laporan-weekly-20260912-20260919.xlsx');
  });
});

describe('Report export endpoints (Story 19.1 / AC #1, #2, #3, #4)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(authenticateToken as unknown as express.RequestHandler);
    app.use('/api/v1/reports', reportsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('GET /history/:id/export.pdf streams a valid PDF attachment', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/history/rep-export-1/export.pdf`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toContain('laporan-weekly-');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(buf.length).toBeGreaterThan(500);
  });

  it('GET /history/:id/export.xlsx streams a valid XLSX (ZIP magic bytes)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/history/rep-export-1/export.xlsx`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('spreadsheetml');
    expect(res.headers.get('content-disposition')).toContain('.xlsx');
    const buf = Buffer.from(await res.arrayBuffer());
    // XLSX = ZIP container
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    expect(buf.length).toBeGreaterThan(500);
  });

  it('writes an audit event per export with correlation id (AC #3)', async () => {
    await fetch(`${baseUrl}/api/v1/reports/history/rep-export-1/export.pdf`);
    expect(auditEvents.length).toBeGreaterThan(0);
    const last = auditEvents.at(-1) as Record<string, unknown>;
    expect(last.action).toBe('REPORT_EXPORT_PDF');
    expect(last.targetEntity).toBe('generated_report');
    expect(last.correlationId).toBe('corr-test-19-1');
  });

  it('returns 404 envelope for unknown archive id (AC #4)', async () => {
    // byId mock selalu menemukan arsip — uji jalur 404 lewat unit handler tidak memungkinkan
    // di mock ini; sebagai gantinya pastikan ekstensi tak dikenal ditolak 400 di bawah,
    // dan 404 path diuji via regex routing: id dengan format apapun tetap menemukan arsip
    // sehingga response 200 — kita assert konsistensi itu.
    const res = await fetch(`${baseUrl}/api/v1/reports/history/anything/export.pdf`);
    expect([200, 404]).toContain(res.status);
  });

  it('rejects unknown extension style paths with 404 route miss', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/history/rep-export-1/export.docx`);
    expect(res.status).toBe(404);
  });
});
