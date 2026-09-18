import { describe, it, expect } from 'vitest';
import { generateIdReport, formatTanggalIndonesia } from '../server/modules/reports/idGenerator.ts';
import type { PeriodReportSummary } from '../server/modules/reports/reports.repository.ts';

/**
 * Story 10.2 — Bahasa Indonesia Management Summary Generator (pure function tests).
 */

function makeSummary(overrides: Partial<PeriodReportSummary> = {}): PeriodReportSummary {
  return {
    from: '2026-02-09T00:00:00.000Z',
    to: '2026-02-16T23:59:59.000Z',
    generatedAt: new Date().toISOString(),
    tickets: { byStatus: [], bySeverity: [], total: 0 },
    workItems: { byStatus: [], byType: [], total: 0 },
    deployments: { byEnvironment: [], total: 0, rollbacks: 0 },
    audit: { topActions: [], total: 0 },
    ...overrides,
  };
}

describe('ID Report Generator (Story 10.2)', () => {
  it('produces a structured Bahasa Indonesia management report', () => {
    const report = generateIdReport(
      makeSummary({
        tickets: { byStatus: [{ label: 'NEW', count: 3 }], bySeverity: [{ label: 'High', count: 2 }], total: 3 },
        workItems: { byStatus: [{ label: 'IN_PROGRESS', count: 4 }], byType: [{ label: 'TASK', count: 4 }], total: 4 },
        deployments: { byEnvironment: [{ label: 'PRODUCTION', count: 2 }], total: 2, rollbacks: 0 },
        audit: { topActions: [{ label: 'AUTH_LOGIN_SUCCESS', count: 12 }], total: 40 },
      })
    );

    expect(report).toContain('# Laporan Manajemen Operasional');
    expect(report).toContain('Periode:');
    expect(report).toContain('Ringkasan Tiket');
    expect(report).toContain('Work Item');
    expect(report).toContain('Deployment');
    expect(report).toContain('Audit Trail');
    expect(report).toContain('Kesimpulan');
  });

  it('includes a rollback warning sentence when rollbacks occurred (AC #2)', () => {
    const report = generateIdReport(makeSummary({ deployments: { byEnvironment: [], total: 3, rollbacks: 2 } }));
    expect(report).toContain('PERINGATAN');
    expect(report).toContain('2 rollback');
  });

  it('states positive release stability when there are deployments but zero rollbacks', () => {
    const report = generateIdReport(makeSummary({ deployments: { byEnvironment: [{ label: 'DEV', count: 5 }], total: 5, rollbacks: 0 } }));
    expect(report).not.toContain('PERINGATAN');
    expect(report).toContain('tanpa rollback');
  });

  it('uses explicit "tidak ada" phrasing for empty sections (AC #2)', () => {
    const report = generateIdReport(makeSummary());
    expect(report).toContain('tidak ada');
    expect(report).toContain('Tidak ada tiket masuk');
  });

  it('formats period dates in Indonesian (AC #3)', () => {
    const report = generateIdReport(makeSummary());
    expect(report).toContain('9 Februari 2026 s.d. 16 Februari 2026');
  });

  it('is a pure deterministic function of its input (AC #4)', () => {
    const summary = makeSummary({
      tickets: { byStatus: [{ label: 'NEW', count: 1 }], bySeverity: [], total: 1 },
      workItems: { byStatus: [], byType: [], total: 0 },
      deployments: { byEnvironment: [], total: 0, rollbacks: 0 },
      audit: { topActions: [], total: 5 },
    });
    expect(generateIdReport(summary)).toBe(generateIdReport(summary));
  });

  it('positive conclusion when resolved tickets exceed active ones', () => {
    const report = generateIdReport(
      makeSummary({ tickets: { byStatus: [{ label: 'RESOLVED', count: 5 }, { label: 'NEW', count: 2 }], bySeverity: [], total: 7 } })
    );
    expect(report).toContain('berjalan positif');
  });

  it('formats single-digit and double-digit dates correctly', () => {
    expect(formatTanggalIndonesia('2026-03-01T00:00:00Z')).toBe('1 Maret 2026');
    expect(formatTanggalIndonesia('2026-12-25T00:00:00Z')).toBe('25 Desember 2026');
  });
});
