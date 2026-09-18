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

export function generateIdReport(summary: PeriodReportSummary): string {
  const dari = formatTanggalIndonesia(summary.from);
  const sampai = formatTanggalIndonesia(summary.to);

  const lines: string[] = [];

  // Header (AC 10.2.1)
  lines.push(`# Laporan Manajemen Operasional`);
  lines.push('');
  lines.push(`**Periode:** ${dari} s.d. ${sampai}`);
  lines.push(`**Dibuat otomatis oleh:** WORKSTATION Reporting Engine`);
  lines.push('');

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
