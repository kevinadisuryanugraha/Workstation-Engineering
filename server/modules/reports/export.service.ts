import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { GeneratedReport } from '../../db/schema/generated_reports.ts';

/**
 * Report export service (Story 19.1 — Course Correction 6).
 * Renders an archived generated report into PDF (pdfkit) or Excel (exceljs)
 * fully on-the-fly from content_markdown — the archive stays append-only and
 * nothing is written to disk.
 */

const KPI_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'Total Tiket Masuk', regex: /Total tiket masuk pada periode ini:\s*\*\*(\d+)\*\*/ },
  { label: 'Total Work Item Dibuat', regex: /Total work item dibuat pada periode ini:\s*\*\*(\d+)\*\*/ },
  { label: 'Total Deployment', regex: /Total deployment pada periode ini:\s*\*\*(\d+)\*\*/ },
  { label: 'Jumlah Rollback', regex: /Rollback tercatat\s*\(\*\*(\d+)\*\*x\)/ },
  { label: 'Total Event Audit', regex: /Total event tercatat di audit trail:\s*\*\*(\d+)\*\*/ },
];

/** Extracts well-known KPI rows from the Indonesian report markdown (best-effort). */
export function extractKpiRows(markdown: string): Array<{ metric: string; value: string }> {
  const rows: Array<{ metric: string; value: string }> = [];
  for (const { label, regex } of KPI_PATTERNS) {
    const match = markdown.match(regex);
    if (match) rows.push({ metric: label, value: match[1] });
  }
  return rows;
}

function stripInlineMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateSlug(iso: Date | string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** Attachment filename for an archived report, e.g. laporan-weekly-20260919-20260926.pdf */
export function reportFileName(report: Pick<GeneratedReport, 'type' | 'periodFrom' | 'periodTo'>, ext: 'pdf' | 'xlsx'): string {
  return `laporan-${report.type.toLowerCase()}-${dateSlug(report.periodFrom)}-${dateSlug(report.periodTo)}.${ext}`;
}

type MdBlock =
  | { kind: 'h1' | 'h2' | 'text' | 'bullet' | 'sub-bullet' | 'note'; text: string }
  | { kind: 'rule' };

/** Minimal line-based markdown parser tuned to the idGenerator output shape. */
export function parseReportMarkdown(markdown: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (line.trim() === '') continue;
    if (/^---+$/.test(line.trim())) {
      blocks.push({ kind: 'rule' });
    } else if (line.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: stripInlineMd(line.slice(3)) });
    } else if (line.startsWith('# ')) {
      blocks.push({ kind: 'h1', text: stripInlineMd(line.slice(2)) });
    } else if (line.startsWith('  - ')) {
      blocks.push({ kind: 'sub-bullet', text: stripInlineMd(line.slice(4)) });
    } else if (line.startsWith('- ')) {
      blocks.push({ kind: 'bullet', text: stripInlineMd(line.slice(2)) });
    } else if (/^\*[^*].*\*$/.test(line.trim())) {
      blocks.push({ kind: 'note', text: stripInlineMd(line.trim().replace(/^\*/, '').replace(/\*$/, '')) });
    } else {
      blocks.push({ kind: 'text', text: stripInlineMd(line) });
    }
  }
  return blocks;
}

/** Renders the archived report into a valid PDF buffer. */
export function renderReportPdf(report: GeneratedReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 56, size: 'A4', info: { Title: `Laporan ${report.type} WORKSTATION` } });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(9).fillColor('#64748b').text('WORKSTATION — Engineering Intelligence & Operations', { align: 'left' });
      doc.moveDown(0.5);

      for (const block of parseReportMarkdown(report.contentMarkdown)) {
        switch (block.kind) {
          case 'h1':
            doc.moveDown(0.4).font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(block.text);
            doc.font('Helvetica');
            break;
          case 'h2':
            doc.moveDown(0.6).font('Helvetica-Bold').fontSize(13).fillColor('#1e293b').text(block.text);
            doc.font('Helvetica');
            break;
          case 'bullet':
            doc.font('Helvetica').fontSize(10.5).fillColor('#334155').text(`•  ${block.text}`, { indent: 14 });
            break;
          case 'sub-bullet':
            doc.font('Helvetica').fontSize(10.5).fillColor('#475569').text(`–  ${block.text}`, { indent: 30 });
            break;
          case 'note':
            doc.moveDown(0.3).font('Helvetica-Oblique').fontSize(9).fillColor('#64748b').text(block.text);
            doc.font('Helvetica');
            break;
          case 'rule':
            doc.moveDown(0.3).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).lineWidth(0.75).strokeColor('#cbd5e1').stroke();
            doc.moveDown(0.3);
            break;
          default:
            doc.font('Helvetica').fontSize(10.5).fillColor('#334155').text(block.text, { paragraphGap: 3 });
        }
      }

      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/** Renders the archived report into a valid XLSX buffer (Ringkasan + Isi Laporan). */
export async function renderReportXlsx(report: GeneratedReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WORKSTATION Reporting Engine';
  workbook.created = new Date();

  const summary = workbook.addWorksheet('Ringkasan');
  summary.addRow(['Laporan WORKSTATION']);
  summary.getCell('A1').font = { bold: true, size: 14 };
  summary.addRow([]);
  summary.addRow(['Tipe', report.type]);
  summary.addRow(['Periode Dari', new Date(report.periodFrom).toISOString()]);
  summary.addRow(['Periode Sampai', new Date(report.periodTo).toISOString()]);
  summary.addRow(['Bahasa', report.language]);
  summary.addRow(['Dibuat Pada', new Date(report.generatedAt).toISOString()]);
  summary.addRow([]);
  summary.addRow(['Metrik Kunci', 'Nilai']).font = { bold: true };
  for (const row of extractKpiRows(report.contentMarkdown)) {
    summary.addRow([row.metric, row.value]);
  }
  summary.getColumn(1).width = 34;
  summary.getColumn(2).width = 30;

  const content = workbook.addWorksheet('Isi Laporan');
  content.getColumn(1).width = 120;
  content.addRow(['Isi Laporan (Markdown diringkas ke teks)']).font = { bold: true };
  for (const block of parseReportMarkdown(report.contentMarkdown)) {
    if (block.kind === 'rule') {
      content.addRow(['──────────']);
    } else {
      content.addRow([block.text]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
