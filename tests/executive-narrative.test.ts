import { describe, it, expect } from 'vitest';
import { generateIdReport, buildExecutiveSentences, buildTrendSection } from '../server/modules/reports/idGenerator.ts';
import type { PeriodReportSummary } from '../server/modules/reports/reports.repository.ts';

/**
 * Story 12.2 — Executive narrative & period-over-period trends.
 */

function makeSummary(overrides: Partial<PeriodReportSummary> = {}): PeriodReportSummary {
  return {
    from: '2026-02-09T00:00:00.000Z',
    to: '2026-02-16T00:00:00.000Z',
    generatedAt: new Date().toISOString(),
    tickets: { byStatus: [{ label: 'NEW', count: 7 }, { label: 'CLOSED', count: 1 }], bySeverity: [], total: 8 },
    workItems: { byStatus: [], byType: [{ label: 'TASK', count: 5 }], total: 5 },
    deployments: { byEnvironment: [{ label: 'PRODUCTION', count: 3 }], total: 3, rollbacks: 1 },
    audit: { topActions: [], total: 120 },
    ...overrides,
  };
}

describe('Executive summary (Story 12.2 / AC #1)', () => {
  it('produces 3-5 management-language sentences with real numbers', () => {
    const sentences = buildExecutiveSentences(makeSummary());
    expect(sentences.length).toBeGreaterThanOrEqual(3);
    expect(sentences.length).toBeLessThanOrEqual(5);
    const text = sentences.join(' ');
    expect(text).toContain('8 tiket layanan');
    expect(text).toContain('5 pekerjaan teknis');
    expect(text).not.toMatch(/JSON|endpoint|API/); // no technical jargon
  });

  it('warns management when rollbacks occurred', () => {
    const text = buildExecutiveSentences(makeSummary({ deployments: { byEnvironment: [], total: 3, rollbacks: 1 } })).join(' ');
    expect(text).toContain('pembatalan (rollback)');
  });

  it('appears at the top of the generated report', () => {
    const report = generateIdReport(makeSummary(), {});
    const execPos = report.indexOf('## Ringkasan Eksekutif');
    const tiketPos = report.indexOf('## 1. Ringkasan Tiket');
    expect(execPos).toBeGreaterThan(-1);
    expect(execPos).toBeLessThan(tiketPos);
  });
});

describe('Trend section (Story 12.2 / AC #2, #3, #4)', () => {
  it('compares the five required metrics with deltas in a Markdown table', () => {
    const current = makeSummary();
    const previous = makeSummary({
      tickets: { byStatus: [{ label: 'NEW', count: 3 }], bySeverity: [], total: 3 },
      deployments: { byEnvironment: [], total: 4, rollbacks: 0 },
      audit: { topActions: [], total: 100 },
    });
    const lines = buildTrendSection(current, previous);
    const table = lines.filter((l) => l.startsWith('|')).join('\n');
    expect(table).toContain('Total tiket');
    expect(table).toContain('Total work item');
    expect(table).toContain('Total deployment');
    expect(table).toContain('Rollback');
    expect(table).toContain('Event audit');
    expect(table).toContain('naik 5'); // tickets 8 vs 3 → +5 = +167%
    expect(table).toContain('turun 1'); // deployments 3 vs 4
  });

  it('adds a management warning when rollbacks increased vs previous period', () => {
    const lines = buildTrendSection(makeSummary(), makeSummary({ deployments: { byEnvironment: [], total: 5, rollbacks: 0 } }));
    const text = lines.join('\n');
    expect(text).toContain('perhatian manajemen');
  });

  it('notes positive trend when active tickets decrease', () => {
    const previous = makeSummary({ tickets: { byStatus: [{ label: 'NEW', count: 20 }], bySeverity: [], total: 20 } });
    const lines = buildTrendSection(makeSummary(), previous);
    expect(lines.join('\n')).toContain('indikasi positif');
  });

  it('handles empty comparison data gracefully (no NaN, explicit sentence)', () => {
    const emptyPrevious = makeSummary({
      tickets: { byStatus: [], bySeverity: [], total: 0 },
      workItems: { byStatus: [], byType: [], total: 0 },
      deployments: { byEnvironment: [], total: 0, rollbacks: 0 },
      audit: { topActions: [], total: 0 },
    });
    const lines = buildTrendSection(makeSummary(), emptyPrevious);
    const text = lines.join('\n');
    expect(text).toContain('Belum ada data pembanding');
    expect(text).not.toContain('NaN');
  });

  it('is omitted entirely when no previous period is provided (backward compatibility)', () => {
    const report = generateIdReport(makeSummary());
    expect(report).not.toContain('## Tren vs Periode Sebelumnya');
  });
});
