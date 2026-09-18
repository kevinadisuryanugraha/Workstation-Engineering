import type { PeriodReportSummary } from './reports.repository.ts';

/**
 * Bahasa Indonesia Management Summary Generator (Story 10.2).
 *
 * PURE function — consumes the aggregation object from Story 10.1 and renders a
 * rule-based, deterministic Markdown narrative. NO LLM calls (AI feature decision
 * is still PENDING in decision-log.md).
 */

const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Formats an ISO date as "14 Februari 2026" using UTC components (deterministic across server timezones). */
export function formatTanggalIndonesia(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return `${date.getUTCDate()} ${BULAN_INDONESIA[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function labelize(raw: string): string {
  // TRIAGED -> Triaged, IN_PROGRESS -> In Progress, READY_FOR_TEST -> Ready For Test
  return raw
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderCounts(label: string, rows: { label: string; count: number }[]): string {
  if (rows.length === 0) {
    return `- **${label}:** tidak ada data pada periode ini.`;
  }
  const items = rows
    .map((r) => `${labelize(r.label)}: ${r.count}`)
    .join(', ');
  return `- **${label}:** ${items}.`;
}

export interface IdReportOptions {
  /** Story 12.2 — previous-period summary for trend comparison (same duration). */
  previous?: PeriodReportSummary;
}

export function generateIdReport(summary: PeriodReportSummary, options: IdReportOptions = {}): string {
  const dari = formatTanggalIndonesia(summary.from);
  const sampai = formatTanggalIndonesia(summary.to);

  const lines: string[] = [];

  // Header (AC 10.2.1)
  lines.push(`# Laporan Manajemen Operasional`);
  lines.push('');
  lines.push(`**Periode:** ${dari} s.d. ${sampai}`);
  lines.push(`**Dibuat otomatis oleh:** WORKSTATION Reporting Engine`);
  lines.push('');

  // ===== Ringkasan Eksekutif (Story 12.2 / AC #1) =====
  lines.push(`## Ringkasan Eksekutif`);
  for (const sentence of buildExecutiveSentences(summary)) lines.push(sentence);
  lines.push('');

  // ===== Tren vs Periode Sebelumnya (Story 12.2 / AC #2) =====
  if (options.previous) {
    lines.push(`## Tren vs Periode Sebelumnya`);
    lines.push(...buildTrendSection(summary, options.previous));
    lines.push('');
  }

  // Tiket
  lines.push(`## 1. Ringkasan Tiket (ITSM)`);
  lines.push(`Total tiket masuk pada periode ini: **${summary.tickets.total}**.`);
  lines.push(renderCounts('Status tiket', summary.tickets.byStatus));
  lines.push(renderCounts('Severity tiket', summary.tickets.bySeverity));
  lines.push('');

  // Work Items
  lines.push(`## 2. Ringkasan Work Item (Pekerjaan Rekayasa)`);
  lines.push(`Total work item dibuat pada periode ini: **${summary.workItems.total}**.`);
  lines.push(renderCounts('Status work item', summary.workItems.byStatus));
  lines.push(renderCounts('Tipe work item', summary.workItems.byType));
  lines.push('');

  // Deployments
  lines.push(`## 3. Ringkasan Deployment & Rilis`);
  if (summary.deployments.total === 0) {
    lines.push(`Tidak ada aktivitas deployment pada periode ini.`);
  } else {
    lines.push(`Total deployment pada periode ini: **${summary.deployments.total}**.`);
    lines.push(renderCounts('Deployment per environment', summary.deployments.byEnvironment));
  }
  // AC 10.2.2: rollback triggers an explicit warning sentence
  if (summary.deployments.rollbacks > 0) {
    lines.push(
      `> ⚠️ **PERINGATAN:** Terdapat **${summary.deployments.rollbacks} rollback** pada periode ini. Mohon tinjau penyebab kegagalan rilis bersama tim terkait.`
    );
  } else {
    lines.push(`Tidak ada rollback pada periode ini — stabilitas rilis terjaga.`);
  }
  lines.push('');

  // Audit
  lines.push(`## 4. Aktivitas Sistem (Audit Trail)`);
  lines.push(`Total event tercatat di audit trail: **${summary.audit.total}**.`);
  if (summary.audit.topActions.length === 0) {
    lines.push(`- **Aksi paling sering:** tidak ada aktivitas pada periode ini.`);
  } else {
    lines.push(`- **5 aksi paling sering:**`);
    for (const action of summary.audit.topActions) {
      lines.push(`  - ${labelize(action.label)}: ${action.count} kali`);
    }
  }
  lines.push('');

  // Automatic conclusion (AC 10.2.2: narrative adapts to data)
  lines.push(`## 5. Kesimpulan`);
  const conclusions: string[] = [];

  const resolved = summary.tickets.byStatus
    .filter((s) => s.label === 'RESOLVED' || s.label === 'CLOSED')
    .reduce((acc, s) => acc + s.count, 0);
  if (summary.tickets.total > 0 && resolved > summary.tickets.total - resolved) {
    conclusions.push(`Penanganan tiket berjalan positif: tiket yang selesai (${resolved}) melebihi tiket yang masih aktif.`);
  } else if (summary.tickets.total > 0) {
    conclusions.push(`Perlu perhatian: masih terdapat tiket aktif yang menunggu penyelesaian.`);
  } else {
    conclusions.push(`Tidak ada tiket masuk pada periode ini.`);
  }

  if (summary.deployments.rollbacks > 0) {
    conclusions.push(`Rollback tercatat (${summary.deployments.rollbacks}x), disarankan evaluasi proses rilis sebelum deployment berikutnya.`);
  } else if (summary.deployments.total > 0) {
    conclusions.push(`Seluruh ${summary.deployments.total} deployment berjalan tanpa rollback.`);
  }

  if (conclusions.length === 0) conclusions.push(`Periode berjalan tenang tanpa aktivitas signifikan.`);
  for (const c of conclusions) lines.push(`- ${c}`);
  lines.push('');
  lines.push(`---`);
  lines.push(`*Laporan dihasilkan otomatis dari data PostgreSQL WORKSTATION — bukan hasil pencatatan manual.*`);

  return lines.join('\n');
}

// ===== Story 12.2 helpers =====

interface CountRowLike {
  label: string;
  count: number;
}

function sumRows(rows: CountRowLike[]): number {
  return rows.reduce((acc, r) => acc + r.count, 0);
}

/**
 * 3-5 executive sentences in plain management Indonesian (no technical jargon).
 * Pure & rule-based — data in, narrative out.
 */
export function buildExecutiveSentences(summary: PeriodReportSummary): string[] {
  const sentences: string[] = [];

  sentences.push(
    `Pada periode ini tercatat **${summary.tickets.total} tiket layanan** dan **${summary.workItems.total} pekerjaan teknis baru**.`
  );

  if (summary.workItems.total > 0) {
    sentences.push(`Tim engineering aktif menangani seluruh pekerjaan tersebut sesuai prioritas yang ditetapkan.`);
  } else {
    sentences.push(`Tidak ada pekerjaan teknis baru yang memerlukan perhatian manajemen.`);
  }

  if (summary.deployments.total > 0 && summary.deployments.rollbacks === 0) {
    sentences.push(`Rilis aplikasi berjalan stabil: seluruh ${summary.deployments.total} peluncuran berhasil tanpa pembatalan.`);
  } else if (summary.deployments.rollbacks > 0) {
    sentences.push(
      `Perlu perhatian: dari ${summary.deployments.total} peluncuran aplikasi, terdapat ${summary.deployments.rollbacks} pembatalan (rollback) yang perlu dievaluasi.`
    );
  } else {
    sentences.push(`Tidak ada peluncuran aplikasi pada periode ini.`);
  }

  sentences.push(
    `Aktivitas sistem tercatat **${summary.audit.total} kejadian** dan seluruhnya terdokumentasi dalam jejak audit resmi perusahaan.`
  );

  return sentences;
}

function describeDelta(current: number, previous: number): string {
  const delta = current - previous;
  if (delta === 0) return 'tetap';
  const direction = delta > 0 ? 'naik' : 'turun';
  const abs = Math.abs(delta);
  if (previous > 0) {
    const pct = Math.round((abs / previous) * 100);
    return `${direction} ${abs} (${pct}%)`;
  }
  return `${direction} ${abs}`;
}

/**
 * Markdown trend table + adaptive narrative (Story 12.2 / AC #2, #3, #4).
 */
export function buildTrendSection(current: PeriodReportSummary, previous: PeriodReportSummary): string[] {
  const previousIsEmpty =
    previous.tickets.total === 0 &&
    previous.workItems.total === 0 &&
    previous.deployments.total === 0 &&
    previous.audit.total === 0;

  if (previousIsEmpty) {
    return ['Belum ada data pembanding pada periode sebelumnya — tren akan tersedia setelah ada dua periode aktif.'];
  }

  const rows: Array<{ metric: string; current: number; previous: number }> = [
    { metric: 'Total tiket', current: current.tickets.total, previous: previous.tickets.total },
    { metric: 'Total work item', current: current.workItems.total, previous: previous.workItems.total },
    { metric: 'Total deployment', current: current.deployments.total, previous: previous.deployments.total },
    { metric: 'Rollback', current: current.deployments.rollbacks, previous: previous.deployments.rollbacks },
    { metric: 'Event audit', current: current.audit.total, previous: previous.audit.total },
  ];

  const lines: string[] = [];
  lines.push('| Metrik | Periode Ini | Sebelumnya | Tren |');
  lines.push('|---|---|---|---|');
  for (const row of rows) {
    lines.push(`| ${row.metric} | ${row.current} | ${row.previous} | ${describeDelta(row.current, row.previous)} |`);
  }
  lines.push('');

  // Adaptive narrative
  if (current.deployments.rollbacks > previous.deployments.rollbacks) {
    lines.push(
      `> Kenaikan jumlah rollback dibanding periode sebelumnya perlu mendapat perhatian manajemen pada evaluasi rilis berikutnya.`
    );
  }
  const activeNow = current.tickets.total - sumRows(current.tickets.byStatus.filter((s) => s.label === 'RESOLVED' || s.label === 'CLOSED'));
  const activePrev = previous.tickets.total - sumRows(previous.tickets.byStatus.filter((s) => s.label === 'RESOLVED' || s.label === 'CLOSED'));
  if (current.tickets.total > 0 && activeNow < activePrev) {
    lines.push(`Beban tiket aktif menurun dibanding periode sebelumnya — indikasi positif bagi tim dukungan.`);
  }

  return lines;
}
