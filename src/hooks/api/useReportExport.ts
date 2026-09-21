import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { authManager } from '../../lib/auth.ts';
import { saveBlob } from '../../lib/download.ts';

/**
 * Story 19.2 (CC-6) — Report export hook.
 * Downloads an archived generated report as PDF/XLSX via the Story 19.1
 * endpoints and triggers a browser file download (blob).
 */

export type ExportFormat = 'pdf' | 'xlsx';

export class ExportError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ExportError';
  }
}

export async function requestExport(reportId: string, format: ExportFormat): Promise<{ filename: string; size: number }> {
  const token = authManager.getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api/v1/reports/history/${encodeURIComponent(reportId)}/export.${format}`, { headers });

  if (!response.ok) {
    let message = `Export gagal (HTTP ${response.status})`;
    try {
      const body = await response.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* binary or empty error body */
    }
    throw new ExportError(message, response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  // Tanpa header (mis. lingkungan uji): pakai id arsip agar tetap jujur & bisa dilacak.
  const filename = match?.[1] ?? `laporan-${reportId}.${format}`;
  saveBlob(blob, filename);
  return { filename, size: blob.size };
}

export interface UseReportExportResult {
  exportReport: (reportId: string, format: ExportFormat) => Promise<{ filename: string; size: number }>;
  isExporting: boolean;
  error: string | null;
  lastFilename: string | null;
  reset: () => void;
}

export interface ArchivedReportSummary {
  id: string;
  type: string;
  periodFrom: string;
  periodTo: string;
  language: string;
  contentPreview: string;
  generatedAt: string;
}

/** Daftar arsip laporan terbaru (endpoint Story 12.1) — sumber pilihan export. */
export function useReportArchive(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['reportArchive'],
    queryFn: () => apiRequest<{ reports: ArchivedReportSummary[]; count: number }>('/api/v1/reports/history?limit=10'),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useReportExport(): UseReportExportResult {
  const mutation = useMutation({
    mutationFn: ({ reportId, format }: { reportId: string; format: ExportFormat }) => requestExport(reportId, format),
  });

  return {
    exportReport: (reportId: string, format: ExportFormat) => mutation.mutateAsync({ reportId, format }),
    isExporting: mutation.isPending,
    error: mutation.isError ? (mutation.error as Error).message : null,
    lastFilename: mutation.data?.filename ?? null,
    reset: () => mutation.reset(),
  };
}
