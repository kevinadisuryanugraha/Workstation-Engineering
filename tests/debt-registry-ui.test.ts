import { describe, it, expect, vi } from 'vitest';

/**
 * Story 22.2 (CC-7) — Debt Registry UI.
 * Lingkungan test = node (tanpa DOM, pola 21.2) — yang diuji REAL:
 * - mapper payload registry (envelope / array / sampah → jujur, tanpa crash);
 * - filter + sort murni (aging desc, kombinasi filter, pencarian);
 * - opsi status turunan dari data aktual;
 * - guard: array kosong / bentuk aneh TIDAK pernah crash (kontrak hotfix #4).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    status?: number;
    constructor(code: string, message: string, status?: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

import { mapDebtRegistryItem, mapDebtRegistryPayload } from '../src/lib/contractMappers.ts';
import {
  filterDebtRegistry,
  deriveDebtStatusOptions,
  DEBT_ORIGIN_LABELS,
  DEBT_IMPACTS_ALL,
  type DebtRegistryFilters,
} from '../src/hooks/api/useAiIntel.ts';
import type { DebtRegistryItem } from '../src/types.ts';

const item = (over: Partial<DebtRegistryItem>): DebtRegistryItem =>
  ({
    id: 'wi-1',
    key: 'WRK-1',
    projectId: 'p1',
    title: 'Refactor modul auth',
    description: null,
    status: 'BACKLOG',
    priority: 'P2',
    ownerId: null,
    milestoneId: null,
    estimateHours: 8,
    debtOrigin: 'AI_SCAN',
    debtImpact: 'HIGH',
    debtSourceRef: 'SCAN-1/REC-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    agingDays: 200,
    agingBucket: 'CRITICAL',
    ...over,
  }) as DebtRegistryItem;

const NO_FILTER: DebtRegistryFilters = { status: 'ALL', origin: 'ALL', impact: 'ALL', query: '' };

describe('Story 22.2 — mapDebtRegistryItem (normalisasi jujur per baris)', () => {
  it('baris valid → item utuh', () => {
    const m = mapDebtRegistryItem({
      id: 'wi-9', key: 'WRK-9', projectId: 'p1', title: 'Debt', status: 'IN_PROGRESS',
      priority: 'P1', ownerId: 'usr-1', milestoneId: 'ms-1', estimateHours: 3.7,
      debtOrigin: 'tech_lead_audit', debtImpact: 'low', debtSourceRef: 'S/R',
      createdAt: '2026-06-01T00:00:00.000Z', agingDays: 45.9, agingBucket: 'AGING',
    });
    expect(m).not.toBeNull();
    expect(m!.debtOrigin).toBe('TECH_LEAD_AUDIT');
    expect(m!.debtImpact).toBe('LOW');
    expect(m!.agingDays).toBe(45); // floor
    expect(m!.agingBucket).toBe('AGING');
  });

  it('baris tanpa id/key → dibuang (null), bukan dikarang', () => {
    expect(mapDebtRegistryItem({ key: 'WRK-1' })).toBeNull();
    expect(mapDebtRegistryItem(null)).toBeNull();
    expect(mapDebtRegistryItem('bukan-objek')).toBeNull();
  });

  it('agingBucket tak dikenal → diturunkan dari agingDays (fallback jujur)', () => {
    const m = mapDebtRegistryItem({ id: 'x', key: 'WRK-2', agingDays: 100, agingBucket: 'APAPUN' });
    expect(m!.agingBucket).toBe('STALE');
  });

  it('field numerik/salah tipe → fallback aman tanpa crash', () => {
    const m = mapDebtRegistryItem({ id: 'x', key: 'WRK-3', agingDays: 'bukan-angka', estimateHours: 'banyak' });
    expect(m!.agingDays).toBe(0);
    expect(m!.agingBucket).toBe('FRESH');
    expect(m!.estimateHours).toBeNull();
  });
});

describe('Story 22.2 — mapDebtRegistryPayload (envelope / array / sampah)', () => {
  it('envelope { data, meta.summary } → items + summary ternormalisasi', () => {
    const { items, summary } = mapDebtRegistryPayload({
      success: true,
      data: [item({}), item({ id: 'wi-2', key: 'WRK-2' })],
      meta: {
        summary: {
          total: 2, open: 2,
          byStatus: { BACKLOG: 2 },
          byOrigin: { AI_SCAN: 2 },
          byImpact: { HIGH: 2 },
          byAgingBucket: { FRESH: 0, AGING: 0, STALE: 0, CRITICAL: 2 },
        },
      },
    });
    expect(items.length).toBe(2);
    expect(summary!.total).toBe(2);
    expect(summary!.byAgingBucket.CRITICAL).toBe(2);
  });

  it('baris rusak di antara baris valid → hanya valid yang lolos', () => {
    const { items } = mapDebtRegistryPayload({ data: [item({}), { rusak: true }, null, 'x'] });
    expect(items.length).toBe(1);
  });

  it('summary numerik aneh → 0, bucket wajib 4 kunci (tanpa crash)', () => {
    const { summary } = mapDebtRegistryPayload({ data: [], meta: { summary: { total: 'banyak', byAgingBucket: { FRESH: 'x' } } } });
    expect(summary!.total).toBe(0);
    expect(summary!.byAgingBucket).toEqual({ FRESH: 0, AGING: 0, STALE: 0, CRITICAL: 0 });
  });

  it('input sampah → registry kosong yang jujur', () => {
    for (const garbage of [null, undefined, 42, 'teks', {}]) {
      expect(() => mapDebtRegistryPayload(garbage)).not.toThrow();
      expect(mapDebtRegistryPayload(garbage).items).toEqual([]);
    }
  });
});

describe('Story 22.2 — filterDebtRegistry (murni, sort aging desc)', () => {
  const rows = [
    item({ id: 'a', key: 'WRK-1', title: 'Refactor auth', agingDays: 100, agingBucket: 'STALE', status: 'IN_PROGRESS', debtOrigin: 'AI_SCAN', debtImpact: 'HIGH' }),
    item({ id: 'b', key: 'WRK-2', title: 'Naikkan coverage test', agingDays: 5, agingBucket: 'FRESH', status: 'BACKLOG', debtOrigin: 'CODE_REVIEW', debtImpact: 'LOW' }),
    item({ id: 'c', key: 'WRK-3', title: 'Migrasi image lama', agingDays: 320, agingBucket: 'CRITICAL', status: 'BACKLOG', debtOrigin: 'MANUAL', debtImpact: 'MEDIUM' }),
  ];

  it('default: urut aging terlama dulu, tanpa filter', () => {
    expect(filterDebtRegistry(rows, NO_FILTER).map((r) => r.id)).toEqual(['c', 'a', 'b']);
  });

  it('filter kombinasi status + origin + impact', () => {
    const f: DebtRegistryFilters = { status: 'BACKLOG', origin: 'MANUAL', impact: 'MEDIUM', query: '' };
    expect(filterDebtRegistry(rows, f).map((r) => r.id)).toEqual(['c']);
  });

  it('pencarian query pada judul & key (case-insensitive)', () => {
    expect(filterDebtRegistry(rows, { ...NO_FILTER, query: 'auth' }).map((r) => r.id)).toEqual(['a']);
    expect(filterDebtRegistry(rows, { ...NO_FILTER, query: 'wrk-2' }).map((r) => r.id)).toEqual(['b']);
  });

  it('guard: bukan array / hasil kosong → array kosong (tanpa crash)', () => {
    expect(filterDebtRegistry(undefined as any, NO_FILTER)).toEqual([]);
    expect(filterDebtRegistry([], NO_FILTER)).toEqual([]);
    expect(filterDebtRegistry(rows, { ...NO_FILTER, query: 'zx tidak ada' })).toEqual([]);
  });
});

describe('Story 22.2 — deriveDebtStatusOptions & konstanta', () => {
  it('opsi status unik sesuai urutan kemunculan', () => {
    expect(deriveDebtStatusOptions([item({ status: 'DONE' }), item({ status: 'BACKLOG' }), item({ status: 'DONE' })])).toEqual([
      'DONE',
      'BACKLOG',
    ]);
  });

  it('label origin lengkap & impact enum tersedia', () => {
    expect(Object.keys(DEBT_ORIGIN_LABELS)).toEqual(['AI_SCAN', 'TECH_LEAD_AUDIT', 'CODE_REVIEW', 'MANUAL', 'INCIDENT']);
    expect(DEBT_IMPACTS_ALL).toEqual(['HIGH', 'MEDIUM', 'LOW']);
  });
});
