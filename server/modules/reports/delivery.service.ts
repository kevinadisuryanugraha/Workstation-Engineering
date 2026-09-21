import nodemailer from 'nodemailer';
import { db } from '../../db/client.ts';
import { reportDeliveries, type NewReportDelivery } from '../../db/schema/report_deliveries.ts';
import type { GeneratedReport } from '../../db/schema/generated_reports.ts';
import { auditService } from '../audit/audit.service.ts';
import { renderReportPdf, reportFileName, extractKpiRows } from './export.service.ts';

/**
 * Report delivery service (Story 20.2 — Course Correction 6).
 * Mengirim laporan terjadwal via SMTP ke penerima REPORT_DELIVERY_EMAILS.
 *
 * Kontrak penting:
 * - SMTP tidak lengkap → graceful SKIP per penerima (log jujur + baris SKIPPED),
 *   TIDAK pernah crash boot atau job scheduler (AC #2);
 * - setiap percobaan tercatat append-only di report_deliveries (AC #3);
 * - kegagalan SMTP → FAILED + detail ringkas, penerima berikutnya tetap dicoba (AC #4);
 * - semua delivery ter-audit (AC #5);
 * - SMTP_PASS tidak pernah masuk log/audit.
 */

export type DeliveryChannel = 'EMAIL' | 'WHATSAPP';
export type DeliveryStatus = 'SENT' | 'FAILED' | 'SKIPPED';

// ===== Konfigurasi SMTP (env) =====

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  complete: boolean;
}

export function parseSmtpConfig(env: Record<string, string | undefined>): SmtpConfig {
  const host = (env.SMTP_HOST ?? '').trim();
  const user = (env.SMTP_USER ?? '').trim();
  const pass = env.SMTP_PASS ?? '';
  const portRaw = (env.SMTP_PORT ?? '').trim();
  const port = portRaw ? Number(portRaw) : 587;
  const secure = (env.SMTP_SECURE ?? '').trim().toLowerCase() === 'true';
  const complete = Boolean(host && user && pass) && Number.isFinite(port) && port > 0;
  return { host, port, secure, user, pass, complete };
}

/** Penerima dari env dipisah koma; entri tidak valid dipisah agar di-skip dengan log. */
export function parseRecipients(
  raw: string | undefined,
): { valid: string[]; invalid: string[] } {
  const entries = (raw ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const e of entries) (emailRe.test(e) ? valid : invalid).push(e);
  return { valid, invalid };
}

// ===== Transporter (factory — test inject transporter palsu) =====

export interface MailAttachment {
  filename: string;
  content: Buffer;
}

export interface TransporterLike {
  sendMail(mail: {
    to: string;
    subject: string;
    html: string;
    attachments?: MailAttachment[];
  }): Promise<unknown>;
}

export function createSmtpTransporter(cfg: SmtpConfig): TransporterLike {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

// ===== Deps ter-inject untuk testability =====

export interface DeliveryDeps {
  transporter: TransporterLike | null;
  insertDelivery: (row: NewReportDelivery) => Promise<unknown>;
  auditLog: (entry: { action: string; detail: Record<string, unknown> }) => Promise<void>;
  renderPdf: (report: GeneratedReport) => Promise<Buffer>;
  log?: (msg: string) => void;
  errorLog?: (msg: string, err?: unknown) => void;
}

export const defaultDeliveryDeps: DeliveryDeps = {
  get transporter() {
    const cfg = parseSmtpConfig(process.env);
    return cfg.complete ? createSmtpTransporter(cfg) : null;
  },
  insertDelivery: async (row) => {
    await db.insert(reportDeliveries).values(row);
  },
  auditLog: async ({ action, detail }) => {
    await auditService.logEvent({
      actorId: 'SCHEDULER',
      actorName: 'Report Scheduler',
      action,
      targetEntity: 'report_delivery',
      targetId: String(detail.reportId ?? detail.destination ?? 'unknown'),
      correlationId: crypto.randomUUID(),
      details: detail,
    });
  },
  renderPdf: (report) => renderReportPdf(report),
  log: (msg) => console.log(`[ReportDelivery] ${msg}`),
  errorLog: (msg, err) => console.error(`[ReportDelivery] ${msg}`, err ?? ''),
};

// ===== Email builder =====

/** Periode ringkas Bahasa Indonesia: "12 Sep s.d. 19 Sep 2026" (hari sama = "12 Sep 2026"). */
export function formatPeriodId(report: Pick<GeneratedReport, 'periodFrom' | 'periodTo'>): string {
  const fmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' });
  const from = fmt.format(new Date(report.periodFrom));
  const to = fmt.format(new Date(report.periodTo));
  const year = new Date(report.periodTo).getFullYear();
  return from === to ? `${from} ${year}` : `${from} s.d. ${to} ${year}`;
}

export function buildReportEmailSubject(report: GeneratedReport): string {
  return `[${report.type}] Laporan WORKSTATION ${formatPeriodId(report)}`;
}

export function buildReportEmailHtml(report: GeneratedReport): string {
  const kpiRows = extractKpiRows(report.contentMarkdown)
    .map((r) => `<tr><td style="padding:4px 12px;border-bottom:1px solid #eee">${escapeHtml(r.metric)}</td><td style="padding:4px 12px;border-bottom:1px solid #eee"><strong>${escapeHtml(r.value)}</strong></td></tr>`)
    .join('');
  const kpiSection = kpiRows
    ? `<h3>Ringkasan KPI</h3><table style="border-collapse:collapse">${kpiRows}</table>`
    : '';
  return [
    `<h2>Laporan WORKSTATION — ${report.type}</h2>`,
    `<p><strong>Periode:</strong> ${formatPeriodId(report)}</p>`,
    kpiSection,
    `<p>File PDF lengkap terlampir. Arsip laporan juga tersedia di aplikasi WORKSTATION (menu Laporan → Arsip &amp; Ekspor).</p>`,
    `<p style="color:#666;font-size:12px"><em>Laporan dihasilkan otomatis oleh Report Scheduler WORKSTATION.</em></p>`,
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

// ===== Delivery inti (never-throw — scheduler aman memanggil) =====

export interface DeliverySummary {
  sent: number;
  failed: number;
  skipped: number;
}

const NO_RECIPIENTS = '(tanpa penerima REPORT_DELIVERY_EMAILS)';

export async function deliverReportEmail(
  report: GeneratedReport,
  recipientsRaw: string | undefined,
  deps: DeliveryDeps = defaultDeliveryDeps,
): Promise<DeliverySummary> {
  const log = deps.log ?? (() => {});
  const errorLog = deps.errorLog ?? (() => {});
  const summary: DeliverySummary = { sent: 0, failed: 0, skipped: 0 };

  const { valid, invalid } = parseRecipients(recipientsRaw);
  for (const bad of invalid) log(`Penerima tidak valid diabaikan: "${bad}".`);

  const record = async (row: NewReportDelivery, action: string) => {
    try {
      await deps.insertDelivery(row);
      await deps.auditLog({ action, detail: { ...row } });
    } catch (err) {
      // Pencatatan gagal tidak boleh menggagalkan delivery berikutnya.
      errorLog(`Gagal mencatat delivery (${row.destination}):`, err);
    }
  };

  if (valid.length === 0) {
    log(`${report.type}: tidak ada penerima dikonfigurasi — delivery dilewati.`);
    await record(
      { reportId: report.id, channel: 'EMAIL', destination: NO_RECIPIENTS, status: 'SKIPPED', detail: 'REPORT_DELIVERY_EMAILS kosong/tidak valid' },
      'REPORT_DELIVERY_SKIPPED',
    );
    summary.skipped += 1;
    return summary;
  }

  if (!deps.transporter) {
    log(`${report.type}: SMTP tidak lengkap (SMTP_HOST/SMTP_USER/SMTP_PASS) — ${valid.length} penerima di-skip.`);
    for (const to of valid) {
      await record(
        { reportId: report.id, channel: 'EMAIL', destination: to, status: 'SKIPPED', detail: 'Konfigurasi SMTP tidak lengkap' },
        'REPORT_DELIVERY_SKIPPED',
      );
      summary.skipped += 1;
    }
    return summary;
  }

  // Render PDF sekali per laporan; kegagalan render = FAILED untuk semua penerima.
  let pdf: Buffer;
  try {
    pdf = await deps.renderPdf(report);
  } catch (err) {
    errorLog(`${report.type}: render PDF lampiran gagal —`, err);
    for (const to of valid) {
      await record(
        { reportId: report.id, channel: 'EMAIL', destination: to, status: 'FAILED', detail: `Render PDF gagal: ${shortError(err)}` },
        'REPORT_DELIVERY_FAILED',
      );
      summary.failed += 1;
    }
    return summary;
  }

  const subject = buildReportEmailSubject(report);
  const html = buildReportEmailHtml(report);
  const attachment: MailAttachment = { filename: reportFileName(report, 'pdf'), content: pdf };

  for (const to of valid) {
    try {
      const info = (await deps.transporter.sendMail({ to, subject, html, attachments: [attachment] })) as { messageId?: string };
      log(`${report.type}: laporan terkirim ke ${to}${info?.messageId ? ` (${info.messageId})` : ''}.`);
      await record(
        { reportId: report.id, channel: 'EMAIL', destination: to, status: 'SENT', detail: info?.messageId ?? 'terkirim' },
        'REPORT_DELIVERY_SENT',
      );
      summary.sent += 1;
    } catch (err) {
      errorLog(`${report.type}: kirim ke ${to} gagal —`, err);
      await record(
        { reportId: report.id, channel: 'EMAIL', destination: to, status: 'FAILED', detail: `SMTP gagal: ${shortError(err)}` },
        'REPORT_DELIVERY_FAILED',
      );
      summary.failed += 1;
    }
  }
  return summary;
}

function shortError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.slice(0, 300);
}
