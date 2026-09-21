import { describe, it, expect } from 'vitest';

/**
 * Story 20.3 (CC-6) — WhatsApp Delivery via gateway HTTP generik.
 * Unit test dengan fetch ter-inject (tanpa jaringan/DB nyata):
 * - skip tanpa config gateway (graceful, baris SKIPPED);
 * - SENT dengan fetch mock (Bearer token + body {target, message});
 * - FAILED non-2xx & timeout, nomor berikutnya tetap dicoba;
 * - pesan teks memuat judul & KPI utama; token tidak pernah di-log.
 */

import {
  parseWaConfig,
  parseWaNumbers,
  markdownToPlainText,
  buildReportWaMessage,
  truncateWaText,
  deliverReportWhatsapp,
  WA_TIMEOUT_MS,
  type WaDeps,
  type FetchLike,
} from '../server/modules/reports/whatsapp.channel.ts';
import type { GeneratedReport } from '../server/db/schema/generated_reports.ts';
import type { NewReportDelivery } from '../server/db/schema/report_deliveries.ts';

const report: GeneratedReport = {
  id: 'rep-wa-1',
  type: 'DAILY',
  periodFrom: new Date('2026-09-18T00:00:00Z'),
  periodTo: new Date('2026-09-19T00:00:00Z'),
  language: 'id-ID',
  contentMarkdown: [
    '# Laporan Manajemen Operasional',
    '**Periode:** 18 Sep s.d. 19 Sep',
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

describe('parseWaConfig', () => {
  it('lengkap bila URL + token ada', () => {
    expect(parseWaConfig({ WA_GATEWAY_URL: 'https://wa.kantor.id/send', WA_GATEWAY_TOKEN: 'tok' }).complete).toBe(true);
    expect(parseWaConfig({}).complete).toBe(false);
    expect(parseWaConfig({ WA_GATEWAY_URL: 'https://x' }).complete).toBe(false);
  });

  it('HOTFIX WA-1: scheme default raw (Fonnte menolak Bearer)', () => {
    const cfg = parseWaConfig({ WA_GATEWAY_URL: 'https://api.fonnte.com/send', WA_GATEWAY_TOKEN: 'tok' });
    expect(cfg.authScheme).toBe('raw');
  });

  it('HOTFIX WA-1: scheme bearer eksplisit utk gateway Wablas-style', () => {
    const cfg = parseWaConfig({
      WA_GATEWAY_URL: 'https://wa.kantor.id/send',
      WA_GATEWAY_TOKEN: 'tok',
      WA_GATEWAY_AUTH_SCHEME: 'bearer',
    });
    expect(cfg.authScheme).toBe('bearer');
  });

  it('HOTFIX WA-1: guard — scheme tak dikenal / huruf besar → raw, tanpa crash', () => {
    expect(parseWaConfig({ WA_GATEWAY_AUTH_SCHEME: 'weird' }).authScheme).toBe('raw');
    expect(parseWaConfig({ WA_GATEWAY_AUTH_SCHEME: 'BEARER' }).authScheme).toBe('bearer');
    expect(parseWaConfig({ WA_GATEWAY_AUTH_SCHEME: undefined }).authScheme).toBe('raw');
  });
});

describe('parseWaNumbers', () => {
  it('internasional tanpa "+", digit saja, 8–16 karakter', () => {
    const { valid, invalid } = parseWaNumbers('6281234567890, 628987654321, +6281111, abc, 123');
    expect(valid).toEqual(['6281234567890', '628987654321']);
    expect(invalid).toEqual(['+6281111', 'abc', '123']);
  });
});

describe('formatter teks', () => {
  it('markdownToPlainText membuang sintaks ringan', () => {
    const text = markdownToPlainText('# Judul\n**tebal** dan `kode`\n- item satu\n[tautan](https://x.id)');
    expect(text).toContain('Judul');
    expect(text).toContain('tebal');
    expect(text).toContain('• item satu');
    expect(text).toContain('tautan');
    expect(text).not.toContain('# Judul');
    expect(text).not.toContain('**');
    expect(text).not.toContain('https://x.id');
  });

  it('pesan memuat judul, periode, dan KPI utama (AC #6)', () => {
    const msg = buildReportWaMessage(report);
    expect(msg).toContain('Laporan WORKSTATION — DAILY');
    expect(msg).toContain('Periode:');
    expect(msg).toContain('Total Tiket Masuk: 7');
  });

  it('truncateWaText memotong dengan suffix jujur (guard defensif)', () => {
    const cut = truncateWaText('x'.repeat(6000));
    expect(cut.length).toBeLessThanOrEqual(3500);
    expect(cut.endsWith('… (lampiran lengkap di WORKSTATION)')).toBe(true);
    expect(truncateWaText('pendek')).toBe('pendek');
  });

  it('timeout gateway 10 detik (AC #4)', () => {
    expect(WA_TIMEOUT_MS).toBe(10_000);
  });
});

describe('deliverReportWhatsapp', () => {
  interface Harness {
    deps: WaDeps;
    rows: NewReportDelivery[];
    auditEvents: Array<{ action: string; detail: Record<string, unknown> }>;
    calls: Array<{ url: string; init: RequestInit }>;
    statuses: number[];
    rejectAll: boolean;
  }

  function makeHarness(complete = true): Harness {
    const h: Harness = {
      deps: null as unknown as WaDeps,
      rows: [],
      auditEvents: [],
      calls: [],
      statuses: [],
      rejectAll: false,
    };
    const fetchFn: FetchLike = async (url, init) => {
      if (h.rejectAll) throw new Error('gateway unreachable');
      const status = h.statuses.shift() ?? 200;
      h.calls.push({ url, init });
      return { ok: status >= 200 && status < 300, status } as Response;
    };
    h.deps = {
      config: complete
        ? { url: 'https://wa.kantor.id/send', token: 'TOPSECRET-TOKEN', complete: true, authScheme: 'raw' }
        : { url: '', token: '', complete: false, authScheme: 'raw' },
      fetchFn,
      insertDelivery: async (row) => {
        h.rows.push(row);
      },
      auditLog: async (entry) => {
        h.auditEvents.push({ action: entry.action, detail: entry.detail });
      },
      log: () => {},
      errorLog: () => {},
    };
    return h;
  }

  it('gateway tidak dikonfigurasi → SKIP per nomor, boot/job aman (AC #3)', async () => {
    const h = makeHarness(false);
    const summary = await deliverReportWhatsapp(report, '6281234567890, 628987654321', h.deps);
    expect(summary).toEqual({ sent: 0, failed: 0, skipped: 2 });
    expect(h.rows).toHaveLength(2);
    expect(h.rows.every((r) => r.status === 'SKIPPED' && r.channel === 'WHATSAPP')).toBe(true);
    expect(h.calls).toHaveLength(0);
    expect(h.auditEvents.every((e) => e.action === 'REPORT_DELIVERY_SKIPPED')).toBe(true);
  });

  it('tanpa nomor → satu baris SKIPPED tujuan eksplisit', async () => {
    const h = makeHarness(true);
    const summary = await deliverReportWhatsapp(report, undefined, h.deps);
    expect(summary.skipped).toBe(1);
    expect(h.rows[0].destination).toContain('tanpa nomor');
  });

  it('SENT dengan fetch mock: token RAW default (Fonnte), body {target,message}, baris + audit (AC #1,#5)', async () => {
    const h = makeHarness(true);
    const summary = await deliverReportWhatsapp(report, '6281234567890', h.deps);
    expect(summary).toEqual({ sent: 1, failed: 0, skipped: 0 });
    expect(h.calls).toHaveLength(1);
    const { url, init } = h.calls[0];
    expect(url).toBe('https://wa.kantor.id/send');
    expect((init.headers as Record<string, string>).Authorization).toBe('TOPSECRET-TOKEN');
    const body = JSON.parse(String(init.body));
    expect(body.target).toBe('6281234567890');
    expect(body.message).toContain('Laporan WORKSTATION — DAILY');
    expect(h.rows[0].status).toBe('SENT');
    expect(h.auditEvents.map((e) => e.action)).toEqual(['REPORT_DELIVERY_SENT']);
  });

  it('HOTFIX WA-1: scheme bearer → header Authorization pakai prefix Bearer', async () => {
    const h = makeHarness(true);
    h.deps.config.authScheme = 'bearer';
    await deliverReportWhatsapp(report, '6281234567890', h.deps);
    expect((h.calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer TOPSECRET-TOKEN');
  });

  it('non-2xx → FAILED + nomor berikutnya tetap dicoba (AC #4)', async () => {
    const h = makeHarness(true);
    h.statuses = [500]; // nomor pertama gagal, sisanya default 200
    const summary = await deliverReportWhatsapp(report, '6281234567890, 628987654321', h.deps);
    expect(summary).toEqual({ sent: 1, failed: 1, skipped: 0 });
    const failed = h.rows.find((r) => r.status === 'FAILED');
    expect(failed?.detail).toContain('Gateway HTTP 500');
    expect(h.calls).toHaveLength(2); // batch lanjut
  });

  it('fetch reject (timeout/network) → FAILED tercatat, tidak throw', async () => {
    const h = makeHarness(true);
    h.rejectAll = true;
    const summary = await deliverReportWhatsapp(report, '6281234567890', h.deps);
    expect(summary).toEqual({ sent: 0, failed: 1, skipped: 0 });
    expect(h.rows[0].detail).toContain('Gateway gagal');
  });

  it('nomor tidak valid di-skip per entri, tidak masuk ledger', async () => {
    const h = makeHarness(true);
    const summary = await deliverReportWhatsapp(report, '+6281111, 6281234567890', h.deps);
    expect(summary).toEqual({ sent: 1, failed: 0, skipped: 0 });
    expect(h.calls).toHaveLength(1);
    expect(h.rows).toHaveLength(1);
    expect(h.rows[0].destination).toBe('6281234567890');
  });

  it('satu baris ledger per percobaan; token tidak pernah muncul di detail (AC #5)', async () => {
    const h = makeHarness(true);
    await deliverReportWhatsapp(report, '6281234567890, 628987654321, 628777777777', h.deps);
    expect(h.rows).toHaveLength(3);
    const serialized = JSON.stringify({ rows: h.rows, audit: h.auditEvents });
    expect(serialized).not.toContain('TOPSECRET-TOKEN');
  });
});
