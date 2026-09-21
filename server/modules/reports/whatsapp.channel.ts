import { db } from '../../db/client.ts';
import { reportDeliveries, type NewReportDelivery } from '../../db/schema/report_deliveries.ts';
import type { GeneratedReport } from '../../db/schema/generated_reports.ts';
import { auditService } from '../audit/audit.service.ts';
import { extractKpiRows } from './export.service.ts';
import { formatPeriodId, type DeliverySummary } from './delivery.service.ts';

/**
 * WhatsApp delivery channel (Story 20.3 — Course Correction 6).
 * POST HTTP ke gateway generik kompatibel pola Fonnte/Wablas:
 * header `Authorization: Bearer <WA_GATEWAY_TOKEN>`, body JSON `{ target, message }`.
 *
 * Kontrak penting:
 * - Gateway tidak dikonfigurasi → graceful SKIP per nomor (log jujur + baris SKIPPED) (AC #3);
 * - non-2xx / timeout 10 detik → FAILED + detail ringkas; channel email & tipe laporan
 *   lain tidak terpengaruh (AC #4);
 * - setiap percobaan tercatat append-only di report_deliveries + audit (AC #5);
 * - nomor tidak valid di-skip per entri dengan log;
 * - TOKEN gateway tidak pernah masuk log/audit (nomor tujuan boleh).
 */

export const WA_TIMEOUT_MS = 10_000;

export interface WaConfig {
  url: string;
  token: string;
  complete: boolean;
  /** 'raw' = token mentah (Fonnte native); 'bearer' = prefix Bearer (Wablas-style). Default raw. */
  authScheme: 'raw' | 'bearer';
}

export function parseWaConfig(env: Record<string, string | undefined>): WaConfig {
  const url = (env.WA_GATEWAY_URL ?? '').trim();
  const token = (env.WA_GATEWAY_TOKEN ?? '').trim();
  // HOTFIX WA-1 (2026-09-21): Fonnte menolak prefix Bearer ("token invalid") —
  // scheme 'raw' jadi default; 'bearer' tetap tersedia utk gateway Wablas-style.
  // Guard: nilai tak dikenal → raw (jangan crash, HOTFIX #4).
  const schemeRaw = String(env.WA_GATEWAY_AUTH_SCHEME ?? '').trim().toLowerCase();
  const authScheme: WaConfig['authScheme'] = schemeRaw === 'bearer' ? 'bearer' : 'raw';
  return { url, token, complete: Boolean(url && token), authScheme };
}

/** Nomor format internasional tanpa `+` — hanya digit, 8–16 karakter. */
export function parseWaNumbers(raw: string | undefined): { valid: string[]; invalid: string[] } {
  const entries = (raw ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const numRe = /^\d{8,16}$/;
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const e of entries) (numRe.test(e) ? valid : invalid).push(e);
  return { valid, invalid };
}

// ===== Formatter teks (heading + KPI utama, tanpa lampiran) =====

const WA_MAX_CHARS = 3500;
const WA_TRUNCATE_SUFFIX = '… (lampiran lengkap di WORKSTATION)';

/** Strip markdown ringan → teks polos (pola renderer 19.1). */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Pesan WA: judul + periode + KPI utama + footer, dibatasi ±3500 karakter. */
export function buildReportWaMessage(report: GeneratedReport): string {
  const kpi = extractKpiRows(report.contentMarkdown)
    .slice(0, 8)
    .map((r) => `• ${r.metric}: ${r.value}`)
    .join('\n');
  const parts = [
    `*Laporan WORKSTATION — ${report.type}*`,
    `Periode: ${formatPeriodId(report)}`,
    kpi ? `\nRingkasan KPI:\n${kpi}` : '',
    '\nLaporan dihasilkan otomatis oleh Report Scheduler WORKSTATION.',
  ];
  return truncateWaText(parts.filter(Boolean).join('\n').trim());
}

/** Batasi panjang pesan agar aman untuk WA, dengan suffix jujur. */
export function truncateWaText(text: string, maxChars: number = WA_MAX_CHARS): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - WA_TRUNCATE_SUFFIX.length) + WA_TRUNCATE_SUFFIX;
}

// ===== Deps ter-inject untuk testability =====

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface WaDeps {
  config: WaConfig;
  fetchFn: FetchLike;
  insertDelivery: (row: NewReportDelivery) => Promise<unknown>;
  auditLog: (entry: { action: string; detail: Record<string, unknown> }) => Promise<void>;
  log?: (msg: string) => void;
  errorLog?: (msg: string, err?: unknown) => void;
}

export const defaultWaDeps: WaDeps = {
  config: parseWaConfig(process.env),
  fetchFn: (url, init) => fetch(url, init),
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
  log: (msg) => console.log(`[WaDelivery] ${msg}`),
  errorLog: (msg, err) => console.error(`[WaDelivery] ${msg}`, err ?? ''),
};

function shortError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.slice(0, 300);
}

export async function deliverReportWhatsapp(
  report: GeneratedReport,
  numbersRaw: string | undefined,
  deps: WaDeps = defaultWaDeps,
): Promise<DeliverySummary> {
  const log = deps.log ?? (() => {});
  const errorLog = deps.errorLog ?? (() => {});
  const summary: DeliverySummary = { sent: 0, failed: 0, skipped: 0 };

  const { valid, invalid } = parseWaNumbers(numbersRaw);
  for (const bad of invalid) log(`Nomor WA tidak valid diabaikan: "${bad}".`);

  const record = async (row: NewReportDelivery, action: string) => {
    try {
      await deps.insertDelivery(row);
      await deps.auditLog({ action, detail: { ...row } });
    } catch (err) {
      errorLog(`Gagal mencatat delivery (${row.destination}):`, err);
    }
  };

  if (valid.length === 0) {
    log(`${report.type}: tidak ada nomor WA dikonfigurasi — delivery dilewati.`);
    await record(
      { reportId: report.id, channel: 'WHATSAPP', destination: '(tanpa nomor REPORT_DELIVERY_WA_NUMBERS)', status: 'SKIPPED', detail: 'REPORT_DELIVERY_WA_NUMBERS kosong/tidak valid' },
      'REPORT_DELIVERY_SKIPPED',
    );
    summary.skipped += 1;
    return summary;
  }

  if (!deps.config.complete) {
    log(`${report.type}: gateway WA tidak lengkap (WA_GATEWAY_URL/WA_GATEWAY_TOKEN) — ${valid.length} nomor di-skip.`);
    for (const to of valid) {
      await record(
        { reportId: report.id, channel: 'WHATSAPP', destination: to, status: 'SKIPPED', detail: 'Konfigurasi gateway WA tidak lengkap' },
        'REPORT_DELIVERY_SKIPPED',
      );
      summary.skipped += 1;
    }
    return summary;
  }

  const message = buildReportWaMessage(report);

  for (const target of valid) {
    try {
      const res = await deps.fetchFn(deps.config.url, {
        method: 'POST',
        headers: {
          Authorization:
            deps.config.authScheme === 'bearer' ? `Bearer ${deps.config.token}` : deps.config.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target, message }),
        signal: AbortSignal.timeout(WA_TIMEOUT_MS),
      });
      if (!res.ok) {
        errorLog(`${report.type}: gateway WA balas HTTP ${res.status} untuk ${target}.`);
        await record(
          { reportId: report.id, channel: 'WHATSAPP', destination: target, status: 'FAILED', detail: `Gateway HTTP ${res.status}` },
          'REPORT_DELIVERY_FAILED',
        );
        summary.failed += 1;
        continue;
      }
      log(`${report.type}: ringkasan laporan terkirim ke WA ${target}.`);
      await record(
        { reportId: report.id, channel: 'WHATSAPP', destination: target, status: 'SENT', detail: 'terkirim via gateway' },
        'REPORT_DELIVERY_SENT',
      );
      summary.sent += 1;
    } catch (err) {
      // Termasuk AbortError dari timeout 10 detik.
      errorLog(`${report.type}: kirim WA ke ${target} gagal —`, err);
      await record(
        { reportId: report.id, channel: 'WHATSAPP', destination: target, status: 'FAILED', detail: `Gateway gagal: ${shortError(err)}` },
        'REPORT_DELIVERY_FAILED',
      );
      summary.failed += 1;
    }
  }
  return summary;
}
