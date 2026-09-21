import { describe, it, expect } from 'vitest';

/**
 * Story 20.2 (CC-6) — Email Delivery SMTP + Log report_deliveries.
 * Unit test murni dengan transporter & deps ter-inject (tanpa DB/SMTP nyata):
 * - skip tanpa config SMTP (graceful, baris SKIPPED);
 * - SENT dengan transporter palsu (subjek, lampiran PDF, html tervalidasi);
 * - FAILED tercatat, penerima berikutnya tetap dicoba;
 * - satu baris report_deliveries per percobaan + audit per delivery;
 * - hook scheduler memanggil delivery pasca-generate.
 */

import {
  parseSmtpConfig,
  parseRecipients,
  formatPeriodId,
  buildReportEmailSubject,
  buildReportEmailHtml,
  deliverReportEmail,
  type DeliveryDeps,
  type TransporterLike,
} from '../server/modules/reports/delivery.service.ts';
import type { GeneratedReport } from '../server/db/schema/generated_reports.ts';
import type { NewReportDelivery } from '../server/db/schema/report_deliveries.ts';
import { createScheduler, type SchedulerConfig, type SchedulerDeps } from '../server/modules/reports/scheduler.service.ts';

const report: GeneratedReport = {
  id: 'rep-1',
  type: 'WEEKLY',
  periodFrom: new Date('2026-09-12T00:00:00Z'),
  periodTo: new Date('2026-09-19T00:00:00Z'),
  language: 'id-ID',
  contentMarkdown: [
    '# Laporan Manajemen Operasional',
    '**Periode:** 12 Sep s.d. 19 Sep',
    '## 1. Ringkasan Tiket (ITSM)',
    'Total tiket masuk pada periode ini: **7**.',
  ].join('\n'),
  generatedBy: 'SCHEDULER',
  generatedAt: new Date('2026-09-19T07:00:00Z'),
  translationMarkdown: null,
  translationLanguage: null,
};

const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r));
};

describe('parseSmtpConfig', () => {
  it('lengkap bila host+user+pass ada; port/secure punya default', () => {
    const cfg = parseSmtpConfig({ SMTP_HOST: 'smtp.kantor.id', SMTP_USER: 'laporan', SMTP_PASS: 'rahasia' });
    expect(cfg.complete).toBe(true);
    expect(cfg.port).toBe(587);
    expect(cfg.secure).toBe(false);
  });

  it('tidak lengkap bila salah satu kritis kosong', () => {
    expect(parseSmtpConfig({}).complete).toBe(false);
    expect(parseSmtpConfig({ SMTP_HOST: 'h' }).complete).toBe(false);
    expect(parseSmtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'u' }).complete).toBe(false);
  });

  it('pass tersedia untuk auth transporter (hanya di field kredensial)', () => {
    const cfg = parseSmtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'TOPSECRET' });
    expect(cfg.pass).toBe('TOPSECRET'); // dibutuhkan nodemailer auth
    expect(cfg.complete).toBe(true);
  });
});

describe('parseRecipients', () => {
  it('memisah koma, trim, validasi format dasar (wajib ada TLD dot)', () => {
    const { valid, invalid } = parseRecipients(' a@b.id , bos@kantor.id ,, bukan-email ,x@y ');
    expect(valid).toEqual(['a@b.id', 'bos@kantor.id']);
    expect(invalid).toEqual(['bukan-email', 'x@y']);
  });

  it('kosong/undefined → tidak ada penerima valid', () => {
    expect(parseRecipients(undefined).valid).toEqual([]);
    expect(parseRecipients('  ').valid).toEqual([]);
  });
});

describe('email builder', () => {
  it('format periode id-ID dan subjek sesuai AC #1', () => {
    expect(formatPeriodId(report)).toBe('12 Sep s.d. 19 Sep 2026');
    expect(buildReportEmailSubject(report)).toBe('[WEEKLY] Laporan WORKSTATION 12 Sep s.d. 19 Sep 2026');
  });

  it('html memuat periode + KPI dari markdown', () => {
    const html = buildReportEmailHtml(report);
    expect(html).toContain('12 Sep s.d. 19 Sep 2026');
    expect(html).toContain('Total Tiket Masuk');
  });
});

describe('deliverReportEmail', () => {
  interface Harness {
    deps: DeliveryDeps;
    rows: NewReportDelivery[];
    auditEvents: Array<{ action: string; detail: Record<string, unknown> }>;
    sent: Array<{ to: string; subject: string; attachments: unknown[] }>;
    failDestinations: Set<string>;
    renderFail: boolean;
  }

  function makeHarness(to: TransporterLike | null): Harness {
    const h: Harness = {
      deps: null as unknown as DeliveryDeps,
      rows: [],
      auditEvents: [],
      sent: [],
      failDestinations: new Set(),
      renderFail: false,
    };
    const transporter: TransporterLike | null = to;
    h.deps = {
      transporter,
      insertDelivery: async (row) => {
        h.rows.push(row);
      },
      auditLog: async (entry) => {
        h.auditEvents.push({ action: entry.action, detail: entry.detail });
      },
      renderPdf: async () => {
        if (h.renderFail) throw new Error('pdfkit boom');
        return Buffer.from('%PDF-fake');
      },
      log: () => {},
      errorLog: () => {},
    };
    if (to) {
      (to as TransporterLike & { __harness?: Harness }).__harness = h;
    }
    return h;
  }

  function fakeTransporter(h: Harness): TransporterLike {
    return {
      async sendMail(mail) {
        if (h.failDestinations.has(mail.to)) throw new Error('SMTP connection timeout');
        h.sent.push({ to: mail.to, subject: mail.subject, attachments: mail.attachments ?? [] });
        return { messageId: `<msg-${h.sent.length}@workstation>` };
      },
    };
  }

  it('SMTP tidak lengkap (transporter null) → SKIP per penerima, tanpa crash (AC #2)', async () => {
    const h = makeHarness(null);
    const summary = await deliverReportEmail(report, 'a@b.id, c@d.id', h.deps);
    expect(summary).toEqual({ sent: 0, failed: 0, skipped: 2 });
    expect(h.rows).toHaveLength(2);
    expect(h.rows.every((r) => r.status === 'SKIPPED' && r.channel === 'EMAIL')).toBe(true);
    expect(h.auditEvents.every((e) => e.action === 'REPORT_DELIVERY_SKIPPED')).toBe(true);
  });

  it('tanpa penerima → satu baris SKIPPED tujuan eksplisit', async () => {
    const h = makeHarness(null);
    const summary = await deliverReportEmail(report, undefined, h.deps);
    expect(summary.skipped).toBe(1);
    expect(h.rows).toHaveLength(1);
    expect(h.rows[0].destination).toContain('tanpa penerima');
  });

  it('SENT dengan transporter palsu: subjek, html, lampiran PDF, baris + audit per kirim (AC #1,#3,#5)', async () => {
    const h2 = makeHarness(null);
    const transporter = fakeTransporter(h2);
    h2.deps.transporter = transporter;
    h2.deps.renderPdf = async () => Buffer.from('%PDF-real');
    const summary = await deliverReportEmail(report, 'a@b.id', h2.deps);
    expect(summary).toEqual({ sent: 1, failed: 0, skipped: 0 });
    expect(h2.sent).toHaveLength(1);
    expect(h2.sent[0].to).toBe('a@b.id');
    expect(h2.sent[0].subject).toBe('[WEEKLY] Laporan WORKSTATION 12 Sep s.d. 19 Sep 2026');
    const att = h2.sent[0].attachments[0] as { filename: string; content: Buffer };
    expect(att.filename).toMatch(/^laporan-weekly-\d{8}-\d{8}\.pdf$/);
    expect(att.content.toString()).toContain('%PDF-real');
    expect(h2.rows).toEqual([
      expect.objectContaining({ destination: 'a@b.id', status: 'SENT', channel: 'EMAIL' }),
    ]);
    expect(h2.rows[0].detail).toContain('msg-1');
    expect(h2.auditEvents.map((e) => e.action)).toEqual(['REPORT_DELIVERY_SENT']);
  });

  it('FAILED tercatat + penerima berikutnya tetap dicoba (AC #4)', async () => {
    const h = makeHarness(null);
    const transporter = fakeTransporter(h);
    h.deps.transporter = transporter;
    h.failDestinations = new Set(['a@b.id']);
    const summary = await deliverReportEmail(report, 'a@b.id, c@d.id', h.deps);
    expect(summary).toEqual({ sent: 1, failed: 1, skipped: 0 });
    expect(h.sent.map((s) => s.to)).toEqual(['c@d.id']); // batch lanjut
    const failedRow = h.rows.find((r) => r.status === 'FAILED');
    expect(failedRow?.destination).toBe('a@b.id');
    expect(failedRow?.detail).toContain('SMTP connection timeout');
    expect(h.auditEvents.map((e) => e.action).sort()).toEqual(['REPORT_DELIVERY_FAILED', 'REPORT_DELIVERY_SENT']);
  });

  it('entri penerima tidak valid di-skip dengan log, tidak menggagalkan batch', async () => {
    const h = makeHarness(null);
    h.deps.transporter = fakeTransporter(h);
    const summary = await deliverReportEmail(report, 'bukan-email, ok@b.id', h.deps);
    expect(summary).toEqual({ sent: 1, failed: 0, skipped: 0 });
    expect(h.sent[0].to).toBe('ok@b.id');
    // baris log hanya untuk percobaan nyata — entri invalid tidak masuk ledger
    expect(h.rows).toHaveLength(1);
  });

  it('render PDF gagal → FAILED untuk semua penerima, tetap never-throw', async () => {
    const h = makeHarness(null);
    h.deps.transporter = fakeTransporter(h);
    h.renderFail = true;
    const summary = await deliverReportEmail(report, 'a@b.id, c@d.id', h.deps);
    expect(summary).toEqual({ sent: 0, failed: 2, skipped: 0 });
    expect(h.rows.every((r) => r.status === 'FAILED' && r.detail?.includes('Render PDF gagal'))).toBe(true);
    expect(h.sent).toHaveLength(0);
  });

  it('satu baris ledger per percobaan (AC #3): 3 penerima valid = 3 baris SENT', async () => {
    const h = makeHarness(null);
    h.deps.transporter = fakeTransporter(h);
    await deliverReportEmail(report, 'a@b.id, c@d.id, e@f.id', h.deps);
    expect(h.rows).toHaveLength(3);
    expect(h.rows.map((r) => r.status)).toEqual(['SENT', 'SENT', 'SENT']);
  });
});

describe('hook scheduler → delivery (integrasi 20.1 ↔ 20.2)', () => {
  it('pasca generate sukses, deps.deliver dipanggil dengan hasil generate', async () => {
    const delivered: unknown[] = [];
    const cfg: SchedulerConfig = { enabled: true, timezone: 'Asia/Jakarta', crons: { DAILY: '0 7 * * *', WEEKLY: '', MONTHLY: '' } };
    const jobs: Array<() => void> = [];
    const deps: SchedulerDeps = {
      generate: async () => report,
      findLatestGeneratedAt: async () => null,
      auditLog: async () => {},
      scheduleFn: (_expr, fn) => {
        jobs.push(fn);
        return { stop: () => {} } as never;
      },
      deliver: async (r) => {
        delivered.push(r);
      },
      now: () => new Date('2026-09-19T02:00:00Z'),
      log: () => {},
      errorLog: () => {},
    };
    createScheduler(cfg, deps);
    expect(jobs).toHaveLength(1);
    jobs[0]();
    await flush();
    expect(delivered).toHaveLength(1);
    expect((delivered[0] as GeneratedReport).id).toBe('rep-1');
  });

  it('delivery melempar error → job tetap sukses (audit GENERATED tetap tercatat)', async () => {
    const audit: string[] = [];
    const cfg: SchedulerConfig = { enabled: true, timezone: 'Asia/Jakarta', crons: { DAILY: '0 7 * * *', WEEKLY: '', MONTHLY: '' } };
    const jobs: Array<() => void> = [];
    const deps: SchedulerDeps = {
      generate: async () => report,
      findLatestGeneratedAt: async () => null,
      auditLog: async (e) => {
        audit.push(e.action);
      },
      scheduleFn: (_expr, fn) => {
        jobs.push(fn);
        return { stop: () => {} } as never;
      },
      deliver: async () => {
        throw new Error('delivery down');
      },
      now: () => new Date('2026-09-19T02:00:00Z'),
      log: () => {},
      errorLog: () => {},
    };
    createScheduler(cfg, deps);
    jobs[0]();
    await flush();
    expect(audit).toEqual(['REPORT_SCHEDULE_GENERATED']);
  });
});
