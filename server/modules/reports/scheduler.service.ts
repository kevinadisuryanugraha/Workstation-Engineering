import cron, { ScheduledTask } from 'node-cron';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { generatedReports } from '../../db/schema/generated_reports.ts';
import type { GeneratedReport } from '../../db/schema/generated_reports.ts';
import { generatedReportsService, ReportType } from './generated-reports.service.ts';
import { deliverReportEmail } from './delivery.service.ts';
import { deliverReportWhatsapp } from './whatsapp.channel.ts';
import { auditService } from '../audit/audit.service.ts';

/**
 * Report scheduler (Story 20.1 — CC-6).
 * Production cron that auto-generates DAILY/WEEKLY/MONTHLY reports.
 *
 * Kontrak penting:
 * - Default OFF (`REPORT_SCHEDULER` tidak diset / bukan "on" = tidak menjadwalkan apa pun);
 *   boot produksi eksisting tidak berubah perilaku sampai diaktifkan eksplisit.
 * - Idempoten per window kalender (hari / minggu ISO / bulan) — tidak pernah duplikat arsip.
 * - Gagal satu tipe TIDAK menghentikan tipe lain; semua fail-safe (tidak crash boot).
 */

export type SchedulerEnv = Record<string, string | undefined>;

export interface SchedulerConfig {
  enabled: boolean;
  timezone: string;
  crons: Record<ReportType, string>;
}

export const DEFAULT_CRON: Record<ReportType, string> = {
  DAILY: '0 7 * * *',
  WEEKLY: '0 7 * * 1',
  MONTHLY: '0 7 1 * *',
};

const CRON_ENV_KEYS: Record<ReportType, string> = {
  DAILY: 'REPORT_CRON_DAILY',
  WEEKLY: 'REPORT_CRON_WEEKLY',
  MONTHLY: 'REPORT_CRON_MONTHLY',
};

/** Parses + validates scheduler env. Invalid cron values disable that type (fail-safe). */
export function parseSchedulerConfig(env: SchedulerEnv, validate: (expr: string) => boolean = cron.validate): SchedulerConfig {
  const enabled = (env.REPORT_SCHEDULER ?? '').trim().toLowerCase() === 'on';
  const timezone = (env.REPORT_SCHEDULER_TZ ?? 'Asia/Jakarta').trim() || 'Asia/Jakarta';

  const crons = {} as Record<ReportType, string>;
  for (const type of ['DAILY', 'WEEKLY', 'MONTHLY'] as ReportType[]) {
    const raw = (env[CRON_ENV_KEYS[type]] ?? '').trim();
    const expr = raw || DEFAULT_CRON[type];
    if (!validate(expr)) {
      console.error(`[ReportScheduler] Cron expression tidak valid untuk ${type}: "${expr}" — tipe ini tidak dijadwalkan.`);
      crons[type] = '';
      continue;
    }
    crons[type] = expr;
  }
  return { enabled, timezone, crons };
}

// ===== Kalender helper (TZ-aware via Intl) =====

interface CalendarParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 1=Senin .. 7=Minggu (ISO)
}

export function calendarPartsInTz(date: Date, timeZone: string): CalendarParts {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: weekdayMap[get('weekday')] ?? 1,
  };
}

/** Pasangan tahun-minggu ISO 8601 (algoritma 4-Januari; tahun = tahun milik Kamis). */
export function isoWeekInfo(parts: CalendarParts): { year: number; week: number } {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayNum = d.getUTCDay() || 7; // 1..7 (ISO, Senin=1)
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Kamis pekan ini
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function windowKey(type: ReportType, date: Date, timezone: string): string {
  const p = calendarPartsInTz(date, timezone);
  switch (type) {
    case 'DAILY':
      return `${p.year}-${p.month}-${p.day}`;
    case 'WEEKLY': {
      // ISO week-numbering year — Senin 2024-12-30 & Kamis 2025-01-02 = "2025-W1" (satu window).
      const w = isoWeekInfo(p);
      return `${w.year}-W${w.week}`;
    }
    case 'MONTHLY':
      return `${p.year}-${p.month}`;
  }
}

// ===== Deps ter-inject untuk testability =====

export interface SchedulerDeps {
  generate: (type: ReportType, generatedBy?: string) => Promise<unknown>;
  findLatestGeneratedAt: (type: ReportType) => Promise<Date | null>;
  auditLog: (entry: { action: string; detail: Record<string, unknown> }) => Promise<void>;
  scheduleFn: (expr: string, fn: () => void, opts: { timezone: string }) => ScheduledTask;
  /** Hook pasca-generate (Story 20.2): delivery email — never-throw di dalam service. */
  deliver?: (report: GeneratedReport) => Promise<unknown>;
  /** Jam ter-inject (default jam nyata) — untuk determinisme test window. */
  now?: () => Date;
  log?: (msg: string) => void;
  errorLog?: (msg: string, err?: unknown) => void;
}

export const defaultDeps: SchedulerDeps = {
  generate: (type, generatedBy) => generatedReportsService.generate(type, generatedBy),
  findLatestGeneratedAt: async (type) => {
    const rows = await db
      .select({ generatedAt: generatedReports.generatedAt })
      .from(generatedReports)
      .where(eq(generatedReports.type, type))
      .orderBy(desc(generatedReports.generatedAt))
      .limit(1);
    return rows.length > 0 ? new Date(rows[0].generatedAt) : null;
  },
  auditLog: async ({ action, detail }) => {
    await auditService.logEvent({
      actorId: 'SCHEDULER',
      actorName: 'Report Scheduler',
      action,
      targetEntity: 'generated_report',
      targetId: String(detail.reportType ?? 'unknown'),
      correlationId: crypto.randomUUID(),
      details: detail,
    });
  },
  scheduleFn: (expr, fn, opts) => cron.schedule(expr, fn, { timezone: opts.timezone }),
  deliver: async (report) => {
    // Story 20.2 + 20.3 — kedua channel berjalan paralel, saling independen (AC #4 20.3).
    await Promise.all([
      deliverReportEmail(report, process.env.REPORT_DELIVERY_EMAILS),
      deliverReportWhatsapp(report, process.env.REPORT_DELIVERY_WA_NUMBERS),
    ]);
  },
  log: (msg) => console.log(`[ReportScheduler] ${msg}`),
  errorLog: (msg, err) => console.error(`[ReportScheduler] ${msg}`, err ?? ''),
};

export interface ReportSchedulerHandle {
  stop: () => void;
  scheduledTypes: ReportType[];
}

/** Membuat scheduler (tanpa memulai) — dipakai test & startScheduler. */
export function createScheduler(config: SchedulerConfig, deps: SchedulerDeps = defaultDeps): ReportSchedulerHandle {
  const tasks: Array<{ type: ReportType; task: ScheduledTask }> = [];
  const log = deps.log ?? (() => {});
  const errorLog = deps.errorLog ?? (() => {});

  const now = deps.now ?? (() => new Date());

  const runJob = (type: ReportType) => {
    // Fire-and-forget dengan penanganan error per-tipe (AC #4).
    void (async () => {
      try {
        const latest = await deps.findLatestGeneratedAt(type);
        const nowDate = now();
        if (latest && windowKey(type, latest, config.timezone) === windowKey(type, nowDate, config.timezone)) {
          log(`${type}: arsip window ini sudah ada (${windowKey(type, nowDate, config.timezone)}) — skip (idempoten).`);
          await deps.auditLog({ action: 'REPORT_SCHEDULE_SKIP', detail: { reportType: type, reason: 'ALREADY_GENERATED' } });
          return;
        }
        const report = await deps.generate(type, 'SCHEDULER') as GeneratedReport;
        log(`${type}: laporan terjadwal dibuat & diarsipkan.`);
        await deps.auditLog({ action: 'REPORT_SCHEDULE_GENERATED', detail: { reportType: type } });
        // Story 20.2 — delivery pasca-generate; gagal delivery TIDAK menandai job gagal.
        if (deps.deliver) {
          try {
            await deps.deliver(report);
          } catch (deliverErr) {
            errorLog(`${type}: delivery pasca-generate gagal (laporan tetap terarsip).`, deliverErr);
          }
        }
      } catch (err) {
        errorLog(`${type}: gagal membuat laporan terjadwal — job lanjut di periode berikutnya.`, err);
        try {
          await deps.auditLog({ action: 'REPORT_SCHEDULE_FAILED', detail: { reportType: type, error: String(err) } });
        } catch {
          /* audit gagal pun tidak boleh naik ke cron */
        }
      }
    })();
  };

  if (!config.enabled) {
    log('REPORT_SCHEDULER tidak aktif (on untuk mengaktifkan) — tidak ada job dijadwalkan.');
    return { stop: () => tasks.forEach(({ task }) => task.stop()), scheduledTypes: [] };
  }

  for (const type of ['DAILY', 'WEEKLY', 'MONTHLY'] as ReportType[]) {
    const expr = config.crons[type];
    if (!expr) continue; // cron tidak valid → tipe dilewati (fail-safe parse)
    const task = deps.scheduleFn(expr, () => runJob(type), { timezone: config.timezone });
    tasks.push({ type, task });
    log(`${type}: dijadwalkan "${expr}" (${config.timezone}).`);
  }

  return {
    stop: () => tasks.forEach(({ task }) => task.stop()),
    scheduledTypes: tasks.map((t) => t.type),
  };
}

// ===== Module-level lifecycle (bootstrap server.ts) =====

let activeHandle: ReportSchedulerHandle | null = null;

/** Mulai scheduler dari env proses (dipanggil bootstrap setelah server siap). */
export function startSchedulerFromEnv(env: SchedulerEnv = process.env): ReportSchedulerHandle | null {
  if (activeHandle) return activeHandle;
  const config = parseSchedulerConfig(env);
  activeHandle = createScheduler(config);
  return activeHandle;
}

export function stopScheduler(): void {
  activeHandle?.stop();
  activeHandle = null;
}

/** Alias AC #5 — nama generik untuk test/pemakaian programatik. */
export const startScheduler = startSchedulerFromEnv;
