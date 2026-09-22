import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';

/**
 * Story 22.1 (CC-7, Master PRD §11.4) — Debt Registry API.
 *
 * 1. Pure unit: aging math deterministik (clock disuntik), bucket, heuristik
 *    impact, normalisasi field debt (server-authoritative), listDebts dengan
 *    repo palsu, mapper DTO.
 * 2. Integration (DB dev nyata, pola workflow-e2e): create debt via service,
 *    listDebts berisi field terstruktur, non-TECH_DEBT dibersihkan.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

// CI tanpa Postgres → suite integrasi DB di-skip jujur; pure unit tetap jalan.
dotenv.config();
const HAS_DB = Boolean(process.env.DATABASE_URL);
const describeDb = HAS_DB ? describe : describe.skip;

import {
  computeAgingDays,
  computeAgingBucket,
  summarizeDebts,
  WorkItemService,
  type DebtRegistryItem,
} from '../server/modules/work-items/work-item.service.ts';
import { createWorkItemSchema, updateWorkItemSchema } from '../server/modules/work-items/work-item.schema.ts';
import { mapExpectedImpactToDebtImpact } from '../server/modules/ai/ai-intel.routes.ts';
import { mapWorkItemDto } from '../src/lib/contractMappers.ts';
import type { WorkItem as DbWorkItem } from '../server/db/schema/work_items.ts';

const NOW = new Date('2026-09-21T00:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe('Story 22.1 — computeAgingDays (deterministik)', () => {
  it('0 hari untuk createdAt = now', () => {
    expect(computeAgingDays(NOW, NOW)).toBe(0);
  });

  it('floor: usia 29 hari 23 jam → 29 (bukan 30)', () => {
    const age29d23h = new Date(NOW.getTime() - (30 * 86_400_000 - 3_600_000));
    expect(computeAgingDays(age29d23h, NOW)).toBe(29);
  });

  it('tepat 30 hari → 30', () => {
    expect(computeAgingDays(daysAgo(30), NOW)).toBe(30);
  });

  it('batas 31, 90, 91, 180, 181 akurat', () => {
    expect(computeAgingDays(daysAgo(31), NOW)).toBe(31);
    expect(computeAgingDays(daysAgo(90), NOW)).toBe(90);
    expect(computeAgingDays(daysAgo(91), NOW)).toBe(91);
    expect(computeAgingDays(daysAgo(180), NOW)).toBe(180);
    expect(computeAgingDays(daysAgo(181), NOW)).toBe(181);
  });

  it('createdAt di masa depan → clamp ke 0', () => {
    expect(computeAgingDays(new Date(NOW.getTime() + 5 * 86_400_000), NOW)).toBe(0);
  });

  it('menerima string ISO', () => {
    expect(computeAgingDays('2026-09-20T00:00:00.000Z', NOW)).toBe(1);
  });
});

describe('Story 22.1 — computeAgingBucket (batas 30/90/180)', () => {
  it.each([
    [0, 'FRESH'], [30, 'FRESH'], [31, 'AGING'], [90, 'AGING'],
    [91, 'STALE'], [180, 'STALE'], [181, 'CRITICAL'], [400, 'CRITICAL'],
  ] as const)('%i hari → %s', (days, bucket) => {
    expect(computeAgingBucket(days)).toBe(bucket);
  });
});

describe('Story 22.1 — heuristik mapExpectedImpactToDebtImpact', () => {
  it('HIGH untuk kata tinggi/kritis/high', () => {
    expect(mapExpectedImpactToDebtImpact('Dampak tinggi pada performa')).toBe('HIGH');
    expect(mapExpectedImpactToDebtImpact('Critical security risk')).toBe('HIGH');
  });

  it('LOW untuk kata rendah/minor', () => {
    expect(mapExpectedImpactToDebtImpact('perbaikan minor')).toBe('LOW');
    expect(mapExpectedImpactToDebtImpact('low priority cleanup')).toBe('LOW');
  });

  it('default MEDIUM (termasuk kosong/undefined)', () => {
    expect(mapExpectedImpactToDebtImpact('mengurangi biaya token')).toBe('MEDIUM');
    expect(mapExpectedImpactToDebtImpact(undefined)).toBe('MEDIUM');
  });
});

describe('Story 22.1 — normalisasi field debt (server-authoritative)', () => {
  it('create non-TECH_DEBT: field debt dibuang', () => {
    const parsed = createWorkItemSchema.parse({
      projectId: 'p1',
      title: 'Task biasa',
      type: 'TASK',
      debtOrigin: 'MANUAL',
      debtImpact: 'HIGH',
      debtSourceRef: 'x/y',
    });
    expect(parsed.debtOrigin).toBeUndefined();
    expect(parsed.debtImpact).toBeUndefined();
    expect(parsed.debtSourceRef).toBeUndefined();
  });

  it('create TECH_DEBT: field debt dipertahankan', () => {
    const parsed = createWorkItemSchema.parse({
      projectId: 'p1',
      title: 'Refactor modul auth',
      type: 'TECH_DEBT',
      debtOrigin: 'AI_SCAN',
      debtImpact: 'HIGH',
      debtSourceRef: 'SCAN-01/REC-02',
    });
    expect(parsed.debtOrigin).toBe('AI_SCAN');
    expect(parsed.debtImpact).toBe('HIGH');
    expect(parsed.debtSourceRef).toBe('SCAN-01/REC-02');
  });

  it('create dengan nilai di luar enum → ditolak 400', () => {
    expect(() =>
      createWorkItemSchema.parse({
        projectId: 'p1',
        title: 'Debt aneh',
        type: 'TECH_DEBT',
        debtOrigin: 'HACKED',
      })
    ).toThrow();
    expect(() =>
      createWorkItemSchema.parse({
        projectId: 'p1',
        title: 'Debt aneh 2',
        type: 'TECH_DEBT',
        debtImpact: 'EXTREME',
      })
    ).toThrow();
  });

  it('update tanpa type: field debt dipertahankan (kasus sah update debt)', () => {
    const parsed = updateWorkItemSchema.parse({ debtImpact: 'LOW' });
    expect(parsed.debtImpact).toBe('LOW');
  });

  it('update dengan type eksplisit non-TECH_DEBT: field debt dibuang', () => {
    const parsed = updateWorkItemSchema.parse({ type: 'TASK', debtOrigin: 'MANUAL' });
    expect(parsed.debtOrigin).toBeUndefined();
    expect(parsed.type).toBe('TASK');
  });
});

describe('Story 22.1 — listDebts (repo palsu, aging server-side)', () => {
  const makeRow = (over: Partial<DbWorkItem>): DbWorkItem =>
    ({
      id: 'wi-1',
      key: 'WRK-1',
      projectId: 'proj-1',
      title: 'Debt contoh',
      description: null,
      type: 'TECH_DEBT',
      priority: 'P2',
      status: 'BACKLOG',
      assigneeId: null,
      estimateHours: 8,
      sprintId: null,
      milestoneId: null,
      debtOrigin: 'AI_SCAN',
      debtImpact: 'MEDIUM',
      debtSourceRef: 'SCAN-9/REC-1',
      createdAt: daysAgo(100),
      updatedAt: daysAgo(100),
      ...over,
    }) as DbWorkItem;

  it('memetakan aging/bucket, mempertahankan urutan repo, agregat akurat', async () => {
    const rows = [
      makeRow({ id: 'wi-old', key: 'WRK-2', createdAt: daysAgo(200), debtImpact: 'HIGH', status: 'IN_PROGRESS' }),
      makeRow({ id: 'wi-mid', key: 'WRK-3', createdAt: daysAgo(95) }),
      makeRow({ id: 'wi-new', key: 'WRK-4', createdAt: daysAgo(10), debtOrigin: 'MANUAL', debtImpact: null, debtSourceRef: null }),
      makeRow({ id: 'wi-done', key: 'WRK-5', createdAt: daysAgo(60), status: 'DONE' }),
    ];
    let receivedFilters: Record<string, unknown> | null = null;
    const svc = new WorkItemService({
      findDebts: async (f: Record<string, unknown>) => {
        receivedFilters = f;
        return rows;
      },
    } as any);

    const { items, summary } = await svc.listDebts({ status: undefined, origin: undefined, impact: undefined, projectId: 'proj-1' }, NOW);

    expect(receivedFilters).toMatchObject({ projectId: 'proj-1' });
    expect(items.map((i) => i.id)).toEqual(['wi-old', 'wi-mid', 'wi-new', 'wi-done']);
    expect(items[0]).toMatchObject({ agingDays: 200, agingBucket: 'CRITICAL', debtOrigin: 'AI_SCAN' });
    expect(items[1]).toMatchObject({ agingDays: 95, agingBucket: 'STALE' });
    expect(items[2]).toMatchObject({ agingDays: 10, agingBucket: 'FRESH', debtImpact: null });
    expect(items[3]).toMatchObject({ agingDays: 60, agingBucket: 'AGING' });
    expect(items.every((i) => typeof i.createdAt === 'string')).toBe(true);

    expect(summary).toEqual({
      total: 4,
      open: 3, // wi-done DONE → tidak dihitung open
      byStatus: { IN_PROGRESS: 1, BACKLOG: 2, DONE: 1 },
      byOrigin: { AI_SCAN: 3, MANUAL: 1 },
      byImpact: { HIGH: 1, MEDIUM: 2 },
      byAgingBucket: { FRESH: 1, AGING: 1, STALE: 1, CRITICAL: 1 },
    });
  });

  it('summarizeDebts pada daftar kosong → nol semuanya', () => {
    const summary = summarizeDebts([] as DebtRegistryItem[]);
    expect(summary).toEqual({
      total: 0,
      open: 0,
      byStatus: {},
      byOrigin: {},
      byImpact: {},
      byAgingBucket: { FRESH: 0, AGING: 0, STALE: 0, CRITICAL: 0 },
    });
  });
});

describe('Story 22.1 — mapWorkItemDto field debt (normalisasi jujur)', () => {
  it('memetakan field valid; unknown → undefined (bukan karangan)', () => {
    const ui = mapWorkItemDto({
      id: 'wi-9', key: 'WRK-9', projectId: 'p', title: 'Debt mapper',
      type: 'TECH_DEBT', status: 'BACKLOG', priority: 'P1',
      debtOrigin: 'ai_scan', // case-insensitive → AI_SCAN
      debtImpact: 'HIGH',
      debtSourceRef: 'SCAN-1/REC-1',
      agingDays: 45,
      agingBucket: 'AGING',
    });
    expect(ui.debtOrigin).toBe('AI_SCAN');
    expect(ui.debtImpact).toBe('HIGH');
    expect(ui.debtSourceRef).toBe('SCAN-1/REC-1');
    expect(ui.agingDays).toBe(45);
    expect(ui.agingBucket).toBe('AGING');

    const weird = mapWorkItemDto({
      id: 'wi-10', key: 'WRK-10', projectId: 'p', title: 'Debt aneh',
      type: 'TECH_DEBT', status: 'BACKLOG', priority: 'P2',
      debtOrigin: 'NGAWUR', debtImpact: 'EXTREME', agingDays: 'bukan-angka', agingBucket: 'APAPUN',
    });
    expect(weird.debtOrigin).toBeUndefined();
    expect(weird.debtImpact).toBeUndefined();
    expect(weird.agingDays).toBeUndefined();
    expect(weird.agingBucket).toBeUndefined();
  });
});

// ─── Integration (DB dev nyata; skip jujur tanpa DATABASE_URL) ─────────────

describeDb('Story 22.1 — Debt Registry integration', () => {
  it('create TECH_DEBT dengan field terstruktur → muncul di listDebts', async () => {
    const { projectService } = await import('../server/modules/projects/project.service.ts');
    const { workItemService } = await import('../server/modules/work-items/work-item.service.ts');

    const projects = await projectService.listProjects();
    expect(projects.length).toBeGreaterThan(0);
    const projectId = projects[0].id;

    const debt = await workItemService.createWorkItem(
      {
        projectId,
        title: 'Debt Registry Test — teknik utang 22.1',
        type: 'TECH_DEBT',
        debtOrigin: 'TECH_LEAD_AUDIT',
        debtImpact: 'HIGH',
        debtSourceRef: 'test/22-1',
      } as any,
      'test-user',
      'Test Runner',
      'test-22-1'
    );
    expect(debt.debtOrigin).toBe('TECH_LEAD_AUDIT');
    expect(debt.debtImpact).toBe('HIGH');
    expect(debt.debtSourceRef).toBe('test/22-1');

    const { items, summary } = await workItemService.listDebts({ projectId });
    const found = items.find((i) => i.id === debt.id);
    expect(found).toBeDefined();
    expect(found!.debtOrigin).toBe('TECH_LEAD_AUDIT');
    expect(found!.agingDays).toBe(0);
    expect(found!.agingBucket).toBe('FRESH');
    expect(summary.byOrigin['TECH_LEAD_AUDIT']).toBeGreaterThanOrEqual(1);

    // Task biasa dengan field debt → dibersihkan server (tidak muncul di registry).
    const task = await workItemService.createWorkItem(
      {
        projectId,
        title: 'Bukan debt — tidak boleh masuk registry',
        type: 'TASK',
        debtOrigin: 'MANUAL',
      } as any,
      'test-user',
      'Test Runner',
      'test-22-1'
    );
    const { items: afterTask } = await workItemService.listDebts({ projectId });
    expect(afterTask.find((i) => i.id === task.id)).toBeUndefined();

    // Bersih-bersih best-effort.
    await workItemService.deleteWorkItem(debt.id, 'test-user', 'Test Runner', 'test-22-1').catch(() => undefined);
    await workItemService.deleteWorkItem(task.id, 'test-user', 'Test Runner', 'test-22-1').catch(() => undefined);
  });
});
