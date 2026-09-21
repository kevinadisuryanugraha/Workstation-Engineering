import { describe, it, expect, vi } from 'vitest';

/**
 * Story 20.1 (CC-6) — Report Scheduler Cron.
 * Unit test murni dengan deps ter-inject (tanpa DB/node-cron nyata):
 * - idempotensi window kalender (hari / minggu ISO / bulan, TZ-aware);
 * - flag REPORT_SCHEDULER off = tidak menjadwalkan apa pun;
 * - gagal satu tipe tidak menghentikan tipe lain (service palsu);
 * - cron tidak valid = tipe itu dilewati, boot tidak crash (fail-safe).
 */

import {
  DEFAULT_CRON,
  parseSchedulerConfig,
  calendarPartsInTz,
  isoWeekInfo,
  createScheduler,
  startScheduler,
  startSchedulerFromEnv,
  stopScheduler,
  type SchedulerConfig,
  type SchedulerDeps,
  type SchedulerEnv,
} from '../server/modules/reports/scheduler.service.ts';
import type { ReportType } from '../server/modules/reports/generated-reports.service.ts';

const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r));
};

const TYPES: ReportType[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

interface Harness {
  deps: SchedulerDeps;
  generateCalls: Array<{ type: ReportType; by?: string }>;
  auditEvents: Array<{ action: string; detail: Record<string, unknown> }>;
  jobs: Partial<Record<ReportType, () => void>>;
  exprs: Partial<Record<ReportType, string>>;
  stoppedTasks: number;
  setLatest: (type: ReportType, d: Date | null) => void;
  setNow: (d: Date) => void;
  failTypes: Partial<Record<ReportType, Error>>;
}

function makeHarness(config: SchedulerConfig, log: string[] = []): Harness {
  const h: Harness = {
    deps: null as unknown as SchedulerDeps,
    generateCalls: [],
    auditEvents: [],
    jobs: {},
    exprs: {},
    stoppedTasks: 0,
    setLatest: () => {},
    setNow: () => {},
    failTypes: {},
  };
  const latest = new Map<ReportType, Date | null>(TYPES.map((t) => [t, null]));
  let fixedNow: Date = NOW;

  h.deps = {
    generate: async (type, by) => {
      if (h.failTypes[type]) throw h.failTypes[type]!;
      h.generateCalls.push({ type, by });
      return { id: `gen-${type}` };
    },
    findLatestGeneratedAt: async (type) => latest.get(type) ?? null,
    auditLog: async (entry) => {
      h.auditEvents.push({ action: entry.action, detail: entry.detail });
    },
    scheduleFn: (expr, fn) => {
      // Tipe dikenali dari expr konfigurasi (bukan urutan) — cron kosong = tipe di-skip.
      const type = TYPES.find((t) => config.crons[t] === expr);
      h.exprs[type!] = expr;
      h.jobs[type!] = fn;
      return { stop: () => { h.stoppedTasks += 1; } } as never;
    },
    now: () => fixedNow,
    log: (msg) => log.push(msg),
    errorLog: (msg) => log.push(`ERR:${msg}`),
  };
  h.setLatest = (type, d) => latest.set(type, d);
  h.setNow = (d) => {
    fixedNow = d;
  };
  return h;
}

const enabledConfig = (tz = 'Asia/Jakarta'): SchedulerConfig => ({
  enabled: true,
  timezone: tz,
  crons: { DAILY: '0 7 * * *', WEEKLY: '0 7 * * 1', MONTHLY: '0 7 1 * *' },
});

const runAll = async (h: Harness) => {
  for (const t of TYPES) h.jobs[t]?.();
  await flush();
};

// "now" uji ter-inject: Sabtu 2026-09-19 02:00 UTC = 09:00 WIB (2026-W38, bulan 9, hari 19)
const NOW = new Date('2026-09-19T02:00:00Z');

describe('parseSchedulerConfig', () => {
  it('default: flag off, TZ Asia/Jakarta, jadwal cron default', () => {
    const cfg = parseSchedulerConfig({});
    expect(cfg.enabled).toBe(false);
    expect(cfg.timezone).toBe('Asia/Jakarta');
    expect(cfg.crons).toEqual(DEFAULT_CRON);
  });

  it('REPORT_SCHEDULER=on mengaktifkan (case-insensitive, trim)', () => {
    expect(parseSchedulerConfig({ REPORT_SCHEDULER: ' ON ' }).enabled).toBe(true);
    expect(parseSchedulerConfig({ REPORT_SCHEDULER: 'On' }).enabled).toBe(true);
    expect(parseSchedulerConfig({ REPORT_SCHEDULER: 'off' }).enabled).toBe(false);
    expect(parseSchedulerConfig({ REPORT_SCHEDULER: '1' }).enabled).toBe(false);
  });

  it('env TZ dan env cron custom dibaca', () => {
    const cfg = parseSchedulerConfig({
      REPORT_SCHEDULER: 'on',
      REPORT_SCHEDULER_TZ: 'UTC',
      REPORT_CRON_DAILY: '30 5 * * *',
    });
    expect(cfg.timezone).toBe('UTC');
    expect(cfg.crons.DAILY).toBe('30 5 * * *');
    expect(cfg.crons.WEEKLY).toBe(DEFAULT_CRON.WEEKLY);
  });

  it('cron tidak valid → tipe itu dikosongkan (fail-safe), lain tetap; tanpa crash', () => {
    const realValidate = (expr: string) => ['0 7 * * *', '0 7 * * 1'].includes(expr);
    const cfg = parseSchedulerConfig(
      { REPORT_CRON_MONTHLY: 'bogus-expr', REPORT_CRON_DAILY: 'nope nope' },
      realValidate,
    );
    expect(cfg.crons.DAILY).toBe('');
    expect(cfg.crons.MONTHLY).toBe('');
    expect(cfg.crons.WEEKLY).toBe('0 7 * * 1');
  });
});

describe('kalender TZ-aware', () => {
  it('calendarPartsInTz memetakan UTC → Jakarta (hari bisa maju)', () => {
    const p = calendarPartsInTz(new Date('2026-09-18T20:00:00Z'), 'Asia/Jakarta');
    expect(p).toEqual({ year: 2026, month: 9, day: 19, weekday: 6 }); // Sabtu
    const u = calendarPartsInTz(new Date('2026-09-18T20:00:00Z'), 'UTC');
    expect(u.day).toBe(18);
  });

  it('isoWeekInfo mengikuti tahun milik Kamis (edge pergantian tahun ISO)', () => {
    expect(isoWeekInfo({ year: 2026, month: 1, day: 1, weekday: 4 })).toEqual({ year: 2026, week: 1 });
    // Senin 2024-12-30 dan Kamis 2025-01-02 = ISO week yang sama: 2025-W01
    expect(isoWeekInfo({ year: 2024, month: 12, day: 30, weekday: 1 })).toEqual({ year: 2025, week: 1 });
    expect(isoWeekInfo({ year: 2026, month: 9, day: 19, weekday: 6 })).toEqual({ year: 2026, week: 38 });
  });
});

describe('flag off — tidak menjadwalkan apa pun (AC #2)', () => {
  it('scheduledTypes kosong, scheduleFn tidak pernah dipanggil', () => {
    const log: string[] = [];
    const h = makeHarness({ ...enabledConfig(), enabled: false }, log);
    const handle = createScheduler({ ...enabledConfig(), enabled: false }, h.deps);
    expect(handle.scheduledTypes).toEqual([]);
    expect(h.exprs.DAILY).toBeUndefined();
    expect(log.some((m) => m.includes('tidak ada job dijadwalkan'))).toBe(true);
    // stop() pada handle kosong tetap aman
    expect(() => handle.stop()).not.toThrow();
  });

  it('parse default env (tanpa REPORT_SCHEDULER) → off', () => {
    const cfg = parseSchedulerConfig({} as SchedulerEnv);
    expect(createScheduler(cfg, makeHarness(cfg).deps).scheduledTypes).toEqual([]);
  });
});

describe('penjadwalan aktif', () => {
  it('3 tipe dijadwalkan dengan expr & TZ konfigurasi; stop menghentikan semua', () => {
    const h = makeHarness(enabledConfig('UTC'));
    const handle = createScheduler(enabledConfig('UTC'), h.deps);
    expect(handle.scheduledTypes).toEqual(TYPES);
    expect(h.exprs.DAILY).toBe('0 7 * * *');
    expect(h.exprs.MONTHLY).toBe('0 7 1 * *');
    handle.stop();
    expect(h.stoppedTasks).toBe(3);
  });

  it('cron invalid (string kosong) → tipe itu tidak dijadwalkan, lain tetap', () => {
    const cfg: SchedulerConfig = { enabled: true, timezone: 'UTC', crons: { DAILY: '', WEEKLY: '0 7 * * 1', MONTHLY: '0 7 1 * *' } };
    const h = makeHarness(cfg);
    const handle = createScheduler(cfg, h.deps);
    expect(handle.scheduledTypes).toEqual(['WEEKLY', 'MONTHLY']);
    expect(h.jobs.DAILY).toBeUndefined();
  });
});

describe('idempotensi window (AC #3)', () => {
  it('belum ada arsip → generate(type, "SCHEDULER") + audit GENERATED', async () => {
    const h = makeHarness(enabledConfig());
    h.setNow(NOW);
    createScheduler(enabledConfig(), h.deps);
    await runAll(h);
    expect(h.generateCalls).toEqual([
      { type: 'DAILY', by: 'SCHEDULER' },
      { type: 'WEEKLY', by: 'SCHEDULER' },
      { type: 'MONTHLY', by: 'SCHEDULER' },
    ]);
    expect(h.auditEvents.filter((e) => e.action === 'REPORT_SCHEDULE_GENERATED')).toHaveLength(3);
  });

  it('DAILY: arsip hari kalender yang sama (TZ) → skip meski tanggal UTC beda', async () => {
    const h = makeHarness(enabledConfig());
    h.setNow(NOW);
    createScheduler(enabledConfig(), h.deps);
    h.setLatest('DAILY', new Date('2026-09-18T20:00:00Z')); // 19 Sep 03:00 WIB — hari yang sama dgn NOW
    await runAll(h);
    expect(h.generateCalls.map((c) => c.type)).toEqual(['WEEKLY', 'MONTHLY']);
    const skip = h.auditEvents.find((e) => e.action === 'REPORT_SCHEDULE_SKIP');
    expect(skip?.detail).toMatchObject({ reportType: 'DAILY', reason: 'ALREADY_GENERATED' });
  });

  it('DAILY: TZ UTC → pasangan waktu yang sama dianggap beda hari → generate', async () => {
    const h = makeHarness(enabledConfig('UTC'));
    h.setNow(NOW);
    createScheduler(enabledConfig('UTC'), h.deps);
    h.setLatest('DAILY', new Date('2026-09-18T20:00:00Z')); // UTC: 18 Sep ≠ 19 Sep
    await runAll(h);
    expect(h.generateCalls.map((c) => c.type)).toContain('DAILY');
  });

  it('WEEKLY: arsip minggu ISO yang sama → skip; beda minggu → generate', async () => {
    const h = makeHarness(enabledConfig());
    h.setNow(NOW);
    createScheduler(enabledConfig(), h.deps);
    h.setLatest('WEEKLY', new Date('2026-09-16T02:00:00Z')); // Rabu 16 Sep = 2026-W38 (window sama dgn NOW)
    h.setLatest('MONTHLY', new Date('2026-08-20T02:00:00Z')); // Agustus ≠ September → generate
    await runAll(h);
    expect(h.generateCalls.map((c) => c.type)).toEqual(['DAILY', 'MONTHLY']);
  });

  it('MONTHLY: arsip bulan yang sama → skip', async () => {
    const h = makeHarness(enabledConfig());
    h.setNow(NOW);
    createScheduler(enabledConfig(), h.deps);
    h.setLatest('MONTHLY', new Date('2026-09-01T00:30:00Z')); // 1 Sep WIB
    await runAll(h);
    expect(h.generateCalls.map((c) => c.type)).toEqual(['DAILY', 'WEEKLY']);
  });
});

describe('isolasi kegagalan (AC #4)', () => {
  it('generate gagal untuk DAILY → audit FAILED, WEEKLY & MONTHLY tetap jalan', async () => {
    const h = makeHarness(enabledConfig());
    h.failTypes.DAILY = new Error('db down');
    createScheduler(enabledConfig(), h.deps);
    await expect(runAll(h)).resolves.toBeUndefined(); // tidak ada throw keluar
    expect(h.auditEvents.find((e) => e.action === 'REPORT_SCHEDULE_FAILED')?.detail).toMatchObject({ reportType: 'DAILY' });
    expect(h.generateCalls.map((c) => c.type)).toEqual(['WEEKLY', 'MONTHLY']);
    expect(h.auditEvents.filter((e) => e.action === 'REPORT_SCHEDULE_GENERATED')).toHaveLength(2);
  });

  it('audit gagal pun tidak mengganggu job berikutnya (fail-safe berlapis)', async () => {
    const h = makeHarness(enabledConfig());
    h.deps.auditLog = async () => {
      throw new Error('audit sink down');
    };
    createScheduler(enabledConfig(), h.deps);
    await expect(runAll(h)).resolves.toBeUndefined();
    expect(h.generateCalls).toHaveLength(3);
  });
});

describe('bootstrap lifecycle (AC #5)', () => {
  it('mengekspor startScheduler/startSchedulerFromEnv/stopScheduler; stop idempoten', () => {
    expect(typeof startSchedulerFromEnv).toBe('function');
    expect(typeof startScheduler).toBe('function'); // alias AC #5
    expect(typeof stopScheduler).toBe('function');
    // flag off proses uji → handle tanpa job; stop dua kali tetap aman
    stopScheduler();
    startSchedulerFromEnv({});
    expect(() => {
      stopScheduler();
      stopScheduler();
    }).not.toThrow();
  });
});
