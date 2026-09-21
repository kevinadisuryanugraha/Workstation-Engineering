/**
 * Story 19.2 (CC-6) — Download helper.
 * Converts a fetch Response (file attachment) into a browser download,
 * deriving the filename from Content-Disposition when present.
 */

export function fileNameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      /* fall through */
    }
  }
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? fallback;
}

export function downloadBlobResponse(response: Response, fallbackName: string): string {
  const filename = fileNameFromDisposition(response.headers.get('Content-Disposition'), fallbackName);
  return filename;
}

/** Triggers a client-side download of a blob under the given filename. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function genericReportFileName(type: string, ext: 'pdf' | 'xlsx'): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  return `laporan-${type.toLowerCase()}-${stamp}.${ext}`;
}
